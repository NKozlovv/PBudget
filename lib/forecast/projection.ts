import { accountBalanceEURAt, totalBalanceEUR } from '@/lib/balance';
import { dateToISO, monthName } from '@/lib/date';
import type { Account, Transaction } from '@/lib/supabase/types';

export interface ProjectionPoint {
  /** Short month label (uppercase). */
  label: string;
  /** ISO `YYYY-MM-DD` for the data point. Past = month-end; projected = month-end. */
  date: string;
  /** Total EUR balance at this point. */
  balance: number;
  /** True for projected points; false for actual past + today. */
  projected: boolean;
}

/**
 * Build a continuous balance series: past `pastMonths` month-ends → today →
 * projected `forwardMonths` month-ends, using `avgNet` as the monthly pace.
 *
 * The point at index `pastMonths` is "today" and is the bridge between
 * actual and projected — present in both segments so the line connects.
 */
export function projectionSeries(args: {
  accounts: Account[];
  transactions: Transaction[];
  fxRate: number;
  now: Date;
  pastMonths: number;
  forwardMonths: number;
  avgNet: number;
}): ProjectionPoint[] {
  const { accounts, transactions, fxRate, now, pastMonths, forwardMonths, avgNet } = args;
  const out: ProjectionPoint[] = [];
  const year = now.getFullYear();
  const month = now.getMonth();

  // Past month-end balances.
  for (let i = pastMonths; i >= 1; i--) {
    const eom = new Date(year, month - i + 1, 0);
    const date = dateToISO(eom);
    let total = 0;
    for (const a of accounts) {
      total += accountBalanceEURAt({ account: a, date, transactions, fxRate });
    }
    out.push({
      label: monthName(eom.getMonth(), true).toUpperCase(),
      date,
      balance: total,
      projected: false,
    });
  }

  // Today as the bridge point.
  const today = totalBalanceEUR({ accounts, transactions, fxRate });
  out.push({
    label: monthName(month, true).toUpperCase(),
    date: dateToISO(now),
    balance: today,
    projected: false,
  });

  // Projected forward at avgNet pace.
  let running = today;
  for (let i = 1; i <= forwardMonths; i++) {
    running += avgNet;
    const eom = new Date(year, month + i + 1, 0);
    out.push({
      label: monthName(eom.getMonth(), true).toUpperCase(),
      date: dateToISO(eom),
      balance: running,
      projected: true,
    });
  }
  return out;
}

/** ISO month-end date `forwardMonths` ahead of `now`. */
export function eomAhead(now: Date, forwardMonths: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + forwardMonths + 1, 0);
}

/**
 * Pick the next round-number savings milestone past `balance`. Steps by
 * 10k once balance ≥ 20k, else by 5k.
 */
export function nextMilestone(balance: number): number {
  const step = balance >= 20000 ? 10000 : 5000;
  return Math.ceil((balance + 1) / step) * step;
}

/** Estimate the calendar date the milestone is reached at avgNet pace. */
export function milestoneEta(args: {
  balance: number;
  avgNet: number;
  milestone: number;
  now: Date;
}): { months: number; date: Date } | null {
  const { balance, avgNet, milestone, now } = args;
  if (avgNet <= 0) return null;
  const need = milestone - balance;
  if (need <= 0) return null;
  const months = Math.ceil(need / avgNet);
  // Snap to month-end so the label reads as "by Aug 2026".
  const date = new Date(now.getFullYear(), now.getMonth() + months + 1, 0);
  return { months, date };
}
