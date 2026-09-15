'use client';

import type { ForecastBucket } from '@/lib/balance';
import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

interface HoverData {
  label: string;
  kind: 'income' | 'spend';
  value: number;
  projected: boolean;
}

/**
 * Paired income / spend bars, Jan–Dec of the current year. Past months are
 * real data; months from today onward are filled in at the YTD average
 * pace (see lib/balance.ts#forecastYear) and rendered lighter + dashed so
 * the actual/projected boundary reads at a glance, same visual language as
 * the Forecast page's projection line.
 */
export function IncomeSpendBars({
  months,
  height = 240,
}: {
  months: ForecastBucket[];
  height?: number;
}) {
  const { containerRef, hover, show, hide } = useChartHover<HoverData>();
  const w = 900;
  const h = height;
  const pad = { l: 42, r: 12, t: 16, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const groupW = innerW / Math.max(1, months.length);
  const barW = (groupW - 10) / 2;
  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max];
  // Vertical marker at the actual → projected boundary, so it's obvious at
  // a glance where "so far" ends and the forecast begins.
  const boundaryIdx = months.findIndex((m) => m.projected);
  const boundaryX = boundaryIdx > 0 ? pad.l + boundaryIdx * groupW : null;

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="xMinYMid meet"
        style={{ display: 'block' }}
        role="img"
        aria-label="Income vs spending, January through December, with a forecast for months not yet reached"
      >
        {yTicks.map((y, i) => {
          const py = pad.t + innerH - (y / max) * innerH;
          return (
            <g key={i}>
              <line
                x1={pad.l}
                y1={py}
                x2={w - pad.r}
                y2={py}
                stroke="var(--rule)"
                strokeWidth="0.5"
                strokeDasharray={i === 0 ? undefined : '2 3'}
              />
              <text
                x={pad.l - 8}
                y={py + 3}
                fontSize="9"
                fontFamily="var(--font-inter)"
                fill="var(--ink-mute)"
                textAnchor="end"
              >
                {compactK(y)}
              </text>
            </g>
          );
        })}

        {boundaryX != null ? (
          <g>
            <line
              x1={boundaryX}
              x2={boundaryX}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="var(--ink-mute)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={boundaryX}
              y={pad.t - 5}
              fontSize="8"
              fontFamily="var(--font-inter)"
              fill="var(--ink-mute)"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              TODAY
            </text>
          </g>
        ) : null}

        {months.map((m, i) => {
          const x = pad.l + i * groupW + 5;
          const incH = (m.income / max) * innerH;
          const spdH = (m.expense / max) * innerH;
          const projected = m.projected;
          const barProps = (fill: string) => ({
            fill,
            fillOpacity: projected ? 0.28 : 1,
            stroke: fill,
            strokeWidth: projected ? 1 : 0,
            strokeDasharray: projected ? '3 2' : undefined,
          });
          return (
            <g key={`${m.year}-${m.month}`}>
              <rect
                x={x}
                y={pad.t + innerH - incH}
                width={barW}
                height={Math.max(incH, 1)}
                {...barProps('var(--pos)')}
                onMouseEnter={(e) => show(e, { label: m.label, kind: 'income', value: m.income, projected })}
                onMouseMove={(e) => show(e, { label: m.label, kind: 'income', value: m.income, projected })}
                onMouseLeave={hide}
              />
              <rect
                x={x + barW + 5}
                y={pad.t + innerH - spdH}
                width={barW}
                height={Math.max(spdH, 1)}
                {...barProps('var(--accent)')}
                onMouseEnter={(e) => show(e, { label: m.label, kind: 'spend', value: m.expense, projected })}
                onMouseMove={(e) => show(e, { label: m.label, kind: 'spend', value: m.expense, projected })}
                onMouseLeave={hide}
              />
              <text
                x={x + barW + 2.5}
                y={h - 10}
                fontSize="9"
                fontFamily="var(--font-inter)"
                fill={projected ? 'var(--ink-faint)' : 'var(--ink-mute)'}
                textAnchor="middle"
                letterSpacing="0.5"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
          <span className="font-medium text-ink">{hover.data.label}</span>
          <span className="mx-1 text-ink-mute">·</span>
          <span className={hover.data.kind === 'income' ? 'text-pos' : 'text-accent'}>
            {hover.data.kind === 'income' ? 'Income' : 'Spend'} {fmtEUR(hover.data.value, { decimals: 0 })}
          </span>
          {hover.data.projected ? <span className="ml-1 text-ink-mute">(projected)</span> : null}
        </ChartTooltip>
      ) : null}
    </div>
  );
}

function compactK(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}
