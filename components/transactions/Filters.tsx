'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Mono, Select } from '@/components/ui';
import type { Account, Category, Subcategory } from '@/lib/supabase/types';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return yyyymm;
  return `${MONTH_LABELS[idx]} ${y}`;
}

export function Filters({
  accounts,
  expenseCats,
  incomeCats,
  subcategories,
  months,
}: {
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategories: Subcategory[];
  months: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentCategory = params.get('category') ?? '';

  function update(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const allCats = [...expenseCats, ...incomeCats];

  // If a category is selected, narrow subcategories to that category.
  const subcatScope = (() => {
    if (!currentCategory) return subcategories;
    const cat = allCats.find((c) => c.name === currentCategory);
    if (!cat) return subcategories;
    return subcategories.filter((s) => s.category_id === cat.id);
  })();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Search">
        <Input
          type="search"
          placeholder="Description…"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update({ q: e.target.value })}
          className="w-[220px]"
        />
      </Field>
      <Field label="Month">
        <Select
          value={params.get('month') ?? ''}
          onChange={(e) => update({ month: e.target.value })}
          className="w-[150px]"
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Type">
        <Select
          value={params.get('type') ?? ''}
          onChange={(e) => update({ type: e.target.value })}
          className="w-[130px]"
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="adjustment">Adjustment</option>
        </Select>
      </Field>
      <Field label="Account">
        <Select
          value={params.get('account') ?? ''}
          onChange={(e) => update({ account: e.target.value })}
          className="w-[160px]"
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
          value={currentCategory}
          // When the category changes, drop any selected subcategory that no
          // longer applies.
          onChange={(e) => update({ category: e.target.value, subcategory: '' })}
          className="w-[160px]"
        >
          <option value="">All categories</option>
          {allCats.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Subcategory">
        <Select
          value={params.get('subcategory') ?? ''}
          onChange={(e) => update({ subcategory: e.target.value })}
          className="w-[160px]"
          disabled={subcatScope.length === 0}
        >
          <option value="">{subcatScope.length === 0 ? '—' : 'All subcats'}</option>
          {subcatScope.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
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
          Clear all
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
