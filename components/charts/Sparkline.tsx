'use client';

import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

/**
 * Sparkline. Originally for the auth preview card; now also used by the
 * dashboard hero + KPI tiles. Modeled on design-refs/src/charts.jsx
 * Sparkline: gradient area fill from `color` plus a single-stroke line.
 *
 * Hover tooltips are opt-in via `labels` — the auth page's decorative
 * preview sparkline has no real data behind it, so it passes none and stays
 * non-interactive; real trend sparklines pass one label per point.
 */
export function Sparkline({
  data,
  labels,
  width = 336,
  height = 60,
  color = 'var(--accent)',
  fillFrom,
  className,
  valueFormat = (v: number) => fmtEUR(v, { decimals: 0 }),
}: {
  data: number[];
  /** One label per point, e.g. "March 2026" — enables hover tooltips. */
  labels?: string[];
  width?: number;
  height?: number;
  /** Stroke + fill color. Pass any CSS color or var(--token). */
  color?: string;
  /** Override the gradient start color (defaults to `color` at 0.4 alpha). */
  fillFrom?: string;
  className?: string;
  valueFormat?: (v: number) => string;
}) {
  const { containerRef, hover, show, hide } = useChartHover<{ label: string; value: number }>();
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradId = `spk-${Math.random().toString(36).slice(2, 8)}`;

  const interactive = !!labels && labels.length === data.length;
  // One hit-region per point, spanning the midpoint gap to its neighbors —
  // there's no per-point dot to hover in a line chart, so this is what
  // makes the whole width of the sparkline respond to the nearest point.
  const hitWidth = width / data.length;

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className={className}
        role={interactive ? 'img' : undefined}
        aria-hidden={interactive ? undefined : true}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom ?? color} stopOpacity={fillFrom ? 1 : 0.4} />
            <stop offset="100%" stopColor={fillFrom ?? color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {last ? <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} /> : null}
        {interactive
          ? points.map(([x], i) => (
              <rect
                key={i}
                x={Math.max(0, x - hitWidth / 2)}
                y={0}
                width={hitWidth}
                height={height}
                fill="transparent"
                onMouseEnter={(e) => show(e, { label: labels![i]!, value: data[i]! })}
                onMouseMove={(e) => show(e, { label: labels![i]!, value: data[i]! })}
                onMouseLeave={hide}
              />
            ))
          : null}
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
          <span className="font-medium text-ink">{hover.data.label}</span>
          <span className="mx-1 text-ink-mute">·</span>
          <span style={{ color }}>{valueFormat(hover.data.value)}</span>
        </ChartTooltip>
      ) : null}
    </div>
  );
}
