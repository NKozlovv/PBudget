'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Mono, Num, Pill } from '@/components/ui';
import {
  bulkDeleteTransactionsAction,
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
  type TxInput,
} from '@/app/actions/transactions';
import { TransactionForm } from './TransactionForm';
import { SortableHeader } from './SortableHeader';
import { EditableCell, type SaveResult } from './EditableCell';
import { BulkActionBar } from './BulkActionBar';
import { fmtCurrency, fmtEUR, signedAmount, txToEUR } from '@/lib/money';
import { dateDisplay } from '@/lib/date';
import { categoryColor } from '@/lib/categoryColor';
import type { Account, Category, Transaction, TxType } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'delete'; tx: Transaction }
  | { kind: 'bulkDelete' };

const TYPE_OPTIONS: { value: TxType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'adjustment', label: 'Adjustment' },
];

export function TransactionsTable({
  transactions,
  accounts,
  expenseCats,
  incomeCats,
  budgetId,
  budgetFxRate,
}: {
  transactions: Transaction[];
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  budgetId: string;
  budgetFxRate: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);

  const selectedNetEUR = useMemo(() => {
    let total = 0;
    for (const t of transactions) {
      if (!selectedIds.has(t.id)) continue;
      total += signedAmount({ type: t.type, amount: txToEUR(t, budgetFxRate) });
    }
    return total;
  }, [transactions, selectedIds, budgetFxRate]);

  const allOnPageSelected =
    transactions.length > 0 && transactions.every((t) => selectedIds.has(t.id));
  const someOnPageSelected = transactions.some((t) => selectedIds.has(t.id));

  function toggleAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const t of transactions) next.delete(t.id);
      } else {
        for (const t of transactions) next.add(t.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(input: TxInput) {
    const res = await createTransactionAction(input);
    if (res.ok) {
      setMode({ kind: 'idle' });
      router.refresh();
    }
    return res;
  }

  async function handleDelete(id: string) {
    const res = await deleteTransactionAction(id);
    if (res.ok) {
      setMode({ kind: 'idle' });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    }
  }

  async function handleBulkDelete() {
    setBulkPending(true);
    const res = await bulkDeleteTransactionsAction([...selectedIds]);
    setBulkPending(false);
    if (res.ok) {
      setMode({ kind: 'idle' });
      setSelectedIds(new Set());
      router.refresh();
    }
  }

  function makeSaver<K extends keyof TxInput>(id: string, field: K) {
    return async (next: string): Promise<SaveResult> => {
      // Coerce to the right shape for the action.
      let value: unknown = next;
      if (field === 'amount') value = Number(next);
      if (next === '' && (field === 'category' || field === 'comment')) value = null;
      const patch = { [field]: value } as Partial<Omit<TxInput, 'budget_id'>>;
      const res = await updateTransactionAction(id, patch);
      if (res.ok) {
        router.refresh();
        return { ok: true };
      }
      return { ok: false, error: res.error };
    };
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setMode({ kind: 'add' })}>+ Add transaction</Button>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-rule bg-bg-soft px-6 py-12 text-center text-sm text-ink-mute">
          No transactions match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <th className="w-[44px] px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 rounded border-rule accent-accent"
                  />
                </th>
                <SortableHeader field="date" className="w-[120px]">
                  Date
                </SortableHeader>
                <SortableHeader field="comment">Description</SortableHeader>
                <SortableHeader field="category">Category</SortableHeader>
                <SortableHeader field="type" className="w-[120px]">
                  Type
                </SortableHeader>
                <Th className="w-[140px]">Account</Th>
                <SortableHeader field="amount" align="right" className="w-[130px]">
                  Amount
                </SortableHeader>
                <Th align="right" className="w-[120px]">
                  EUR
                </Th>
                <Th className="w-[80px]" align="right">
                  {''}
                </Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const account = accounts.find((a) => a.id === t.account_id);
                const eur = txToEUR(t, budgetFxRate);
                const signed = signedAmount({ type: t.type, amount: eur });
                const tone = signed > 0 ? 'pos' : signed < 0 ? 'neg' : 'mute';
                const cats = t.type === 'income' ? incomeCats : expenseCats;
                const isSelected = selectedIds.has(t.id);
                return (
                  <tr
                    key={t.id}
                    className={`border-b border-rule/60 last:border-0 transition-colors ${
                      isSelected ? 'bg-accent-soft/40' : 'hover:bg-bg-panel/40'
                    }`}
                  >
                    <td className="px-4 py-2 align-middle">
                      <input
                        type="checkbox"
                        aria-label="Select transaction"
                        checked={isSelected}
                        onChange={() => toggleOne(t.id)}
                        className="h-4 w-4 rounded border-rule accent-accent"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <EditableCell
                        value={t.date}
                        variant={{ kind: 'date' }}
                        onSave={makeSaver(t.id, 'date')}
                        display={
                          <Num size={12} tone="mute">
                            {dateDisplay(t.date).toUpperCase()}
                          </Num>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <EditableCell
                        value={t.comment ?? ''}
                        variant={{ kind: 'text', placeholder: 'Description…' }}
                        onSave={makeSaver(t.id, 'comment')}
                        display={
                          <span className={t.comment ? 'text-ink' : 'text-ink-mute'}>
                            {t.comment || '—'}
                          </span>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <EditableCell
                        value={t.category ?? ''}
                        variant={{
                          kind: 'select',
                          options: [
                            { value: '', label: '— None —' },
                            ...cats.map((c) => ({ value: c.name, label: c.name })),
                          ],
                        }}
                        onSave={makeSaver(t.id, 'category')}
                        display={
                          t.category ? (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-sm"
                                style={{ background: categoryColor(t.category) }}
                              />
                              <span className="text-[13px] text-ink-soft">{t.category}</span>
                            </span>
                          ) : (
                            <span className="text-ink-mute">—</span>
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <EditableCell
                        value={t.type}
                        variant={{
                          kind: 'select',
                          options: TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                        }}
                        onSave={makeSaver(t.id, 'type')}
                        display={
                          <Pill
                            variant={
                              t.type === 'income'
                                ? 'pos'
                                : t.type === 'adjustment'
                                  ? 'accent'
                                  : 'outline'
                            }
                          >
                            {t.type}
                          </Pill>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <EditableCell
                        value={t.account_id ?? ''}
                        variant={{
                          kind: 'select',
                          options: accounts.map((a) => ({
                            value: a.id,
                            label: `${a.name} · ${a.currency}`,
                          })),
                        }}
                        onSave={makeSaver(t.id, 'account_id')}
                        display={
                          <span className="text-[13px] text-ink-soft">
                            {account?.name ?? '—'}
                          </span>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <EditableCell
                        value={String(t.amount)}
                        variant={{ kind: 'number' }}
                        align="right"
                        onSave={makeSaver(t.id, 'amount')}
                        display={
                          <Num size={14} weight={500} tone="soft">
                            {fmtCurrency(t.amount, t.currency)}
                          </Num>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <Num size={14} weight={600} tone={tone}>
                        {fmtEUR(signed)}
                      </Num>
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => setMode({ kind: 'delete', tx: t })}
                        className="text-[12px] text-ink-soft hover:text-neg hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={mode.kind === 'add'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title="Add transaction"
        description="A new entry on this budget."
      >
        <TransactionForm
          budgetId={budgetId}
          accounts={accounts}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          submitLabel="Add transaction"
          onSubmit={handleCreate}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      </Modal>

      {mode.kind === 'delete' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Delete transaction?"
          description="This can't be undone."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-rule bg-bg p-3 text-[13px]">
              <Mono size="xs" className="block">
                {dateDisplay(mode.tx.date).toUpperCase()}
              </Mono>
              <div className="mt-1 text-ink">{mode.tx.comment || '(no description)'}</div>
              <div className="mt-1 text-ink-soft">
                {fmtCurrency(mode.tx.amount, mode.tx.currency)} · {mode.tx.type}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
                Cancel
              </Button>
              <Button onClick={() => handleDelete(mode.tx.id)}>Delete</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <Modal
        open={mode.kind === 'bulkDelete'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title={`Delete ${selectedIds.size} transaction${selectedIds.size === 1 ? '' : 's'}?`}
        description="This can't be undone."
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-ink-soft">
            Selected net: {fmtEUR(selectedNetEUR)}.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
              Cancel
            </Button>
            <Button onClick={handleBulkDelete} disabled={bulkPending}>
              {bulkPending ? 'Deleting…' : `Delete ${selectedIds.size}`}
            </Button>
          </div>
        </div>
      </Modal>

      <BulkActionBar
        count={selectedIds.size}
        totalEUR={selectedNetEUR}
        pending={bulkPending}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setMode({ kind: 'bulkDelete' })}
      />
    </>
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
