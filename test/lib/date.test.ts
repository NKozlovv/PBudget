import { describe, it, expect } from 'vitest';
import {
  monthOfDate,
  yearOfDate,
  dayOfDate,
  dateToISO,
  dateStr,
  dateDisplay,
  eomDateStr,
  monthName,
  daysBetweenInclusive,
  dateRangeDisplay,
} from '@/lib/date';

/**
 * Regression tests for the timezone bug documented in CLAUDE.md §8b.
 * In any timezone east of UTC (e.g. Berlin, where this project lives),
 * `new Date('YYYY-MM-DD')` parses as UTC midnight, which converts to the
 * previous calendar day in local time. The helpers here parse 'YYYY-MM-DD'
 * literally so the year/month/day are correct regardless of TZ.
 */

describe('date helpers — timezone-safe parsing', () => {
  it('monthOfDate handles January 1st correctly', () => {
    // The canonical regression: new Date('2026-01-01').getMonth() returns 11
    // (December) in Berlin because UTC midnight is Dec 31 local. Our helper
    // must return 0 (January) regardless of TZ.
    expect(monthOfDate('2026-01-01')).toBe(0);
  });

  it('yearOfDate handles January 1st correctly', () => {
    // Same regression: new Date('2026-01-01').getFullYear() returns 2025
    // in Berlin. Our helper must return 2026.
    expect(yearOfDate('2026-01-01')).toBe(2026);
  });

  it('dayOfDate handles December 31st correctly', () => {
    expect(dayOfDate('2025-12-31')).toBe(31);
  });

  it('parses a typical mid-month date', () => {
    expect(monthOfDate('2026-05-15')).toBe(4);
    expect(yearOfDate('2026-05-15')).toBe(2026);
    expect(dayOfDate('2026-05-15')).toBe(15);
  });

  it('throws on malformed input', () => {
    expect(() => monthOfDate('not-a-date')).toThrow();
    expect(() => monthOfDate('')).toThrow();
  });

  it('accepts ISO strings with a time suffix and only reads the date part', () => {
    expect(yearOfDate('2026-05-15T10:30:00Z')).toBe(2026);
    expect(monthOfDate('2026-05-15T10:30:00Z')).toBe(4);
    expect(dayOfDate('2026-05-15T10:30:00Z')).toBe(15);
  });
});

describe('date helpers — formatting', () => {
  it('dateToISO uses local components, not UTC', () => {
    // Build a Date from explicit local Y/M/D — toLocaleDateString and
    // .getFullYear/.getMonth/.getDate must round-trip without TZ shift.
    const d = new Date(2026, 0, 1); // local Jan 1, 2026
    expect(dateToISO(d)).toBe('2026-01-01');
  });

  it('dateToISO pads single-digit month and day', () => {
    const d = new Date(2026, 4, 5); // May 5
    expect(dateToISO(d)).toBe('2026-05-05');
  });

  it('dateStr is idempotent on string input', () => {
    expect(dateStr('2026-05-15')).toBe('2026-05-15');
    expect(dateStr('2026-05-15T10:30:00Z')).toBe('2026-05-15');
  });

  it('dateStr formats Date input via local components', () => {
    expect(dateStr(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('dateDisplay produces a human-readable form', () => {
    // Locale dependent; assert the components rather than the exact
    // separator/format string so this works in any node version.
    const out = dateDisplay('2026-05-15');
    expect(out).toMatch(/15/);
    expect(out).toMatch(/May/);
    expect(out).toMatch(/2026/);
  });
});

describe('date helpers — eomDateStr', () => {
  it('returns the last day of the given month', () => {
    expect(eomDateStr(2026, 0)).toBe('2026-01-31');
    expect(eomDateStr(2026, 3)).toBe('2026-04-30');
    expect(eomDateStr(2026, 11)).toBe('2026-12-31');
  });

  it('handles February in a non-leap year', () => {
    expect(eomDateStr(2026, 1)).toBe('2026-02-28');
  });

  it('handles February in a leap year', () => {
    expect(eomDateStr(2024, 1)).toBe('2024-02-29');
  });
});

describe('date helpers — daysBetweenInclusive', () => {
  it('counts a single day as 1', () => {
    expect(daysBetweenInclusive('2026-03-06', '2026-03-06')).toBe(1);
  });

  it('counts an inclusive range within a month', () => {
    // 6, 7, ..., 18 Mar = 13 days.
    expect(daysBetweenInclusive('2026-03-06', '2026-03-18')).toBe(13);
  });

  it('is order-independent', () => {
    expect(daysBetweenInclusive('2026-03-18', '2026-03-06')).toBe(13);
  });

  it('spans a year boundary without a UTC-shift off-by-one', () => {
    // 29, 30, 31 Dec + 1, 2 Jan = 5 days.
    expect(daysBetweenInclusive('2025-12-29', '2026-01-02')).toBe(5);
  });
});

describe('date helpers — dateRangeDisplay', () => {
  it('drops the repeated month for a same-month range', () => {
    expect(dateRangeDisplay('2026-03-06', '2026-03-18')).toBe('6–18 Mar');
  });

  it('shows both months when the range crosses a month boundary', () => {
    expect(dateRangeDisplay('2026-02-28', '2026-03-03')).toBe('28 Feb – 3 Mar');
  });

  it('shows both years when the range crosses a year boundary', () => {
    expect(dateRangeDisplay('2025-12-29', '2026-01-02')).toBe('29 Dec 2025 – 2 Jan 2026');
  });
});

describe('date helpers — monthName', () => {
  it('returns full names by default', () => {
    expect(monthName(0)).toBe('January');
    expect(monthName(11)).toBe('December');
  });

  it('returns short names when requested', () => {
    expect(monthName(0, true)).toBe('Jan');
    expect(monthName(11, true)).toBe('Dec');
  });

  it('returns empty string for out-of-range', () => {
    expect(monthName(99)).toBe('');
  });
});
