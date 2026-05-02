import type { Account, Transaction } from '@/lib/supabase/types';
import { txToEUR, signedAmount } from '@/lib/money';
import { dateToISO } from '@/lib/date';

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

export interface MonthBucket {
  /** Calendar year. */
  year: number;
  /** 0-indexed month. */
  month: number;
  /** Short-month label, e.g. "MAY". */
  label: string;
  income: number;
  expense: number;
  net: number;
}

const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Last N months of {income, expense, net} ending at `endYear`/`endMonth`
 * (inclusive). Months are filled even if they have no transactions.
 */
export function lastNMonthsTotals(args: {
  transactions: Transaction[];
  endYear: number;
  endMonth: number;
  count: number;
  fxRate: number;
}): MonthBucket[] {
  const { transactions, endYear, endMonth, count, fxRate } = args;
  const out: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(endYear, endMonth - i, 1);
    const y = date.getFullYear();
    const m = date.getMonth();
    const totals = monthTotalsEUR({ transactions, year: y, month: m, fxRate });
    out.push({
      year: y,
      month: m,
      label: MONTH_SHORT[m] ?? '',
      income: totals.income,
      expense: totals.expense,
      net: totals.net,
    });
  }
  return out;
}

export interface CategorySlice {
  name: string;
  value: number;
}

/**
 * Expense category totals (EUR) for a given (year, 0-indexed month).
 * Returns slices sorted by value desc. Adjustments are excluded.
 */
export function categorySpendEUR(args: {
  transactions: Transaction[];
  year: number;
  month: number;
  fxRate: number;
}): CategorySlice[] {
  const { transactions, year, month, fxRate } = args;
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    if (Number(m[1]) !== year) continue;
    if (Number(m[2]) - 1 !== month) continue;
    const key = (t.category ?? '').trim() || '(Uncategorised)';
    totals.set(key, (totals.get(key) ?? 0) + txToEUR(t, fxRate));
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Native-currency balance of an account up to and including `date`.
 * Mirrors legacy `accountBalanceNative()` from index.html line 1115.
 */
export function accountBalanceNativeAt(args: {
  accountId: string;
  date: string;
  openingBalance: number;
  transactions: Transaction[];
}): number {
  const { accountId, date, openingBalance, transactions } = args;
  let balance = openingBalance;
  for (const t of transactions) {
    if (t.account_id !== accountId) continue;
    if (t.date > date) continue;
    balance += signedAmount({ type: t.type, amount: t.amount });
  }
  return balance;
}

/**
 * EUR balance of an account up to and including `date`. Uses per-tx
 * `fx_rate` when set, else the current fallback rate. Opening balances
 * are converted at the fallback rate (legacy uses end-of-month historical
 * rates here — that ships in Chunk 10 with the FX cache).
 */
export function accountBalanceEURAt(args: {
  account: Account;
  date: string;
  transactions: Transaction[];
  fxRate: number;
}): number {
  const { account, date, transactions, fxRate } = args;
  let balance = account.currency === 'EUR'
    ? account.opening_balance
    : account.opening_balance * fxRate;
  for (const t of transactions) {
    if (t.account_id !== account.id) continue;
    if (t.date > date) continue;
    balance += signedAmount({ type: t.type, amount: txToEUR(t, fxRate) });
  }
  return balance;
}

/** Per-account current EUR balance map, keyed by account id. */
export function accountsCurrentEUR(args: {
  accounts: Account[];
  transactions: Transaction[];
  fxRate: number;
}): Map<string, number> {
  const today = dateToISO(new Date());
  const out = new Map<string, number>();
  for (const a of args.accounts) {
    out.set(
      a.id,
      accountBalanceEURAt({
        account: a,
        date: today,
        transactions: args.transactions,
        fxRate: args.fxRate,
      }),
    );
  }
  return out;
}

export interface TrajectoryPoint {
  label: string;
  date: string;
  /** balanceEUR per account id */
  balances: Record<string, number>;
}

const MONTH_SHORT_TR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Last N month-end balances per account, in EUR. Used by the trajectory
 * chart on the Accounts page.
 */
export function accountsTrajectoryEUR(args: {
  accounts: Account[];
  transactions: Transaction[];
  endYear: number;
  endMonth: number;
  count: number;
  fxRate: number;
}): TrajectoryPoint[] {
  const { accounts, transactions, endYear, endMonth, count, fxRate } = args;
  const out: TrajectoryPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = endMonth - i;
    // EOM = day 0 of next month, in local TZ.
    const eom = new Date(endYear, m + 1, 0);
    const date = dateToISO(eom);
    const balances: Record<string, number> = {};
    for (const a of accounts) {
      balances[a.id] = accountBalanceEURAt({ account: a, date, transactions, fxRate });
    }
    out.push({
      label: MONTH_SHORT_TR[eom.getMonth()] ?? '',
      date,
      balances,
    });
  }
  return out;
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
