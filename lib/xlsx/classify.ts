import type { Currency, TxType } from '@/lib/supabase/types';

/**
 * Account-adjustment classifier.
 *
 * **REGRESSION** — see CLAUDE.md §8a. Rows in the user's xlsx with
 * category = "Account adjustment" are transfers/refunds, NOT real
 * expenses or income. They must end up as `type: 'adjustment'`.
 *
 * Stored amount sign convention:
 *   - Expense block (left half) adjustment → amount stored NEGATIVE
 *     (money left the account).
 *   - Income block (right half) adjustment → amount stored POSITIVE
 *     (money entered the account).
 *   - Plain expense → amount stored POSITIVE; the type carries the sign.
 *   - Plain income → amount stored POSITIVE.
 *
 * Test coverage: test/lib/xlsx/classify.test.ts
 */

const ADJUSTMENT_LABEL = 'Account adjustment';

export interface ParsedExpenseRow {
  amount: number;
  category: string;
  subcategory: string;
  comment: string;
  accountName: string;
  currency: Currency;
  date: string; // YYYY-MM-DD
}

export interface ParsedIncomeRow {
  amount: number;
  /** "Type" cell on the income side — either an income category name or 'Account adjustment'. */
  typeLabel: string;
  comment: string;
  accountName: string;
  currency: Currency;
  date: string; // YYYY-MM-DD
}

export interface ClassifiedRow {
  date: string;
  type: TxType;
  amount: number;
  currency: Currency;
  category: string;
  subcategory: string;
  comment: string;
  accountName: string;
}

export function classifyExpenseRow(row: ParsedExpenseRow): ClassifiedRow {
  const isAdjustment = row.category === ADJUSTMENT_LABEL;
  const amountAbs = Math.abs(row.amount);
  return {
    date: row.date,
    type: isAdjustment ? 'adjustment' : 'expense',
    amount: isAdjustment ? -amountAbs : amountAbs,
    currency: row.currency,
    category: row.category,
    subcategory: isAdjustment ? '' : row.subcategory,
    comment: row.comment,
    accountName: row.accountName,
  };
}

export function classifyIncomeRow(row: ParsedIncomeRow): ClassifiedRow {
  const isAdjustment = row.typeLabel === ADJUSTMENT_LABEL;
  return {
    date: row.date,
    type: isAdjustment ? 'adjustment' : 'income',
    amount: Math.abs(row.amount),
    currency: row.currency,
    category: row.typeLabel,
    subcategory: '',
    comment: row.comment,
    accountName: row.accountName,
  };
}

export function isAdjustmentLabel(s: string | null | undefined): boolean {
  return (s ?? '').trim() === ADJUSTMENT_LABEL;
}
