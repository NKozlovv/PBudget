'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Mono, Num, Pill } from '@/components/ui';
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
  type TxInput,
} from '@/app/actions/transactions';
import { TransactionForm } from './TransactionForm';
import { fmtCurrency, fmtEUR, signedAmount, txToEUR } from '@/lib/money';
import { dateDisplay } from '@/lib/date';
import { categoryColor } from '@/lib/categoryColor';
import type { Account, Category, Transaction } from '@/lib/supabase/types';

type Mode = { kind: 'idle' } | { kind: 'add' } | { kind: 'edit'; tx: Transaction } | { kind: 'delete'; tx: Transaction };

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
      router.refresh();
    }
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
                <Th className="w-[120px]">Date</Th>
                <Th>Description</Th>
                <Th>Category</Th>
                <Th className="w-[110px]">Type</Th>
                <Th className="w-[140px]">Account</Th>
                <Th align="right" className="w-[130px]">Amount</Th>
                <Th align="right" className="w-[120px]">EUR</Th>
                <Th className="w-[80px]" align="right">{''}</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const account = accounts.find((a) => a.id === t.account_id);
                const eur = txToEUR(t, budgetFxRate);
                const signed = signedAmount({ type: t.type, amount: eur });
                const tone = signed > 0 ? 'pos' : signed < 0 ? 'neg' : 'mute';
                return (
                  <tr
                    key={t.id}
                    className="border-b border-rule/60 last:border-0 hover:bg-bg-panel/40 transition-colors"
                  >
                    <Td>
                      <Num size={12} tone="mute">
                        {dateDisplay(t.date).toUpperCase()}
                      </Num>
                    </Td>
                    <Td className="text-ink">{t.comment || '—'}</Td>
                    <Td>
                      {t.category ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm"
                            style={{ background: categoryColor(t.category) }}
                          />
                          <span className="text-[13px] text-ink-soft">{t.category}</span>
                        </span>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </Td>
                    <Td>
                      <Pill
                        variant={
                          t.type === 'income' ? 'pos' : t.type === 'adjustment' ? 'accent' : 'outline'
                        }
                      >
                        {t.type}
                      </Pill>
                    </Td>
                    <Td className="text-ink-soft text-[13px]">{account?.name ?? '—'}</Td>
                    <Td align="right">
                      <Num size={14} weight={500} tone="soft">
                        {fmtCurrency(t.amount, t.currency)}
                      </Num>
                    </Td>
                    <Td align="right">
                      <Num size={14} weight={600} tone={tone}>
                        {fmtEUR(signed)}
                      </Num>
                    </Td>
                    <Td align="right">
                      <RowMenu
                        onEdit={() => setMode({ kind: 'edit', tx: t })}
                        onDelete={() => setMode({ kind: 'delete', tx: t })}
                      />
                    </Td>
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

      {mode.kind === 'edit' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Edit transaction"
        >
          <TransactionForm
            budgetId={budgetId}
            accounts={accounts}
            expenseCats={expenseCats}
            incomeCats={incomeCats}
            defaults={{
              date: mode.tx.date,
              type: mode.tx.type,
              amount: mode.tx.amount,
              currency: mode.tx.currency,
              account_id: mode.tx.account_id,
              category: mode.tx.category,
              comment: mode.tx.comment,
            }}
            submitLabel="Save changes"
            onSubmit={(input) => handleUpdate(mode.tx.id, input)}
            onCancel={() => setMode({ kind: 'idle' })}
          />
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
    </>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="text-[12px] text-ink-soft hover:text-accent hover:underline"
      >
        Edit
      </button>
      <span className="text-ink-mute">·</span>
      <button
        type="button"
        onClick={onDelete}
        className="text-[12px] text-ink-soft hover:text-neg hover:underline"
      >
        Delete
      </button>
    </div>
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

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );
}
