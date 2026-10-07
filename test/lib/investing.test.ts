import { describe, it, expect } from 'vitest';
import { period, priceOn, simulate, type Lot, type PricePoint } from '@/lib/investing/calc';
import { schedule, addMonths } from '@/lib/rsu/calc';

const history: PricePoint[] = [
  { date: '2025-12-31', close: 10 },
  { date: '2026-01-31', close: 11 },
  { date: '2026-02-28', close: 12 },
];

describe('priceOn', () => {
  it('uses the last close on or before the date', () => {
    expect(priceOn(history, '2026-02-15')).toBe(11);
    expect(priceOn(history, '2026-02-28')).toBe(12);
    expect(priceOn(history, '2030-01-01')).toBe(12);
  });
  it('falls back to the first close before history starts', () => {
    expect(priceOn(history, '2020-01-01')).toBe(10);
  });
});

describe('period', () => {
  const lots: Lot[] = [
    { id: 'a', type: 'open', date: '2025-12-31', shares: 100, price: 10, fee: 0 },
    { id: 'b', type: 'buy', date: '2026-01-31', shares: 10, price: 11, fee: 1 },
  ];
  it('splits cash in from market move', () => {
    const p = period(lots, history, '2025-12-31', '2026-02-28');
    expect(p.sv).toBe(1000); // opening lot dated on the boundary is already held
    expect(p.inv).toBe(111); // only the 31 Jan buy is a flow
    expect(p.ev).toBe(110 * 12);
    expect(p.ret).toBeCloseTo(110 * 12 - 1000 - 111);
  });
  it('a loss is a negative return, not an expense', () => {
    const down: PricePoint[] = [{ date: '2026-01-01', close: 10 }, { date: '2026-06-01', close: 8 }];
    const l: Lot[] = [{ id: 'a', type: 'open', date: '2026-01-01', shares: 10, price: 10, fee: 0 }];
    const p = period(l, down, '2026-01-01', '2026-06-01');
    expect(p.ret).toBeCloseTo(-20);
    expect(p.yld).toBeLessThan(0);
  });
});

describe('simulate', () => {
  it('with 0% yield just adds contributions', () => {
    const s = simulate(1000, { contrib: 1200, inc: 0 }, 0, 2);
    expect(s.vals[2]).toBeCloseTo(3400);
    expect(s.contribs[2]).toBe(2400);
  });
});

describe('rsu schedule', () => {
  const g = { id: 'g', name: 'x', start_date: '2024-03-15', shares: 1200, months: 48, every: 3, cliff: 12 };
  it('totals the grant exactly and skips pre-cliff vests', () => {
    const ev = schedule(g);
    expect(ev.reduce((a, e) => a + e.shares, 0)).toBe(1200);
    expect(ev[0]?.date).toBe('2025-03-15');
    expect(ev[0]?.shares).toBe(300); // 12/48 of the grant lands at the cliff
    expect(ev[0]?.isCliff).toBe(true);
  });
  it('clamps month-end days', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
  });
});
