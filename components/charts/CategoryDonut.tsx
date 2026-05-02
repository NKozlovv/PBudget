import type { CategorySlice } from '@/lib/balance';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';

/**
 * Stroke-dashed donut + side legend.
 * Modeled on design-refs/src/theus-dashboard.jsx 82–105 (DonutChart) +
 * the side-list block at 246–260.
 */
export function CategoryDonut({
  data,
  size = 160,
  strokeWidth = 22,
}: {
  data: CategorySlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
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
        aria-label="Spend by category"
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
        {data.map((d) => {
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
              stroke={categoryColor(d.name)}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>

      <ul className="flex-1 flex flex-col gap-2 min-w-0">
        {data.length === 0 ? (
          <li className="text-sm text-ink-mute">No expense data this month yet.</li>
        ) : (
          data.slice(0, 6).map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: categoryColor(d.name) }}
                />
                <span className="truncate text-[13px] text-ink">{d.name}</span>
              </span>
              <span className="font-sans text-[12px] tabular-nums text-ink-soft">
                {fmtEUR(d.value, { decimals: 0 })}
              </span>
            </li>
          ))
        )}
        {data.length > 6 ? (
          <li className="text-[11px] text-ink-mute pt-1">
            + {data.length - 6} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}
