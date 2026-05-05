'use client';

import { Icon, Mono } from '@/components/ui';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIcon } from '@/lib/dashboard/categoryIcon';
import { fmtCurrency, fmtEUR, signedAmount, txToEUR } from '@/lib/money';
import { groupTransactionsByDate } from '@/lib/transactions/grouping';
import { cn } from '@/lib/utils';
import type { Account, Transaction } from '@/lib/supabase/types';

/**
 * Day-grouped transaction list (replaces the old <table>).
 *
 * Selection pattern: the leading icon tile doubles as the select target
 * (Gmail / Linear). Click anywhere else on the row → edit. The icon tile
 * shows a check overlay on hover or whenever any row is selected, so
 * multi-select is discoverable without checkboxes.
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
  const anySelected = selectedIds.size > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
      {groups.map((group, gi) => (
        <div key={group.date}>
          {/* Day header strip */}
          <div
            className={cn(
              'flex items-center justify-between bg-bg px-5 py-3',
              gi > 0 && 'border-t border-rule',
              'border-b border-rule',
            )}
          >
            <Mono size="sm">{group.label}</Mono>
            <span
              className={cn(
                'font-mono text-[12px] font-semibold tabular-nums',
                group.totalEUR > 0
                  ? 'text-pos'
                  : group.totalEUR < 0
                    ? 'text-ink-soft'
                    : 'text-ink-mute',
              )}
            >
              {group.totalEUR >= 0 ? '+' : '−'}
              {fmtEUR(Math.abs(group.totalEUR))}
            </span>
          </div>

          {/* Rows */}
          {group.items.map((tx, ri) => {
            const acc = tx.account_id ? accById.get(tx.account_id) : undefined;
            const catName = (tx.category ?? '').trim();
            const color = categoryColor(catName || '—');
            const icon = categoryIcon(catName);
            const isSelected = selectedIds.has(tx.id);

            const eur = txToEUR(tx, budgetFxRate);
            const signedEur = signedAmount({ type: tx.type, amount: eur });
            const isInflow = tx.type === 'income';
            const tone = isInflow ? 'pos' : tx.type === 'adjustment' ? 'soft' : 'ink';
            const showEurLine = tx.currency !== 'EUR';
            const symbol = tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : '';
            const sign = isInflow ? '+' : '−';

            return (
              <div
                key={tx.id}
                className={cn(
                  'group/tx relative grid items-center gap-4 border-b border-rule/60 px-5 py-3 transition-colors last:border-b-0',
                  'grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_140px]',
                  isSelected
                    ? 'bg-accent-soft'
                    : 'hover:bg-bg-panel/40',
                  ri === group.items.length - 1 && gi !== groups.length - 1 ? 'border-b-rule' : '',
                )}
              >
                {/* Selection accent strip on the very left */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-0 h-full w-[3px] transition-colors',
                    isSelected ? 'bg-accent' : 'bg-transparent',
                  )}
                />

                {/* Col 1: icon tile / select target */}
                <button
                  type="button"
                  aria-label={isSelected ? 'Deselect transaction' : 'Select transaction'}
                  aria-pressed={isSelected}
                  onClick={() => onToggleSelect(tx.id)}
                  className="relative h-9 w-9 shrink-0 rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  style={{ background: isSelected ? 'var(--accent)' : `${color}1F` }}
                >
                  {/* Idle icon (hidden when selected) */}
                  <span
                    className={cn(
                      'absolute inset-0 flex items-center justify-center transition-opacity',
                      isSelected
                        ? 'opacity-0'
                        : anySelected
                          ? 'opacity-100 group-hover/tx:opacity-0'
                          : 'opacity-100 group-hover/tx:opacity-0',
                    )}
                  >
                    <Icon name={icon} size={16} color={color} />
                  </span>
                  {/* Hover/selected check */}
                  <span
                    className={cn(
                      'absolute inset-0 flex items-center justify-center transition-opacity',
                      isSelected
                        ? 'opacity-100'
                        : anySelected
                          ? 'opacity-60 group-hover/tx:opacity-100'
                          : 'opacity-0 group-hover/tx:opacity-100',
                    )}
                  >
                    <Icon
                      name="check"
                      size={16}
                      color={isSelected ? 'var(--bg)' : color}
                    />
                  </span>
                </button>

                {/* Col 2: merchant + subcategory (click → edit) */}
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="flex min-w-0 flex-col items-start text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="truncate text-[13px] font-medium text-ink">
                    {tx.comment?.trim() || catName || 'Uncategorised'}
                  </span>
                  <span className="truncate text-[11px] text-ink-mute">
                    {tx.subcategory || (tx.comment ? catName : '—')}
                  </span>
                </button>

                {/* Col 3: category chip */}
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {catName ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: `${color}1A`, color }}
                    >
                      {catName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-mute">—</span>
                  )}
                </button>

                {/* Col 4: account */}
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="truncate text-left font-mono text-[12px] text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {acc ? `${acc.name}, ${symbol || acc.currency}` : '—'}
                </button>

                {/* Col 5: amount (native + EUR mute under for non-EUR) */}
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="flex flex-col items-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span
                    className={cn(
                      'font-mono text-[14px] font-semibold tabular-nums',
                      tone === 'pos' ? 'text-pos' : tone === 'soft' ? 'text-ink-soft' : 'text-ink',
                    )}
                  >
                    {sign}
                    {fmtCurrency(Math.abs(tx.amount), tx.currency)}
                  </span>
                  {showEurLine ? (
                    <span className="font-mono text-[10px] tabular-nums text-ink-mute">
                      ≈ {sign}
                      {fmtEUR(Math.abs(signedEur))}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
