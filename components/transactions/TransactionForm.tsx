'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Select } from '@/components/ui';
import { TripField } from './TripField';
import { pickDefaultAccount } from '@/lib/accounts/defaultAccount';
import { isTravelCategory } from '@/lib/transactions/constants';
import type { Account, Category, Currency, TxType } from '@/lib/supabase/types';
import type { TxInput, TransferInput } from '@/app/actions/transactions';

export interface FormDefaults {
  date?: string;
  type?: TxType;
  amount?: number;
  currency?: Currency;
  account_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  trip?: string | null;
  comment?: string | null;
}

export function TransactionForm({
  budgetId,
  accounts,
  expenseCats,
  incomeCats,
  subcategoriesByCategory = {},
  mostUsedSubcategory = {},
  existingTrips = [],
  defaults,
  submitLabel,
  onSubmit,
  onTransfer,
  onCancel,
}: {
  budgetId: string;
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  /** Category name → its subcategory names. */
  subcategoriesByCategory?: Record<string, string[]>;
  /** Category name → most-frequently-used subcategory name. */
  mostUsedSubcategory?: Record<string, string>;
  /** Previously-used trip names, for the Trip field's autocomplete. */
  existingTrips?: string[];
  defaults?: FormDefaults;
  submitLabel: string;
  onSubmit: (input: TxInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** When given, the Adjustment type gains a "To account" field and saves as a transfer (new transactions only). */
  onTransfer?: (input: TransferInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaults?.date ?? todayISO);
  const [type, setType] = useState<TxType>(defaults?.type ?? 'expense');
  const [accountId, setAccountId] = useState<string>(
    defaults?.account_id ?? pickDefaultAccount(accounts)?.id ?? '',
  );
  const [category, setCategory] = useState<string>(defaults?.category ?? '');
  const [subcategory, setSubcategory] = useState<string>(defaults?.subcategory ?? '');
  const [trip, setTrip] = useState<string>(defaults?.trip ?? '');
  const [amount, setAmount] = useState<string>(defaults?.amount?.toString() ?? '');
  const [comment, setComment] = useState<string>(defaults?.comment ?? '');
  const [toAccountId, setToAccountId] = useState('');
  const [rate, setRate] = useState('');
  const [fee, setFee] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const currency: Currency = (defaults?.currency ?? account?.currency ?? 'EUR') as Currency;
  const isAdjustment = type === 'adjustment';
  const transferEnabled = isAdjustment && !!onTransfer;
  const isTransfer = transferEnabled && !!toAccount;
  const crossCurrency = isTransfer && !!account && account.currency !== toAccount?.currency;
  const cats = type === 'income' ? incomeCats : type === 'expense' ? expenseCats : [];

  function handleTypeChange(next: TxType) {
    setType(next);
    // Expense and income categories are different lists, and adjustments
    // have none — a stale pick from the previous type would be invalid.
    setCategory('');
    setSubcategory('');
    setTrip('');
  }
  const subcatOptions = subcategoriesByCategory[category] ?? [];
  const isTravel = isTravelCategory(category);

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory);
    setSubcategory(mostUsedSubcategory[nextCategory] ?? '');
    // A trip tag only makes sense on a Travel transaction — losing the
    // category loses the tag (also re-enforced server-side, see
    // lib/transactions/constants.ts's enforceTripRule).
    if (!isTravelCategory(nextCategory)) setTrip('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const rawAmount = Number(amount);
    if (!Number.isFinite(rawAmount) || rawAmount === 0) {
      setError('Amount must be a non-zero number.');
      return;
    }
    if (!accountId) {
      setError('Pick an account.');
      return;
    }
    // Expense/income amounts are always stored as a positive magnitude —
    // direction comes from `type`, not the sign of `amount` (signedAmount()
    // in lib/money.ts negates expenses and would double-flip a negative
    // entry here, silently crediting the account instead of debiting it).
    // Adjustments are the one type that encodes direction in the sign
    // itself, so leave those as typed.
    const parsedAmount = type === 'adjustment' ? rawAmount : Math.abs(rawAmount);
    if (isTransfer && onTransfer) {
      const rateNum = Number(rate);
      if (crossCurrency && !(rateNum > 0)) {
        setError('Enter the exchange rate.');
        return;
      }
      setPending(true);
      const res = await onTransfer({
        budget_id: budgetId,
        date,
        from_account_id: accountId,
        to_account_id: toAccountId,
        amount: Math.abs(rawAmount),
        rate: crossCurrency ? rateNum : null,
        fee: Number(fee) > 0 ? Number(fee) : null,
        comment: comment.trim() || null,
      });
      setPending(false);
      if (!res.ok) setError(res.error);
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
      category: isAdjustment ? 'Adjustment' : category.trim() || null,
      subcategory: isAdjustment ? null : subcategory.trim() || null,
      trip: isTravel ? trip.trim() || null : null,
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
            <Select id={id} value={type} onChange={(e) => handleTypeChange(e.target.value as TxType)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          )}
        </Field>
      </div>

      <Field label={transferEnabled ? 'From account' : 'Account'}>
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

      {transferEnabled ? (
        <>
          <Field label="To account" hint={isTransfer ? undefined : 'Leave empty for a plain balance adjustment.'}>
            {({ id }) => (
              <Select id={id} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                <option value="">— balance adjustment only —</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.currency}
                    </option>
                  ))}
              </Select>
            )}
          </Field>
          {crossCurrency && account && toAccount ? (
            <Field label="Exchange rate" hint={`1 ${account.currency} = ? ${toAccount.currency}`}>
              {({ id }) => (
                <Input id={id} type="number" step="0.0001" min="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} />
              )}
            </Field>
          ) : null}
          {isTransfer && toAccount ? (
            <Field label={`Transfer fee (${toAccount.currency}, optional)`} hint="Booked as Bills → Fees on the receiving account.">
              {({ id }) => (
                <Input id={id} type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
              )}
            </Field>
          ) : null}
        </>
      ) : null}

      {isAdjustment ? null : (
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" className={subcatOptions.length > 0 ? undefined : 'col-span-2'}>
          {({ id }) => (
            <Select id={id} value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">— None —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {subcatOptions.length > 0 ? (
          <Field label="Subcategory">
            {({ id }) => (
              <Select id={id} value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                <option value="">— None —</option>
                {subcatOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
      </div>
      )}

      {isTravel && !isAdjustment ? (
        <Field label="Trip" hint="Pick a previous trip or type a new one.">
          {({ id }) => <TripField id={id} value={trip} onChange={setTrip} suggestions={existingTrips} />}
        </Field>
      ) : null}

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
