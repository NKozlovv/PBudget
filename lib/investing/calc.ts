/**
 * Investing math — pure. Value, return and yield are *derived* from lots
 * and the daily price history; nothing market-driven is ever written to the
 * transaction log, so cash "Saved" figures stay clean (see
 * docs/investing-rsu-migration.sql header).
 */

export interface Lot {
  id: string;
  type: 'buy' | 'open';
  date: string;
  shares: number;
  price: number;
  fee: number;
}

export interface PricePoint {
  date: string;
  close: number;
}

export const lotCost = (l: Lot) => l.shares * l.price + l.fee;

/** Last close on or before `date` (first close if `date` precedes the history). */
export function priceOn(history: PricePoint[], date: string): number {
  if (history.length === 0) return 0;
  let lo = 0;
  let hi = history.length - 1;
  if (date < history[0]!.date) return history[0]!.close;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (history[mid]!.date <= date) lo = mid;
    else hi = mid - 1;
  }
  return history[lo]!.close;
}

export function valueAt(lots: Lot[], history: PricePoint[], date: string): number {
  const shares = lots.reduce((a, l) => (l.date <= date ? a + l.shares : a), 0);
  return shares * priceOn(history, date);
}

const dayMs = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
};

export interface PeriodStats {
  /** Value at the start boundary. */
  sv: number;
  /** Value at the end boundary. */
  ev: number;
  /** Cash put in during (start, end], fees included. */
  inv: number;
  /** Market move after fees: ev − sv − inv. */
  ret: number;
  /** Money-weighted yield %: each buy only counts for the part of the period it was invested. */
  yld: number;
  flows: Lot[];
}

export function period(lots: Lot[], history: PricePoint[], start: string, end: string): PeriodStats {
  const flows = lots.filter((l) => l.date > start && l.date <= end);
  const sv = valueAt(lots, history, start);
  const ev = valueAt(lots, history, end);
  const inv = flows.reduce((a, l) => a + lotCost(l), 0);
  const ret = ev - sv - inv;
  const span = Math.max(1, dayMs(end) - dayMs(start));
  const wInv = flows.reduce((a, l) => a + (lotCost(l) * (dayMs(end) - dayMs(l.date))) / span, 0);
  const base = sv + wInv;
  return { sv, ev, inv, ret, yld: base > 0 ? (ret / base) * 100 : 0, flows };
}

export interface PlanInput {
  contrib: number;
  inc: number;
  overrides?: Record<string, number>;
}

export interface Simulation {
  vals: number[];
  contribs: number[];
  yearly: { y: number; amt: number; base: number; growth: number; end: number }[];
}

/** Monthly-compounded projection from `v0`, contributing `amt/12` each month. */
export function simulate(v0: number, p: PlanInput, yieldPct: number, horizon: number): Simulation {
  const r = Math.pow(1 + yieldPct / 100, 1 / 12) - 1;
  const vals = [v0];
  const contribs = [0];
  const yearly: Simulation['yearly'] = [];
  let v = v0;
  let c = 0;
  for (let y = 1; y <= horizon; y++) {
    const base = p.contrib * Math.pow(1 + p.inc / 100, y - 1);
    const o = p.overrides?.[String(y)];
    const amt = o != null ? o : base;
    const start = v;
    for (let m = 0; m < 12; m++) v = v * (1 + r) + amt / 12;
    c += amt;
    vals.push(v);
    contribs.push(c);
    yearly.push({ y, amt, base, growth: v - start - amt, end: v });
  }
  return { vals, contribs, yearly };
}
