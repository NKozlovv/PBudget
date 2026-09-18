import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { BurnRateRow } from '@/lib/balance';

/** Detailed per-category burn-rate table — Theus Forecast design handoff. */
export function BurnRateTable({
  title,
  subtitle,
  head,
  rows,
  monthsElapsed,
  emptyMessage = 'No data this year yet.',
  totalsTone,
}: {
  title: string;
  subtitle?: string;
  head: string;
  rows: BurnRateRow[];
  monthsElapsed: number;
  emptyMessage?: string;
  totalsTone: 'pos' | 'neg';
}) {
  const toneColor = totalsTone === 'pos' ? 'var(--in)' : 'var(--out)';

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <h2 className="text-[20px] font-extrabold -tracking-[0.025em] text-ink">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-[13.5px] font-medium text-ink-soft">{subtitle}</p> : null}
      </div>

      {rows.length === 0 ? (
        <div className="glass !rounded-[26px] px-6 py-10 text-center text-[13px] text-ink-mute">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse">
            <thead>
              <tr>
                <Th align="left">{head}</Th>
                <Th>Avg / mo</Th>
                <Th>This month</Th>
                <Th>Year at this pace</Th>
                <Th align="right" last>
                  Active
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const partial = r.monthsActive < monthsElapsed;
                return (
                  <tr key={r.name} className="transition-colors duration-150 hover:bg-white/[0.55]">
                    <td className="whitespace-nowrap border-b border-[rgba(31,39,66,.06)] py-[11px] pr-3 text-[13.5px] font-bold text-ink">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: categoryColor(r.name) }} />
                        {r.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-[rgba(31,39,66,.06)] px-3 py-[11px] text-right text-[13.5px] font-semibold tabular-nums text-ink-mute">
                      {fmtEUR(r.avgMonthly, { decimals: 0 })}
                    </td>
                    <td
                      className="whitespace-nowrap border-b border-[rgba(31,39,66,.06)] px-3 py-[11px] text-right text-[13.5px] font-extrabold tabular-nums"
                      style={{ color: r.thisMonth > 0 ? toneColor : 'var(--ink-mute)' }}
                    >
                      {r.thisMonth > 0 ? fmtEUR(r.thisMonth, { decimals: 0 }) : '—'}
                    </td>
                    <td className="whitespace-nowrap border-b border-[rgba(31,39,66,.06)] px-3 py-[11px] text-right text-[13.5px] font-semibold tabular-nums text-ink-mute">
                      {fmtEUR(r.projectedYearTotal, { decimals: 0 })}
                    </td>
                    <td className="whitespace-nowrap border-b border-[rgba(31,39,66,.06)] py-[11px] pl-3 text-right">
                      <span
                        className={`rounded-full px-[9px] py-[3px] text-[11px] font-bold tabular-nums ${
                          partial ? 'bg-amber/[0.2] text-[#a4670e]' : 'bg-[rgba(31,39,66,.07)] text-ink-soft'
                        }`}
                      >
                        {r.monthsActive} of {monthsElapsed}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = 'right',
  last,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  last?: boolean;
}) {
  return (
    <th
      className={`border-b border-[rgba(31,39,66,.12)] py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${last ? 'pl-3' : 'px-3'}`}
    >
      {children}
    </th>
  );
}
