import { fmtEUR } from '@/lib/money';
import type { TripSummary } from './summary';

export type TripMetric = 'total' | 'perDay' | 'perPersonDay';

export const TRIP_METRICS: { key: TripMetric; label: string; note: string }[] = [
  { key: 'total', label: 'Total', note: 'Raw cost of each trip.' },
  { key: 'perDay', label: 'Per day', note: 'Total divided by days away.' },
  {
    key: 'perPersonDay',
    label: 'Per person-day',
    note: 'The fairest way to compare trips of different size and length.',
  },
];

export function metricValue(t: TripSummary, metric: TripMetric): number {
  if (metric === 'total') return t.total;
  if (metric === 'perDay') return t.perDay;
  return t.perPersonDay;
}

export function formatMetric(value: number, metric: TripMetric): string {
  if (metric === 'total') return fmtEUR(value, { decimals: 0 });
  const suffix = metric === 'perDay' ? '/day' : '/p·day';
  return fmtEUR(Math.round(value), { decimals: 0 }) + suffix;
}

/**
 * The plain mean of each trip's own metric value — one trip, one data
 * point, regardless of how long it was. Deliberately NOT total spend over
 * total days/person-days: that day-weighted version lets one very long or
 * very short trip pull the "average" toward its own rate far more than its
 * one-trip-out-of-N share, which reads as "the average trip costs X" while
 * actually meaning something closer to "the average day across all travel
 * costs X." Used identically by the hero KPIs, the ranked list's benchmark
 * line, and the table's verdict column, so all three agree on what
 * "average" means.
 */
export function averageMetric(trips: TripSummary[], metric: TripMetric): number {
  if (trips.length === 0) return 0;
  return trips.reduce((s, t) => s + metricValue(t, metric), 0) / trips.length;
}
