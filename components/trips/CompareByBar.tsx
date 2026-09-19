'use client';

import { cn } from '@/lib/utils';
import { TRIP_METRICS, type TripMetric } from '@/lib/trips/view';

/**
 * The metric picker, pulled out of TripsHero — the metric it controls
 * affects sections well below the fold (ranked list, mix chart, matrix,
 * table), so it needs to stay reachable while scrolled down instead of
 * requiring a trip back to the hero.
 *
 * This didn't actually stick at first: the app shell's `.ambient-ground`
 * wrapper (app/globals.css) had `overflow: hidden` on it (meant to clip
 * the decorative blurred blobs), and per the CSS spec ANY ancestor with
 * overflow other than `visible` breaks `position: sticky` for every
 * descendant, regardless of whether that ancestor's own content actually
 * overflows — it almost certainly broke TopNav's own sticky too, just
 * unnoticed until this page needed a second sticky element far enough
 * down to prove it. Fixed at the source instead of working around it here
 * with `position: fixed`: `.ambient-ground`'s `overflow: hidden` turned
 * out to be redundant anyway — `.ambient-layer` (the blobs' own direct
 * parent, `position: absolute; inset: 0`) already has its own
 * `overflow: hidden` that clips the blobs (and their blur bleed)
 * identically, so removing the outer one changes nothing visually.
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
