import 'server-only';
import * as XLSX from 'xlsx';
import { dateToISO } from '@/lib/date';
import { detectCurrency, normaliseDate } from './dates';
import {
  classifyExpenseRow,
  classifyIncomeRow,
  type ClassifiedRow,
} from './classify';
import type { Currency } from '@/lib/supabase/types';

const MONTH_SHEET_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface ParseResult {
  /** Account name → metadata. Discovered both from "Accounts Balance" sheet and from transaction rows. */
  accounts: Map<string, { name: string; currency: Currency; opening_balance: number }>;
  /** Category → set of subcategories (expense-only). */
  expenseCategories: Map<string, Set<string>>;
  /** Distinct income types observed. */
  incomeTypes: Set<string>;
  /** All classified transactions, with `accountName` linking back to `accounts`. */
  transactions: ClassifiedRow[];
  /** Number of rows seen but skipped because we couldn't parse them (no account, bad date, etc). */
  dropped: Array<{ sheet: string; row: number; reason: string }>;
}

/**
 * Port of legacy `parseXlsxRaw()` (index.html line 1346) to TypeScript.
 *
 * Sheet conventions (from CLAUDE.md §8d — DO NOT regress):
 * - "Accounts Balance" sheet: column B "Account" → name, C "€" → EUR
 *   opening balance, D "$" → USD opening balance.
 * - Each month sheet (named "January", "February", …): col B "Date"
 *   header signals the start. Expense rows live in cols B-G; income
 *   rows in cols I-L. A row may have either, both, or neither.
 * - Income rows have no per-row date — assigned the 28th of the month.
 *
 * Cell access is done directly via XLSX.utils.encode_cell rather than
 * sheet_to_json{header:1} — the latter has edge cases with blank
 * leading rows that silently dropped data in the legacy parser.
 */
export function parseXlsx(buffer: ArrayBuffer | Uint8Array, importYear: number): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const accounts = new Map<string, { name: string; currency: Currency; opening_balance: number }>();
  const expenseCategories = new Map<string, Set<string>>();
  const incomeTypes = new Set<string>();
  const transactions: ClassifiedRow[] = [];
  const dropped: ParseResult['dropped'] = [];

  // ---- 1. Accounts Balance sheet ----
  if (wb.SheetNames.includes('Accounts Balance')) {
    const ws = wb.Sheets['Accounts Balance'];
    const ref = ws?.['!ref'];
    if (ws && ref) {
      const range = XLSX.utils.decode_range(ref);
      let headerRow = -1;
      for (let r = range.s.r; r <= range.e.r; r++) {
        const c = ws[XLSX.utils.encode_cell({ r, c: 1 })];
        if (c && c.v === 'Account') {
          headerRow = r;
          break;
        }
      }
      if (headerRow >= 0) {
        for (let r = headerRow + 1; r <= range.e.r; r++) {
          const nameCell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
          const eurCell = ws[XLSX.utils.encode_cell({ r, c: 2 })];
          const usdCell = ws[XLSX.utils.encode_cell({ r, c: 3 })];
          if (!nameCell || nameCell.v == null) continue;
          const name = String(nameCell.v).trim();
          if (!name || name === 'TOTAL') continue;
          const currency = detectCurrency(name);
          let opening = 0;
          if (currency === 'USD' && usdCell && typeof usdCell.v === 'number') {
            opening = usdCell.v;
          } else if (eurCell && typeof eurCell.v === 'number') {
            opening = eurCell.v;
          }
          accounts.set(name, { name, currency, opening_balance: opening });
        }
      }
    }
  }

  // ---- 2. Walk monthly sheets ----
  MONTH_SHEET_NAMES.forEach((monthName, monthIdx) => {
    if (!wb.SheetNames.includes(monthName)) return;
    const ws = wb.Sheets[monthName];
    if (!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Header row: 'Date' in column B (index 1), within first 10 rows.
    let headerRow = -1;
    for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
      const c = ws[XLSX.utils.encode_cell({ r, c: 1 })];
      if (c && c.v === 'Date') {
        headerRow = r;
        break;
      }
    }
    if (headerRow < 0) return;

    for (let r = headerRow + 1; r <= range.e.r; r++) {
      // ---- Expense block: cols B-G (1-6) ----
      const expDate = ws[XLSX.utils.encode_cell({ r, c: 1 })];
      const expAmt = ws[XLSX.utils.encode_cell({ r, c: 2 })];
      const expCat = ws[XLSX.utils.encode_cell({ r, c: 3 })];
      const expSub = ws[XLSX.utils.encode_cell({ r, c: 4 })];
      const expCmt = ws[XLSX.utils.encode_cell({ r, c: 5 })];
      const expAcc = ws[XLSX.utils.encode_cell({ r, c: 6 })];

      if (expAmt && typeof expAmt.v === 'number' && expAmt.v !== 0) {
        const accName = expAcc && expAcc.v ? String(expAcc.v).trim() : null;
        const dateISO = expDate ? normaliseDate(expDate.v) : null;
        const cat = expCat && expCat.v ? String(expCat.v).trim() : '';
        const sub = expSub && expSub.v ? String(expSub.v).trim() : '';
        const cmt = expCmt && expCmt.v ? String(expCmt.v).trim() : '';

        if (accName && dateISO) {
          if (!accounts.has(accName)) {
            accounts.set(accName, {
              name: accName,
              currency: detectCurrency(accName),
              opening_balance: 0,
            });
          }
          const acc = accounts.get(accName)!;

          const classified = classifyExpenseRow({
            date: dateISO,
            amount: expAmt.v,
            category: cat,
            subcategory: sub,
            comment: cmt,
            accountName: accName,
            currency: acc.currency,
          });

          // Track expense categories (skip the synthetic adjustment label).
          if (classified.type === 'expense' && cat) {
            if (!expenseCategories.has(cat)) expenseCategories.set(cat, new Set());
            if (sub) expenseCategories.get(cat)!.add(sub);
          }

          transactions.push(classified);
        } else {
          dropped.push({
            sheet: monthName,
            row: r + 1,
            reason: !accName ? 'no-account' : 'bad-date',
          });
        }
      }

      // ---- Income block: cols I-L (8-11) ----
      const incAmt = ws[XLSX.utils.encode_cell({ r, c: 8 })];
      const incTyp = ws[XLSX.utils.encode_cell({ r, c: 9 })];
      const incCmt = ws[XLSX.utils.encode_cell({ r, c: 10 })];
      const incAcc = ws[XLSX.utils.encode_cell({ r, c: 11 })];

      if (incAmt && typeof incAmt.v === 'number' && incAmt.v !== 0 && incTyp && incTyp.v) {
        const accName = incAcc && incAcc.v ? String(incAcc.v).trim() : null;
        const typeStr = String(incTyp.v).trim();
        const cmt = incCmt && incCmt.v ? String(incCmt.v).trim() : '';

        if (accName) {
          if (!accounts.has(accName)) {
            accounts.set(accName, {
              name: accName,
              currency: detectCurrency(accName),
              opening_balance: 0,
            });
          }
          const acc = accounts.get(accName)!;

          // Income rows have no per-row date — anchor at the 28th of the
          // sheet's month, in local time (CLAUDE.md §8b).
          const dateISO = dateToISO(new Date(importYear, monthIdx, 28));

          const classified = classifyIncomeRow({
            date: dateISO,
            amount: incAmt.v,
            typeLabel: typeStr,
            comment: cmt,
            accountName: accName,
            currency: acc.currency,
          });

          if (classified.type === 'income') {
            incomeTypes.add(typeStr);
          }

          transactions.push(classified);
        } else {
          dropped.push({ sheet: monthName, row: r + 1, reason: 'no-account-income' });
        }
      }
    }
  });

  return { accounts, expenseCategories, incomeTypes, transactions, dropped };
}
