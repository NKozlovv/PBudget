'use client';

import { useState } from 'react';
import { FilterPill, Icon, OptionsList, useDismissable, type DropdownOption } from '@/components/ui';
import { UNCATEGORISED } from '@/lib/transactions/constants';
import { cn } from '@/lib/utils';
import type { Account, Category, Subcategory, TxType } from '@/lib/supabase/types';

export interface TxFilterValue {
  type: 'All' | TxType;
  account: string;
  category: string;
  subcategory: string;
  month: string;
  search: string;
}

export function emptyTxFilters(): TxFilterValue {
  return { type: 'All', account: 'All', category: 'All', subcategory: 'All', month: 'All', search: '' };
}

const TYPE_PILLS: Array<{ value: TxType; label: string }> = [
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'adjustment', label: 'Adjustments' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const idx = Number(m) - 1;
  if (!y || idx < 0 || idx > 11) return yyyymm;
  return `${MONTH_NAMES[idx]} ${y}`;
}

/**
 * Filter row — design_handoff_theus_rehaul README "Transactions", with
 * two departures from the mockup based on direct feedback: a Month
 * filter (the design doesn't have one, but at 1000+ transactions it's
 * genuinely needed), and the Category/Subcategory/Account/Month pills
 * are a themed popover (glass `OptionsList`) instead of real native
 * `<select>` elements — the spec's rationale for native selects was
 * free keyboard/mobile/screen-reader support, but the browser's own
 * unthemeable dropdown chrome read as visibly off-system, which won
 * out. Sign pills stay single-select; "Clear" appears once anything
 * is engaged; the search box and the live count sit to the right.
 */
export function Filters({
  accounts,
  expenseCats,
  incomeCats,
  subcategories,
  months,
  value,
  onChange,
  shown,
  total,
}: {
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategories: Subcategory[];
  /** Distinct 'YYYY-MM' strings present in the data, newest first. */
  months: string[];
  value: TxFilterValue;
  onChange: (next: TxFilterValue) => void;
  /** Filtered count / unfiltered total — "Showing N of 412", recomputed from the filtered set. */
  shown: number;
  total: number;
}) {
  function patch(updates: Partial<TxFilterValue>) {
    onChange({ ...value, ...updates });
  }

  const allCats = [...expenseCats, ...incomeCats].sort((a, b) => a.name.localeCompare(b.name));

  const subcatScope = (() => {
    if (value.category === 'All' || value.category === UNCATEGORISED) return subcategories;
    const cat = allCats.find((c) => c.name === value.category);
    return cat ? subcategories.filter((s) => s.category_id === cat.id) : [];
  })();

  const hasAnyFilter =
    value.type !== 'All' ||
    value.account !== 'All' ||
    value.category !== 'All' ||
    value.subcategory !== 'All' ||
    value.month !== 'All' ||
    value.search.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-[9px]">
      <FilterPill active={value.type === 'All'} onClick={() => patch({ type: 'All' })}>
        All
      </FilterPill>
      {TYPE_PILLS.map((p) => (
        <FilterPill key={p.value} active={value.type === p.value} onClick={() => patch({ type: p.value })}>
          {p.label}
        </FilterPill>
      ))}

      <CapsuleSelect
        value={value.category}
        onChange={(v) => patch({ category: v, subcategory: 'All' })}
        options={[
          { value: 'All', label: 'All categories' },
          { value: UNCATEGORISED, label: 'Uncategorised' },
          ...allCats.map((c) => ({ value: c.name, label: c.name })),
        ]}
      />
      <CapsuleSelect
        value={value.subcategory}
        onChange={(v) => patch({ subcategory: v })}
        disabled={subcatScope.length === 0}
        options={[
          { value: 'All', label: 'All subcategories' },
          ...subcatScope.map((s) => ({ value: s.name, label: s.name })),
        ]}
      />
      <CapsuleSelect
        value={value.account}
        onChange={(v) => patch({ account: v })}
        options={[{ value: 'All', label: 'All accounts' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
      />
      <CapsuleSelect
        value={value.month}
        onChange={(v) => patch({ month: v })}
        options={[{ value: 'All', label: 'All months' }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))]}
      />

      {hasAnyFilter ? (
        <button
          type="button"
          onClick={() => onChange(emptyTxFilters())}
          className="text-[12.5px] font-semibold text-ink-mute hover:text-ink hover:underline"
        >
          Clear
        </button>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <div className="flex w-[210px] items-center gap-2 rounded-full border border-white/90 bg-white/[0.72] px-[18px] py-[11px] backdrop-blur-xl transition-colors duration-200 focus-within:bg-white focus-within:[box-shadow:0_0_0_3px_rgba(74,92,224,.25)] hover:bg-white">
          <Icon name="search" size={13} className="shrink-0 text-ink-mute" />
          <input
            type="search"
            placeholder="Search merchant or note"
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-ink-mute focus:outline-none"
          />
        </div>
        <span className="whitespace-nowrap text-[12.5px] font-semibold text-ink-mute">
          Showing {shown} of {total}
        </span>
      </div>
    </div>
  );
}

function CapsuleSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));
  const engaged = value !== 'All';
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex max-w-[190px] items-center gap-1.5 rounded-full py-[10px] pl-4 pr-3 text-[13.5px] font-semibold transition-colors duration-200 focus:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(74,92,224,.25)] disabled:cursor-not-allowed disabled:opacity-50',
          engaged
            ? 'border border-indigo bg-indigo/[0.12] text-indigo-dark'
            : 'border border-white/90 bg-white/[0.72] text-ink hover:border-indigo',
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <Icon
          name="chevron-down"
          size={12}
          className={cn(
            'shrink-0 transition-transform duration-200 ease-theus',
            open && 'rotate-180',
            engaged ? 'text-indigo-dark' : 'text-ink-mute',
          )}
        />
      </button>
      {open ? (
        <OptionsList
          options={options}
          value={value}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
