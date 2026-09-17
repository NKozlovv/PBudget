'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@/components/ui';
import { AccountForm } from './AccountForm';
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
  type AccountInput,
} from '@/app/actions/accounts';
import { AccountCard, AddAccountCard } from './AccountCard';
import { ADD_ACCOUNT_EVENT } from './AddAccountButton';
import type { Account } from '@/lib/supabase/types';
import type { AccountSummary } from '@/lib/accounts/summary';

type Mode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; account: Account }
  | { kind: 'delete'; account: Account };

export function AccountsGrid({
  budgetId,
  summaries,
  colors,
}: {
  budgetId: string;
  summaries: AccountSummary[];
  /** account.id → swatch hex */
  colors: Record<string, string>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onAdd() {
      setMode({ kind: 'add' });
    }
    window.addEventListener(ADD_ACCOUNT_EVENT, onAdd);
    return () => window.removeEventListener(ADD_ACCOUNT_EVENT, onAdd);
  }, []);

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {summaries.map((s) => (
          <AccountCard
            key={s.account.id}
            summary={s}
            color={colors[s.account.id] ?? 'var(--ink-mute)'}
            onEdit={() => setMode({ kind: 'edit', account: s.account })}
          />
        ))}
        <AddAccountCard onAdd={() => setMode({ kind: 'add' })} />
      </div>

      <Modal
        open={mode.kind === 'add'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title="Add account"
        description="Native currency + opening balance."
      >
        <AccountForm
          budgetId={budgetId}
          defaults={{ sort_order: summaries.length }}
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
          <div className="flex flex-col gap-4">
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
            <div className="flex justify-between border-t border-white/60 pt-4">
              <button
                type="button"
                onClick={() => setMode({ kind: 'delete', account: mode.account })}
                className="text-[12px] text-ink-mute hover:text-neg hover:underline"
              >
                Delete this account
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {mode.kind === 'delete' ? (
        <Modal
          open={true}
          onOpenChange={(o) => {
            if (!o) {
              setError(null);
              setMode({ kind: 'idle' });
            }
          }}
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
