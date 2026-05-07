'use client';

import { Icon, Mono } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIcon } from '@/lib/dashboard/categoryIcon';
import { fmtEUR } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/lib/categories/summary';

/**
 * Single category row, 6-col grid matching design-refs/src/categories.jsx
 * lines 67-94. Click anywhere → opens the drill-down modal.
 *
 * Columns: icon-tile / name+sub-meta / this-month vs avg / progress bar /
 * avg-per-month / chevron-right.
 */
export function CategoryRow({
  summary,
  onClick,
  isLast,
}: {
  summary: CategorySummary;
  onClick: () => void;
  isLast: boolean;
}) {
  const { category, thisMonth, avgMonthly, subCount, txCountThisMonth, over, pctVsAvg } = summary;
  const color = categoryColor(category.name);
  const icon = categoryIcon(category.name);
  const pct = avgMonthly > 0 ? (thisMonth / avgMonthly) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/cat grid w-full grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_110px_28px] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-bg-panel/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        !isLast && 'border-b border-rule/60',
      )}
    >
      {/* Col 1: icon tile */}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ background: `${color}1F` }}
      >
        <Icon name={icon} size={16} color={color} />
      </span>

      {/* Col 2: name + sub-meta */}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-medium text-ink">{category.name}</div>
        <div className="truncate text-[11px] text-ink-mute">
          {subCount} {subCount === 1 ? 'subcategory' : 'subcategories'} · {txCountThisMonth} this month
        </div>
      </div>

      {/* Col 3: this-month / avg with % used */}
      <div className="min-w-0">
        <div className="font-mono text-[13px] font-semibold tabular-nums">
          <span className={over ? 'text-neg' : 'text-ink'}>{fmtEUR(thisMonth, { decimals: 0 })}</span>
          <span className="font-normal text-ink-mute">
            {' '}/ {fmtEUR(avgMonthly, { decimals: 0 })}
          </span>
        </div>
        <div className="mt-0.5 font-mono text-[10px] tabular-nums text-ink-mute">
          {avgMonthly > 0 ? (
            <>
              {pct.toFixed(0)}% of avg{' '}
              <span className={pctVsAvg > 0 ? 'text-neg' : pctVsAvg < 0 ? 'text-pos' : 'text-ink-mute'}>
                ({pctVsAvg >= 0 ? '+' : ''}
                {pctVsAvg.toFixed(0)}%)
              </span>
            </>
          ) : (
            <Mono size="xs">no history</Mono>
          )}
        </div>
      </div>

      {/* Col 4: progress bar */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-rule">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: over ? 'var(--neg)' : color,
          }}
        />
        {pct > 100 ? (
          <span
            aria-hidden
            className="absolute inset-y-[-1px] right-0 w-[2px] bg-neg"
          />
        ) : null}
      </div>

      {/* Col 5: avg / month */}
      <div className="text-right font-mono text-[12px] tabular-nums text-ink-soft">
        {fmtEUR(avgMonthly, { decimals: 0 })}
      </div>

      {/* Col 6: chevron */}
      <span className="flex justify-end text-ink-mute transition-colors group-hover/cat:text-ink">
        <Icon name="chevron-right" size={16} />
      </span>
    </button>
  );
}
