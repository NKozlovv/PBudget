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

function trendNote(avg: number, projected: number): string {
  if (avg <= 0) return 'No spend yet this year.';
  const pctDiff = (projected - avg) / avg;
  if (pctDiff > 0.05) return 'Trending above your average.';
  if (pctDiff < -0.05) return 'Trending below your average.';
  return 'Steady with your average.';
}

/**
 * Top-N expense categories with avg vs projected bars — Theus Forecast
 * design handoff. Next-month projection: avg + a small uplift when this
 * month is trending over avg, else just avg.
 */
export function PerCategoryOutlook({
  rows,
  limit = 5,
}: {
  rows: BurnRateRow[];
  limit?: number;
}) {
  const enriched: OutlookRow[] = rows.map((r) => {
    const lift = r.thisMonth > r.avgMonthly ? (r.thisMonth - r.avgMonthly) * 0.5 : 0;
    return {
      name: r.name,
      avg: r.avgMonthly,
      projected: Math.max(r.avgMonthly + lift, 0),
    };
  });
  const sorted = enriched.sort((a, b) => b.projected - a.projected).slice(0, limit);
  const max = Math.max(1, ...sorted.map((r) => r.avg), ...sorted.map((r) => r.projected));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px] font-extrabold -tracking-[0.025em] text-ink">Categories to watch</h2>
        <p className="mt-1.5 text-[13.5px] font-medium text-ink-soft">
          Average so far this year against next month&apos;s projection, which leans toward the
          most recent month.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-mute">Not enough data yet.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {sorted.map((r) => {
            const color = categoryColor(r.name);
            const wAvg = (r.avg / max) * 100;
            const wProj = (r.projected / max) * 100;
            const over = r.projected > r.avg * 1.02;
            const under = r.projected < r.avg * 0.98;
            return (
              <div
                key={r.name}
                className="glass-tile flex flex-col gap-[9px] !rounded-[20px] p-[15px] px-[17px] transition-transform duration-200 ease-theus hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-[15px] font-extrabold -tracking-[0.015em] text-ink">{r.name}</span>
                  <span className="inline-flex items-baseline gap-[9px] whitespace-nowrap tabular-nums">
                    <span className="text-[13px] font-semibold text-ink-mute">{fmtEUR(r.avg, { decimals: 0 })} avg</span>
                    <span
                      className="text-[16px] font-extrabold"
                      style={{ color: over ? 'var(--out)' : under ? 'var(--in)' : 'var(--ink)' }}
                    >
                      {fmtEUR(r.projected, { decimals: 0 })}
                    </span>
                  </span>
                </div>
                <div className="relative h-[9px] overflow-hidden rounded-full bg-[#eef0f6]">
                  <span
                    aria-hidden
                    className="meter absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${wAvg}%`, background: `${color}40`, borderRight: `1.5px dashed ${color}` }}
                  />
                  <span
                    aria-hidden
                    className="meter absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${wProj}%`, background: color, opacity: 0.85 }}
                  />
                </div>
                <div className="text-[12px] font-semibold text-ink-mute">{trendNote(r.avg, r.projected)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
