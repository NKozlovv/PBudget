import type { Account, Transaction } from '@/lib/supabase/types';
import { txToEUR, signedAmount } from '@/lib/money';

/**
 * Total EUR balance across all accounts for a budget.
 *
 * Account openings: native amount × current rate for non-EUR accounts.
 * Transactions: txToEUR (uses stored fx_rate when set, falls back) then
 * signedAmount based on type. Mirrors the legacy `totalBalanceNow()`
 * approximation in index.html line 1143.
 *
 * NOTE: legacy code uses end-of-month historical rates for older
 * balances (better accuracy). The Frankfurter cache lands in Chunk 10
 * with the XLSX importer; for now the dashboard uses current rate.
 */
export function totalBalanceEUR(args: {
  accounts: Account[];
  transactions: Transaction[];
  fxRate: number;
}): number {
  const { accounts, transactions, fxRate } = args;

  const openingEUR = accounts.reduce((sum, a) => {
    if (a.currency === 'EUR') return sum + a.opening_balance;
    return sum + a.opening_balance * fxRate;
  }, 0);

  const txEUR = transactions.reduce((sum, t) => {
    const eur = txToEUR(t, fxRate);
    return sum + signedAmount({ type: t.type, amount: eur });
  }, 0);

  return openingEUR + txEUR;
}

export interface MonthTotals {
  income: number;
  expense: number;
  net: number;
}

/** Income / expense / net for a given (year, 0-indexed month), in EUR. */
export function monthTotalsEUR(args: {
  transactions: Transaction[];
  year: number;
  month: number;
  fxRate: number;
}): MonthTotals {
  const { transactions, year, month, fxRate } = args;
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    // Parse YYYY-MM-DD literally — same TZ-safe rule as lib/date.ts.
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    if (Number(m[1]) !== year) continue;
    if (Number(m[2]) - 1 !== month) continue;
    if (t.type === 'adjustment') continue; // excluded from totals per CLAUDE.md §8a

    const eur = txToEUR(t, fxRate);
    if (t.type === 'income') income += eur;
    else if (t.type === 'expense') expense += eur;
  }

  return { income, expense, net: income - expense };
}
