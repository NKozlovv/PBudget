'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/nav/PageHeader';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LotModal, type LotModalMode } from './LotModal';
import { savePlanAction } from '@/app/actions/investing';
import type { SavedPlan } from '@/lib/data/investing';
import type { MarketData } from '@/lib/market';
import { lotCost, period, simulate, type Lot, type PricePoint } from '@/lib/investing/calc';
import { big, eur, monthShort, pct, signed } from '@/lib/investing/format';
import { toISO } from '@/lib/rsu/calc';
import type { InvestmentLot } from '@/lib/supabase/types';

const SCOL = ['#e0568a', '#ef9a3c', '#8b5cf6'];
const POS = '#0f9d8a';
const NEG = '#c93f68';
const eyebrow = 'text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute';
const th = 'whitespace-nowrap border-b border-white/60 px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute';
const td = 'whitespace-nowrap border-b border-white/45 px-2.5 py-2.5 tabular-nums';

type Plan = NonNullable<SavedPlan['p']>;
type Scenario = NonNullable<SavedPlan['saved']>[number];

const DEFAULT_PLAN: Plan = { contrib: 6000, inc: 0, yield: 7, spread: 3, horizon: 20, overrides: {} };

function Tile({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="glass-tile !rounded-[22px] px-4 py-3.5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold -tracking-[0.03em] tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-[3px] text-[12px] font-semibold text-ink-soft">{sub}</div>
    </div>
  );
}

function Seg<T extends string | number>({
  items,
  value,
  onPick,
}: {
  items: { k: T; label: string }[];
  value: T;
  onPick: (k: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-white/[0.44] p-1">
      {items.map((it) => (
        <button
          key={String(it.k)}
          type="button"
          onClick={() => onPick(it.k)}
          className={cn(
            'whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12.5px] font-bold transition-colors',
            it.k === value
              ? 'bg-[linear-gradient(180deg,#5a6be8,#4152d6)] text-white [box-shadow:0_8px_18px_-8px_rgba(74,92,224,.6)]'
              : 'text-ink-soft hover:bg-white/60',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  title,
  display,
  min,
  max,
  step,
  value,
  onChange,
  sub,
  displayClass,
}: {
  title: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  sub?: React.ReactNode;
  displayClass?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute">{title}</span>
        <span className={cn('text-[17px] font-extrabold tabular-nums', displayClass)}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="m-0 w-full accent-indigo"
      />
      {sub ? <div className="text-[12px] font-semibold text-ink-mute">{sub}</div> : null}
    </div>
  );
}

export function InvestingClient({
  budgetId,
  ticker,
  lots: rawLots,
  plan: savedPlan,
  market,
  today,
}: {
  budgetId: string;
  ticker: string;
  lots: InvestmentLot[];
  plan: SavedPlan;
  market: MarketData | null;
  today: string;
}) {
  const lots: Lot[] = useMemo(
    () => rawLots.map((l) => ({ id: l.id, type: l.type, date: l.date, shares: l.shares, price: l.price, fee: l.fee })),
    [rawLots],
  );

  // ── price source ──
  // Live feed when available; otherwise fall back to the most recent lot's
  // price so the page still renders (and says so).
  const fallbackPrice = lots.length ? lots[lots.length - 1]!.price : 0;
  const live = market?.price ?? fallbackPrice;
  const prevClose = market?.prevClose ?? live;
  const history: PricePoint[] = useMemo(
    () => market?.history ?? lots.map((l) => ({ date: l.date, close: l.price })),
    [market, lots],
  );
  const priceDate = market?.asOf ?? today;

  // ── saved plan state (persisted, debounced) ──
  const initialPlan: Plan = useMemo(() => {
    if (savedPlan.p) return savedPlan.p;
    const yearAgo = String(Number(today.slice(0, 4)) - 1) + today.slice(4);
    const last12 = lots.filter((l) => l.type === 'buy' && l.date > yearAgo).reduce((a, l) => a + lotCost(l), 0);
    return last12 > 0 ? { ...DEFAULT_PLAN, contrib: Math.round(last12 / 250) * 250 } : DEFAULT_PLAN;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [p, setPState] = useState<Plan>(initialPlan);
  const [saved, setSaved] = useState<Scenario[]>(savedPlan.saved ?? []);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      void savePlanAction({ budget_id: budgetId, plan: { p, saved } });
    }, 600);
    return () => clearTimeout(t);
  }, [p, saved, budgetId]);
  const setP = <K extends keyof Plan>(k: K, v: Plan[K]) => setPState((s) => ({ ...s, [k]: v }));

  // ── ui state ──
  const [modal, setModal] = useState<LotModalMode | null>(null);
  const [histYear, setHistYear] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const yr0 = Number(today.slice(0, 4));
  const H = p.horizon;

  // ── position ──
  const shares = lots.reduce((a, l) => a + l.shares, 0);
  const invested = lots.reduce((a, l) => a + lotCost(l), 0);
  const value = shares * live;
  const pl = value - invested;
  const plPct = invested ? (pl / invested) * 100 : 0;
  const dayAbs = shares * (live - prevClose);
  const dayPct = prevClose ? (live / prevClose - 1) * 100 : 0;
  const avg = shares ? invested / shares : 0;
  const up = pl >= 0;
  const [vWhole = '0', vCents = '00'] = value.toFixed(2).split('.');
  const fees = lots.reduce((a, l) => a + l.fee, 0);

  // ── track record ──
  const firstY = lots.length ? Number(lots[0]!.date.slice(0, 4)) : yr0;
  const yrs: number[] = [];
  for (let y = firstY; y <= yr0; y++) yrs.push(y);
  const hy = histYear && yrs.includes(histYear) ? histYear : yr0;
  const inProg = hy === yr0;
  const yEnd = (y: number) => (y === yr0 ? today : `${y}-12-31`);

  const ys = useMemo(
    () => yrs.map((y) => ({ y, ...period(lots, history, `${y - 1}-12-31`, yEnd(y)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lots, history, today],
  );
  const cy = ys.find((x) => x.y === hy);
  const cur = cy ?? { y: hy, sv: 0, ev: 0, inv: 0, ret: 0, yld: 0, flows: [] as Lot[] };
  const posRet = cur.ret >= 0;
  const openAmt = cur.flows.filter((l) => l.type === 'open').reduce((a, l) => a + lotCost(l), 0);

  const lastM = inProg ? Number(today.slice(5, 7)) - 1 : 11;
  const months = useMemo(() => {
    const out: (ReturnType<typeof period> & { m: number; partial: boolean })[] = [];
    for (let m = 0; m <= lastM; m++) {
      const s = m === 0 ? `${hy - 1}-12-31` : toISO(new Date(hy, m, 0));
      const partial = m === lastM && inProg;
      const e = partial ? today : toISO(new Date(hy, m + 1, 0));
      out.push({ m, partial, ...period(lots, history, s, e) });
    }
    return out;
  }, [lots, history, hy, lastM, inProg, today]);
  const maxMove = Math.max(1, ...months.map((x) => Math.abs(x.ret)));
  const flowTot = cur.sv + cur.inv + Math.max(0, cur.ret);
  const flowSegs = [
    { v: cur.sv, color: '#9aa3bd', t: 'Start ' + eur(cur.sv, 0) },
    { v: cur.inv, color: '#4a5ce0', t: 'Invested ' + eur(cur.inv, 0) },
    { v: Math.max(0, cur.ret), color: '#1fb9a4', t: 'Return ' + signed(cur.ret, 0) },
  ].filter((s) => s.v > 0);
  const lossSeg = !posRet && flowTot > 0 ? { v: Math.abs(cur.ret), t: 'Loss ' + signed(cur.ret, 0) } : null;
  const flowDenom = flowTot || 1;

  // ── projection ──
  const sim = useMemo(() => {
    const base = simulate(value, p, p.yield, H);
    const lo = simulate(value, p, Math.max(0, p.yield - p.spread), H);
    const hi = simulate(value, p, p.yield + p.spread, H);
    const sc = saved.map((s, i) => ({ ...s, color: SCOL[i % 3]!, sim: simulate(value, { ...s }, s.yield, H) }));
    return { base, lo, hi, sc };
  }, [value, p, saved, H]);
  const { base, lo, hi, sc } = sim;

  const maxV = Math.max(1, ...hi.vals, ...sc.flatMap((s) => s.sim.vals)) * 1.06;
  const X = (y: number) => (y / H) * 1000;
  const Y = (v: number) => 320 - (v / maxV) * 300;
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const contribAbs = base.contribs.map((c) => c + invested);
  const valueLine = line(base.vals);
  const bandPath =
    line(hi.vals) + ' ' + lo.vals.map((v, i) => `L${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).reverse().join(' ') + ' Z';
  const contribLine = line(contribAbs);
  const contribArea = contribLine + ' L1000 320 L0 320 Z';
  const step = maxV > 4e5 ? 1e5 : maxV > 2e5 ? 5e4 : maxV > 8e4 ? 2.5e4 : 1e4;
  const yGrid: { y: number; label: string }[] = [];
  for (let v = step; v < maxV; v += step) yGrid.push({ y: Y(v), label: big(v) });
  const tickEvery = H <= 5 ? 1 : H <= 10 ? 2 : 5;
  const xTicks: { left: number; label: string; shift: string }[] = [];
  for (let y = 0; y <= H; y += tickEvery) {
    xTicks.push({ left: X(y) / 10, label: y === 0 ? 'Today' : String(yr0 + y), shift: y === 0 ? '0' : y === H ? '-100%' : '-50%' });
  }
  const milestones = [50000, 100000, 250000, 500000, 1000000, 2000000]
    .filter((x) => x > value)
    .slice(0, 4)
    .map((x) => ({ m: x, i: base.vals.findIndex((v) => v >= x) }));
  const msDots = milestones.filter((x) => x.i > 0).slice(0, 3);

  const hv = hover != null ? Math.round(hover * H) : null;
  const endV = base.vals[H] ?? 0;
  const endC = contribAbs[H] ?? 0;
  const endG = endV - endC;
  const overrides = p.overrides;
  const oc = Object.keys(overrides).length;
  const scenDetail = (s: { contrib: number; inc: number; yield: number; overrides: Record<string, number> }) =>
    eur(s.contrib, 0) + '/yr' + (s.inc ? ` +${s.inc}%/yr` : '') + ` · ${s.yield}% return` +
    (Object.keys(s.overrides ?? {}).length ? ` · ${Object.keys(s.overrides).length} edited years` : '');
  const sameAs = (s: Scenario) =>
    s.contrib === p.contrib && s.inc === p.inc && s.yield === p.yield && JSON.stringify(s.overrides ?? {}) === JSON.stringify(overrides);
  const canSave = saved.length < 3 && !saved.some(sameAs);

  const hasLots = lots.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Investing" meta="Your WEBN position at Interactive Brokers. Cash put in and market moves are tracked separately, so they never skew what you saved." />

      {/* ── Hero ── */}
      <section className="glass flex flex-col gap-5 !rounded-[34px] px-[26px] py-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-[1_1_320px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn(eyebrow, 'tracking-[0.12em]')}>Portfolio · {ticker}</span>
              {market ? (
                <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full bg-teal/15 px-[11px] py-1 text-[11.5px] font-bold text-[#0f7f72]">
                  <span className="h-[7px] w-[7px] rounded-full bg-teal" />
                  {eur(live, 3)} · {pct(dayPct)} · as of {priceDate}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber/20 px-[11px] py-1 text-[11.5px] font-bold text-[#8a5a10]">
                  Live price unavailable · using last buy price
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[clamp(24px,2.2vw,32px)] font-bold text-ink-mute">€</span>
              <span className="text-[clamp(42px,5vw,72px)] font-extrabold leading-none -tracking-[0.042em] tabular-nums">
                {Number(vWhole).toLocaleString('en-US')}
              </span>
              <span className="text-[clamp(24px,2.2vw,34px)] font-bold tabular-nums text-ink-mute">.{vCents}</span>
            </div>
            {hasLots ? (
              <div className="mt-3 flex flex-wrap gap-2.5">
                <span
                  className="rounded-full px-[13px] py-1.5 text-[13.5px] font-extrabold tabular-nums"
                  style={{ background: up ? 'rgba(31,185,164,.18)' : 'rgba(242,112,143,.18)', color: up ? '#0f7f72' : NEG }}
                >
                  {signed(pl)} · {pct(plPct)} all time
                </span>
                <span className="rounded-full bg-white/50 px-[13px] py-1.5 text-[13.5px] font-bold tabular-nums" style={{ color: dayAbs >= 0 ? POS : NEG }}>
                  {signed(dayAbs)} today
                </span>
              </div>
            ) : null}
          </div>
          <div className="ml-auto flex flex-none flex-col items-end gap-2.5">
            <Button onClick={() => setModal('buy')} className="!px-5 !py-3 !text-[14px]">
              Log a buy
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setModal('history')}>
              History · {lots.length}
            </Button>
          </div>
        </div>
        {hasLots ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <Tile label="Shares held" value={shares.toLocaleString('en-US', { maximumFractionDigits: 4 })} sub={`${lots.length} transactions`} />
            <Tile label="Money put in" value={eur(invested, 0)} sub={`incl. ${eur(fees)} fees`} />
            <Tile label="Average cost" value={eur(avg, 3)} sub="per share, fees included = break-even" />
            <Tile
              label={up ? 'Cushion' : 'To break even'}
              value={up ? pct((live / avg - 1) * 100) : pct((avg / live - 1) * 100)}
              sub={up ? 'price can fall this much before a loss' : 'price rise needed to recover'}
              color={up ? POS : NEG}
            />
          </div>
        ) : (
          <div className="rounded-[22px] bg-white/40 p-6 text-center text-[13.5px] font-semibold text-ink-soft">
            No position yet. Use “Log a buy” → “Existing position” to enter what you already hold, then log each new buy.
          </div>
        )}
      </section>

      {/* ── Track record ── */}
      {hasLots ? (
        <section className="glass flex flex-col gap-[18px] !rounded-[34px] px-[26px] py-6">
          <div className="flex flex-wrap items-start justify-between gap-3.5">
            <div>
              <div className="text-[17px] font-extrabold -tracking-[0.02em]">Track record</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-soft">
                {inProg ? `${hy} so far. Closes into a full-year record on 31 Dec.` : `Full calendar year ${hy}.`}
              </div>
            </div>
            <Seg
              items={yrs.map((y) => ({ k: y, label: y === yr0 ? `${y} · YTD` : String(y) }))}
              value={hy}
              onPick={setHistYear}
            />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <Tile label="Start of year" value={eur(cur.sv, 0)} sub={cur.sv ? 'value on 1 Jan' : 'nothing invested yet'} />
            <Tile label="Invested" value={eur(cur.inv, 0)} sub={openAmt ? `incl. ${eur(openAmt, 0)} opening position` : `${cur.flows.length} buys`} color="#3a49c4" />
            <Tile label="Return" value={signed(cur.ret, 0)} sub="market move, after fees" color={posRet ? POS : NEG} />
            <Tile label={inProg ? 'Balance today' : 'End of year'} value={eur(cur.ev, 0)} sub={inProg ? 'EoY figure lands 31 Dec' : 'value on 31 Dec'} />
            <Tile label={inProg ? 'Yield · YTD' : 'Yield'} value={pct(cur.yld)} sub="money-weighted" color={posRet ? POS : NEG} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex h-4 gap-[3px] overflow-hidden rounded-full bg-white/40">
              {flowSegs.map((s) => (
                <div key={s.t} title={s.t} style={{ width: `${((s.v / flowDenom) * 100).toFixed(2)}%`, background: s.color }} />
              ))}
              {lossSeg ? (
                <div
                  title={lossSeg.t}
                  style={{
                    width: `${((lossSeg.v / flowDenom) * 100).toFixed(2)}%`,
                    background: 'repeating-linear-gradient(135deg,#f2708f 0 4px,rgba(242,112,143,.35) 4px 8px)',
                  }}
                />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-4 text-[12px] font-semibold text-ink-soft">
              {[...flowSegs.map((s) => ({ t: s.t, color: s.color })), ...(lossSeg ? [{ t: lossSeg.t, color: '#f2708f' }] : [])].map((s) => (
                <span key={s.t} className="flex items-center gap-[7px]">
                  <span className="h-[11px] w-[11px] rounded-[4px]" style={{ background: s.color }} />
                  {s.t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <div className={eyebrow}>Month by month · {hy}</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(th, 'text-left')}>Month</th>
                      <th className={cn(th, 'text-right')}>Invested</th>
                      <th className={cn(th, 'text-right')}>Market move</th>
                      <th className={cn(th, 'w-[30%] text-left')} />
                      <th className={cn(th, 'text-right')}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((x) => {
                      const w = (Math.abs(x.ret) / maxMove) * 50;
                      const c = x.ret >= 0 ? POS : NEG;
                      return (
                        <tr key={x.m}>
                          <td className={cn(td, 'text-[13px] font-bold')}>{monthShort(x.m)}{x.partial ? ' (so far)' : ''}</td>
                          <td className={cn(td, 'text-right text-[13px] font-semibold text-[#3a49c4]')}>{x.inv ? eur(x.inv, 0) : '—'}</td>
                          <td className={cn(td, 'text-right text-[13px] font-bold')} style={{ color: c }}>{signed(x.ret, 0)}</td>
                          <td className={td}>
                            <div className="relative h-2.5">
                              <div className="absolute -bottom-[3px] -top-[3px] left-1/2 w-px bg-ink/20" />
                              <div
                                className="absolute inset-y-0 rounded-full"
                                style={{ left: x.ret >= 0 ? '50%' : `${(50 - w).toFixed(2)}%`, width: `${w.toFixed(2)}%`, background: c }}
                              />
                            </div>
                          </td>
                          <td className={cn(td, 'text-right text-[13px] font-extrabold')}>{eur(x.ev, 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <div className={eyebrow}>All years</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(th, 'text-left')}>Year</th>
                      <th className={cn(th, 'text-right')}>Start</th>
                      <th className={cn(th, 'text-right')}>Invested</th>
                      <th className={cn(th, 'text-right')}>Return</th>
                      <th className={cn(th, 'text-right')}>End</th>
                      <th className={cn(th, 'text-right')}>Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...ys].reverse().map((x) => {
                      const c = x.ret >= 0 ? POS : NEG;
                      return (
                        <tr key={x.y} onClick={() => setHistYear(x.y)} className={cn('cursor-pointer hover:bg-white/45', x.y === hy && 'bg-white/40')}>
                          <td className={td}>
                            <div className="text-[13.5px] font-extrabold">{x.y}</div>
                            <div className={cn('text-[11px] font-bold', x.y === yr0 ? 'text-[#3a49c4]' : 'text-ink-mute')}>{x.y === yr0 ? 'In progress' : 'Closed'}</div>
                          </td>
                          <td className={cn(td, 'text-right text-[13px] font-semibold text-ink-soft')}>{eur(x.sv, 0)}</td>
                          <td className={cn(td, 'text-right text-[13px] font-semibold text-[#3a49c4]')}>{eur(x.inv, 0)}</td>
                          <td className={cn(td, 'text-right text-[13px] font-bold')} style={{ color: c }}>{signed(x.ret, 0)}</td>
                          <td className={cn(td, 'text-right text-[13.5px] font-extrabold')}>{eur(x.ev, 0)}</td>
                          <td className={cn(td, 'text-right text-[13px] font-extrabold')} style={{ color: c }}>{pct(x.yld)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-[12px] font-semibold text-ink-soft">
                Yield is money-weighted: each buy only counts for the part of the year it was invested, so a December buy doesn’t dilute the year’s result. Fees are included in Invested, so Return is after fees.
                {` Your opening position counts as money put in on its “as of” date.`}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Projection ── */}
      <section className="glass flex flex-col gap-5 !rounded-[34px] px-[26px] py-6">
        <div className="flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className="text-[17px] font-extrabold -tracking-[0.02em]">Where this could go</div>
            <div className="mt-1 text-[13px] font-semibold text-ink-soft">Starts from today’s value and adds your contributions monthly. Returns compound monthly.</div>
          </div>
          <Seg
            items={[5, 10, 20, 30].map((h) => ({ k: h, label: `${h} yrs` }))}
            value={H}
            onPick={(h) => setP('horizon', h)}
          />
        </div>

        <div className="flex flex-wrap items-stretch gap-6">
          <div className="glass-inner grid min-w-[260px] max-w-full flex-[1_1_320px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] content-start gap-x-6 gap-y-[18px] !rounded-[24px] p-[18px]">
            <Slider title="Invest per year" display={eur(p.contrib, 0)} min={0} max={30000} step={250} value={p.contrib} onChange={(v) => setP('contrib', v)} sub={`≈ ${eur(p.contrib / 12, 0)} a month`} />
            <Slider title="Raise it each year" display={p.inc ? `+${p.inc}%` : 'Flat'} min={0} max={10} step={0.5} value={p.inc} onChange={(v) => setP('inc', v)} />
            <div className="flex flex-col gap-2">
              <Slider
                title="Average yearly return"
                display={p.yield.toFixed(2).replace(/\.?0+$/, '') + '%'}
                displayClass="text-[#0f7f72]"
                min={0}
                max={14}
                step={0.25}
                value={p.yield}
                onChange={(v) => setP('yield', v)}
              />
              <div className="flex flex-wrap gap-1.5">
                {[{ l: 'Cautious 4%', v: 4 }, { l: 'Long-run avg 7%', v: 7 }, { l: 'Strong 9%', v: 9 }].map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setP('yield', r.v)}
                    className={cn('rounded-full px-2.5 py-[5px] text-[11.5px] font-bold', p.yield === r.v ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft')}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
            <Slider
              title="Good / bad years range"
              display={`±${p.spread}%`}
              min={0}
              max={5}
              step={0.5}
              value={p.spread}
              onChange={(v) => setP('spread', v)}
              sub={`Shaded band: ${Math.max(0, p.yield - p.spread)}% to ${p.yield + p.spread}% a year.`}
            />
            <div className="col-span-full self-end">
              <button
                type="button"
                disabled={!canSave}
                onClick={() => setSaved((s) => [...s, { name: 'Scenario ' + 'ABC'[s.length], contrib: p.contrib, inc: p.inc, yield: p.yield, overrides: { ...overrides } }])}
                className={cn(
                  'w-full rounded-full px-3.5 py-2.5 text-[13px] font-bold',
                  canSave ? 'bg-ink text-white [box-shadow:0_10px_20px_-10px_rgba(21,26,45,.6)]' : 'cursor-default bg-white/55 text-ink-mute',
                )}
              >
                {saved.length >= 3 ? 'Up to 3 scenarios saved' : saved.some(sameAs) ? 'Saved' : 'Save as scenario to compare'}
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3.5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">In {H} years · {yr0 + H}</div>
                <div className="mt-1 text-[32px] font-extrabold -tracking-[0.035em] tabular-nums text-[#0f7f72]">{big(endV)}</div>
                <div className="text-[12px] font-semibold tabular-nums text-ink-soft">range {big(lo.vals[H] ?? 0)} – {big(hi.vals[H] ?? 0)}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">You put in</div>
                <div className="mt-1 text-2xl font-extrabold -tracking-[0.03em] tabular-nums">{big(endC)}</div>
                <div className="text-[12px] font-semibold text-ink-soft">{big(invested)} so far + {big(base.contribs[H] ?? 0)} new</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Growth earned</div>
                <div className="mt-1 text-2xl font-extrabold -tracking-[0.03em] tabular-nums text-[#0f9d8a]">{big(endG)}</div>
                <div className="text-[12px] font-semibold text-ink-soft">{endV ? Math.round((endG / endV) * 100) : 0}% of the final value</div>
              </div>
            </div>

            <div
              ref={chartRef}
              onMouseMove={(e) => {
                const el = chartRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                setHover(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
              }}
              onMouseLeave={() => setHover(null)}
              className="relative h-[320px]"
            >
              <svg viewBox="0 0 1000 320" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                {yGrid.map((g, i) => (
                  <line key={i} x1="0" x2="1000" y1={g.y} y2={g.y} stroke="rgba(255,255,255,.75)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={bandPath} fill="#1fb9a4" fillOpacity="0.14" />
                <path d={contribArea} fill="#4a5ce0" fillOpacity="0.2" />
                <path d={contribLine} fill="none" stroke="#4a5ce0" strokeOpacity="0.7" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                {sc.map((s) => (
                  <path key={s.name} d={line(s.sim.vals)} fill="none" stroke={s.color} strokeWidth="2.2" strokeDasharray="7 5" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={valueLine} fill="none" stroke="#0f9d8a" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
              {yGrid.map((g, i) => (
                <div key={i} className="absolute left-0 -translate-y-[120%] text-[11px] font-bold tabular-nums text-ink-mute" style={{ top: `${g.y / 3.2}%` }}>
                  {g.label}
                </div>
              ))}
              {msDots.map((x) => (
                <div key={x.m} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${X(x.i) / 10}%`, top: `${Y(base.vals[x.i] ?? 0) / 3.2}%` }}>
                  <span className="block -translate-y-3.5 whitespace-nowrap rounded-full bg-white/85 px-2 py-[3px] text-[10.5px] font-extrabold text-[#0f7f72] [box-shadow:0_4px_10px_-4px_rgba(31,39,66,.25)]">
                    {big(x.m)}
                  </span>
                </div>
              ))}
              {hv != null ? (
                <>
                  <div className="pointer-events-none absolute inset-y-0 w-px bg-ink/30" style={{ left: `${X(hv) / 10}%` }} />
                  <div
                    className="pointer-events-none absolute -ml-[5px] -mt-[5px] h-2.5 w-2.5 rounded-full bg-[#0f9d8a] [box-shadow:0_0_0_3px_#fff]"
                    style={{ left: `${X(hv) / 10}%`, top: `${Y(base.vals[hv] ?? 0) / 3.2}%` }}
                  />
                  <div
                    className="pointer-events-none absolute top-1.5 whitespace-nowrap rounded-[16px] bg-white/90 px-[13px] py-2.5 [box-shadow:0_12px_28px_-10px_rgba(31,39,66,.35)]"
                    style={{ left: `${X(hv) / 10}%`, transform: `translateX(${(hover ?? 0) > 0.65 ? 'calc(-100% - 12px)' : '12px'})` }}
                  >
                    <div className="text-[11.5px] font-bold text-ink-mute">{hv === 0 ? 'Today' : `End of ${yr0 + hv} · year ${hv}`}</div>
                    <div className="mt-[3px] text-base font-extrabold tabular-nums text-[#0f7f72]">{eur(base.vals[hv] ?? 0, 0)}</div>
                    <div className="text-[12px] font-semibold tabular-nums text-ink-soft">{big(lo.vals[hv] ?? 0)} – {big(hi.vals[hv] ?? 0)}</div>
                    <div className="text-[12px] font-semibold tabular-nums text-indigo">Put in {eur(contribAbs[hv] ?? 0, 0)}</div>
                  </div>
                </>
              ) : null}
            </div>
            <div className="relative h-4">
              {xTicks.map((t) => (
                <span key={t.label} className="absolute whitespace-nowrap text-[11.5px] font-bold text-ink-mute" style={{ left: `${t.left}%`, transform: `translateX(${t.shift})` }}>
                  {t.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-[12px] font-semibold text-ink-soft">
              <span className="flex items-center gap-[7px]"><span className="h-[3px] w-[18px] rounded-sm bg-[#0f9d8a]" />Projected value</span>
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-3.5 rounded-[3px] bg-teal/20" />Good to bad years</span>
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-3.5 rounded-[3px] bg-indigo/25" />Money put in</span>
              {sc.map((s) => (
                <span key={s.name} className="flex items-center gap-[7px]"><span className="w-[18px] border-t-[2.5px] border-dashed" style={{ borderColor: s.color }} />{s.name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-start gap-5">
        {/* Year by year */}
        <section className="glass flex flex-col gap-3.5 !rounded-[34px] px-[26px] py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold -tracking-[0.02em]">Year by year</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-soft">Type over any year’s amount to plan a pause, a bonus year or a step-up.</div>
            </div>
            {oc > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setP('overrides', {})}>
                Reset {oc} edits
              </Button>
            ) : null}
          </div>
          <div className="-mx-2 max-h-[460px] overflow-y-auto px-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Year', 'Invest', 'Growth', 'End value'].map((h, i) => (
                    <th key={h} className={cn('sticky top-0 bg-[rgba(240,234,250,.9)] px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute', i === 0 ? 'text-left' : 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {base.yearly.map((r) => {
                  const o = overrides[String(r.y)];
                  return (
                    <tr key={r.y} className={o != null ? 'bg-indigo/[0.06]' : ''}>
                      <td className="border-b border-white/50 px-2.5 py-1.5 text-[13.5px] font-bold">{yr0 + r.y}</td>
                      <td className="border-b border-white/50 px-2.5 py-1.5 text-right">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={o != null ? String(o) : ''}
                          placeholder={Math.round(r.base).toLocaleString('en-US')}
                          onChange={(e) => {
                            const v = e.target.value;
                            const next = { ...overrides };
                            if (v === '' || Number.isNaN(Number(v))) delete next[String(r.y)];
                            else next[String(r.y)] = Math.max(0, Number(v));
                            setP('overrides', next);
                          }}
                          className={cn(
                            'w-[110px] rounded-[11px] border px-2.5 py-[7px] text-right text-[13px] font-bold tabular-nums text-ink outline-none',
                            o != null ? 'border-indigo bg-indigo/10' : 'border-white/80 bg-white/60',
                          )}
                        />
                      </td>
                      <td className="border-b border-white/50 px-2.5 py-1.5 text-right text-[13px] font-bold tabular-nums text-[#0f9d8a]">+{big(r.growth)}</td>
                      <td className="border-b border-white/50 px-2.5 py-1.5 text-right text-[13.5px] font-extrabold tabular-nums">{big(r.end)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scenarios */}
        <section className="glass flex flex-col gap-4 !rounded-[34px] px-[26px] py-6">
          <div>
            <div className="text-[17px] font-extrabold -tracking-[0.02em]">Scenarios</div>
            <div className="mt-1 text-[13px] font-semibold text-ink-soft">
              {saved.length ? `Value in ${H} years. Dashed lines on the chart.` : 'Save the current plan, change the sliders, and compare. Up to 3.'}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[13px] rounded-[20px] bg-teal/10 px-[15px] py-[13px]">
              <span className="w-[18px] border-t-[3px] border-solid border-[#0f9d8a]" />
              <div className="min-w-0">
                <div className="text-[14px] font-extrabold">Current plan</div>
                <div className="mt-0.5 truncate text-[12px] font-semibold text-ink-mute">{scenDetail({ ...p, overrides })}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-extrabold tabular-nums">{big(endV)}</div>
                <div className="text-[11.5px] font-bold text-ink-mute">baseline</div>
              </div>
            </div>
            {sc.map((s, i) => {
              const e = s.sim.vals[H] ?? 0;
              const d = e - endV;
              return (
                <div key={s.name} className="glass-tile grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[13px] !rounded-[20px] px-[15px] py-[13px]">
                  <span className="w-[18px] border-t-[3px] border-dashed" style={{ borderColor: s.color }} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-extrabold">{s.name}</div>
                    <div className="mt-0.5 truncate text-[12px] font-semibold text-ink-mute">{scenDetail(s)}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-[15px] font-extrabold tabular-nums">{big(e)}</div>
                      <div className="text-[11.5px] font-bold tabular-nums" style={{ color: d >= 0 ? POS : NEG }}>
                        {d >= 0 ? '+' : '−'}{big(Math.abs(d))} vs current
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="rounded-full bg-white/60 px-[9px] py-[5px] text-[11px] font-bold text-[#3a49c4]"
                        onClick={() => setPState((cur2) => ({ ...cur2, contrib: s.contrib, inc: s.inc, yield: s.yield, overrides: { ...s.overrides } }))}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-white/60 px-[9px] py-[5px] text-[11px] font-bold text-ink-mute"
                        onClick={() => setSaved((all) => all.filter((_, j) => j !== i).map((x, j) => ({ ...x, name: 'Scenario ' + 'ABC'[j] })))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {milestones.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1.5">
              <div className={eyebrow}>Milestones · current plan</div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
                {milestones.map((x) => (
                  <div key={x.m} className="rounded-[18px] bg-white/[0.36] px-3.5 py-3">
                    <div className="text-[15px] font-extrabold tabular-nums">{big(x.m)}</div>
                    <div className="mt-0.5 text-[12.5px] font-bold" style={{ color: x.i > 0 ? '#0f7f72' : '#7b8296' }}>
                      {x.i > 0 ? `${yr0 + x.i} · in ${x.i} ${x.i === 1 ? 'yr' : 'yrs'}` : `Beyond ${yr0 + H}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {modal ? (
        <LotModal
          budgetId={budgetId}
          lots={lots}
          mode={modal}
          onModeChange={setModal}
          onClose={() => setModal(null)}
          today={today}
          suggestedPrice={market ? market.price : null}
        />
      ) : null}
    </div>
  );
}
