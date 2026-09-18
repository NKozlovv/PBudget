'use client';

import { Icon } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CategorySummary, SubcategorySummary } from '@/lib/categories/summary';

function paceColor(pctOfAvg: number): string {
  if (pctOfAvg > 115) return '#d94a6f';
  if (pctOfAvg > 102) return '#d98b1f';
  return '#12a08c';
}

/**
 * Category row + its accordion panel — design_handoff_theus_rehaul README
 * "Categories". The whole row is the disclosure trigger (opens the
 * subcategory breakdown in place); the hue tile is a separate click
 * target that opens the rename/delete/subcategory-CRUD modal (a pencil
 * icon fades in on hover so that's discoverable), since the mockup's
 * 5-column row has no room for a dedicated edit affordance and that
 * management flow can't just disappear. The accordion also repeats that
 * entry point as an explicit "+ Add or remove subcategories" link, since
 * it's the one place users look for subcategory management.
 */
export function CategoryRow({
  summary,
  open,
  onToggle,
  onEdit,
  subcategories,
}: {
  summary: CategorySummary;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  subcategories: SubcategorySummary[];
}) {
  const { category, thisMonth, avgMonthly } = summary;
  const color = categoryColor(category.name);
  const pctOfAvg = avgMonthly > 0 ? (thisMonth / avgMonthly) * 100 : 0;
  const meterPct = Math.min(100, (avgMonthly > 0 ? thisMonth / avgMonthly : 0) * 66);
  const tone = paceColor(pctOfAvg);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onToggle();
        }}
        className="grid cursor-pointer grid-cols-[minmax(150px,1.1fr)_minmax(0,1.6fr)_110px_100px_34px] items-center gap-4 rounded-[18px] px-[18px] py-[14px] transition-colors duration-[160ms] hover:bg-white/[0.85]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${category.name}`}
            title={`Edit ${category.name}`}
            className="group/edit relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[12px] text-[13px] font-extrabold text-white transition-transform hover:scale-105"
            style={{ background: color }}
          >
            {category.name.charAt(0).toUpperCase()}
            <span className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/40 opacity-0 transition-opacity group-hover/edit:opacity-100">
              <Icon name="pencil" size={14} />
            </span>
          </button>
          <span className="truncate text-[14.5px] font-semibold text-ink">{category.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-[10px] flex-1 rounded-full bg-white/80">
            <div
              className="meter h-full rounded-full"
              style={{ width: `${meterPct}%`, background: color }}
            />
            <span
              aria-hidden
              className="absolute -bottom-[5px] -top-[5px] w-[2px] rounded-full bg-[rgba(21,26,45,.35)]"
              style={{ left: '66%' }}
            />
          </div>
          <span className="w-[46px] shrink-0 text-right text-[12px] font-extrabold tabular-nums" style={{ color: tone }}>
            {Math.round(pctOfAvg)}%
          </span>
        </div>

        <div className="text-[15.5px] font-extrabold tabular-nums text-ink">
          {fmtEUR(thisMonth, { decimals: 0 })}
        </div>

        <div className="text-[13.5px] font-semibold text-ink-mute">{fmtEUR(avgMonthly, { decimals: 0 })}</div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={open ? 'Collapse' : 'Expand'}
          aria-expanded={open}
          className="flex h-[30px] w-[30px] items-center justify-center justify-self-end rounded-full bg-white/80 text-ink-soft transition-colors hover:bg-white"
        >
          <Icon
            name="chevron-down"
            size={15}
            strokeWidth={1.8}
            className={cn('transition-transform duration-200 ease-theus', open && 'rotate-180')}
          />
        </button>
      </div>

      {open ? (
        <div className="rise ml-[62px] mr-[10px] mb-[10px] mt-0.5 rounded-[16px] bg-white/50 px-4 py-2.5" style={{ animationDuration: '240ms' }}>
          {subcategories.length === 0 ? (
            <div className="py-2 text-[12.5px] text-ink-mute">No subcategories yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_90px_90px] gap-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
                <span />
                <span>Pace vs avg</span>
                <span>This month</span>
                <span>YTD avg / mo</span>
              </div>
              {subcategories.map((s) => {
                const subPctOfAvg = s.avgMonthly > 0 ? (s.thisMonth / s.avgMonthly) * 100 : 0;
                const subMeterPct = Math.min(100, (s.avgMonthly > 0 ? s.thisMonth / s.avgMonthly : 0) * 66);
                const subTone = paceColor(subPctOfAvg);
                return (
                  <div
                    key={s.subcategory.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_90px_90px] items-center gap-4 py-[7px] text-[13.5px]"
                  >
                    <span className="truncate font-semibold text-ink-soft">{s.subcategory.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="relative h-[6px] flex-1 rounded-full bg-white/80">
                        <div
                          className="meter h-full rounded-full"
                          style={{ width: `${subMeterPct}%`, background: color }}
                        />
                      </div>
                      <span className="w-[36px] shrink-0 text-right text-[11px] font-extrabold tabular-nums" style={{ color: subTone }}>
                        {Math.round(subPctOfAvg)}%
                      </span>
                    </div>
                    <span className="font-bold tabular-nums text-ink">{fmtEUR(s.thisMonth, { decimals: 0 })}</span>
                    <span className="font-semibold text-ink-mute">{fmtEUR(s.avgMonthly, { decimals: 0 })}</span>
                  </div>
                );
              })}
            </>
          )}
          <div className="mt-1 border-t border-white/60 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-[12px] font-semibold text-indigo-dark hover:underline"
            >
              + Add or remove subcategories
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
