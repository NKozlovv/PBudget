import type { Account } from '@/lib/supabase/types';
import type { TrajectoryPoint } from '@/lib/balance';
import { fmtEUR } from '@/lib/money';

/**
 * Multi-line per-account balance over the last N months in EUR.
 * Inline SVG, mono y-axis labels, brass dot at the latest point per line.
 */
export function AccountsTrajectory({
  accounts,
  points,
  colors,
  height = 220,
}: {
  accounts: Account[];
  points: TrajectoryPoint[];
  /** account.id → swatch hex (precomputed server-side) */
  colors: Record<string, string>;
  height?: number;
}) {
  const w = 720;
  const h = height;
  const pad = { l: 44, r: 16, t: 12, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  if (points.length === 0 || accounts.length === 0) {
    return (
      <div className="text-sm text-ink-mute py-8 text-center">
        Not enough data to draw a trajectory yet.
      </div>
    );
  }

  // Y range — all balances across all accounts, padded.
  let yMin = 0;
  let yMax = 0;
  for (const p of points) {
    for (const a of accounts) {
      const v = p.balances[a.id] ?? 0;
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
  }
  if (yMax === yMin) yMax = yMin + 1;
  const yPad = (yMax - yMin) * 0.08;
  yMin -= yPad;
  yMax += yPad;

  function x(i: number) {
    return pad.l + (i / Math.max(1, points.length - 1)) * innerW;
  }
  function y(v: number) {
    return pad.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  }

  const ticks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="xMinYMid meet"
      style={{ display: 'block' }}
      role="img"
      aria-label="Account balance trajectory"
    >
      {ticks.map((t, i) => {
        const py = y(t);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              y1={py}
              x2={w - pad.r}
              y2={py}
              stroke="var(--rule)"
              strokeWidth="0.5"
              strokeDasharray={i === ticks.length - 1 ? undefined : '2 3'}
            />
            <text
              x={pad.l - 8}
              y={py + 3}
              fontSize="9"
              fontFamily="var(--font-inter)"
              fill="var(--ink-mute)"
              textAnchor="end"
            >
              {compactEUR(t)}
            </text>
          </g>
        );
      })}

      {points.map((p, i) => (
        <text
          key={p.date}
          x={x(i)}
          y={h - 10}
          fontSize="9"
          fontFamily="var(--font-inter)"
          fill="var(--ink-mute)"
          textAnchor="middle"
          letterSpacing="1"
        >
          {p.label}
        </text>
      ))}

      {accounts.map((a) => {
        const color = colors[a.id] ?? 'var(--ink-mute)';
        const path = points
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balances[a.id] ?? 0).toFixed(1)}`)
          .join(' ');
        const last = points[points.length - 1];
        return (
          <g key={a.id}>
            <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
            {last ? (
              <circle
                cx={x(points.length - 1)}
                cy={y(last.balances[a.id] ?? 0)}
                r={2.5}
                fill={color}
              >
                <title>
                  {a.name} · {fmtEUR(last.balances[a.id] ?? 0)}
                </title>
              </circle>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function compactEUR(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}k`;
  return `${sign}€${Math.round(abs)}`;
}
