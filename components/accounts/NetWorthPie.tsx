'use client';

import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { useChartHover } from '@/components/charts/useChartHover';
import { fmtEUR } from '@/lib/money';
import type { AccountShare } from './AccountsHero';

const R = 42;
const STROKE = 24;
const C = 2 * Math.PI * R;

/** Net-worth share donut — one ring segment per (possibly grouped, see "Other") positive-balance share. */
export function NetWorthPie({ shares }: { shares: AccountShare[] }) {
  const { containerRef, hover, show, hide } = useChartHover<AccountShare>();

  let cumulative = 0; // percent
  const segments = shares.map((s) => {
    const dash = (s.pct / 100) * C;
    const offset = -((cumulative / 100) * C);
    cumulative += s.pct;
    return { ...s, dash, offset };
  });

  return (
    <div ref={containerRef} className="relative mx-auto h-[120px] w-[120px] shrink-0">
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx={60} cy={60} r={R} fill="none" stroke="#eef0f6" strokeWidth={STROKE} />
        <g transform="rotate(-90 60 60)">
          {segments.map((s) => (
            <circle
              key={s.id}
              cx={60}
              cy={60}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset}
              className="cursor-default transition-opacity duration-150 hover:opacity-80"
              onMouseEnter={(e) => show(e, s)}
              onMouseMove={(e) => show(e, s)}
              onMouseLeave={hide}
            />
          ))}
        </g>
      </svg>
      {hover ? (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
          <span className="font-semibold text-ink">{hover.data.name}</span>
          <br />
          <span style={{ color: hover.data.color }}>{fmtEUR(hover.data.eur, { decimals: 0 })}</span>
          <span className="mx-1 text-ink-mute">·</span>
          {Math.round(hover.data.pct)}%
        </ChartTooltip>
      ) : null}
    </div>
  );
}
