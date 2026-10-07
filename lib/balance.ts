import type { Account, Transaction } from '@/lib/supabase/types';
import { txToEUR, signedAmount } from '@/lib/money';
import { categoryDisplayName } from '@/lib/transactions/constants';
import { activeMonthCount, monthsWithActivity } from '@/lib/activeMonths';

/**
 * Total EUR balance across all accounts for a budget.
 *
 * Account openings: native amount × current rate for non-EUR accounts.
 * Transactions: txToEUR (uses stored fx_rate when set, falls back) then
 * signedAmount based on type.
 *
 * Opening balances of non-EUR accounts use the current rate, not a historical one.
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
 * Native-currency balance of an account up to and including `date`.
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
 * are converted at the fallback rate.
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

export interface YtdAverages {
  monthsElapsed: number;
  monthsRemaining: number;
  avgIncome: number;
  avgExpense: number;
  avgNet: number;
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  projectedIncome: number;
  projectedExpense: number;
  projectedNet: number;
  savingsRate: number; // 0..1
}

/**
 * Year-to-date averages and end-of-year projection.
 * Remaining months are projected at the YTD average pace.
 */
export function ytdAverages(args: {
  transactions: Transaction[];
  year: number;
  endMonth: number;
  fxRate: number;
}): YtdAverages {
  const { transactions, year, endMonth, fxRate } = args;
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.type === 'adjustment') continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (y !== year) continue;
    if (mo > endMonth) continue;
    const eur = txToEUR(t, fxRate);
    if (t.type === 'income') totalIncome += eur;
    else if (t.type === 'expense') totalExpense += eur;
  }
  // Averages divide by months that actually have data — an empty month
  // (usually the one just ended, not entered yet) isn't a month of zero.
  // Projection still runs over the calendar months left after endMonth.
  const monthsElapsed = activeMonthCount(monthsWithActivity(transactions), year, endMonth);
  const monthsRemaining = 11 - endMonth;
  const avgIncome = monthsElapsed > 0 ? totalIncome / monthsElapsed : 0;
  const avgExpense = monthsElapsed > 0 ? totalExpense / monthsElapsed : 0;
  const avgNet = avgIncome - avgExpense;
  const projectedIncome = totalIncome + avgIncome * monthsRemaining;
  const projectedExpense = totalExpense + avgExpense * monthsRemaining;
  const projectedNet = projectedIncome - projectedExpense;
  const savingsRate = projectedIncome > 0 ? projectedNet / projectedIncome : 0;
  return {
    monthsElapsed,
    monthsRemaining,
    avgIncome,
    avgExpense,
    avgNet,
    totalIncome,
    totalExpense,
    totalNet: totalIncome - totalExpense,
    projectedIncome,
    projectedExpense,
    projectedNet,
    savingsRate,
  };
}

export interface ForecastBucket extends MonthBucket {
  projected: boolean;
}

/**
 * 12 months of {income, expense, net} for the year. Past months use real
 * data; future months get the YTD-average filled in for both income and
 * expense.
 */
export function forecastYear(args: {
  transactions: Transaction[];
  year: number;
  endMonth: number;
  fxRate: number;
}): ForecastBucket[] {
  const { transactions, year, endMonth, fxRate } = args;
  const ytd = ytdAverages({ transactions, year, endMonth, fxRate });
  const buckets: ForecastBucket[] = [];
  for (let m = 0; m < 12; m++) {
    if (m <= endMonth) {
      const totals = monthTotalsEUR({ transactions, year, month: m, fxRate });
      buckets.push({
        year,
        month: m,
        label: MONTH_SHORT[m] ?? '',
        income: totals.income,
        expense: totals.expense,
        net: totals.net,
        projected: false,
      });
    } else {
      buckets.push({
        year,
        month: m,
        label: MONTH_SHORT[m] ?? '',
        income: ytd.avgIncome,
        expense: ytd.avgExpense,
        net: ytd.avgNet,
        projected: true,
      });
    }
  }
  return buckets;
}

export interface BurnRateRow {
  name: string;
  thisMonth: number;
  avgMonthly: number;
  projectedYearTotal: number;
  monthsActive: number;
}

/**
 * Per-category burn rate (avg per month) + EOY projection,
 * for a given `kind` (expense or income).
 */
export function burnRatesEUR(args: {
  transactions: Transaction[];
  year: number;
  endMonth: number;
  fxRate: number;
  kind: 'expense' | 'income';
}): BurnRateRow[] {
  const { transactions, year, endMonth, fxRate, kind } = args;
  // Budget-wide months with data (not this category's) — see ytdAverages.
  const monthsElapsed = activeMonthCount(monthsWithActivity(transactions), year, endMonth);

  const totalsByCat = new Map<string, number>();
  const monthlyByCat = new Map<string, Set<number>>();
  const thisMonthByCat = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== kind) continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (y !== year) continue;
    if (mo > endMonth) continue;
    const cat = categoryDisplayName(t.category);
    const eur = txToEUR(t, fxRate);
    totalsByCat.set(cat, (totalsByCat.get(cat) ?? 0) + eur);
    if (!monthlyByCat.has(cat)) monthlyByCat.set(cat, new Set());
    monthlyByCat.get(cat)!.add(mo);
    if (mo === endMonth) {
      thisMonthByCat.set(cat, (thisMonthByCat.get(cat) ?? 0) + eur);
    }
  }

  const rows: BurnRateRow[] = [];
  for (const [name, total] of totalsByCat) {
    const avgMonthly = monthsElapsed > 0 ? total / monthsElapsed : 0;
    rows.push({
      name,
      thisMonth: thisMonthByCat.get(name) ?? 0,
      avgMonthly,
      projectedYearTotal: avgMonthly * 12,
      monthsActive: monthlyByCat.get(name)?.size ?? 0,
    });
  }
  rows.sort((a, b) => b.projectedYearTotal - a.projectedYearTotal);
  return rows;
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
