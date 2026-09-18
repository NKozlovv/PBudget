'use client';

import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { useChartHover } from '@/components/charts/useChartHover';
import { fmtEUR } from '@/lib/money';
import type { AccountShare } from './AccountsHero';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const p1 = polarToCartesian(cx, cy, r, startAngle);
  const p2 = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

/** Net-worth share pie, one slice per positive-balance account (sorted, same data as the account list). */
export function NetWorthPie({ shares }: { shares: AccountShare[] }) {
  const { containerRef, hover, show, hide } = useChartHover<AccountShare>();
  const cx = 60;
  const cy = 60;
  const r = 56;

  let cumulative = 0;
  const slices = shares.map((s) => {
    const startAngle = (cumulative / 100) * 360;
    cumulative += s.pct;
    const endAngle = (cumulative / 100) * 360;
    return { ...s, startAngle, endAngle };
  });

  return (
    <div ref={containerRef} className="relative mx-auto h-[120px] w-[120px] shrink-0">
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        {slices.length <= 1 ? (
          <circle cx={cx} cy={cy} r={r} fill={slices[0]?.color ?? 'var(--ink-mute)'} />
        ) : (
          slices.map((s) => (
            <path
              key={s.id}
              d={slicePath(cx, cy, r, s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="rgba(255,255,255,.75)"
              strokeWidth={1.5}
              className="cursor-default transition-opacity duration-150 hover:opacity-80"
              onMouseEnter={(e) => show(e, s)}
              onMouseMove={(e) => show(e, s)}
              onMouseLeave={hide}
            />
          ))
        )}
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
