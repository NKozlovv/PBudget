'use client';

import type { ForecastBucket } from '@/lib/balance';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

interface RatePoint {
  label: string;
  /** (income - expense) / income * 100 for real months with income; null
   * for projected months or months with no income (nothing to rate). */
  rate: number | null;
}

interface HoverDatum {
  label: string;
  rate: number;
}

/**
 * Per-month savings-rate trend — the legacy app's "Savings rate" card
 * (public/legacy/index.html, chartSavings), reimplemented as inline SVG.
 * Only real (non-projected) months with income are plotted; segments are
 * colored by the sign of the rate they end on, with a dashed YTD-average
 * reference line and a one-line insight (best month / streak / average)
 * below the chart, same logic as the legacy `savingsInsight` footer.
 */
export function SavingsRateChart({
  buckets,
  height = 220,
}: {
  buckets: ForecastBucket[];
  height?: number;
}) {
  const { containerRef, hover, show, hide } = useChartHover<HoverDatum>();

  const points: RatePoint[] = buckets.map((b) => ({
    label: b.label,
    rate: !b.projected && b.income > 0 ? ((b.income - b.expense) / b.income) * 100 : null,
  }));
  const validIdx = points.reduce<number[]>((acc, p, i) => {
    if (p.rate != null) acc.push(i);
    return acc;
  }, []);
  if (validIdx.length < 2) return null;

  const validRates = validIdx.map((i) => points[i]!.rate!);
  const ytdAvg = validRates.reduce((s, v) => s + v, 0) / validRates.length;
  const lastValidIdx = validIdx[validIdx.length - 1]!;

  const width = 1000;
  const pad = { l: 44, r: 16, t: 22, b: 26 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const rawMin = Math.min(...validRates, ytdAvg, 0);
  const rawMax = Math.max(...validRates, ytdAvg, 0);
  const range = Math.max(rawMax - rawMin, 1);
  const min = rawMin - range * 0.2;
  const max = rawMax + range * 0.2;
  const span = Math.max(max - min, 1);
  const yFor = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;

  const xs = points.map((_, i) => pad.l + (innerW * i) / (points.length - 1));
  const zeroY = yFor(0);

  const segments = validIdx.slice(1).map((i1, k) => {
    const i0 = validIdx[k]!;
    const v0 = points[i0]!.rate!;
    const v1 = points[i1]!.rate!;
    const pos = v1 > 0;
    return {
      d: `M${xs[i0]!.toFixed(1)},${yFor(v0).toFixed(1)} L${xs[i1]!.toFixed(1)},${yFor(v1).toFixed(1)}`,
      areaD: `M${xs[i0]!.toFixed(1)},${zeroY.toFixed(1)} L${xs[i0]!.toFixed(1)},${yFor(v0).toFixed(1)} L${xs[i1]!.toFixed(1)},${yFor(v1).toFixed(1)} L${xs[i1]!.toFixed(1)},${zeroY.toFixed(1)} Z`,
      color: pos ? 'var(--pos)' : 'var(--neg)',
      fill: pos ? 'var(--pos-soft)' : 'var(--neg-soft)',
    };
  });

  const yTicks = [...new Set([max, 0, min])];

  // Insight footer: mirrors the legacy chart's dynamic message — call out
  // a new best month, an active positive streak, or fall back to the YTD
  // average.
  const bestIdx = validIdx.reduce(
    (best, i) => (best === -1 || points[i]!.rate! > points[best]!.rate! ? i : best),
    -1,
  );
  let streak = 0;
  for (let k = validIdx.length - 1; k >= 0; k--) {
    if (points[validIdx[k]!]!.rate! > 0) streak++;
    else break;
  }
  let insight: string;
  if (bestIdx === lastValidIdx) {
    insight = `Best month yet — ${points[bestIdx]!.label} at ${points[bestIdx]!.rate!.toFixed(0)}%`;
  } else if (streak >= 2) {
    insight = `${streak} months positive in a row`;
  } else {
    insight = `YTD avg: ${ytdAvg.toFixed(0)}%`;
  }
  if (bestIdx !== lastValidIdx) {
    const cur = points[lastValidIdx]!.rate!;
    if (cur > ytdAvg) insight += ` · ${points[lastValidIdx]!.label} above average`;
  }

  const hitWidth = innerW / (points.length - 1);

  return (
    // aspect-ratio locks the rendered box to the viewBox's own ratio —
    // see TrendLineChart's doc comment for why a fixed pixel `height`
    // with a fluid `width` (the old approach here) silently stretched the
    // X-axis by whatever the real card width differed from viewBox width.
    <div ref={containerRef} className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Savings rate by month, year-to-date average ${ytdAvg.toFixed(0)} percent`}
      >
        {yTicks.map((v, i) => {
          const y = yFor(v);
          return (
            <g key={i}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="var(--rule)"
                strokeWidth={v === 0 ? 1 : 0.5}
                strokeDasharray={v === 0 ? undefined : '2 3'}
              />
              <text
                x={pad.l - 8}
                y={y + 3}
                fontSize="10"
                fontFamily="var(--font-inter)"
                fill="var(--ink-mute)"
                textAnchor="end"
              >
                {v.toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* YTD average reference line */}
        <line
          x1={pad.l}
          x2={width - pad.r}
          y1={yFor(ytdAvg)}
          y2={yFor(ytdAvg)}
          stroke="var(--ink-mute)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          opacity={0.6}
        />

        {segments.map((s, i) => (
          <g key={i}>
            <path d={s.areaD} fill={s.fill} />
            <path d={s.d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {validIdx.map((i) => {
          const v = points[i]!.rate!;
          const isLast = i === lastValidIdx;
          const pointColor = v <= 0 ? 'var(--neg)' : isLast ? 'var(--pos)' : 'var(--ink-soft)';
          return (
            <g key={i}>
              <circle
                cx={xs[i]}
                cy={yFor(v)}
                r={isLast ? 5 : 4}
                fill={isLast ? pointColor : 'var(--bg-panel)'}
                stroke={v <= 0 ? 'var(--neg)' : 'var(--pos)'}
                strokeWidth="2"
              />
              <text
                x={xs[i]}
                y={yFor(v) - 12}
                fontSize="10"
                fontWeight={600}
                fontFamily="var(--font-inter)"
                fill={pointColor}
                stroke="var(--bg-panel)"
                strokeWidth="3"
                paintOrder="stroke"
                textAnchor="middle"
              >
                {v.toFixed(0)}%
              </text>
            </g>
          );
        })}

        {points.map((p, i) => (
          <text
            key={i}
            x={xs[i]}
            y={height - 6}
            fontSize="10"
            fontFamily="var(--font-inter)"
            fill="var(--ink-mute)"
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          >
            {p.label}
          </text>
        ))}

        {validIdx.map((i) => (
          <rect
            key={i}
            x={Math.max(0, xs[i]! - hitWidth / 2)}
            y={0}
            width={hitWidth}
            height={height}
            fill="transparent"
            onMouseEnter={(e) => show(e, { label: points[i]!.label, rate: points[i]!.rate! })}
            onMouseMove={(e) => show(e, { label: points[i]!.label, rate: points[i]!.rate! })}
            onMouseLeave={hide}
          />
        ))}
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
          <span className="font-medium text-ink">{hover.data.label}</span>
          <span className="mx-1 text-ink-mute">·</span>
          <span style={{ color: hover.data.rate <= 0 ? 'var(--neg)' : 'var(--pos)' }}>
            {hover.data.rate.toFixed(1)}%
          </span>
        </ChartTooltip>
      ) : null}
      <div className="mt-2.5 text-[11px] text-ink-mute">{insight}</div>
    </div>
  );
}
