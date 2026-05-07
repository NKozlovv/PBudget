import { Mono, Num } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { BurnRateRow } from '@/lib/balance';

/**
 * Detailed per-category burn-rate table. Sterling chrome:
 * `bg-bg-soft` rounded card with mono kicker labels.
 */
export function BurnRateTable({
  title,
  subtitle,
  rows,
  monthsElapsed,
  emptyMessage = 'No data this year yet.',
  totalsTone,
}: {
  title: string;
  subtitle?: string;
  rows: BurnRateRow[];
  monthsElapsed: number;
  emptyMessage?: string;
  totalsTone: 'pos' | 'neg';
}) {
  const total = rows.reduce((s, r) => s + r.projectedYearTotal, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
      <div className="flex items-baseline justify-between border-b border-rule px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle ? (
            <Mono size="xs" className="mt-1 block">
              {subtitle}
            </Mono>
          ) : null}
        </div>
        <div className="text-right">
          <Num size={18} weight={600} tone={totalsTone}>
            {fmtEUR(total, { decimals: 0 })}
          </Num>
          <Mono size="xs" className="mt-0.5 block">
            projected EOY
          </Mono>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-ink-mute">{emptyMessage}</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule bg-bg/50">
              <Th>Category</Th>
              <Th align="right" className="w-[120px]">
                Avg / mo
              </Th>
              <Th align="right" className="w-[110px]">
                This mo
              </Th>
              <Th align="right" className="w-[140px]">
                Projected EOY
              </Th>
              <Th align="right" className="w-[80px]">
                Active
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-b border-rule/60 last:border-0 transition-colors hover:bg-bg-panel/40"
              >
                <td className="px-5 py-3 align-middle">
                  <span className="inline-flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: categoryColor(r.name) }}
                    />
                    <span className="text-[13px] text-ink">{r.name}</span>
                  </span>
                </td>
                <td className="px-5 py-3 align-middle text-right">
                  <Num size={13} weight={500} tone="soft">
                    {fmtEUR(r.avgMonthly, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-5 py-3 align-middle text-right">
                  <Num size={13} weight={500} tone={r.thisMonth > 0 ? totalsTone : 'mute'}>
                    {fmtEUR(r.thisMonth, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-5 py-3 align-middle text-right">
                  <Num size={14} weight={600} tone={totalsTone}>
                    {fmtEUR(r.projectedYearTotal, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-5 py-3 align-middle text-right">
                  <Num size={12} tone="mute">
                    {r.monthsActive}/{monthsElapsed}
                  </Num>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Th({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}
