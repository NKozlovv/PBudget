'use client';

import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

export interface TrendPoint {
  label: string;
  value: number;
  /** Past = real data; projected = filled in at the YTD average pace. */
  projected: boolean;
}

/**
 * Compact "year with forecast" line chart, used by the Dashboard's hero
 * Total Balance / Income / Spending tiles — same actual-vs-projected
 * visual language as ForecastLine and the Cash flow bars (solid line for
 * real months, dashed + lighter for projected, a "today" boundary marker),
 * but sized for a small KPI tile: fewer axis labels, shorter, no legend of
 * its own (the tile's own delta line already carries that context).
 *
 * Replaces the old bare Sparkline (no axis at all) for these three tiles —
 * Sparkline itself is unchanged and still used for the decorative auth
 * preview card.
 */
export function TrendLineChart({
  data,
  width = 500,
  height = 96,
  color = 'var(--accent)',
  valueFormat = (v: number) => fmtEUR(v, { decimals: 0 }),
}: {
  data: TrendPoint[];
  width?: number;
  height?: number;
  color?: string;
  valueFormat?: (v: number) => string;
}) {
  const { containerRef, hover, show, hide } = useChartHover<TrendPoint>();
  if (data.length < 2) return null;

  const pad = { l: 30, r: 4, t: 10, b: 14 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 1) * 1.1;
  const min = rawMin - (rawMax - rawMin) * 0.05;
  const yFor = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;

  const xs = data.map((_, i) => pad.l + (innerW * i) / (data.length - 1));
  const ys = values.map((v) => yFor(v));

  const boundary = data.findIndex((d) => d.projected);
  const splitIdx = boundary <= 0 ? data.length - 1 : boundary - 1;

  function pathSegment(from: number, to: number): string {
    let d = '';
    for (let i = from; i <= to; i++) {
      d += `${i === from ? 'M' : 'L'}${xs[i]!.toFixed(1)},${ys[i]!.toFixed(1)} `;
    }
    return d.trim();
  }

  const actualPath = pathSegment(0, splitIdx);
  const projectedPath = boundary >= 0 ? pathSegment(splitIdx, data.length - 1) : '';
  const areaPath =
    `M${xs[0]!.toFixed(1)},${(pad.t + innerH).toFixed(1)} ` +
    data
      .slice(0, splitIdx + 1)
      .map((_, i) => `L${xs[i]!.toFixed(1)},${ys[i]!.toFixed(1)} `)
      .join('') +
    `L${xs[splitIdx]!.toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;

  const gradId = `trend-${Math.random().toString(36).slice(2, 8)}`;
  const boundaryX = boundary > 0 ? xs[splitIdx]! : null;
  const hitWidth = innerW / (data.length - 1);

  // Three x-axis labels max (first / boundary / last) — a full 12-month
  // label row doesn't fit a tile this narrow without crowding.
  const xTickIndices = [...new Set([0, splitIdx, data.length - 1])];

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Trend from ${valueFormat(rawMin)} to ${valueFormat(rawMax)}, with a forecast for months not yet reached`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* min / max gridlines with compact value labels */}
        {[rawMax, rawMin].map((v, i) => {
          const y = yFor(v);
          return (
            <g key={i}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="var(--rule)"
                strokeWidth="0.5"
                strokeDasharray={i === 0 ? '2 3' : undefined}
              />
              <text
                x={pad.l - 5}
                y={y + (i === 0 ? 3 : -2)}
                fontSize="8"
                fontFamily="var(--font-inter)"
                fill="var(--ink-mute)"
                textAnchor="end"
              >
                {fmtEUR(v, { compact: true, decimals: 0, noSymbol: true })}
              </text>
            </g>
          );
        })}

        {boundaryX != null ? (
          <line
            x1={boundaryX}
            x2={boundaryX}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--ink-mute)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ) : null}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={actualPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {projectedPath ? (
          <path
            d={projectedPath}
            fill="none"
            stroke={color}
            strokeOpacity={0.6}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />
        ) : null}
        <circle cx={xs[splitIdx]} cy={ys[splitIdx]} r={2.5} fill={color} />

        {xTickIndices.map((i) => (
          <text
            key={i}
            x={xs[i]}
            y={height - 3}
            fontSize="8"
            fontFamily="var(--font-inter)"
            fill="var(--ink-mute)"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {data[i]!.label}
          </text>
        ))}

        {data.map((d, i) => (
          <rect
            key={i}
            x={Math.max(0, xs[i]! - hitWidth / 2)}
            y={0}
            width={hitWidth}
            height={height}
            fill="transparent"
            onMouseEnter={(e) => show(e, d)}
            onMouseMove={(e) => show(e, d)}
            onMouseLeave={hide}
          />
        ))}
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
          <span className="font-medium text-ink">{hover.data.label}</span>
          <span className="mx-1 text-ink-mute">·</span>
          <span style={{ color }}>{valueFormat(hover.data.value)}</span>
          {hover.data.projected ? <span className="ml-1 text-ink-mute">(projected)</span> : null}
        </ChartTooltip>
      ) : null}
    </div>
  );
}
