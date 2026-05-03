'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal, Mono, Select } from '@/components/ui';
import {
  createBudgetAction,
  deleteBudgetAction,
  renameBudgetAction,
  setActiveBudgetAction,
} from '@/app/actions/budgets';
import type { Budget, Currency } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'create' }
  | { kind: 'manage' }
  | { kind: 'rename'; budget: Budget }
  | { kind: 'delete'; budget: Budget };

export function BudgetSwitcher({
  budgets,
  activeId,
}: {
  budgets: Budget[];
  activeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const active = budgets.find((b) => b.id === activeId) ?? budgets[0];

  // Click-outside dismiss
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function switchTo(id: string) {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await setActiveBudgetAction(id);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!active) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="group flex w-full items-center gap-2 rounded-lg border border-rule bg-bg px-3 py-2 text-left transition-colors hover:bg-bg-panel/40 focus:outline-none focus:border-accent"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Budget
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-ink">{active.name}</div>
        </div>
        <span className="text-[10px] text-ink-mute group-hover:text-ink">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-lg border border-rule bg-bg-panel shadow-2xl z-30 overflow-hidden">
          <ul role="listbox" className="flex flex-col">
            {budgets.map((b) => {
              const isActive = b.id === activeId;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => switchTo(b.id)}
                    className={
                      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] transition-colors ' +
                      (isActive
                        ? 'bg-accent-soft text-accent'
                        : 'text-ink-soft hover:bg-bg-soft hover:text-ink')
                    }
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-ink-mute">
                      {b.base_currency}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-rule px-1 py-1 flex flex-col">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMode({ kind: 'create' });
              }}
              className="rounded-md px-3 py-2 text-left text-[12px] font-medium text-accent hover:bg-bg-soft"
            >
              + New budget
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMode({ kind: 'manage' });
              }}
              className="rounded-md px-3 py-2 text-left text-[12px] text-ink-soft hover:bg-bg-soft hover:text-ink"
            >
              Manage budgets…
            </button>
          </div>
        </div>
      ) : null}

      {/* Create */}
      <Modal
        open={mode.kind === 'create'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title="New budget"
        description="A separate workspace with its own accounts, categories, and transactions."
      >
        <CreateBudgetForm
          onDone={() => {
            setMode({ kind: 'idle' });
            router.refresh();
          }}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      </Modal>

      {/* Manage list */}
      <Modal
        open={mode.kind === 'manage'}
        onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
        title="Manage budgets"
        description="Rename or delete a budget. Deletion cascades to its accounts, categories, and transactions."
      >
        <div className="flex flex-col gap-2">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-rule px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink">{b.name}</div>
                <div className="text-[10px] uppercase tracking-[0.06em] text-ink-mute">
                  {b.base_currency} · {b.id === activeId ? 'active' : 'member'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'rename', budget: b })}
                  className="text-[12px] text-ink-soft hover:text-accent hover:underline"
                >
                  Rename
                </button>
                <span className="text-ink-mute">·</span>
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'delete', budget: b })}
                  className="text-[12px] text-ink-soft hover:text-neg hover:underline"
                  disabled={budgets.length === 1}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {mode.kind === 'rename' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'manage' })}
          title="Rename budget"
        >
          <RenameBudgetForm
            budget={mode.budget}
            onDone={() => {
              setMode({ kind: 'manage' });
              router.refresh();
            }}
            onCancel={() => setMode({ kind: 'manage' })}
          />
        </Modal>
      ) : null}

      {mode.kind === 'delete' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'manage' })}
          title={`Delete “${mode.budget.name}”?`}
          description="Cascades to all accounts, categories, and transactions in this budget. This can't be undone."
        >
          <DeleteBudgetConfirm
            budget={mode.budget}
            onDone={() => {
              setMode({ kind: 'manage' });
              router.refresh();
            }}
            onCancel={() => setMode({ kind: 'manage' })}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function CreateBudgetForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError('Name is required.');
          return;
        }
        setError(null);
        setPending(true);
        const res = await createBudgetAction({ name, base_currency: currency });
        setPending(false);
        if (res.ok) onDone();
        else setError(res.error);
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Name">
        {({ id }) => (
          <Input
            id={id}
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Personal, Side gig, Joint…"
          />
        )}
      </Field>
      <Field label="Base currency">
        {({ id }) => (
          <Select id={id} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
        )}
      </Field>
      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create budget'}
        </Button>
      </div>
    </form>
  );
}

function RenameBudgetForm({
  budget,
  onDone,
  onCancel,
}: {
  budget: Budget;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(budget.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError('Name is required.');
          return;
        }
        setError(null);
        setPending(true);
        const res = await renameBudgetAction({ id: budget.id, name });
        setPending(false);
        if (res.ok) onDone();
        else setError(res.error);
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Name">
        {({ id }) => (
          <Input
            id={id}
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function DeleteBudgetConfirm({
  budget,
  onDone,
  onCancel,
}: {
  budget: Budget;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const matches = confirm.trim() === budget.name;

  return (
    <div className="flex flex-col gap-4">
      <Field label={`Type the budget name to confirm: ${budget.name}`}>
        {({ id }) => (
          <Input
            id={id}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={budget.name}
          />
        )}
      </Field>
      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!matches || pending}
          onClick={async () => {
            setError(null);
            setPending(true);
            const res = await deleteBudgetAction(budget.id);
            setPending(false);
            if (res.ok) onDone();
            else setError(res.error);
          }}
        >
          {pending ? 'Deleting…' : 'Delete budget'}
        </Button>
      </div>
    </div>
  );
}
