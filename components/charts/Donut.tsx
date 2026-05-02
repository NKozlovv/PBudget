import { fmtEUR } from '@/lib/money';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

/**
 * Generic stroke-dashed donut + side legend.
 * Modeled on design-refs/src/theus-dashboard.jsx 82–105.
 */
export function Donut({
  data,
  size = 160,
  strokeWidth = 22,
  emptyMessage = 'No data.',
  topN = 6,
  formatValue = (n: number) => fmtEUR(n, { decimals: 0 }),
}: {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  emptyMessage?: string;
  topN?: number;
  formatValue?: (n: number) => string;
}) {
  const positive = data.filter((d) => d.value > 0);
  const total = positive.reduce((s, d) => s + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  let off = 0;
  return (
    <div className="flex items-center gap-5">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Distribution"
        style={{ flexShrink: 0 }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={strokeWidth}
        />
        {positive.map((d) => {
          const len = total > 0 ? (d.value / total) * c : 0;
          const dash = `${len} ${c - len}`;
          const dashOffset = -off;
          off += len;
          return (
            <circle
              key={d.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>

      <ul className="flex-1 flex flex-col gap-2 min-w-0">
        {positive.length === 0 ? (
          <li className="text-sm text-ink-mute">{emptyMessage}</li>
        ) : (
          positive.slice(0, topN).map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: d.color }}
                />
                <span className="truncate text-[13px] text-ink">{d.name}</span>
              </span>
              <span className="font-sans text-[12px] tabular-nums text-ink-soft">
                {formatValue(d.value)}
              </span>
            </li>
          ))
        )}
        {positive.length > topN ? (
          <li className="text-[11px] text-ink-mute pt-1">+ {positive.length - topN} more</li>
        ) : null}
      </ul>
    </div>
  );
}
