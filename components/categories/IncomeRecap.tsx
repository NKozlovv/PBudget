import { Icon } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { CategorySummary } from '@/lib/categories/summary';

/**
 * Compact income recap below the expense table. The design doesn't show
 * income at all — this app's schema tracks it, so it stays as a simple
 * restyled list (no accordion/progress-bar semantics, since "over pace"
 * doesn't apply to income). "+ New income category" lives in this
 * section's own header, next to its title — mirroring how "+ New
 * category" sits at the top of the expense table via the page header —
 * rather than floating alone below both tables.
 */
export function IncomeRecap({
  summaries,
  onEdit,
  onAdd,
}: {
  summaries: CategorySummary[];
  onEdit: (categoryId: string) => void;
  onAdd: () => void;
}) {
  const total = summaries.reduce((s, x) => s + x.thisMonth, 0);
  const totalAvg = summaries.reduce((s, x) => s + x.avgMonthly, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[15px] font-bold text-ink">Income</span>
          {summaries.length > 0 ? (
            <span className="text-[12.5px] font-semibold text-ink-mute">
              {fmtEUR(total, { decimals: 0 })}
              {totalAvg > 0 ? ` · YTD avg ${fmtEUR(totalAvg, { decimals: 0 })}` : ''}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-[12.5px] font-semibold text-indigo-dark hover:underline"
        >
          + New income category
        </button>
      </div>

      <div className="glass !rounded-[26px] p-[10px]">
        {summaries.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink-mute">No income categories yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-[34px_minmax(0,1.6fr)_110px_100px] gap-4 px-[18px] pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              <span />
              <span>Category</span>
              <span>This month</span>
              <span>YTD avg / mo</span>
            </div>
            {summaries.map((s) => {
              const color = categoryColor(s.category.name);
              return (
                <div
                  key={s.category.id}
                  className="grid grid-cols-[34px_minmax(0,1.6fr)_110px_100px] items-center gap-4 rounded-[18px] px-[18px] py-[14px]"
                >
                  <button
                    type="button"
                    onClick={() => onEdit(s.category.id)}
                    aria-label={`Edit ${s.category.name}`}
                    title={`Edit ${s.category.name}`}
                    className="group/edit relative flex h-[34px] w-[34px] items-center justify-center rounded-[12px] text-[13px] font-extrabold text-white transition-transform hover:scale-105"
                    style={{ background: color }}
                  >
                    {s.category.name.charAt(0).toUpperCase()}
                    <span className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/40 opacity-0 transition-opacity group-hover/edit:opacity-100">
                      <Icon name="pencil" size={14} />
                    </span>
                  </button>
                  <span className="truncate text-[14.5px] font-semibold text-ink">{s.category.name}</span>
                  <span className="text-[15.5px] font-extrabold tabular-nums text-in">
                    {fmtEUR(s.thisMonth, { decimals: 0 })}
                  </span>
                  <span className="text-[13.5px] font-semibold text-ink-mute">
                    {fmtEUR(s.avgMonthly, { decimals: 0 })}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
