'use client';

import { cn } from '@/lib/utils';
import { fmtEUR } from '@/lib/money';
import { TRIP_METRICS, averageMetric, formatMetric, metricValue, type TripMetric } from '@/lib/trips/view';
import type { TripSummary } from '@/lib/trips/summary';

export function TripsRanked({
  trips,
  metric,
  selected,
  onSelect,
}: {
  trips: TripSummary[];
  metric: TripMetric;
  selected: string | null;
  onSelect: (trip: string) => void;
}) {
  const ranked = [...trips].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  const max = Math.max(...ranked.map((t) => metricValue(t, metric)), 1);
  const avg = averageMetric(trips, metric);
  const avgPct = Math.min(100, (avg / max) * 100);
  const metricLabel = TRIP_METRICS.find((m) => m.key === metric)?.label.toLowerCase() ?? '';

  return (
    <section className="glass flex flex-col gap-[18px] !rounded-[34px] p-[24px] px-[26px]">
      <div>
        <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">Trips ranked</div>
        <div className="mt-1 text-[13px] font-semibold text-ink-soft">
          Ordered by {metricLabel}. Tap a trip to hold it in focus.
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((t) => {
          const value = metricValue(t, metric);
          const barPct = Math.min(100, (value / max) * 100);
          const isDimmed = selected !== null && selected !== t.trip;
          const isSelected = selected === t.trip;
          const fixedPct = t.total > 0 ? Math.round((t.fixed / t.total) * 100) : 0;

          return (
            <button
              key={t.trip}
              type="button"
              onClick={() => onSelect(t.trip)}
              className={cn(
                'block w-full rounded-[18px] p-[11px] px-[13px] text-left transition-[background,transform] duration-150 ease-theus hover:-translate-y-px hover:bg-white/[0.52]',
                isSelected && 'bg-white/[0.56]',
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-[14.5px] font-bold -tracking-[0.01em] text-ink">{t.trip}</span>
                  <span className="whitespace-nowrap text-[12px] font-semibold text-ink-mute">
                    {t.days}d · {t.travelers} {t.travelers > 1 ? 'people' : 'person'}
                  </span>
                </div>
                <span className="whitespace-nowrap text-[15px] font-extrabold tabular-nums text-ink">
                  {formatMetric(value, metric)}
                </span>
              </div>
              <div className="relative mt-[9px] h-[13px] rounded-full bg-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,.5)]">
                <div
                  className={cn(
                    'meter absolute inset-y-0 left-0 origin-left rounded-full',
                    isDimmed ? 'bg-indigo/[0.28]' : value >= avg ? 'bg-[linear-gradient(90deg,#f2708f,#e0568a)]' : 'bg-[linear-gradient(90deg,#4a5ce0,#1fb9a4)]',
                  )}
                  style={{ width: `${barPct}%` }}
                />
                <div
                  className="absolute -top-1 -bottom-1 w-[2px] rounded-sm bg-ink/[0.42]"
                  style={{ left: `${avgPct}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-1.5 text-[12px] font-semibold text-ink-soft">
                {fmtEUR(t.total, { decimals: 0 })} total · {fixedPct}% fixed ·{' '}
                {fmtEUR(Math.round(t.dailyPerDay), { decimals: 0 })}/day on the ground
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft">
        <span className="inline-block h-[13px] w-[2px] rounded-sm bg-ink/[0.42]" aria-hidden />
        Average across all trips · {formatMetric(avg, metric)}
      </div>
    </section>
  );
}
