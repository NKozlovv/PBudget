import { Card, Mono, Num } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { BurnRateRow } from '@/lib/balance';

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
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-rule px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {subtitle ? <Mono size="xs" className="mt-0.5 block">{subtitle}</Mono> : null}
        </div>
        <div className="text-right">
          <Num size={18} weight={600} tone={totalsTone}>
            {fmtEUR(total, { decimals: 0 })}
          </Num>
          <Mono size="xs" className="block mt-0.5">
            projected EOY
          </Mono>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ink-mute">{emptyMessage}</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
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
                className="border-b border-rule/60 last:border-0 hover:bg-bg-panel/40 transition-colors"
              >
                <td className="px-4 py-3 align-middle">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: categoryColor(r.name) }}
                    />
                    <span className="text-[13px] text-ink">{r.name}</span>
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Num size={13} weight={500} tone="soft">
                    {fmtEUR(r.avgMonthly, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Num size={13} weight={500} tone={r.thisMonth > 0 ? totalsTone : 'mute'}>
                    {fmtEUR(r.thisMonth, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Num size={14} weight={600} tone={totalsTone}>
                    {fmtEUR(r.projectedYearTotal, { decimals: 0 })}
                  </Num>
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Num size={12} tone="mute">
                    {r.monthsActive}/{monthsElapsed}
                  </Num>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
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
      className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}
