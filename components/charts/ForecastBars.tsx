import type { ForecastBucket } from '@/lib/balance';
import { fmtEUR } from '@/lib/money';

/**
 * 12-month forecast bars: solid bars for past months, hatched / softer
 * bars for projected. Sage = income, brass = spend, separated within
 * each month.
 */
export function ForecastBars({
  buckets,
  height = 220,
}: {
  buckets: ForecastBucket[];
  height?: number;
}) {
  const w = 720;
  const h = height;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...buckets.flatMap((m) => [m.income, m.expense]));
  const groupW = innerW / Math.max(1, buckets.length);
  const barW = (groupW - 6) / 2;
  const yTicks = [0, max * 0.5, max];

  const projectedStartIdx = buckets.findIndex((b) => b.projected);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="xMinYMid meet"
      style={{ display: 'block' }}
      role="img"
      aria-label="Forecast — income vs spend by month"
    >
      <defs>
        <pattern id="hatch-pos" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="var(--pos-soft)" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--pos)" strokeWidth="1.4" />
        </pattern>
        <pattern id="hatch-spend" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="var(--accent-soft)" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" strokeWidth="1.4" />
        </pattern>
      </defs>

      {/* Vertical separator before projected months */}
      {projectedStartIdx > 0 ? (
        <line
          x1={pad.l + projectedStartIdx * groupW}
          y1={pad.t - 4}
          x2={pad.l + projectedStartIdx * groupW}
          y2={pad.t + innerH + 4}
          stroke="var(--accent)"
          strokeWidth="0.75"
          strokeDasharray="3 3"
        />
      ) : null}

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

      {buckets.map((m, i) => {
        const x = pad.l + i * groupW + 3;
        const incH = (m.income / max) * innerH;
        const spdH = (m.expense / max) * innerH;
        const incFill = m.projected ? 'url(#hatch-pos)' : 'var(--pos)';
        const spdFill = m.projected ? 'url(#hatch-spend)' : 'var(--accent)';
        return (
          <g key={`${m.year}-${m.month}`}>
            <rect
              x={x}
              y={pad.t + innerH - incH}
              width={barW}
              height={incH}
              fill={incFill}
              opacity={m.projected ? 0.75 : 1}
            >
              <title>{`${m.label}${m.projected ? ' (proj)' : ''} · income ${fmtEUR(m.income)}`}</title>
            </rect>
            <rect
              x={x + barW + 3}
              y={pad.t + innerH - spdH}
              width={barW}
              height={spdH}
              fill={spdFill}
              opacity={m.projected ? 0.75 : 1}
            >
              <title>{`${m.label}${m.projected ? ' (proj)' : ''} · spend ${fmtEUR(m.expense)}`}</title>
            </rect>
            <text
              x={x + barW + 1.5}
              y={h - 10}
              fontSize="9"
              fontFamily="var(--font-inter)"
              fill={m.projected ? 'var(--ink-mute)' : 'var(--ink-soft)'}
              textAnchor="middle"
              letterSpacing="1"
              fontStyle={m.projected ? 'italic' : 'normal'}
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function compactK(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}
