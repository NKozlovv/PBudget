import { fmtEUR } from '@/lib/money';
import { categoryColor } from '@/lib/categoryColor';
import { cn } from '@/lib/utils';
import type { CategoryTrendRow, TrendMonth } from '@/lib/categories/monthlyTrend';

type Tone = 'up' | 'down' | 'flat';

/**
 * Month-over-month tone for one cell: 'up' = spent ≥10% more than the
 * prior month (worse → red), 'down' = spent ≥10% less (better → green),
 * 'flat' = within the ±10% no-change band. A prior value of zero counts
 * as 'up' the moment spend appears (nothing to compare a % change to).
 */
function cellTone(curr: number, prev: number): Tone {
  if (Math.abs(prev) < 0.005 && Math.abs(curr) < 0.005) return 'flat';
  if (Math.abs(prev) < 0.005) return 'up';
  const pct = (curr - prev) / Math.abs(prev);
  if (pct > 0.1) return 'up';
  if (pct < -0.1) return 'down';
  return 'flat';
}

const CELL_TONE_CLASS: Record<Tone, string> = {
  up: 'text-neg bg-neg-soft',
  down: 'text-pos bg-pos-soft',
  flat: 'text-ink-soft',
};

const SWATCH_TONE_CLASS: Record<Tone, string> = {
  up: 'bg-neg-soft border border-neg/40',
  down: 'bg-pos-soft border border-pos/40',
  flat: 'bg-bg-panel border border-rule',
};

export function TrendTable({
  rows,
  months,
  visibleCount,
}: {
  rows: CategoryTrendRow[];
  /** Includes one leading month used only as the first visible column's delta baseline. */
  months: TrendMonth[];
  visibleCount: number;
}) {
  const offset = months.length - visibleCount;
  const visibleMonths = months.slice(offset);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-rule bg-bg-soft px-6 py-16 text-center text-sm text-ink-mute">
        No expense categories yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-rule bg-bg">
              <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                Category
              </th>
              {visibleMonths.map((m) => (
                <th
                  key={`${m.year}-${m.month}`}
                  className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RowGroup key={row.category.id} row={row} offset={offset} visibleCount={visibleCount} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-rule px-5 py-3 text-[11px] text-ink-mute">
        <Legend tone="down" label="Spent 10%+ less than the prior month" />
        <Legend tone="flat" label="Within ±10%" />
        <Legend tone="up" label="Spent 10%+ more than the prior month" />
      </div>
    </div>
  );
}

function RowGroup({
  row,
  offset,
  visibleCount,
}: {
  row: CategoryTrendRow;
  offset: number;
  visibleCount: number;
}) {
  const color = categoryColor(row.category.name);
  return (
    <>
      <tr className="border-b border-rule/60 bg-bg/40">
        <td className="px-5 py-2.5">
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ background: color }}
              aria-hidden
            />
            <span className="font-medium text-ink">{row.category.name}</span>
          </span>
        </td>
        {Array.from({ length: visibleCount }, (_, j) => {
          const idx = offset + j;
          const curr = row.values[idx] ?? 0;
          const prev = row.values[idx - 1] ?? 0;
          return (
            <ValueCell key={j} curr={curr} prev={prev} className="font-semibold" />
          );
        })}
      </tr>
      {row.subs.map((sub) => (
        <tr key={sub.name} className="border-b border-rule/40">
          <td className="px-5 py-2 pl-9 text-[12px] text-ink-mute">{sub.name}</td>
          {Array.from({ length: visibleCount }, (_, j) => {
            const idx = offset + j;
            const curr = sub.values[idx] ?? 0;
            const prev = sub.values[idx - 1] ?? 0;
            return <ValueCell key={j} curr={curr} prev={prev} className="text-[12px]" small />;
          })}
        </tr>
      ))}
    </>
  );
}

function ValueCell({
  curr,
  prev,
  className,
  small,
}: {
  curr: number;
  prev: number;
  className?: string;
  small?: boolean;
}) {
  const tone = cellTone(curr, prev);
  return (
    <td
      className={cn(
        'px-3 text-right tabular-nums',
        small ? 'py-2' : 'py-2.5',
        CELL_TONE_CLASS[tone],
        className,
      )}
    >
      {Math.abs(curr) < 0.005 ? '—' : fmtEUR(curr, { decimals: 0 })}
    </td>
  );
}

function Legend({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-sm', SWATCH_TONE_CLASS[tone])} />
      {label}
    </span>
  );
}
