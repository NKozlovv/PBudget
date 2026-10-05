/**
 * "Months with data" — the basis for every monthly average in the app.
 *
 * The user enters a month's transactions some days *after* it ends, so the
 * last calendar month is often still empty for a while. Counting that empty
 * month (or any other gap) as a real month of zero spend/income dragged
 * every YTD average down and skewed every projection until the data
 * arrived. So: a month only counts once it has at least one income or
 * expense transaction (adjustments are transfers, not activity), and the
 * "working month" (CLAUDE.md §8f) steps back past empty months too.
 *
 * Pure; covered by test/lib/activeMonths.test.ts.
 */

import { workingMonth } from '@/lib/dashboard/period';
import type { Transaction } from '@/lib/supabase/types';

type TxLike = Pick<Transaction, 'type' | 'date'>;

/** 'YYYY-MM' keys of months with at least one income or expense transaction. */
export function monthsWithActivity(transactions: TxLike[]): Set<string> {
  const out = new Set<string>();
  for (const t of transactions) {
    if (t.type === 'adjustment') continue;
    out.add(t.date.slice(0, 7));
  }
  return out;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/** How many of Jan..endMonth (0-indexed, inclusive) of `year` have activity. */
export function activeMonthCount(active: Set<string>, year: number, endMonth: number): number {
  let n = 0;
  for (let m = 0; m <= endMonth; m++) if (active.has(monthKey(year, m))) n++;
  return n;
}

/**
 * The last completed calendar month that actually has data — the plain
 * calendar `workingMonth(now)` when it does, else the nearest earlier month
 * that does (looking back up to a year). Falls back to the calendar month
 * when there's no data at all, so an empty budget still has an anchor.
 */
export function activeWorkingMonth(now: Date, active: Set<string>): { year: number; month: number } {
  const base = workingMonth(now);
  let { year, month } = base;
  for (let i = 0; i < 12; i++) {
    if (active.has(monthKey(year, month))) return { year, month };
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return base;
}
