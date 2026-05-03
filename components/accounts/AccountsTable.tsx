'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Mono, Num, Pill } from '@/components/ui';
import { AccountForm } from './AccountForm';
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
  type AccountInput,
} from '@/app/actions/accounts';
import { fmtCurrency, fmtEUR } from '@/lib/money';
import type { Account } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; account: Account }
  | { kind: 'delete'; account: Account };

export function AccountsTable({
  accounts,
  budgetId,
  currentEUR,
  colors,
}: {
  accounts: Account[];
  budgetId: string;
  /** account.id → current EUR balance. Plain Record because functions
   * (and Maps with non-trivial setups) don't cross the server→client
   * boundary cleanly. */
  currentEUR: Record<string, number>;
  /** account.id → swatch hex */
  colors: Record<string, string>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(input: AccountInput) {
    const res = await createAccountAction(input);
    if (res.ok) {
      setMode({ kind: 'idle' });
      router.refresh();
    }
    return res;
  }

  async function handleUpdate(id: string, input: AccountInput) {
    const { budget_id: _ignored, ...patch } = input;
    void _ignored;
    const res = await updateAccountAction(id, patch);
    if (res.ok) {
      setMode({ kind: 'idle' });
      router.refresh();
    }
    return res;
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await deleteAccountAction(id);
    if (res.ok) {
      setMode({ kind: 'idle' });
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Mono size="xs">{accounts.length} accounts</Mono>
        <Button onClick={() => setMode({ kind: 'add' })}>+ Add account</Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-rule bg-bg-soft px-6 py-12 text-center text-sm text-ink-mute">
          No accounts yet. Add one to start tracking.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <Th className="w-[28px]">{''}</Th>
                <Th>Name</Th>
                <Th className="w-[110px]">Currency</Th>
                <Th align="right" className="w-[160px]">
                  Opening
                </Th>
                <Th align="right" className="w-[180px]">
                  Current · €
                </Th>
                <Th className="w-[120px]" align="right">
                  {''}
                </Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const eur = currentEUR[a.id] ?? 0;
                const tone = eur > 0 ? 'pos' : eur < 0 ? 'neg' : 'mute';
                return (
                  <tr
                    key={a.id}
                    className="border-b border-rule/60 last:border-0 hover:bg-bg-panel/40 transition-colors"
                  >
                    <td className="px-4 py-3 align-middle">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ background: colors[a.id] ?? 'var(--ink-mute)' }}
                        aria-hidden
                      />
                    </td>
                    <td className="px-4 py-3 align-middle text-ink font-medium">{a.name}</td>
                    <td className="px-4 py-3 align-middle">
                      <Pill variant="outline">{a.currency}</Pill>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Num size={14} weight={500} tone="soft">
                        {fmtCurrency(a.opening_balance, a.currency)}
                      </Num>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Num size={15} weight={600} tone={tone}>
                        {fmtEUR(eur)}
                      </Num>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMode({ kind: 'edit', account: a })}
                          className="text-[12px] text-ink-soft hover:text-accent hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-ink-mute">·</span>
                        <button
                          type="button"
                          onClick={() => setMode({ kind: 'delete', account: a })}
                          className="text-[12px] text-ink-soft hover:text-neg hover:underline"
                        >
                          Delete
                        </button>
                      </div>
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
        title="Add account"
        description="Native currency + opening balance."
      >
        <AccountForm
          budgetId={budgetId}
          defaults={{ sort_order: accounts.length }}
          submitLabel="Add account"
          onSubmit={handleCreate}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      </Modal>

      {mode.kind === 'edit' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Edit account"
        >
          <AccountForm
            budgetId={budgetId}
            defaults={{
              name: mode.account.name,
              currency: mode.account.currency,
              opening_balance: mode.account.opening_balance,
              sort_order: mode.account.sort_order,
            }}
            submitLabel="Save changes"
            onSubmit={(input) => handleUpdate(mode.account.id, input)}
            onCancel={() => setMode({ kind: 'idle' })}
          />
        </Modal>
      ) : null}

      {mode.kind === 'delete' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && (setError(null), setMode({ kind: 'idle' }))}
          title={`Delete ${mode.account.name}?`}
          description="This can't be undone."
        >
          <div className="flex flex-col gap-4">
            {error ? (
              <p className="text-[13px] text-neg" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setMode({ kind: 'idle' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleDelete(mode.account.id)}>Delete</Button>
            </div>
          </div>
        </Modal>
      ) : null}
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
