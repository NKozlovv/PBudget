'use client';

import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { useChartHover } from '@/components/charts/useChartHover';

interface Point {
  label: string;
  native: number;
  eur: number;
}

/**
 * Per-account mini area chart (6 month-end points). Replaces the bare
 * Sparkline used elsewhere — adds a faint baseline, a top max-tick, and
 * x-axis month labels so the trend is readable on its own without
 * relying on the surrounding card copy.
 *
 * Token-only colors except for the data stroke/fill, which the caller
 * passes from `categoryColor()` (account swatch).
 */
export function AccountMiniChart({
  data,
  color,
  width = 220,
  height = 80,
}: {
  data: Point[];
  color: string;
  width?: number;
  height?: number;
}) {
  const { containerRef, hover, show, hide } = useChartHover<Point>();
  if (data.length < 2) return null;

  const padX = 6;
  const padTop = 10;
  const padBottom = 18; // room for labels
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const values = data.map((d) => d.eur);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad the range so flat lines still show a sliver of area.
  const range = rawMax - rawMin || Math.max(Math.abs(rawMax), 1);
  const min = rawMin - range * 0.08;
  const max = rawMax + range * 0.08;
  const span = max - min || 1;

  const xs = data.map((_, i) => padX + (innerW * i) / (data.length - 1));
  const ys = values.map((v) => padTop + innerH - ((v - min) / span) * innerH);

  const line = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i]!.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${xs[xs.length - 1]!.toFixed(1)},${(padTop + innerH).toFixed(1)} L${xs[0]!.toFixed(1)},${(padTop + innerH).toFixed(1)} Z`;
  const lastX = xs[xs.length - 1]!;
  const lastY = ys[ys.length - 1]!;

  const gridY = padTop + innerH; // baseline
  const topY = padTop;

  // Show x-tick labels for first, midpoint, last to avoid crowding.
  const tickIndices = data.length <= 4 ? data.map((_, i) => i) : [0, Math.floor(data.length / 2), data.length - 1];
  const hitWidth = innerW / data.length;

  const gradId = `acct-spk-${Math.random().toString(36).slice(2, 8)}`;

  return (
    // aspect-ratio locks the rendered box to the viewBox's own ratio —
    // see TrendLineChart's doc comment for why a fixed pixel `height` with
    // a fluid `width` (the old approach here) silently stretched the
    // X-axis by however far the real card width drifted from `width`.
    <div ref={containerRef} className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Balance trend, ${data.length} months. Min ${fmtEUR(rawMin, { decimals: 0 })}, max ${fmtEUR(rawMax, { decimals: 0 })}.`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* y baseline + top tick — faint rule lines */}
        <line x1={padX} x2={width - padX} y1={gridY} y2={gridY} stroke="rgba(31,39,66,.12)" strokeWidth="1" />
        <line
          x1={padX}
          x2={width - padX}
          y1={topY}
          y2={topY}
          stroke="rgba(31,39,66,.12)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* y-axis ticks at min/max — small text on the right edge */}
        <text
          x={width - padX}
          y={topY + 3}
          fontSize="9"
          fontFamily="var(--font-sans)"
          fill="var(--ink-mute)"
          textAnchor="end"
        >
          {fmtEUR(rawMax, { compact: true, decimals: 0 })}
        </text>
        <text
          x={width - padX}
          y={gridY - 3}
          fontSize="9"
          fontFamily="var(--font-sans)"
          fill="var(--ink-mute)"
          textAnchor="end"
        >
          {fmtEUR(rawMin, { compact: true, decimals: 0 })}
        </text>

        {/* Area + line */}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={2.5} fill={color} />

        {/* x-axis labels */}
        {tickIndices.map((i) => (
          <text
            key={i}
            x={xs[i]}
            y={height - 4}
            fontSize="9"
            fontFamily="var(--font-sans)"
            fill="var(--ink-mute)"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {data[i]!.label}
          </text>
        ))}

        {/* Hover hit-regions, one per point */}
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
          <span style={{ color }}>{fmtEUR(hover.data.eur, { decimals: 0 })}</span>
        </ChartTooltip>
      ) : null}
    </div>
  );
}
