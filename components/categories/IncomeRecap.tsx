import { Icon, Mono } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIcon } from '@/lib/dashboard/categoryIcon';
import { fmtEUR } from '@/lib/money';
import type { CategorySummary } from '@/lib/categories/summary';

/**
 * Compact income recap below the main expense table. The ref doesn't show
 * income at all (Option B), but our schema tracks it — surface it in a
 * stripped row list (no progress bars, since "over budget" doesn't apply
 * to income; tone flips pos for above-average months).
 */
export function IncomeRecap({ summaries }: { summaries: CategorySummary[] }) {
  const total = summaries.reduce((s, x) => s + x.thisMonth, 0);
  const totalAvg = summaries.reduce((s, x) => s + x.avgMonthly, 0);
  const pctVsAvg = totalAvg > 0 ? (total / totalAvg - 1) * 100 : 0;

  if (summaries.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <Mono>Income</Mono>
          <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums tracking-tight text-pos">
            {fmtEUR(total, { decimals: 0 })}
          </div>
        </div>
        {totalAvg > 0 ? (
          <div className="text-[12px] text-ink-soft">
            {pctVsAvg >= 0 ? '+' : ''}
            <span
              className={pctVsAvg > 0 ? 'font-semibold text-pos' : pctVsAvg < 0 ? 'font-semibold text-neg' : 'text-ink-mute'}
            >
              {pctVsAvg.toFixed(1)}%
            </span>{' '}
            vs YTD avg of {fmtEUR(totalAvg, { decimals: 0 })}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
        {summaries.map((s, i) => {
          const color = categoryColor(s.category.name);
          const icon = categoryIcon(s.category.name);
          return (
            <div
              key={s.category.id}
              className={
                'flex items-center gap-4 px-5 py-3 ' +
                (i < summaries.length - 1 ? 'border-b border-rule/60' : '')
              }
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ background: `${color}1F` }}
              >
                <Icon name={icon} size={16} color={color} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">
                  {s.category.name}
                </div>
                <div className="text-[11px] text-ink-mute">
                  {s.txCountThisMonth} {s.txCountThisMonth === 1 ? 'entry' : 'entries'} this month
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                  {fmtEUR(s.thisMonth, { decimals: 0 })}
                </div>
                <div className="font-mono text-[10px] tabular-nums text-ink-mute">
                  YTD avg {fmtEUR(s.avgMonthly, { decimals: 0 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
