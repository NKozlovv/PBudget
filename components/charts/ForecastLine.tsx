'use client';

import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';
import type { ProjectionPoint } from '@/lib/forecast/projection';

/**
 * Past + projected balance line. Two `<path>` segments share the same
 * stroke color; the projected segment is dashed and uses 0.65 opacity so
 * the boundary reads at a glance. Inline SVG, no library.
 *
 * Mirrors design-refs/src/forecast.jsx LineChart pattern + the legend at
 * lines 50-53.
 */
export function ForecastLine({
  points,
  height = 200,
}: {
  points: ProjectionPoint[];
  height?: number;
}) {
  const { containerRef, hover, show, hide } = useChartHover<ProjectionPoint>();
  if (points.length < 2) return null;

  const padX = 12;
  const padTop = 18;
  const padBottom = 28;
  const ySpace = height - padTop - padBottom;

  const values = points.map((p) => p.balance);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 1) * 1.1;
  const min = rawMin - (rawMax - rawMin) * 0.05;
  const yFor = (v: number) => padTop + ySpace - ((v - min) / span) * ySpace;

  // Width is fluid — using viewBox + preserveAspectRatio="none" lets the
  // SVG stretch to the parent.
  const width = 1000;
  const innerW = width - padX * 2;
  const xs = points.map((_, i) => padX + (innerW * i) / (points.length - 1));
  const ys = values.map((v) => yFor(v));
  const yTicks = [rawMin, (rawMin + rawMax) / 2, rawMax];

  // Find the boundary: index of the last actual point (still part of actual).
  const boundary = points.findIndex((p) => p.projected);
  const splitIdx = boundary <= 0 ? points.length - 1 : boundary - 1;

  function pathSegment(from: number, to: number): string {
    let d = '';
    for (let i = from; i <= to; i++) {
      d += `${i === from ? 'M' : 'L'}${xs[i]!.toFixed(1)},${ys[i]!.toFixed(1)} `;
    }
    return d.trim();
  }

  // Actual: 0 → splitIdx (inclusive). Projected: splitIdx → end (inclusive,
  // so the line is continuous).
  const actualPath = pathSegment(0, splitIdx);
  const projectedPath = boundary >= 0 ? pathSegment(splitIdx, points.length - 1) : '';

  // Area under actual portion, for a soft accent fill.
  const areaPath =
    `M${xs[0]!.toFixed(1)},${(padTop + ySpace).toFixed(1)} ` +
    points
      .slice(0, splitIdx + 1)
      .map((_, i) => `L${xs[i]!.toFixed(1)},${ys[i]!.toFixed(1)} `)
      .join('') +
    `L${xs[splitIdx]!.toFixed(1)},${(padTop + ySpace).toFixed(1)} Z`;

  // Area under the projected portion, same shape as the actual-area logic.
  const projectedAreaPath =
    boundary >= 0
      ? `M${xs[splitIdx]!.toFixed(1)},${(padTop + ySpace).toFixed(1)} ` +
        points
          .slice(splitIdx)
          .map((_, i) => `L${xs[splitIdx + i]!.toFixed(1)},${ys[splitIdx + i]!.toFixed(1)} `)
          .join('') +
        `L${xs[points.length - 1]!.toFixed(1)},${(padTop + ySpace).toFixed(1)} Z`
      : '';

  const gradId = `fc-line-${Math.random().toString(36).slice(2, 8)}`;
  const gradIdProj = `fc-line-proj-${Math.random().toString(36).slice(2, 8)}`;

  // Choose 4 evenly-spaced x-axis labels to avoid crowding.
  const tickIndices = [
    0,
    Math.floor(points.length / 3),
    Math.floor((points.length * 2) / 3),
    points.length - 1,
  ];

  // The "today" marker (boundary).
  const markerIdx = splitIdx;
  const markerX = xs[markerIdx]!;
  const markerY = ys[markerIdx]!;

  const hitWidth = innerW / (points.length - 1);

  return (
    // aspect-ratio locks the rendered box to the viewBox's own ratio, so
    // preserveAspectRatio="none" below never has a mismatched box to
    // stretch to — a fixed pixel `height` with a fluid `width` let the
    // X-axis silently stretch by however far the real card width drifted
    // from `width`, which read as a crooked/distorted chart.
    <div ref={containerRef} className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Balance projection. ${fmtEUR(rawMin, { decimals: 0 })} to ${fmtEUR(rawMax, { decimals: 0 })}.`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--indigo)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--indigo)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={gradIdProj} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.24} />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* horizontal gridlines: min / mid / max, each with a value label */}
      {yTicks.map((v, i) => {
        const y = yFor(v);
        return (
          <g key={i}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(31,39,66,.12)"
              strokeWidth={i === 0 ? 1 : 0.5}
              strokeDasharray={i === 0 ? undefined : '2 3'}
            />
            <text
              x={width - padX}
              y={y - 4}
              fontSize="10"
              fontFamily="var(--font-sans)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              {fmtEUR(v, { compact: true, decimals: 0 })}
            </text>
          </g>
        );
      })}

      {/* boundary marker (vertical dashed) */}
      {boundary > 0 ? (
        <line
          x1={markerX}
          x2={markerX}
          y1={padTop}
          y2={padTop + ySpace}
          stroke="rgba(31,39,66,.12)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ) : null}

      {/* area under actual */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* area under projected — separate teal fill so the boundary reads at a glance */}
      {projectedAreaPath ? <path d={projectedAreaPath} fill={`url(#${gradIdProj})`} /> : null}

      {/* actual line */}
      <path
        d={actualPath}
        fill="none"
        stroke="var(--indigo)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* projected line — teal + dashed, distinct color from actual rather than just faded */}
      {projectedPath ? (
        <path
          d={projectedPath}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 5"
        />
      ) : null}

      {/* boundary marker: ring where recorded data ends and the projection begins */}
      <circle cx={markerX} cy={markerY} r={6} fill="white" stroke="var(--indigo)" strokeWidth={3} />
      {points[points.length - 1] ? (
        <circle cx={xs[points.length - 1]} cy={ys[ys.length - 1]} r={4.5} fill="var(--teal)" />
      ) : null}

      {/* x-axis labels */}
      {tickIndices.map((i) => (
        <text
          key={i}
          x={xs[i]}
          y={height - 8}
          fontSize="10"
          fontFamily="var(--font-sans)"
          fill="var(--ink-mute)"
          textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
        >
          {points[i]!.label}
        </text>
      ))}

      {/* Hover hit-regions, one per point */}
      {points.map((p, i) => (
        <rect
          key={i}
          x={Math.max(0, xs[i]! - hitWidth / 2)}
          y={0}
          width={hitWidth}
          height={height}
          fill="transparent"
          onMouseEnter={(e) => show(e, p)}
          onMouseMove={(e) => show(e, p)}
          onMouseLeave={hide}
        />
      ))}
    </svg>
    {hover ? (
      <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
        <span className="font-medium text-ink">{hover.data.label}</span>
        <span className="mx-1 text-ink-mute">·</span>
        <span className="text-accent">{fmtEUR(hover.data.balance, { decimals: 0 })}</span>
        {hover.data.projected ? <span className="ml-1 text-ink-mute">(projected)</span> : null}
      </ChartTooltip>
    ) : null}
    </div>
  );
}
