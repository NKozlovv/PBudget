'use client';

import { categoryColor } from '@/lib/categoryColor';
import { fmtCurrency, fmtEUR, signedAmount, txToEUR } from '@/lib/money';
import { groupTransactionsByDate } from '@/lib/transactions/grouping';
import { isUncategorised } from '@/lib/transactions/constants';
import { cn } from '@/lib/utils';
import type { Account, Transaction } from '@/lib/supabase/types';

/**
 * Day-grouped transaction list — design_handoff_theus_rehaul README
 * "Transactions" list panel. Seven columns: checkbox, category-hue
 * avatar, name+note, category tag, subcategory (dot + text, its own
 * column so the hierarchy stays visually distinct from the tag), account,
 * amount. The whole row (not just one cell) opens the edit modal; the
 * checkbox alone toggles selection.
 */
export function DayGroupedList({
  transactions,
  accounts,
  budgetFxRate,
  selectedIds,
  onToggleSelect,
  onEdit,
  now,
}: {
  transactions: Transaction[];
  accounts: Account[];
  budgetFxRate: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  now: Date;
}) {
  const accById = new Map(accounts.map((a) => [a.id, a]));
  const groups = groupTransactionsByDate(transactions, budgetFxRate, now);

  return (
    <div className="glass !rounded-[26px] p-2">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center justify-between px-[18px] pb-[10px] pt-[14px]">
            <span className="text-[13px] font-bold text-ink-soft">{group.label}</span>
            <span className="text-[12.5px] font-bold tabular-nums text-ink-mute">
              {group.totalEUR >= 0 ? '+' : '−'}
              {fmtEUR(Math.abs(group.totalEUR))}
            </span>
          </div>

          {group.items.map((tx) => {
            const acc = tx.account_id ? accById.get(tx.account_id) : undefined;
            const catName = isUncategorised(tx.category) ? '' : (tx.category ?? '').trim();
            const isInflow = tx.type === 'income';
            const hue = categoryColor(catName || (isInflow ? 'Income' : ''));
            const avatarLabel = catName || (isInflow ? 'Income' : '');
            const initial = avatarLabel ? avatarLabel.charAt(0).toUpperCase() : '—';
            const isSelected = selectedIds.has(tx.id);
            const amountColor = isInflow ? 'var(--in)' : 'var(--ink)';
            const showEurLine = tx.currency !== 'EUR';
            const signedEur = signedAmount({ type: tx.type, amount: txToEUR(tx, budgetFxRate) });

            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                onClick={() => onEdit(tx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEdit(tx);
                }}
                className={cn(
                  'grid cursor-pointer items-center gap-3 rounded-[18px] px-[18px] py-[14px] transition-[background,transform] duration-[160ms]',
                  'grid-cols-[22px_40px_minmax(130px,1.5fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,.85fr)_auto]',
                  isSelected ? 'bg-white/[0.85]' : 'hover:translate-x-[6px] hover:bg-white/[0.85]',
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={isSelected ? 'Deselect transaction' : 'Select transaction'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(tx.id);
                  }}
                  className="group/check -m-[9px] flex shrink-0 items-center justify-center p-[9px]"
                >
                  <span
                    className={cn(
                      'flex h-[16px] w-[16px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors',
                      isSelected
                        ? 'border-indigo bg-indigo'
                        : 'border-[#c2c8d8] group-hover/check:border-indigo group-hover/check:bg-indigo/[0.16]',
                    )}
                  >
                    {isSelected ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : null}
                  </span>
                </button>

                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-[14px] font-bold text-white"
                  style={{ background: hue }}
                >
                  {initial}
                </span>

                <span className="flex min-w-0 flex-col items-start">
                  <span className="w-full truncate text-[14.5px] font-semibold text-ink">
                    {tx.comment?.trim() || catName || 'No description'}
                  </span>
                  <span className="w-full truncate text-[12px] font-medium text-ink-mute">
                    {tx.comment?.trim() && catName ? catName : ' '}
                  </span>
                </span>

                <span className="min-w-0">
                  {catName ? (
                    <span
                      className="inline-block truncate rounded-full px-[11px] py-[5px] text-[11.5px] font-bold"
                      style={{ background: `${hue}29`, color: hue }}
                    >
                      {catName}
                    </span>
                  ) : (
                    <span className="text-[11.5px] text-ink-mute">—</span>
                  )}
                </span>

                <span className="flex min-w-0 items-center gap-[6px]">
                  {tx.subcategory ? (
                    <>
                      <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: hue }} />
                      <span className="truncate text-[12.5px] font-semibold text-ink-soft">{tx.subcategory}</span>
                    </>
                  ) : (
                    <span className="text-[12.5px] text-ink-mute">—</span>
                  )}
                </span>

                <span className="truncate text-[12.5px] font-semibold text-ink-mute">{acc ? acc.name : '—'}</span>

                <span className="flex min-w-[110px] flex-col items-end">
                  <span className="text-[15.5px] font-extrabold tabular-nums" style={{ color: amountColor }}>
                    {isInflow ? '+' : '−'}
                    {fmtCurrency(Math.abs(tx.amount), tx.currency)}
                  </span>
                  {showEurLine ? (
                    <span className="text-[11px] font-semibold tabular-nums text-ink-mute">
                      ≈ {fmtEUR(signedEur)}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
