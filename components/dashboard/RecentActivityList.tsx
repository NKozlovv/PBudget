import Link from 'next/link';
import { Card, Icon, Mono } from '@/components/ui';
import type { Transaction } from '@/lib/supabase/types';
import type { Account } from '@/lib/supabase/types';
import { dateToISO, monthName, dayOfDate, monthOfDate, yearOfDate } from '@/lib/date';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIcon } from '@/lib/dashboard/categoryIcon';

/**
 * Recent activity list. Modeled on design-refs/src/dashboard.jsx 269-296:
 * day-grouped (`Today` / `Yesterday` / `27 Apr`) rows with a colored
 * icon tile, merchant + `category · account` subline, and signed amount.
 * Pos color for inflows, ink for outflows (neg color reserved for "alarming").
 */
export function RecentActivityList({
  transactions,
  accounts,
  now,
}: {
  transactions: Transaction[];
  accounts: Account[];
  now: Date;
}) {
  const accById = new Map(accounts.map((a) => [a.id, a]));
  const today = dateToISO(now);
  const yesterday = dateToISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Recent activity</h2>
        <Link href="/transactions" className="text-[11px] text-accent hover:underline">
          All transactions →
        </Link>
      </div>

      <div className="mt-2">
        {transactions.length === 0 ? (
          <p className="py-6 text-sm text-ink-mute">No transactions yet.</p>
        ) : (
          transactions.map((tx, i) => {
            const dayLabel = dayLabelFor(tx.date, today, yesterday);
            const showDay = i === 0 || dayLabelFor(transactions[i - 1]!.date, today, yesterday) !== dayLabel;
            const acc = tx.account_id ? accById.get(tx.account_id) : undefined;
            const catName = (tx.category ?? '').trim() || '—';
            const color = categoryColor(catName);
            const icon = categoryIcon(catName);
            const isInflow = tx.type === 'income';
            const symbol = tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : '';
            const signChar = isInflow ? '+' : '−';

            return (
              <div key={tx.id}>
                {showDay ? (
                  <Mono size="xs" className="block pt-3 pb-1.5 tracking-[0.14em]">
                    {dayLabel}
                  </Mono>
                ) : null}
                <div className="flex items-center gap-3 border-b border-rule py-2.5 last:border-0">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `${color}1F` }}
                  >
                    <Icon name={icon} size={16} color={color} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">
                      {tx.comment?.trim() || catName}
                    </div>
                    <div className="truncate text-[11px] text-ink-mute">
                      {catName}
                      {acc ? ` · ${acc.name}` : ''}
                    </div>
                  </div>
                  <div
                    className={`font-mono text-[13px] font-semibold tabular-nums ${
                      isInflow ? 'text-pos' : 'text-ink'
                    }`}
                  >
                    {signChar}
                    {symbol}
                    {Math.abs(tx.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {symbol === '' ? ` ${tx.currency}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function dayLabelFor(isoDate: string, today: string, yesterday: string): string {
  if (isoDate === today) return 'Today';
  if (isoDate === yesterday) return 'Yesterday';
  return `${dayOfDate(isoDate)} ${monthName(monthOfDate(isoDate), true)}${
    yearOfDate(isoDate) !== yearOfDate(today) ? ` ${yearOfDate(isoDate)}` : ''
  }`;
}

