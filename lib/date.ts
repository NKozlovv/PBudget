/**
 * Timezone-safe date helpers.
 *
 * **Regression** — see CLAUDE.md §8b. In Berlin (UTC+1/+2),
 * `new Date('2026-01-01').getDate()` returns 31 of the previous
 * month because the string is parsed as UTC midnight. Every helper
 * here either parses 'YYYY-MM-DD' literally (regex), or builds Date
 * objects via the local-component constructor `new Date(y, m, d)`.
 *
 * Test coverage in test/lib/date.test.ts.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

interface YMD {
  year: number;
  /** 0-indexed: January = 0 */
  month: number;
  day: number;
}

function parseISO(date: string): YMD {
  const m = ISO_DATE_RE.exec(date);
  if (!m) {
    throw new Error(`Invalid YYYY-MM-DD date: ${date}`);
  }
  return {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
  };
}

/** 0-indexed month from a 'YYYY-MM-DD' string. Jan = 0. */
export function monthOfDate(date: string): number {
  return parseISO(date).month;
}

/** 4-digit year from a 'YYYY-MM-DD' string. */
export function yearOfDate(date: string): number {
  return parseISO(date).year;
}

/** Day-of-month (1–31) from a 'YYYY-MM-DD' string. */
export function dayOfDate(date: string): number {
  return parseISO(date).day;
}

/** Format a Date object as 'YYYY-MM-DD' using local components. */
export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Coerce a 'YYYY-MM-DD' string OR a Date to its ISO date string,
 * always using local components. Idempotent on strings.
 */
export function dateStr(d: string | Date): string {
  if (typeof d === 'string') {
    parseISO(d); // validates format
    return d.slice(0, 10);
  }
  return dateToISO(d);
}

/** Format a 'YYYY-MM-DD' string as e.g. "12 May 2026". */
export function dateDisplay(date: string, locale = 'en-GB'): string {
  const { year, month, day } = parseISO(date);
  // Use local-component Date so toLocaleDateString returns the right calendar day.
  return new Date(year, month, day).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** End-of-month date string for a given (year, 0-indexed month). */
export function eomDateStr(year: number, month: number): string {
  // Day 0 of next month = last day of current month, in local TZ.
  const d = new Date(year, month + 1, 0);
  return dateToISO(d);
}

/**
 * Inclusive calendar-day span between two 'YYYY-MM-DD' dates (order doesn't
 * matter). Both sides are built via the local-component constructor, so this
 * is immune to the UTC-midnight shift the rest of this file guards against —
 * a naive `(new Date(b) - new Date(a)) / 86400000` would be off by one for
 * exactly the TZs (east of UTC) this project actually runs in.
 */
export function daysBetweenInclusive(a: string, b: string): number {
  const x = parseISO(a);
  const y = parseISO(b);
  const start = new Date(x.year, x.month, x.day).getTime();
  const end = new Date(y.year, y.month, y.day).getTime();
  return Math.round(Math.abs(end - start) / 86_400_000) + 1;
}

/**
 * Compact human range for a pair of 'YYYY-MM-DD' dates, e.g. "6–18 Mar",
 * "28 Feb – 3 Mar", or "29 Dec 2025 – 2 Jan 2026" — only as verbose as it
 * needs to be, dropping the month/year on the left side when they match the
 * right side's.
 */
export function dateRangeDisplay(from: string, to: string): string {
  const a = parseISO(from);
  const b = parseISO(to);
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${monthName(b.month, true)}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${monthName(a.month, true)} – ${b.day} ${monthName(b.month, true)}`;
  }
  return `${a.day} ${monthName(a.month, true)} ${a.year} – ${b.day} ${monthName(b.month, true)} ${b.year}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function monthName(month: number, short = false): string {
  const arr = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return arr[month] ?? '';
}
