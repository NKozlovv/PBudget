'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@/components/ui';
import { AccountForm } from './AccountForm';
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
  type AccountInput,
} from '@/app/actions/accounts';
import { AccountCard } from './AccountCard';
import { ADD_ACCOUNT_EVENT } from './AddAccountButton';
import type { Account } from '@/lib/supabase/types';
import type { AccountSummary } from '@/lib/accounts/summary';

type Mode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'edit'; account: Account }
  | { kind: 'delete'; account: Account }
  | { kind: 'blocked'; account: Account; message: string };

export function AccountsGrid({
  budgetId,
  summaries,
  colors,
  shareLabels,
  fxRate,
}: {
  budgetId: string;
  summaries: AccountSummary[];
  /** account.id → swatch hex */
  colors: Record<string, string>;
  /** account.id → "X% of net worth" / "Overdraft · excluded from share" */
  shareLabels: Record<string, string>;
  fxRate: number;
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

  async function handleDelete(account: Account) {
    setError(null);
    const res = await deleteAccountAction(account.id);
    if (res.ok) {
      setMode({ kind: 'idle' });
      router.refresh();
    } else if (res.error.toLowerCase().includes('transaction')) {
      setMode({ kind: 'blocked', account, message: res.error });
    } else {
      setError(res.error);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-[11px]">
        {summaries.map((s) => (
          <AccountCard
            key={s.account.id}
            summary={s}
            color={colors[s.account.id] ?? 'var(--ink-mute)'}
            shareLabel={shareLabels[s.account.id] ?? ''}
            fxRate={fxRate}
            onEdit={() => setMode({ kind: 'edit', account: s.account })}
            onDelete={() => setMode({ kind: 'delete', account: s.account })}
          />
        ))}
      </div>

      <Modal
        open={mode.kind === 'add'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title="New account"
        description="Three fields is the whole account. You can edit any of them later."
      >
        <AccountForm
          budgetId={budgetId}
          defaults={{ sort_order: summaries.length }}
          submitLabel="Create account"
          onSubmit={handleCreate}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      </Modal>

      {mode.kind === 'edit' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title={`Edit ${mode.account.name}`}
          description="Changing the opening balance re-bases every balance after it."
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
                className="text-[12px] text-ink-mute hover:text-out hover:underline"
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
          description="This removes the account and its balance history. It cannot be undone."
        >
          <div className="flex flex-col gap-4">
            {error ? (
              <p className="text-[13px] text-out" role="alert">
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
                Keep it
              </Button>
              <Button onClick={() => handleDelete(mode.account)}>Delete account</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {mode.kind === 'blocked' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title={`Cannot delete ${mode.account.name}`}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-[15px] bg-coral/[0.18] px-[14px] py-[11px] text-[13px] font-bold leading-relaxed text-out">
              {mode.message}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
                Close
              </Button>
              <Link
                href={`/transactions?account=${mode.account.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] px-[17px] py-[9px] text-[13.5px] font-bold text-white [box-shadow:0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 ease-theus hover:-translate-y-0.5"
              >
                Show those transactions
              </Link>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
