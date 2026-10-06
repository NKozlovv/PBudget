/**
 * RSU vesting math — pure, no I/O. Dates are YYYY-MM-DD strings parsed
 * literally (never via `new Date('YYYY-MM-DD')`, which is UTC midnight —
 * see CLAUDE.md §8b).
 */

export interface GrantInput {
  id: string;
  name: string;
  start_date: string;
  shares: number;
  months: number;
  every: number;
  cliff: number;
}

export interface VestEvent {
  grantId: string;
  date: string;
  shares: number;
  /** The first vest after the cliff (the lump that covers the cliff period). */
  isCliff: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseISO(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

/** Local-midnight Date for a YYYY-MM-DD string. */
export function toDate(s: string): Date {
  const { y, m, d } = parseISO(s);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add whole months, clamping the day (31 Jan + 1 month = 28/29 Feb, not 3 Mar). */
export function addMonths(s: string, months: number): string {
  const { y, m, d } = parseISO(s);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(ny, nm + 1, 0).getDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, last))}`;
}

/**
 * Vest events for one grant: every `every` months up to `months`, nothing
 * before the cliff (the first post-cliff vest then carries everything
 * accrued so far), cumulative shares rounded down with the remainder on the
 * final event so the total is exact.
 */
export function schedule(g: GrantInput): VestEvent[] {
  const out: VestEvent[] = [];
  let given = 0;
  let cliffMarked = false;
  for (let m = g.every; m <= g.months; m += g.every) {
    if (m < g.cliff) continue;
    const due = Math.floor((g.shares * m) / g.months);
    const sh = m === g.months ? g.shares - given : due - given;
    given += sh;
    if (sh > 0) {
      const isCliff = g.cliff > 0 && !cliffMarked;
      cliffMarked = true;
      out.push({ grantId: g.id, date: addMonths(g.start_date, m), shares: sh, isCliff });
    }
  }
  return out;
}
