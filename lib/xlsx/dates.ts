import { dateToISO } from '@/lib/date';

/**
 * Excel serial date → JS Date in LOCAL time. Excel's epoch is 1899-12-30.
 * We anchor at local midnight to avoid the timezone shift documented in
 * CLAUDE.md §8b.
 */
export function excelSerialToDate(n: number): Date {
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + Math.round(n) * 86400 * 1000);
}

/**
 * Normalise any cell value (Date, Excel serial number, ISO string) to
 * a 'YYYY-MM-DD' string in local time, or null if unparseable.
 */
export function normaliseDate(cellVal: unknown): string | null {
  if (cellVal == null || cellVal === '') return null;
  if (cellVal instanceof Date) {
    return Number.isNaN(cellVal.getTime()) ? null : dateToISO(cellVal);
  }
  if (typeof cellVal === 'number') {
    const d = excelSerialToDate(cellVal);
    return Number.isNaN(d.getTime()) ? null : dateToISO(d);
  }
  if (typeof cellVal === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(cellVal);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(cellVal);
    return Number.isNaN(d.getTime()) ? null : dateToISO(d);
  }
  return null;
}

/** Detect currency from account name suffix ("Deel, $" → USD). */
export function detectCurrency(accountName: string): 'EUR' | 'USD' {
  if (!accountName) return 'EUR';
  const s = accountName.trim();
  if (s.endsWith('$') || s.includes(', $')) return 'USD';
  return 'EUR';
}
