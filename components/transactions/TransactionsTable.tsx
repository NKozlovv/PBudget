'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Mono } from '@/components/ui';
import { ADD_TRANSACTION_EVENT } from './AddTransactionButton';
import {
  bulkDeleteTransactionsAction,
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
  type TxInput,
} from '@/app/actions/transactions';
import { TransactionForm } from './TransactionForm';
import { DayGroupedList } from './DayGroupedList';
import { BulkActionBar } from './BulkActionBar';
import { fmtCurrency, fmtEUR, signedAmount, txToEUR } from '@/lib/money';
import { dateDisplay } from '@/lib/date';
import type { Account, Category, Transaction } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; tx: Transaction }
  | { kind: 'delete'; tx: Transaction }
  | { kind: 'bulkDelete' };

export function TransactionsTable({
  transactions,
  accounts,
  expenseCats,
  incomeCats,
  subcategoriesByCategory,
  mostUsedSubcategory,
  budgetId,
  budgetFxRate,
}: {
  transactions: Transaction[];
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategoriesByCategory: Record<string, string[]>;
  mostUsedSubcategory: Record<string, string>;
  budgetId: string;
  budgetFxRate: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);

  useEffect(() => {
    function onAdd() {
      setMode({ kind: 'add' });
    }
    window.addEventListener(ADD_TRANSACTION_EVENT, onAdd);
    return () => window.removeEventListener(ADD_TRANSACTION_EVENT, onAdd);
  }, []);

  const selectedNetEUR = useMemo(() => {
    let total = 0;
    for (const t of transactions) {
      if (!selectedIds.has(t.id)) continue;
      total += signedAmount({ type: t.type, amount: txToEUR(t, budgetFxRate) });
    }
    return total;
  }, [transactions, selectedIds, budgetFxRate]);

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

  async function handleUpdate(id: string, input: TxInput) {
    const { budget_id: _ignored, ...patch } = input;
    void _ignored;
    const res = await updateTransactionAction(id, patch);
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

  return (
    <>
      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-rule bg-bg-soft px-6 py-16 text-center text-sm text-ink-mute">
          No transactions match the current filters.
        </div>
      ) : (
        <DayGroupedList
          transactions={transactions}
          accounts={accounts}
          budgetFxRate={budgetFxRate}
          selectedIds={selectedIds}
          onToggleSelect={toggleOne}
          onEdit={(tx) => setMode({ kind: 'edit', tx })}
          now={new Date()}
        />
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
          subcategoriesByCategory={subcategoriesByCategory}
          mostUsedSubcategory={mostUsedSubcategory}
          submitLabel="Add transaction"
          onSubmit={handleCreate}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      </Modal>

      {mode.kind === 'edit' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Edit transaction"
          description={dateDisplay(mode.tx.date)}
        >
          <div className="flex flex-col gap-4">
            <TransactionForm
              budgetId={budgetId}
              accounts={accounts}
              expenseCats={expenseCats}
              incomeCats={incomeCats}
              subcategoriesByCategory={subcategoriesByCategory}
              mostUsedSubcategory={mostUsedSubcategory}
              defaults={{
                date: mode.tx.date,
                type: mode.tx.type,
                amount: mode.tx.amount,
                currency: mode.tx.currency,
                account_id: mode.tx.account_id,
                category: mode.tx.category,
                subcategory: mode.tx.subcategory,
                comment: mode.tx.comment,
              }}
              submitLabel="Save changes"
              onSubmit={(input) => handleUpdate(mode.tx.id, input)}
              onCancel={() => setMode({ kind: 'idle' })}
            />
            <div className="flex justify-between border-t border-rule pt-4">
              <button
                type="button"
                onClick={() => setMode({ kind: 'delete', tx: mode.tx })}
                className="text-[12px] text-ink-mute hover:text-neg hover:underline"
              >
                Delete this transaction
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

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
          <p className="text-[13px] text-ink-soft">Selected net: {fmtEUR(selectedNetEUR)}.</p>
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
