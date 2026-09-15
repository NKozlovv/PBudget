'use client';

import type { MonthBucket } from '@/lib/balance';
import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from './ChartTooltip';
import { useChartHover } from './useChartHover';

interface HoverData {
  label: string;
  kind: 'income' | 'spend';
  value: number;
}

/**
 * Paired income / spend bars per month.
 * Modeled on design-refs/src/theus-dashboard.jsx 47–79: padded SVG with
 * dashed gridlines, mono y-axis labels, mono month labels.
 */
export function IncomeSpendBars({
  months,
  height = 220,
}: {
  months: MonthBucket[];
  height?: number;
}) {
  const { containerRef, hover, show, hide } = useChartHover<HoverData>();
  const w = 540;
  const h = height;
  const pad = { l: 38, r: 12, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const groupW = innerW / Math.max(1, months.length);
  const barW = (groupW - 8) / 2;
  const yTicks = [0, max * 0.5, max];

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="xMinYMid meet"
        style={{ display: 'block' }}
        role="img"
        aria-label="Income vs Spend over the last 6 months"
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

        {months.map((m, i) => {
          const x = pad.l + i * groupW + 4;
          const incH = (m.income / max) * innerH;
          const spdH = (m.expense / max) * innerH;
          return (
            <g key={`${m.year}-${m.month}`}>
              <rect
                x={x}
                y={pad.t + innerH - incH}
                width={barW}
                height={Math.max(incH, 1)}
                fill="var(--pos)"
                onMouseEnter={(e) => show(e, { label: m.label, kind: 'income', value: m.income })}
                onMouseMove={(e) => show(e, { label: m.label, kind: 'income', value: m.income })}
                onMouseLeave={hide}
              />
              <rect
                x={x + barW + 4}
                y={pad.t + innerH - spdH}
                width={barW}
                height={Math.max(spdH, 1)}
                fill="var(--accent)"
                onMouseEnter={(e) => show(e, { label: m.label, kind: 'spend', value: m.expense })}
                onMouseMove={(e) => show(e, { label: m.label, kind: 'spend', value: m.expense })}
                onMouseLeave={hide}
              />
              <text
                x={x + barW + 2}
                y={h - 10}
                fontSize="9"
                fontFamily="var(--font-inter)"
                fill="var(--ink-mute)"
                textAnchor="middle"
                letterSpacing="1"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y}>
          <span className="font-medium text-ink">{hover.data.label}</span>
          <span className="mx-1 text-ink-mute">·</span>
          <span className={hover.data.kind === 'income' ? 'text-pos' : 'text-accent'}>
            {hover.data.kind === 'income' ? 'Income' : 'Spend'} {fmtEUR(hover.data.value, { decimals: 0 })}
          </span>
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
