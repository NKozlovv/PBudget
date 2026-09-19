'use client';

import { tripSubcategoryColor } from '@/lib/trips/subcategoryColor';
import { fmtEUR } from '@/lib/money';
import { formatMetric, metricValue, type TripMetric } from '@/lib/trips/view';
import type { TripSummary } from '@/lib/trips/summary';

function cellValue(t: TripSummary, subcategory: string, metric: TripMetric): number {
  const amount = t.bySubcategory.find((s) => s.name === subcategory)?.amount ?? 0;
  if (metric === 'total') return amount;
  if (metric === 'perDay') return amount / t.days;
  return amount / (t.days * t.travelers);
}

/** Subcategory × trip heat table — read across a row to compare one cost type over every trip. */
export function TripsMatrix({ trips, metric }: { trips: TripSummary[]; metric: TripMetric }) {
  const totals = new Map<string, number>();
  for (const t of trips) {
    for (const s of t.bySubcategory) totals.set(s.name, (totals.get(s.name) ?? 0) + s.amount);
  }
  const subcategories = Array.from(totals.keys()).sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));

  return (
    <section className="glass flex flex-col gap-[18px] !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">Subcategory by trip</div>
          <div className="mt-1 text-[13px] font-semibold text-ink-soft">
            {metric === 'total'
              ? 'Absolute spend per subcategory.'
              : metric === 'perDay'
                ? 'Spend per subcategory, per day away.'
                : 'Spend per subcategory, per person-day.'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft">
          Lighter
          <span className="inline-block h-[11px] w-[88px] rounded-full bg-[linear-gradient(90deg,rgba(74,92,224,.08),rgba(74,92,224,.9))]" />
          heavier, read across each row
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
                Subcategory
              </th>
              {trips.map((t) => (
                <th key={t.trip} className="whitespace-nowrap px-2 py-1.5 text-right text-[12px] font-bold text-ink">
                  {t.trip}
                  <div className="text-[11px] font-semibold text-[#7b8296]">
                    {t.days}d · {t.travelers}p
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subcategories.map((sub) => {
              const values = trips.map((t) => cellValue(t, sub, metric));
              const cmax = Math.max(...values, 0) || 1;
              return (
                <tr key={sub}>
                  <td className="whitespace-nowrap rounded-[12px] bg-white/[0.34] px-2.5 py-2">
                    <span
                      className="mr-2 inline-block h-[9px] w-[9px] rounded-[3px]"
                      style={{ background: tripSubcategoryColor(sub) }}
                    />
                    <span className="text-[13px] font-bold text-ink">{sub}</span>
                  </td>
                  {trips.map((t, i) => {
                    const v = values[i]!;
                    const r = v / cmax;
                    return (
                      <td
                        key={t.trip}
                        className="rounded-[12px] px-2.5 py-2 text-right text-[13px] font-bold tabular-nums"
                        style={{
                          background: v === 0 ? 'rgba(255,255,255,.22)' : `rgba(74, 92, 224, ${(0.07 + r * 0.72).toFixed(3)})`,
                          color: v === 0 ? '#9aa0b4' : r > 0.55 ? '#ffffff' : '#1d2340',
                        }}
                      >
                        {v === 0 ? '—' : fmtEUR(metric === 'total' ? v : Math.round(v), { decimals: 0 })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute">
                Trip total
              </td>
              {trips.map((t) => (
                <td key={t.trip} className="px-2.5 py-2 text-right text-[13.5px] font-extrabold tabular-nums text-ink">
                  {formatMetric(metricValue(t, metric), metric)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
