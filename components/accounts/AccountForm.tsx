'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Currency } from '@/lib/supabase/types';
import type { AccountInput } from '@/app/actions/accounts';

export interface AccountDefaults {
  name?: string;
  currency?: Currency;
  opening_balance?: number;
  sort_order?: number;
}

/**
 * Add/edit account form — Theus Accounts design handoff. Three fields is
 * the whole account model (name, currency, opening balance), so currency
 * is a two-way segmented control rather than a dropdown ("two currencies,
 * so no picker" — if a third currency ever lands this becomes a select).
 */
export function AccountForm({
  budgetId,
  defaults,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  budgetId: string;
  defaults?: AccountDefaults;
  submitLabel: string;
  onSubmit: (input: AccountInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaults?.name ?? '');
  const [currency, setCurrency] = useState<Currency>(defaults?.currency ?? 'EUR');
  const [opening, setOpening] = useState<string>(
    defaults?.opening_balance != null ? String(defaults.opening_balance) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Give the account a name.');
      return;
    }
    const ob = Number(opening.replace(',', '.'));
    if (opening.trim() === '' || !Number.isFinite(ob)) {
      setError('Use a plain number for the opening balance, e.g. 4120.55.');
      return;
    }
    setPending(true);
    const res = await onSubmit({
      budget_id: budgetId,
      name: name.trim(),
      currency,
      opening_balance: ob,
      sort_order: defaults?.sort_order ?? 0,
    });
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[13px]">
      <label className="flex flex-col gap-[7px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Revolut EUR"
          className="rounded-[15px] border border-white/90 bg-white/80 px-[15px] py-3 text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
        />
      </label>

      <div className="flex flex-col gap-[7px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Currency</span>
        <div className="flex gap-1 rounded-full bg-[rgba(31,39,66,.06)] p-1">
          {(['EUR', 'USD'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                'flex-1 rounded-full py-[9px] text-[13px] font-bold transition-colors duration-150',
                currency === c ? 'bg-white text-ink shadow-[0_4px_12px_-6px_rgba(31,39,66,.3)]' : 'text-ink-soft',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-[7px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
          Opening balance ({currency})
        </span>
        <input
          type="text"
          inputMode="decimal"
          required
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          placeholder="0.00"
          className="rounded-[15px] border border-white/90 bg-white/80 px-[15px] py-3 text-[15px] font-semibold tabular-nums text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
        />
        <span className="text-[12px] font-semibold text-ink-mute">
          Negative is allowed — an overdraft is a real balance.
        </span>
      </label>

      {error ? (
        <p className="text-[13px] font-bold text-out" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-1 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
