import { accountBalanceEURAt } from '@/lib/balance';
import { dateToISO, monthName } from '@/lib/date';
import type { Account, Transaction } from '@/lib/supabase/types';

export interface ProjectionPoint {
  /** Short month label (uppercase). */
  label: string;
  /** ISO `YYYY-MM-DD` for the data point. Past = month-end; projected = month-end. */
  date: string;
  /** Total EUR balance at this point. */
  balance: number;
  /** True for projected points; false for actual past months. */
  projected: boolean;
}

/**
 * Build a continuous balance series: past `pastMonths` month-ends through
 * (year, month) inclusive, then projected forward `forwardMonths` more
 * month-ends at `avgNet` pace.
 *
 * (year, month) is the boundary between real and projected and should be
 * the same "working month" (last completed calendar month) that `avgNet`
 * itself was averaged through — CLAUDE.md §8f, and the same anchor
 * Overview's own EOY projection uses (see dashboard/page.tsx's
 * `eomBalanceEUR`/`projectedEOY`) — so the two screens' figures agree
 * instead of one counting the in-progress current month and the other
 * not. Account *balances* elsewhere (the "Balance today" KPI, the
 * accounts page) stay real-time; only this averaged/projected line does not.
 */
export function projectionSeries(args: {
  accounts: Account[];
  transactions: Transaction[];
  fxRate: number;
  year: number;
  /** 0-indexed; the last completed month, i.e. the boundary month. */
  month: number;
  pastMonths: number;
  forwardMonths: number;
  avgNet: number;
}): ProjectionPoint[] {
  const { accounts, transactions, fxRate, year, month, pastMonths, forwardMonths, avgNet } = args;
  const out: ProjectionPoint[] = [];

  function eomBalance(y: number, m: number): number {
    const eom = new Date(y, m + 1, 0);
    const date = dateToISO(eom);
    let total = 0;
    for (const a of accounts) {
      total += accountBalanceEURAt({ account: a, date, transactions, fxRate });
    }
    return total;
  }

  // Past month-ends, including the boundary month itself (real data).
  for (let i = pastMonths; i >= 0; i--) {
    const eom = new Date(year, month - i + 1, 0);
    out.push({
      label: monthName(eom.getMonth(), true).toUpperCase(),
      date: dateToISO(eom),
      balance: eomBalance(eom.getFullYear(), eom.getMonth()),
      projected: false,
    });
  }

  // Projected forward at avgNet pace, starting from the boundary balance.
  let running = out[out.length - 1]!.balance;
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
