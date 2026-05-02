'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Mono, Select } from '@/components/ui';
import type { Account, Category } from '@/lib/supabase/types';

export function Filters({
  accounts,
  expenseCats,
  incomeCats,
}: {
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const allCats = [...expenseCats, ...incomeCats];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Search">
        <Input
          type="search"
          placeholder="Description…"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
          className="w-[260px]"
        />
      </Field>
      <Field label="Type">
        <Select
          defaultValue={params.get('type') ?? ''}
          onChange={(e) => update('type', e.target.value)}
          className="w-[140px]"
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="adjustment">Adjustment</option>
        </Select>
      </Field>
      <Field label="Account">
        <Select
          defaultValue={params.get('account') ?? ''}
          onChange={(e) => update('account', e.target.value)}
          className="w-[180px]"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Category">
        <Select
          defaultValue={params.get('category') ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="w-[180px]"
        >
          <option value="">All categories</option>
          {allCats.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      {[...params.entries()].length > 0 ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="ml-auto text-[12px] text-ink-mute hover:text-ink hover:underline"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Mono size="xs" className="block">
        {label}
      </Mono>
      {children}
    </div>
  );
}
