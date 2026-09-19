import { txToEUR } from '@/lib/money';
import { daysBetweenInclusive } from '@/lib/date';
import { isTravelCategory } from '@/lib/transactions/constants';
import type { Subcategory, Transaction, TripDetails } from '@/lib/supabase/types';

export interface TripSubcategoryTotal {
  name: string;
  amount: number;
  count: number;
  /** Booked-before-leaving vs spent-on-the-ground — see Subcategory.is_fixed_cost. */
  fixed: boolean;
}

export interface TripSummary {
  trip: string;
  txCount: number;
  fromDate: string;
  toDate: string;
  /** Inclusive calendar days spanned by fromDate/toDate. */
  days: number;
  /** False when fromDate/toDate are a guess (earliest/latest tagged transaction date) rather than the user's own start_date/end_date from trip_details. */
  datesAreExplicit: boolean;
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
 * A trip's date range prefers the user's own trip_details.start_date/
 * end_date. Those are null until set, so the fallback — earliest/latest
 * tagged transaction date — covers a trip nobody has configured yet. That
 * fallback is only ever a guess: a transaction's date is when the money
 * moved, not necessarily a day you were on the trip (a flight bought weeks
 * ahead and tagged immediately would otherwise stretch the range back to
 * the booking date). datesAreExplicit tells the UI which case it's in.
 */
export function tripSummaries(args: {
  transactions: Transaction[];
  travelSubcategories: Subcategory[];
  tripDetails: TripDetails[];
  fxRate: number;
}): TripSummary[] {
  const { transactions, travelSubcategories, tripDetails, fxRate } = args;
  const fixedByName = new Map(travelSubcategories.map((s) => [s.name, s.is_fixed_cost]));
  const detailsByTrip = new Map(tripDetails.map((d) => [d.trip, d]));

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
    const bySubMap = new Map<string, { amount: number; count: number }>();
    let derivedFrom = txs[0]!.date;
    let derivedTo = txs[0]!.date;
    for (const t of txs) {
      if (t.date < derivedFrom) derivedFrom = t.date;
      if (t.date > derivedTo) derivedTo = t.date;
      const sub = (t.subcategory ?? '').trim() || 'Uncategorised';
      const entry = bySubMap.get(sub) ?? { amount: 0, count: 0 };
      entry.amount += txToEUR(t, fxRate);
      entry.count += 1;
      bySubMap.set(sub, entry);
    }

    const bySubcategory = Array.from(bySubMap, ([name, { amount, count }]) => ({
      name,
      amount,
      count,
      fixed: fixedByName.get(name) ?? false,
    })).sort((a, b) => b.amount - a.amount);

    const total = bySubcategory.reduce((s, x) => s + x.amount, 0);
    const fixed = bySubcategory.filter((x) => x.fixed).reduce((s, x) => s + x.amount, 0);
    const daily = total - fixed;

    const details = detailsByTrip.get(trip);
    const fromDate = details?.start_date ?? derivedFrom;
    const toDate = details?.end_date ?? derivedTo;
    const datesAreExplicit = Boolean(details?.start_date && details?.end_date);
    const days = daysBetweenInclusive(fromDate, toDate);
    const travelers = Math.max(1, details?.travelers ?? 1);

    out.push({
      trip,
      txCount: txs.length,
      fromDate,
      toDate,
      days,
      datesAreExplicit,
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
