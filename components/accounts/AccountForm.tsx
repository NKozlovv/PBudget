'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Select } from '@/components/ui';
import type { Currency } from '@/lib/supabase/types';
import type { AccountInput } from '@/app/actions/accounts';

export interface AccountDefaults {
  name?: string;
  currency?: Currency;
  opening_balance?: number;
  sort_order?: number;
}

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
    defaults?.opening_balance != null ? String(defaults.opening_balance) : '0',
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const ob = Number(opening);
    if (!Number.isFinite(ob)) {
      setError('Opening balance must be a number.');
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name">
        {({ id }) => (
          <Input
            id={id}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sparkasse, Cash, Wise…"
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency">
          {({ id }) => (
            <Select id={id} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
          )}
        </Field>
        <Field label="Opening balance" hint="In the account's native currency.">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              step="0.01"
              required
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          )}
        </Field>
      </div>

      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-end gap-2">
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
