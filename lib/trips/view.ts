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

/** Budget-wide average for the active metric — the benchmark line/label. */
export function averageMetric(trips: TripSummary[], metric: TripMetric): number {
  const grand = trips.reduce((s, t) => s + t.total, 0);
  if (metric === 'total') return trips.length > 0 ? grand / trips.length : 0;
  if (metric === 'perDay') {
    const days = trips.reduce((s, t) => s + t.days, 0);
    return days > 0 ? grand / days : 0;
  }
  const personDays = trips.reduce((s, t) => s + t.days * t.travelers, 0);
  return personDays > 0 ? grand / personDays : 0;
}
