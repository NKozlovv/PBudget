import { txToEUR } from '@/lib/money';
import { daysBetweenInclusive } from '@/lib/date';
import { isTravelCategory } from '@/lib/transactions/constants';
import type { Subcategory, Transaction, TripDetails } from '@/lib/supabase/types';

export interface TripSubcategoryTotal {
  name: string;
  amount: number;
  /** Booked-before-leaving vs spent-on-the-ground — see Subcategory.is_fixed_cost. */
  fixed: boolean;
}

export interface TripSummary {
  trip: string;
  txCount: number;
  fromDate: string;
  toDate: string;
  /** Inclusive calendar days spanned by the trip's own tagged transactions. */
  days: number;
  travelers: number;
  total: number;
  fixed: number;
  daily: number;
  perDay: number;
  perPersonDay: number;
  dailyPerDay: number;
  /** Nonzero subcategories, largest first. */
  bySubcategory: TripSubcategoryTotal[];
}

/**
 * Groups every Travel-category, trip-tagged expense into one summary per
 * trip. Refunds/adjustments aren't expenses (CLAUDE.md §8a) and income has
 * no trip concept, so both are excluded the same way lib/categories/summary.ts
 * excludes them from a category's spend totals.
 *
 * A trip's date range and day count come from its own transactions' dates,
 * not a stored start/end — there's no `trips` table, just a text tag (see
 * lib/transactions/constants.ts), so "when the trip happened" is whatever
 * its tagged spend actually spans.
 */
export function tripSummaries(args: {
  transactions: Transaction[];
  travelSubcategories: Subcategory[];
  tripDetails: TripDetails[];
  fxRate: number;
}): TripSummary[] {
  const { transactions, travelSubcategories, tripDetails, fxRate } = args;
  const fixedByName = new Map(travelSubcategories.map((s) => [s.name, s.is_fixed_cost]));
  const travelersByTrip = new Map(tripDetails.map((d) => [d.trip, d.travelers]));

  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    // Case/whitespace-insensitive, matching isTravelCategory's own
    // tolerance elsewhere (TransactionForm, enforceTripRule) — a
    // transaction can only ever have a `trip` tag if some write path
    // already treated its category as Travel, so re-checking with an
    // exact-string match here would silently drop rows a stricter filter
    // upstream (e.g. a listTransactions({ category: 'Travel' }) call)
    // would also have missed.
    if (!isTravelCategory(t.category)) continue;
    const trip = (t.trip ?? '').trim();
    if (!trip) continue;
    if (!groups.has(trip)) groups.set(trip, []);
    groups.get(trip)!.push(t);
  }

  const out: TripSummary[] = [];
  for (const [trip, txs] of groups) {
    const bySubMap = new Map<string, number>();
    let fromDate = txs[0]!.date;
    let toDate = txs[0]!.date;
    for (const t of txs) {
      if (t.date < fromDate) fromDate = t.date;
      if (t.date > toDate) toDate = t.date;
      const sub = (t.subcategory ?? '').trim() || 'Uncategorised';
      bySubMap.set(sub, (bySubMap.get(sub) ?? 0) + txToEUR(t, fxRate));
    }

    const bySubcategory = Array.from(bySubMap, ([name, amount]) => ({
      name,
      amount,
      fixed: fixedByName.get(name) ?? false,
    })).sort((a, b) => b.amount - a.amount);

    const total = bySubcategory.reduce((s, x) => s + x.amount, 0);
    const fixed = bySubcategory.filter((x) => x.fixed).reduce((s, x) => s + x.amount, 0);
    const daily = total - fixed;
    const days = daysBetweenInclusive(fromDate, toDate);
    const travelers = Math.max(1, travelersByTrip.get(trip) ?? 1);

    out.push({
      trip,
      txCount: txs.length,
      fromDate,
      toDate,
      days,
      travelers,
      total,
      fixed,
      daily,
      perDay: total / days,
      perPersonDay: total / (days * travelers),
      dailyPerDay: daily / days,
      bySubcategory,
    });
  }

  return out;
}
