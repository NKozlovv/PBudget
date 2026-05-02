'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Select } from '@/components/ui';
import type { Account, Category, Currency, TxType } from '@/lib/supabase/types';
import type { TxInput } from '@/app/actions/transactions';

export interface FormDefaults {
  date?: string;
  type?: TxType;
  amount?: number;
  currency?: Currency;
  account_id?: string | null;
  category?: string | null;
  comment?: string | null;
}

export function TransactionForm({
  budgetId,
  accounts,
  expenseCats,
  incomeCats,
  defaults,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  budgetId: string;
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  defaults?: FormDefaults;
  submitLabel: string;
  onSubmit: (input: TxInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaults?.date ?? todayISO);
  const [type, setType] = useState<TxType>(defaults?.type ?? 'expense');
  const [accountId, setAccountId] = useState<string>(
    defaults?.account_id ?? accounts[0]?.id ?? '',
  );
  const [category, setCategory] = useState<string>(defaults?.category ?? '');
  const [amount, setAmount] = useState<string>(defaults?.amount?.toString() ?? '');
  const [comment, setComment] = useState<string>(defaults?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  const currency: Currency = (defaults?.currency ?? account?.currency ?? 'EUR') as Currency;
  const cats = type === 'income' ? incomeCats : type === 'expense' ? expenseCats : [];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setError('Amount must be a non-zero number.');
      return;
    }
    if (!accountId) {
      setError('Pick an account.');
      return;
    }
    setPending(true);
    const res = await onSubmit({
      budget_id: budgetId,
      date,
      type,
      amount: parsedAmount,
      currency,
      account_id: accountId,
      category: category.trim() || null,
      subcategory: null,
      comment: comment.trim() || null,
    });
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          {({ id }) => (
            <Input
              id={id}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>
        <Field label="Type">
          {({ id }) => (
            <Select id={id} value={type} onChange={(e) => setType(e.target.value as TxType)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          )}
        </Field>
      </div>

      <Field label="Account">
        {({ id }) => (
          <Select
            id={id}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="" disabled>
              Pick an account
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.currency}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Category">
        {({ id }) => (
          <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— None —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <Field label={`Amount (${currency})`}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
        </Field>
        <span className="pb-3 text-[12px] text-ink-mute">{currency}</span>
      </div>

      <Field label="Note">
        {({ id }) => (
          <Input
            id={id}
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional"
          />
        )}
      </Field>

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
