'use client';

import { fmtEUR } from '@/lib/money';
import { averageMetric, formatMetric, metricValue, type TripMetric } from '@/lib/trips/view';
import type { TripSummary } from '@/lib/trips/summary';

function splitFigure(n: number): { whole: string; cents: string } {
  const [whole, cents] = Math.abs(n)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split('.');
  return { whole: whole ?? '0', cents: cents ?? '00' };
}

/**
 * Hero + KPI strip. The headline total is always the grand total across
 * every trip (not metric-scaled); the KPI strip reacts to the active
 * metric, which lives in `CompareByBar` now (sticky, above the sections
 * below this one — the metric affects the ranked list, matrix and table
 * too, all of which sit well below the fold, so the picker needed to stay
 * reachable without scrolling back up here).
 */
export function TripsHero({ trips, metric }: { trips: TripSummary[]; metric: TripMetric }) {
  const grand = trips.reduce((s, t) => s + t.total, 0);
  const figure = splitFigure(grand);

  const ranked = [...trips].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  const cheapest = ranked[ranked.length - 1]!;
  const priciest = ranked[0]!;
  const cheapestVal = metricValue(cheapest, metric);
  const priciestVal = metricValue(priciest, metric);

  const bySub = new Map<string, number>();
  for (const t of trips) {
    for (const s of t.bySubcategory) bySub.set(s.name, (bySub.get(s.name) ?? 0) + s.amount);
  }
  const bigSub = Array.from(bySub, ([name, amount]) => ({ name, amount })).sort(
    (a, b) => b.amount - a.amount,
  )[0];

  const metricPhrase =
    metric === 'total' ? 'in total' : metric === 'perDay' ? 'per day' : 'per person-day';
  let insight = '';
  if (ranked.length > 1 && cheapestVal > 0) {
    const ratio = (priciestVal / cheapestVal).toFixed(1);
    insight = `${priciest.trip} costs ${ratio}× what ${cheapest.trip} does ${metricPhrase}.`;
  }
  if (bigSub && grand > 0) {
    insight += `${insight ? ' ' : ''}${bigSub.name} is the biggest line across ${
      trips.length === 1 ? 'this trip' : 'all trips'
    } at ${fmtEUR(bigSub.amount, { decimals: 0 })} (${Math.round((bigSub.amount / grand) * 100)}% of travel).`;
  }

  const kpis = [
    {
      label: 'Average per day',
      value: fmtEUR(Math.round(averageMetric(trips, 'perDay')), { decimals: 0 }),
    },
    {
      label: 'Average per person-day',
      value: fmtEUR(Math.round(averageMetric(trips, 'perPersonDay')), { decimals: 0 }),
    },
  ];

  return (
    <section className="glass flex flex-col gap-[22px] !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-1 basis-[300px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Travel · tagged by trip
            </span>
            <span className="whitespace-nowrap rounded-full bg-indigo/[0.14] px-[11px] py-1 text-[11.5px] font-bold text-indigo-dark">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>
          <div className="mt-2 flex flex-nowrap items-baseline gap-1 whitespace-nowrap">
            <span className="text-[clamp(24px,2.2vw,32px)] font-bold text-ink-mute">€</span>
            <span className="text-[clamp(42px,5vw,72px)] font-extrabold -tracking-[0.042em] tabular-nums text-ink">
              {figure.whole}
            </span>
            <span className="text-[clamp(24px,2.2vw,34px)] font-bold tabular-nums text-ink-mute">
              .{figure.cents}
            </span>
          </div>
          {insight ? <p className="mt-2 max-w-[62ch] text-[13.5px] font-semibold text-ink-soft">{insight}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="glass-tile !rounded-[20px] p-4 px-[16px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">{k.label}</div>
            <div className="mt-1.5 text-[23px] font-extrabold -tracking-[0.03em] tabular-nums text-ink">
              {k.value}
            </div>
          </div>
        ))}
        <div className="glass-tile !rounded-[20px] p-4 px-[16px]">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Most efficient</div>
          <div className="mt-1.5 truncate text-[23px] font-extrabold -tracking-[0.03em] text-in">
            {cheapest.trip}
          </div>
          <div className="mt-0.5 text-[12.5px] font-semibold text-ink-soft">
            {formatMetric(cheapestVal, metric)}
          </div>
        </div>
        <div className="glass-tile !rounded-[20px] p-4 px-[16px]">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Least efficient</div>
          <div className="mt-1.5 truncate text-[23px] font-extrabold -tracking-[0.03em] text-out">
            {priciest.trip}
          </div>
          <div className="mt-0.5 text-[12.5px] font-semibold text-ink-soft">
            {formatMetric(priciestVal, metric)}
          </div>
        </div>
      </div>
    </section>
  );
}
