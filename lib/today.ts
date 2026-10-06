/**
 * "Today" as a YYYY-MM-DD string in the user's timezone (Germany — CLAUDE.md
 * §11). Computed on the server and passed down as a prop so server render
 * and hydration agree; Vercel's own clock is UTC and would flip the date
 * an hour or two early/late.
 */
export function todayInBerlin(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
