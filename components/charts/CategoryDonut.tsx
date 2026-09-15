'use client';

import type { CategorySlice } from '@/lib/balance';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

/**
 * Stroke-dashed donut + side legend.
 * Modeled on design-refs/src/theus-dashboard.jsx 82–105 (DonutChart) +
 * the side-list block at 246–260.
 */
export function CategoryDonut({
  data,
  size = 160,
  strokeWidth = 22,
  centerLabel,
  centerSublabel,
}: {
  data: CategorySlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}) {
  const { containerRef, hover, show, hide } = useChartHover<CategorySlice>();
  const positive = data.filter((d) => d.value > 0);
  const total = positive.reduce((s, d) => s + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  // Adjacent stroke-dasharray segments can show a hairline seam between them
  // (anti-aliasing at the arc boundary, most visible on the biggest slice
  // next to the smallest ones) — render each segment slightly longer than
  // its exact share so it overlaps into the next one by a fraction of a
  // pixel. `off` still advances by the *exact* length, so proportions and
  // the tooltip/legend stay accurate; only the rendered stroke overlaps.
  const SEAM_OVERLAP = 1;

  let off = 0;
  return (
    <div className="flex items-center gap-5">
      <div ref={containerRef} className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label="Spend by category"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--rule)"
            strokeWidth={strokeWidth}
          />
          {positive.map((d) => {
            const exact = total > 0 ? (d.value / total) * c : 0;
            const len = Math.min(exact + SEAM_OVERLAP, c);
            const dash = `${len} ${c - len}`;
            const dashOffset = -off;
            off += exact;
            return (
              <circle
                key={d.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={categoryColor(d.name)}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                onMouseEnter={(e) => show(e, d)}
                onMouseMove={(e) => show(e, d)}
                onMouseLeave={hide}
              />
            );
          })}
        </svg>
        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-sans text-[18px] font-semibold tabular-nums tracking-tight text-ink">
              {centerLabel}
            </div>
            {centerSublabel ? (
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                {centerSublabel}
              </div>
            ) : null}
          </div>
        ) : null}
        {hover ? (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
            <span className="font-medium text-ink">{hover.data.name}</span>
            <span className="mx-1 text-ink-mute">·</span>
            <span style={{ color: categoryColor(hover.data.name) }}>
              {fmtEUR(hover.data.value, { decimals: 0 })}
            </span>
          </ChartTooltip>
        ) : null}
      </div>

      <ul className="flex-1 flex flex-col gap-2 min-w-0">
        {positive.length === 0 ? (
          <li className="text-sm text-ink-mute">Not enough history yet.</li>
        ) : (
          positive.slice(0, 6).map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: categoryColor(d.name) }}
                />
                <span className="truncate text-[13px] text-ink">{d.name}</span>
              </span>
              <span className="font-sans text-[12px] tabular-nums text-ink-soft">
                {fmtEUR(d.value, { decimals: 0 })}
              </span>
            </li>
          ))
        )}
        {positive.length > 6 ? (
          <li className="text-[11px] text-ink-mute pt-1">
            + {positive.length - 6} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}
