export const PERIODS = ['Week', 'Month', 'Quarter', 'YTD', 'All'] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(raw: string | string[] | undefined): Period {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (PERIODS as readonly string[]).includes(v ?? '') ? (v as Period) : 'Month';
}

/** ISO 8601 week number for a Date (1..53). */
export function isoWeek(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((+target - +yearStart) / 86_400_000 + 1) / 7);
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLong(monthIdx: number): string {
  return MONTHS_LONG[monthIdx] ?? '';
}

export function timeOfDayGreeting(d: Date): 'morning' | 'afternoon' | 'evening' {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

/**
 * The "working month" — the last fully-completed calendar month, e.g.
 * March while today is any day in April. The user fills in the budget at
 * month-end for the month that just ended, so "this month" totals /
 * category mix / greeting insight default to this instead of the
 * in-progress current month (which usually has little or no data yet).
 * Account balances stay anchored to the true current date — only
 * spend/income totals shift.
 */
export function workingMonth(now: Date): { year: number; month: number } {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
