'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, Checkbox, Field, Select } from '@/components/ui';
import { TripField } from './TripField';
import { isTravelCategory } from '@/lib/transactions/constants';
import type { Account, Category } from '@/lib/supabase/types';
import type { TxInput } from '@/app/actions/transactions';

type BulkPatch = Partial<Omit<TxInput, 'budget_id'>>;

/**
 * Bulk-edit only ever touches fields that are naturally *shared* across a
 * batch of transactions — category (+ subcategory, + trip when the category
 * is Travel) and account. Amount/date/comment are deliberately not offered
 * here: those are inherently per-transaction, and forcing every selected
 * row to the same amount or date would almost never be what "bulk edit"
 * means. Each field is behind its own "change this?" checkbox so an
 * unchecked field is left out of the patch entirely — bulkUpdateTransactionsAction
 * (and its own enforceTripRule call) only ever touches what's actually in
 * the patch, so unrelated columns on the selected rows are never disturbed.
 */
export function BulkEditModal({
  count,
  accounts,
  expenseCats,
  incomeCats,
  subcategoriesByCategory,
  existingTrips,
  onSubmit,
  onCancel,
}: {
  count: number;
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategoriesByCategory: Record<string, string[]>;
  existingTrips: string[];
  onSubmit: (patch: BulkPatch) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const [changeCategory, setChangeCategory] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [trip, setTrip] = useState('');

  const [changeAccount, setChangeAccount] = useState(false);
  const [accountId, setAccountId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const allCats = useMemo(
    () => [...expenseCats, ...incomeCats].sort((a, b) => a.name.localeCompare(b.name)),
    [expenseCats, incomeCats],
  );
  const subcatOptions = subcategoriesByCategory[category] ?? [];
  const isTravel = isTravelCategory(category);

  function handleCategoryChange(next: string) {
    setCategory(next);
    setSubcategory('');
    if (!isTravelCategory(next)) setTrip('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!changeCategory && !changeAccount) {
      setError('Pick at least one field to change.');
      return;
    }
    if (changeAccount && !accountId) {
      setError('Pick an account.');
      return;
    }

    const patch: BulkPatch = {};
    if (changeCategory) {
      patch.category = category.trim() || null;
      patch.subcategory = subcategory.trim() || null;
      patch.trip = isTravel ? trip.trim() || null : null;
    }
    if (changeAccount) {
      patch.account_id = accountId;
    }

    setPending(true);
    const res = await onSubmit(patch);
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5 rounded-[16px] border border-white/70 bg-white/40 p-4">
        <Checkbox checked={changeCategory} onChange={setChangeCategory} label="Change category" />
        {changeCategory ? (
          <div className="flex flex-col gap-3 pl-[26px]">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" className={subcatOptions.length > 0 ? undefined : 'col-span-2'}>
                {({ id }) => (
                  <Select id={id} value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                    <option value="">— None —</option>
                    {allCats.map((c) => (
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
            {isTravel ? (
              <Field label="Trip" hint="Pick a previous trip or type a new one.">
                {({ id }) => <TripField id={id} value={trip} onChange={setTrip} suggestions={existingTrips} />}
              </Field>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 rounded-[16px] border border-white/70 bg-white/40 p-4">
        <Checkbox checked={changeAccount} onChange={setChangeAccount} label="Change account" />
        {changeAccount ? (
          <div className="pl-[26px]">
            <Field label="Account">
              {({ id }) => (
                <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
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
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Updating…' : `Update ${count} transaction${count === 1 ? '' : 's'}`}
        </Button>
      </div>
    </form>
  );
}
