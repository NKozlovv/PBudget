/** Display formatters shared by the Investing and RSU pages (EUR, en-US grouping like the rest of the v4 UI). */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthShort = (m0: number) => MON[m0] ?? '';

export function eur(n: number, d = 2): string {
  const a = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (n < 0 ? '−' : '') + '€' + a;
}

/** €12k / €1.25M for chart axes and big projections. */
export function big(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return '€' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return '€' + Math.round(n / 1e3) + 'k';
  return eur(n, 0);
}

export const signed = (n: number, d = 2) => (n >= 0 ? '+' : '') + eur(n, d);
export const pct = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%';
export const num = (n: number) => n.toLocaleString('en-US');

/** "12 Mar 26" */
export function niceDate(s: string): string {
  const [y = '', m = '1', d = '1'] = s.split('-');
  return `${Number(d)} ${MON[Number(m) - 1] ?? ''} ${y.slice(2)}`;
}

/** "12 Mar 2026" */
export function niceDateLong(s: string): string {
  const [y = '', m = '1', d = '1'] = s.split('-');
  return `${Number(d)} ${MON[Number(m) - 1] ?? ''} ${y}`;
}

/** Human duration from a day count: "12 days", "7.5 months", "2.1 years". */
export function span(days: number): string {
  if (days < 45) return days + ' days';
  const mo = days / 30.44;
  return mo < 18 ? mo.toFixed(1).replace('.0', '') + ' months' : (mo / 12).toFixed(1) + ' years';
}
