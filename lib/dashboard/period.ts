const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLong(monthIdx: number): string {
  return MONTHS_LONG[monthIdx] ?? '';
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
