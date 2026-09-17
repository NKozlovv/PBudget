import { Mono } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { BurnRateRow } from '@/lib/balance';

interface OutlookRow {
  name: string;
  /** YTD monthly average ("budget" baseline). */
  avg: number;
  /** Projected next month at YTD pace. */
  projected: number;
}

/**
 * Top-N expense categories with avg vs projected bars.
 *
 * Mirrors design-refs/src/forecast.jsx lines 58-80: per row a horizontal
 * bar where a tinted slice marks the avg width with a dashed vertical
 * line at its right edge, and a solid slice on top marks the projected
 * width. Bars normalize to the largest projected in the visible set.
 */
export function PerCategoryOutlook({
  rows,
  limit = 5,
}: {
  rows: BurnRateRow[];
  limit?: number;
}) {
  // Build the next-month projection: ref uses avg + a small uplift for
  // categories trending over avg this month. Use thisMonth when present
  // (signal of recent pace) blended with avgMonthly, else just avgMonthly.
  const enriched: OutlookRow[] = rows.map((r) => {
    const lift = r.thisMonth > r.avgMonthly ? (r.thisMonth - r.avgMonthly) * 0.5 : 0;
    return {
      name: r.name,
      avg: r.avgMonthly,
      projected: Math.max(r.avgMonthly + lift, 0),
    };
  });
  const sorted = enriched.sort((a, b) => b.projected - a.projected).slice(0, limit);
  const max = Math.max(1, ...sorted.map((r) => r.projected));

  return (
    <div className="glass !rounded-[26px] p-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">
          Per-category outlook
        </h3>
        <Mono size="xs" className="mt-1 block">
          avg vs. projected · next month
        </Mono>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-mute">
          Not enough data yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((r) => {
            const color = categoryColor(r.name);
            const wAvg = (r.avg / max) * 100;
            const wProj = (r.projected / max) * 100;
            const over = r.projected > r.avg;
            return (
              <div key={r.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink-soft">{r.name}</span>
                  <span className="font-mono text-[12px] tabular-nums">
                    <span className={over ? 'text-neg' : 'text-ink'}>
                      {fmtEUR(r.projected, { decimals: 0 })}
                    </span>
                    <span className="text-ink-mute">
                      {' '}/ {fmtEUR(r.avg, { decimals: 0 })} avg
                    </span>
                  </span>
                </div>
                <div className="relative h-[18px] overflow-hidden rounded-full bg-white/70">
                  {/* avg slice with dashed right edge */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${wAvg}%`,
                      background: `${color}40`,
                      borderRight: `1.5px dashed ${color}`,
                    }}
                  />
                  {/* projected slice */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${wProj}%`,
                      background: color,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
