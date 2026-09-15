'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/ui';
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

const TEXT_TONE_CLASS: Record<Tone, string> = {
  up: 'text-neg',
  down: 'text-pos',
  flat: 'text-ink-soft',
};

const TONE_ARROW: Record<Tone, IconName | null> = {
  up: 'arrow-up-right',
  down: 'arrow-down-right',
  flat: null,
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const offset = months.length - visibleCount;
  const visibleMonths = months.slice(offset);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-rule bg-bg-soft px-6 py-16 text-center text-sm text-ink-mute">
        No expense categories yet.
      </div>
    );
  }

  const collapsible = rows.filter((r) => r.subs.length > 0);
  const allCollapsed = collapsible.length > 0 && collapsible.every((r) => collapsed.has(r.category.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
          {rows.length} {rows.length === 1 ? 'category' : 'categories'} · {visibleMonths.length}{' '}
          {visibleMonths.length === 1 ? 'month' : 'months'}
        </span>
        {collapsible.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              setCollapsed(allCollapsed ? new Set() : new Set(collapsible.map((r) => r.category.id)))
            }
            className="text-[11px] text-ink-mute hover:text-accent hover:underline"
          >
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[180px] bg-bg px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                Category
              </th>
              {visibleMonths.map((m) => (
                <th
                  key={`${m.year}-${m.month}`}
                  className="sticky top-0 z-20 min-w-[84px] bg-bg px-3 py-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RowGroup
                key={row.category.id}
                row={row}
                offset={offset}
                visibleCount={visibleCount}
                collapsed={collapsed.has(row.category.id)}
                onToggle={() => toggle(row.category.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule px-5 py-3 text-[11px] text-ink-mute">
        <Legend tone="down" label="10%+ less than the prior month" />
        <Legend tone="flat" label="Within ±10%" />
        <Legend tone="up" label="10%+ more than the prior month" />
      </div>
    </div>
  );
}

function RowGroup({
  row,
  offset,
  visibleCount,
  collapsed,
  onToggle,
}: {
  row: CategoryTrendRow;
  offset: number;
  visibleCount: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const color = categoryColor(row.category.name);
  const hasSubs = row.subs.length > 0;

  return (
    <>
      <tr className="border-b border-rule/60 bg-bg-panel">
        <td className="sticky left-0 z-10 bg-bg-panel px-5 py-2.5">
          <span className="relative flex items-center gap-2 pl-2.5">
            <span
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            <button
              type="button"
              onClick={hasSubs ? onToggle : undefined}
              disabled={!hasSubs}
              aria-expanded={hasSubs ? !collapsed : undefined}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-default"
            >
              <span className="truncate font-semibold text-ink">{row.category.name}</span>
              {hasSubs ? (
                <Icon
                  name="chevron-down"
                  size={11}
                  className={cn(
                    'ml-auto shrink-0 text-ink-mute transition-transform',
                    collapsed && '-rotate-90',
                  )}
                />
              ) : null}
            </button>
          </span>
        </td>
        {Array.from({ length: visibleCount }, (_, j) => {
          const idx = offset + j;
          const curr = row.values[idx] ?? 0;
          const prev = row.values[idx - 1] ?? 0;
          return <ValueCell key={j} curr={curr} prev={prev} bold />;
        })}
      </tr>
      {!collapsed
        ? row.subs.map((sub) => (
            <tr key={sub.name} className="border-b border-rule/30">
              <td className="sticky left-0 z-10 bg-bg-soft px-5 py-2 pl-11 text-[12px] text-ink-mute">
                {sub.name}
              </td>
              {Array.from({ length: visibleCount }, (_, j) => {
                const idx = offset + j;
                const curr = sub.values[idx] ?? 0;
                const prev = sub.values[idx - 1] ?? 0;
                return <ValueCell key={j} curr={curr} prev={prev} small />;
              })}
            </tr>
          ))
        : null}
    </>
  );
}

function ValueCell({
  curr,
  prev,
  bold,
  small,
}: {
  curr: number;
  prev: number;
  bold?: boolean;
  small?: boolean;
}) {
  const tone = cellTone(curr, prev);
  const arrow = TONE_ARROW[tone];
  const isZero = Math.abs(curr) < 0.005;

  return (
    <td className={cn('px-3 text-right tabular-nums', small ? 'py-2' : 'py-2.5')}>
      {isZero ? (
        <span className="text-ink-mute/60">—</span>
      ) : (
        <span
          className={cn(
            'inline-flex items-center gap-0.5',
            TEXT_TONE_CLASS[tone],
            bold && 'font-semibold',
            small && 'text-[12px]',
          )}
        >
          {fmtEUR(curr, { decimals: 0 })}
          {arrow ? <Icon name={arrow} size={10} className="shrink-0" /> : null}
        </span>
      )}
    </td>
  );
}

function Legend({ tone, label }: { tone: Tone; label: string }) {
  const arrow = TONE_ARROW[tone];
  return (
    <span className={cn('flex items-center gap-1', TEXT_TONE_CLASS[tone])}>
      {arrow ? <Icon name={arrow} size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
