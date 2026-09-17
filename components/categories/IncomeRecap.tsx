import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { CategorySummary } from '@/lib/categories/summary';

/**
 * Compact income recap below the expense table. The design doesn't show
 * income at all — this app's schema tracks it, so it stays as a simple
 * restyled list (no accordion/progress-bar semantics, since "over pace"
 * doesn't apply to income).
 */
export function IncomeRecap({
  summaries,
  onEdit,
}: {
  summaries: CategorySummary[];
  onEdit: (categoryId: string) => void;
}) {
  const total = summaries.reduce((s, x) => s + x.thisMonth, 0);
  const totalAvg = summaries.reduce((s, x) => s + x.avgMonthly, 0);

  if (summaries.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <span className="text-[15px] font-bold text-ink">Income</span>
        <span className="text-[12.5px] font-semibold text-ink-mute">
          {fmtEUR(total, { decimals: 0 })}
          {totalAvg > 0 ? ` · YTD avg ${fmtEUR(totalAvg, { decimals: 0 })}` : ''}
        </span>
      </div>

      <div className="glass !rounded-[26px] p-[10px]">
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
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[12px] text-[13px] font-extrabold text-white transition-transform hover:scale-105"
                style={{ background: color }}
              >
                {s.category.name.charAt(0).toUpperCase()}
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
      </div>
    </section>
  );
}
