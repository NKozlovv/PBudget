'use client';

import { cn } from '@/lib/utils';
import { TRIP_METRICS, type TripMetric } from '@/lib/trips/view';

/**
 * The metric picker, pulled out of TripsHero and made its own sticky,
 * centered pill — the metric it controls affects sections well below the
 * fold (ranked list, mix chart, matrix, table), so it stays reachable while
 * scrolled down instead of requiring a trip back to the hero. `top-[92px]`
 * clears TopNav's own sticky bar (`top-[14px]`, ~64px tall) plus a gap.
 */
export function CompareByBar({
  metric,
  onMetricChange,
}: {
  metric: TripMetric;
  onMetricChange: (metric: TripMetric) => void;
}) {
  return (
    <div className="sticky top-[92px] z-10 flex justify-center">
      <div className="glass-popover flex items-center gap-3 !rounded-full py-1.5 pl-4 pr-1.5">
        <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
          Compare by
        </span>
        <div className="flex gap-1 rounded-full bg-white/60 p-1">
          {TRIP_METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMetricChange(m.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-[15px] py-[7px] text-[13px] font-bold transition-[background,color,box-shadow] duration-200 ease-theus',
                m.key === metric
                  ? 'bg-indigo text-white [box-shadow:0_8px_20px_rgba(74,92,224,.32)]'
                  : 'text-ink-soft hover:bg-white',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
