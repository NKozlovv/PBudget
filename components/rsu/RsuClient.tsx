'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/nav/PageHeader';
import { Button, Field, Input, Select } from '@/components/ui';
import { cn } from '@/lib/utils';
import { addGrantAction, deleteGrantAction, setSharePriceAction, updateGrantAction } from '@/app/actions/rsu';
import { schedule, toDate, toISO, type GrantInput, type VestEvent } from '@/lib/rsu/calc';
import { eur, monthShort, niceDateLong, num, pct, signed, span } from '@/lib/investing/format';
import type { RsuGrant } from '@/lib/supabase/types';

const COLORS = ['#4a5ce0', '#1fb9a4', '#f2708f', '#ef9a3c', '#8b5cf6', '#2ea3e8'];
const EVERY: Record<number, string> = { 1: 'monthly', 3: 'quarterly', 6: 'every 6 months', 12: 'yearly' };
const DAY = 864e5;

const label = 'text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute';

function Stat({
  title,
  value,
  sub,
  dot,
  valueClass,
}: {
  title: string;
  value: string;
  sub: string;
  dot?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="glass-tile !rounded-[22px] px-[18px] py-4">
      <div className="flex items-center gap-2">
        {dot}
        <span className={label}>{title}</span>
      </div>
      <div className={cn('mt-[7px] text-[28px] font-extrabold -tracking-[0.03em] tabular-nums', valueClass)}>
        {value}
      </div>
      <div className="mt-[3px] text-[12.5px] font-semibold text-ink-soft">{sub}</div>
    </div>
  );
}

export function RsuClient({
  budgetId,
  grants,
  sharePrice,
  today,
}: {
  budgetId: string;
  grants: RsuGrant[];
  sharePrice: number;
  /** YYYY-MM-DD in the user's timezone, from the server. */
  today: string;
}) {
  const router = useRouter();
  const [priceInput, setPriceInput] = useState(sharePrice ? String(sharePrice) : '');
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const blankForm = { name: '', date: today, shares: '', gp: '', months: '48', every: '3', cliff: '12' };
  const [form, setForm] = useState(blankForm);

  const price = Number.parseFloat(priceInput) >= 0 ? Number.parseFloat(priceInput) : 0;
  const todayMs = toDate(today).getTime();
  const daysTo = (s: string) => Math.round((toDate(s).getTime() - todayMs) / DAY);

  const m = useMemo(() => {
    const gs: GrantInput[] = grants.map((g) => ({
      id: g.id,
      name: g.name,
      start_date: g.start_date,
      shares: g.shares,
      months: g.months,
      every: g.every,
      cliff: g.cliff,
    }));
    const colorOf = (id: string) => COLORS[Math.max(0, gs.findIndex((g) => g.id === id)) % COLORS.length]!;
    const evs = gs.flatMap(schedule).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const total = gs.reduce((a, g) => a + g.shares, 0);
    const past = evs.filter((e) => e.date <= today);
    const fut = evs.filter((e) => e.date > today);
    const vested = past.reduce((a, e) => a + e.shares, 0);
    const unvested = total - vested;
    const avgDays = unvested
      ? Math.round(fut.reduce((a, e) => a + e.shares * daysTo(e.date), 0) / unvested)
      : 0;
    const next = fut[0];
    const nextShares = next ? fut.filter((e) => e.date === next.date).reduce((a, e) => a + e.shares, 0) : 0;
    const last = evs.length ? evs[evs.length - 1]!.date : today;
    const vpct = total ? (vested / total) * 100 : 0;
    const perYear = fut.filter((e) => daysTo(e.date) <= 365).reduce((a, e) => a + e.shares, 0);
    // "Since grant": only grants with a recorded grant-date price count.
    const priced = gs.map((g) => ({ g, gp: grants.find((x) => x.id === g.id)?.grant_price ?? null })).filter((x) => x.gp != null);
    const grantBasis = priced.reduce((a, x) => a + x.g.shares * (x.gp ?? 0), 0);
    const grantNow = priced.reduce((a, x) => a + x.g.shares, 0);

    // ── chart ──
    const start = gs.length ? gs.map((g) => g.start_date).sort()[0]! : today;
    const t0 = toDate(start).getTime();
    const t1 = Math.max(toDate(last).getTime(), todayMs) + 30 * DAY;
    const X = (s: string) => ((toDate(s).getTime() - t0) / (t1 - t0)) * 1000;
    const Y = (v: number) => 280 - (total ? v / total : 0) * 250;
    const todayX = Math.max(0, Math.min(1000, X(today)));

    type Snap = { date: string; by: Record<string, number>; tot: number };
    const by: Record<string, number> = {};
    gs.forEach((g) => (by[g.id] = 0));
    let run = 0;
    const snaps: Snap[] = [{ date: start, by: { ...by }, tot: 0 }];
    Array.from(new Set(evs.map((e) => e.date)))
      .sort()
      .forEach((d) => {
        evs.filter((e) => e.date === d).forEach((e: VestEvent) => {
          by[e.grantId] = (by[e.grantId] ?? 0) + e.shares;
          run += e.shares;
        });
        snaps.push({ date: d, by: { ...by }, tot: run });
      });
    const clampX = (x: number, from: number, to: number) => Math.max(from, Math.min(to, x));
    const f = (n: number) => n.toFixed(1);

    // Step path of `val` across [from, to].
    const stepPath = (val: (s: Snap) => number, from: number, to: number) => {
      let d = '';
      snaps.forEach((s, i) => {
        const x = clampX(X(s.date), from, to);
        const y = Y(val(s));
        d += i === 0 ? `M${f(x)} ${f(y)}` : ` H${f(x)} V${f(y)}`;
      });
      return d + ` H${f(to)}`;
    };
    const below = (idx: number, s: Snap) => gs.slice(0, idx).reduce((a, g) => a + (s.by[g.id] ?? 0), 0);
    // Band between the stack below layer `idx` and the stack including it.
    const area = (idx: number, from: number, to: number) => {
      const n = snaps.length;
      const xs = snaps.map((s) => clampX(X(s.date), from, to));
      let d = `M${f(xs[0]!)} ${f(Y(below(idx + 1, snaps[0]!)))}`;
      for (let i = 1; i < n; i++) d += ` H${f(xs[i]!)} V${f(Y(below(idx + 1, snaps[i]!)))}`;
      d += ` H${f(to)} V${f(Y(below(idx, snaps[n - 1]!)))}`;
      for (let i = n - 1; i >= 1; i--) d += ` H${f(xs[i]!)} V${f(Y(below(idx, snaps[i - 1]!)))}`;
      return d + ` H${f(from)} Z`;
    };

    // Month-level axis: a faint tick for every month, a label every month /
    // quarter / year depending on how long the timeline is. January is
    // labelled with its year so the axis stays readable at any density.
    const spanMonths = (t1 - t0) / (30.44 * DAY);
    const labelEvery = spanMonths <= 24 ? 1 : spanMonths <= 60 ? 3 : 12;
    const xTicks: { left: number; label: string; major: boolean }[] = [];
    const minorTicks: number[] = [];
    const sd = toDate(start);
    for (let d = new Date(sd.getFullYear(), sd.getMonth(), 1); d.getTime() <= t1; d.setMonth(d.getMonth() + 1)) {
      const left = X(toISO(d)) / 10;
      if (left < 0 || left > 100) continue;
      if (spanMonths <= 72) minorTicks.push(left);
      if (d.getMonth() % labelEvery !== 0) continue;
      const jan = d.getMonth() === 0;
      xTicks.push({
        left,
        major: jan,
        label: jan ? String(d.getFullYear()) : monthShort(d.getMonth()) + (xTicks.length === 0 ? ' ' + String(d.getFullYear()).slice(2) : ''),
      });
    }

    return {
      grantBasis, grantNow,
      gs, colorOf, evs, total, past, fut, vested, unvested, avgDays, next, nextShares, last, vpct, perYear,
      yGrid: [0.25, 0.5, 0.75, 1].map((fr) => ({ y: Y(total * fr), label: num(Math.round(total * fr)) + ' sh' })),
      layers: gs.map((g, i) => ({
        color: colorOf(g.id),
        pastArea: area(i, 0, todayX),
        futureArea: area(i, todayX, 1000),
      })),
      pastLine: stepPath((s) => s.tot, 0, todayX),
      futureLine: stepPath((s) => s.tot, todayX, 1000),
      todayX,
      xTicks,
      minorTicks,
      snaps,
      t0,
      t1,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, today]);

  // Hover readout: the cumulative state at the hovered date, plus what
  // vests during that calendar month.
  const tip = (() => {
    if (hover == null || m.snaps.length === 0) return null;
    const date = toISO(new Date(m.t0 + hover * (m.t1 - m.t0)));
    let snap = m.snaps[0]!;
    for (const s of m.snaps) if (s.date <= date) snap = s;
    const ym = date.slice(0, 7);
    const thisMonth = m.evs.filter((e) => e.date.slice(0, 7) === ym).reduce((a, e) => a + e.shares, 0);
    const [yy = '', mm = '1'] = date.split('-');
    return {
      title: `${monthShort(Number(mm) - 1)} ${yy}`,
      future: date > today,
      tot: snap.tot,
      thisMonth,
      pct: m.total ? Math.round((snap.tot / m.total) * 100) : 0,
      topPct: (280 - (m.total ? snap.tot / m.total : 0) * 250) / 2.8,
      rows: grants.map((g) => ({ id: g.id, name: g.name, shares: snap.by[g.id] ?? 0 })).filter((r) => r.shares > 0),
    };
  })();

  const list = view === 'upcoming' ? m.fut : [...m.past].reverse();
  const grantName = (id: string) => grants.find((g) => g.id === id)?.name ?? '';

  async function commitPrice() {
    if (price === sharePrice) return;
    const res = await setSharePriceAction({ budget_id: budgetId, price });
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  const fsh = Number.parseInt(form.shares, 10) || 0;
  const preview = fsh
    ? schedule({
        id: 'x',
        name: '',
        start_date: form.date || today,
        shares: fsh,
        months: +form.months,
        every: +form.every,
        cliff: +form.cliff,
      })
    : [];

  async function submit() {
    setError(null);
    if (+form.cliff >= +form.months) return setError('Cliff must be shorter than the full duration.');
    setPending(true);
    const payload = {
      budget_id: budgetId,
      name: form.name,
      start_date: form.date,
      shares: Number(form.shares),
      months: +form.months,
      every: +form.every,
      cliff: +form.cliff,
      grant_price: form.gp.trim() === '' ? null : Number(form.gp),
    };
    const res = editingId ? await updateGrantAction({ ...payload, id: editingId }) : await addGrantAction(payload);
    setPending(false);
    if (!res.ok) return setError(res.error);
    closeForm();
    router.refresh();
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(blankForm);
    setError(null);
  }

  function startEdit(g: RsuGrant) {
    setEditingId(g.id);
    setForm({
      name: g.name,
      date: g.start_date,
      shares: String(g.shares),
      gp: g.grant_price != null ? String(g.grant_price) : '',
      months: String(g.months),
      every: String(g.every),
      cliff: String(g.cliff),
    });
    setError(null);
    setShowForm(true);
  }

  async function remove(id: string) {
    if (confirmId !== id) return setConfirmId(id);
    setConfirmId(null);
    const res = await deleteGrantAction({ budget_id: budgetId, id });
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  const seg = (active: boolean) =>
    cn(
      'rounded-full px-[13px] py-[7px] text-[12.5px] font-bold transition-colors',
      active
        ? 'bg-[linear-gradient(180deg,#5a6be8,#4152d6)] text-white [box-shadow:0_8px_18px_-8px_rgba(74,92,224,.6)]'
        : 'text-ink-soft hover:bg-white/60',
    );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="RSU" meta="Grants, vesting schedule and what they're worth at today's share price." />

      {/* Hero */}
      <section className="glass flex flex-col gap-[22px] !rounded-[34px] px-[26px] py-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-[1_1_320px]">
            <div className={label}>RSU · total grant value at today’s price</div>
            <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[clamp(24px,2.2vw,32px)] font-bold text-ink-mute">€</span>
              <span className="text-[clamp(42px,5vw,72px)] font-extrabold leading-none -tracking-[0.042em] tabular-nums">
                {Math.round(m.total * price).toLocaleString('en-US')}
              </span>
            </div>
            <div className="mt-[9px] text-[13.5px] font-semibold text-ink-soft">
              {grants.length === 0
                ? 'No grants yet — add one below.'
                : `${num(m.total)} shares across ${grants.length} ${grants.length === 1 ? 'grant' : 'grants'}. ${Math.round(m.vpct)}% vested, fully vested ${niceDateLong(m.last)}.`}
            </div>
          </div>
          <label className="ml-auto flex flex-none flex-col gap-1.5">
            <span className={label}>Share price (€)</span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={priceInput}
              placeholder="0.00"
              onChange={(e) => setPriceInput(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="!w-[150px] !text-[20px] !font-extrabold tabular-nums"
            />
          </label>
        </div>

        <div>
          <div className="flex h-[22px] gap-[3px] overflow-hidden rounded-full bg-white/40 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,.5)]">
            <div
              className="rounded-full bg-[linear-gradient(90deg,#4a5ce0,#1fb9a4)]"
              style={{ width: `${m.vpct.toFixed(2)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <Stat
              title="Vested · yours"
              value={eur(m.vested * price, 0)}
              sub={`${num(m.vested)} shares · ${m.past.length} vest events so far`}
              dot={<span className="h-2.5 w-2.5 rounded-[4px] bg-[linear-gradient(135deg,#4a5ce0,#1fb9a4)]" />}
            />
            <Stat
              title="Unvested · still to come"
              value={eur(m.unvested * price, 0)}
              sub={`${num(m.unvested)} shares · ${eur(m.perYear * price, 0)} lands in the next 12 months`}
              valueClass="text-ink-soft"
              dot={<span className="h-2.5 w-2.5 rounded-[4px] bg-white/90 [box-shadow:inset_0_0_0_1.5px_#9aa0b4]" />}
            />
            <Stat
              title="Average wait"
              value={m.unvested ? span(m.avgDays) : '—'}
              sub={m.unvested ? 'share-weighted time until unvested shares vest' : 'Everything has vested'}
            />
            {m.grantNow > 0 ? (
              <Stat
                title="Gain since grant"
                value={signed(m.grantNow * price - m.grantBasis, 0)}
                sub={`${m.grantBasis ? pct((m.grantNow * price / m.grantBasis - 1) * 100) : "—"} vs ${eur(m.grantBasis, 0)} at grant price`}
                valueClass={m.grantNow * price >= m.grantBasis ? "text-pos" : "text-neg"}
              />
            ) : null}
            <Stat
              title="Next vest"
              value={m.next ? span(daysTo(m.next.date)) : '—'}
              sub={
                m.next
                  ? `${niceDateLong(m.next.date)} · ${num(m.nextShares)} shares · ${eur(m.nextShares * price, 0)}`
                  : 'No vests scheduled'
              }
              valueClass="text-indigo-dark"
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      {grants.length > 0 ? (
        <section className="glass flex flex-col gap-4 !rounded-[34px] px-[26px] py-6">
          <div className="flex flex-wrap items-start justify-between gap-3.5">
            <div>
              <div className="text-[17px] font-extrabold -tracking-[0.02em]">Vesting timeline</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-soft">
                Cumulative shares vested, all grants stacked. Solid is behind you, dashed is scheduled.
              </div>
            </div>
            <div className="flex flex-wrap gap-3.5">
              {grants.map((g) => (
                <span key={g.id} className="flex items-center gap-[7px] text-[12px] font-semibold text-ink-soft">
                  <span className="h-[11px] w-[11px] rounded-[4px]" style={{ background: m.colorOf(g.id) }} />
                  {g.name}
                </span>
              ))}
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
            className="relative h-[280px]"
          >
            <svg viewBox="0 0 1000 280" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              {m.yGrid.map((g, i) => (
                <line key={i} x1="0" x2="1000" y1={g.y} y2={g.y} stroke="rgba(255,255,255,.7)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              {m.layers.map((l, i) => (
                <g key={i}>
                  <path d={l.pastArea} fill={l.color} fillOpacity="0.55" />
                  <path d={l.futureArea} fill={l.color} fillOpacity="0.16" />
                </g>
              ))}
              <path d={m.pastLine} fill="none" stroke="#151a2d" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
              <path d={m.futureLine} fill="none" stroke="#151a2d" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
              <line x1={m.todayX} x2={m.todayX} y1="0" y2="280" stroke="#e0568a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {m.yGrid.map((g, i) => (
              <div
                key={i}
                className="absolute left-0 -translate-y-[120%] text-[11px] font-bold tabular-nums text-ink-mute"
                style={{ top: `${g.y / 2.8}%` }}
              >
                {g.label}
              </div>
            ))}
            <div
              className="absolute -top-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e0568a] px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ left: `${m.todayX / 10}%` }}
            >
              Today · {Math.round(m.vpct)}% vested
            </div>
            {tip && hover != null ? (
              <>
                <div className="pointer-events-none absolute inset-y-0 w-px bg-[rgba(21,26,45,.3)]" style={{ left: `${hover * 100}%` }} />
                <div
                  className="pointer-events-none absolute -ml-[5px] -mt-[5px] h-2.5 w-2.5 rounded-full bg-[#151a2d] [box-shadow:0_0_0_3px_#fff]"
                  style={{ left: `${hover * 100}%`, top: `${tip.topPct}%` }}
                />
                <div
                  className="pointer-events-none absolute top-8 z-10 min-w-[190px] whitespace-nowrap rounded-[16px] bg-white/90 px-[13px] py-2.5 [box-shadow:0_12px_28px_-10px_rgba(31,39,66,.35)]"
                  style={{
                    left: `${hover * 100}%`,
                    transform: `translateX(${hover > 0.65 ? 'calc(-100% - 12px)' : '12px'})`,
                  }}
                >
                  <div className="text-[11.5px] font-bold text-ink-mute">
                    {tip.title} · {tip.future ? 'scheduled' : 'vested'}
                  </div>
                  <div className="mt-[3px] text-[16px] font-extrabold tabular-nums">
                    {num(tip.tot)} shares <span className="text-ink-mute">· {tip.pct}%</span>
                  </div>
                  <div className="text-[12px] font-semibold tabular-nums text-ink-soft">
                    {eur(tip.tot * price, 0)} at today’s price
                  </div>
                  {tip.thisMonth > 0 ? (
                    <div className="mt-1 text-[12px] font-bold tabular-nums text-indigo-dark">
                      +{num(tip.thisMonth)} shares vest in {tip.title.split(' ')[0]}
                    </div>
                  ) : null}
                  {tip.rows.length > 1 ? (
                    <div className="mt-1.5 flex flex-col gap-0.5 border-t border-[rgba(21,26,45,.08)] pt-1.5">
                      {tip.rows.map((r) => (
                        <div key={r.id} className="flex items-center gap-[7px] text-[11.5px] font-semibold tabular-nums text-ink-soft">
                          <span className="h-2 w-2 rounded-[3px]" style={{ background: m.colorOf(r.id) }} />
                          {r.name} · {num(r.shares)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
          <div className="relative h-7">
            {m.minorTicks.map((left, i) => (
              <span key={i} className="absolute top-0 h-1.5 w-px bg-[rgba(21,26,45,.18)]" style={{ left: `${left}%` }} />
            ))}
            {m.xTicks.map((t) => (
              <span
                key={t.label + t.left}
                className={cn(
                  'absolute top-2 -translate-x-1/2 whitespace-nowrap text-[11.5px] text-ink-mute',
                  t.major ? 'font-extrabold text-ink-soft' : 'font-semibold',
                )}
                style={{ left: `${t.left}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-start gap-5">
        {/* Vest events */}
        <section className="glass flex flex-col gap-3.5 !rounded-[34px] px-[26px] py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold -tracking-[0.02em]">Vest events</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-soft">
                {view === 'upcoming' ? 'Valued at today’s share price.' : 'Most recent first, valued at today’s share price.'}
              </div>
            </div>
            <div className="flex gap-1 rounded-full bg-white/[0.44] p-1">
              <button type="button" className={seg(view === 'upcoming')} onClick={() => setView('upcoming')}>
                Upcoming · {m.fut.length}
              </button>
              <button type="button" className={seg(view === 'past')} onClick={() => setView('past')}>
                Vested · {m.past.length}
              </button>
            </div>
          </div>
          <div className="-mx-2 flex max-h-[440px] flex-col gap-0.5 overflow-y-auto px-2">
            {list.length === 0 ? (
              <div className="py-6 text-center text-[13px] font-medium text-ink-mute">Nothing here yet.</div>
            ) : (
              list.map((e, i) => {
                const d = daysTo(e.date);
                return (
                  <div
                    key={e.grantId + e.date}
                    className={cn(
                      'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[13px] rounded-[16px] px-3 py-2.5',
                      view === 'upcoming' && i === 0 && 'bg-[rgba(74,92,224,.1)]',
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: m.colorOf(e.grantId), boxShadow: d > 0 ? '0 0 0 2px #fff' : 'none' }}
                    />
                    <div className="min-w-0">
                      <div className="whitespace-nowrap text-[13.5px] font-bold">{niceDateLong(e.date)}</div>
                      <div className="truncate text-[12px] font-semibold text-ink-mute">
                        {grantName(e.grantId)} · {num(e.shares)} shares{e.isCliff ? ' · cliff' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13.5px] font-extrabold tabular-nums">{eur(e.shares * price, 0)}</div>
                      <div className={cn('whitespace-nowrap text-[11.5px] font-bold', d > 0 ? 'text-indigo-dark' : 'text-ink-mute')}>
                        {d > 0 ? 'in ' + span(d) : span(-d) + ' ago'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Grants */}
        <section className="glass flex flex-col gap-4 !rounded-[34px] px-[26px] py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold -tracking-[0.02em]">Grants</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-soft">Each grant follows its own schedule.</div>
            </div>
            <Button size="sm" variant={showForm ? 'secondary' : 'primary'} onClick={() => {
                if (showForm) closeForm();
                else { setEditingId(null); setForm(blankForm); setShowForm(true); setError(null); }
              }}>
              {showForm ? 'Cancel' : 'Add grant'}
            </Button>
          </div>

          {showForm ? (
            <div className="glass-inner flex flex-col gap-3 !rounded-[22px] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Grant name">
                    {({ id }) => (
                      <Input id={id} type="text" placeholder="e.g. 2026 refresh" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    )}
                  </Field>
                </div>
                <Field label="Vesting start">
                  {({ id }) => <Input id={id} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
                </Field>
                <Field label="Total shares">
                  {({ id }) => (
                    <Input id={id} type="number" min={1} step={1} placeholder="0" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} />
                  )}
                </Field>
                <Field label="Price at grant (€)">
                  {({ id }) => (
                    <Input id={id} type="number" min={0} step={0.01} placeholder="optional" value={form.gp} onChange={(e) => setForm({ ...form, gp: e.target.value })} />
                  )}
                </Field>
                <Field label="Duration">
                  {({ id }) => (
                    <Select id={id} value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })}>
                      <option value="12">1 year</option>
                      <option value="24">2 years</option>
                      <option value="36">3 years</option>
                      <option value="48">4 years</option>
                      <option value="60">5 years</option>
                    </Select>
                  )}
                </Field>
                <Field label="Vests every">
                  {({ id }) => (
                    <Select id={id} value={form.every} onChange={(e) => setForm({ ...form, every: e.target.value })}>
                      <option value="1">Month</option>
                      <option value="3">Quarter</option>
                      <option value="6">6 months</option>
                      <option value="12">Year</option>
                    </Select>
                  )}
                </Field>
                <Field label="Cliff">
                    {({ id }) => (
                      <Select id={id} value={form.cliff} onChange={(e) => setForm({ ...form, cliff: e.target.value })}>
                        <option value="0">No cliff</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </Select>
                    )}
                  </Field>
              </div>
              {error ? <p className="text-[13px] font-bold text-neg" role="alert">{error}</p> : null}
              <div className="text-[12.5px] font-semibold text-ink-soft">
                {preview.length
                  ? `${preview.length} vest events, first on ${niceDateLong(preview[0]!.date)} (${num(preview[0]!.shares)} shares), last on ${niceDateLong(preview[preview.length - 1]!.date)}.`
                  : 'Fill in shares to preview the schedule.'}
              </div>
              <Button onClick={submit} disabled={pending}>
                {pending ? 'Saving…' : editingId ? 'Save changes' : 'Add grant'}
              </Button>
            </div>
          ) : error ? (
            <p className="text-[13px] font-bold text-neg" role="alert">{error}</p>
          ) : null}

          <div className="flex flex-col gap-3">
            {grants.length === 0 && !showForm ? (
              <div className="py-6 text-center text-[13px] font-medium text-ink-mute">No grants yet.</div>
            ) : null}
            {grants.map((g) => {
              const v = schedule(g)
                .filter((e) => e.date <= today)
                .reduce((a, e) => a + e.shares, 0);
              const conf = confirmId === g.id;
              return (
                <div key={g.id} className="glass-tile !rounded-[22px] px-[18px] py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: m.colorOf(g.id) }} />
                        <span className="text-[15px] font-extrabold -tracking-[0.01em]">{g.name}</span>
                      </div>
                      <div className="mt-[3px] text-[12px] font-semibold text-ink-mute">
                        {num(g.shares)} shares · {g.months / 12} yrs, {EVERY[g.every] ?? `every ${g.every} months`}
                        {g.cliff ? `, ${g.cliff}-month cliff` : ', no cliff'} · from {niceDateLong(g.start_date)}
                      </div>
                      {g.grant_price != null ? (
                        <div className="mt-[3px] text-[12px] font-bold tabular-nums text-ink-soft">
                          Granted at {eur(g.grant_price, 2)} · now {eur(price, 2)}
                          {g.grant_price > 0 ? ` (${pct((price / g.grant_price - 1) * 100)})` : ""}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(g)}
                      className="whitespace-nowrap rounded-full bg-white/50 px-2.5 py-1.5 text-[11.5px] font-bold text-ink-mute hover:bg-white/80"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(g.id)}
                      className={cn(
                        'whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11.5px] font-bold',
                        conf ? 'bg-[#e0568a] text-white' : 'bg-white/50 text-ink-mute hover:bg-white/80',
                      )}
                    >
                      {conf ? 'Confirm remove' : 'Remove'}
                    </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/50">
                    <div className="h-full rounded-full" style={{ width: `${((v / g.shares) * 100).toFixed(2)}%`, background: m.colorOf(g.id) }} />
                  </div>
                  <div className="mt-2 flex justify-between gap-2.5 text-[12.5px] font-bold tabular-nums">
                    <span>{num(v)} vested · {eur(v * price, 0)}</span>
                    <span className="text-ink-mute">{num(g.shares - v)} to go</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
