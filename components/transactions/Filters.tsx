'use client';

import { useState } from 'react';
import { FilterPill, Icon, OptionsList, useDismissable, type DropdownOption } from '@/components/ui';
import { UNCATEGORISED } from '@/lib/transactions/constants';
import type { Account, Category, Subcategory, TxType } from '@/lib/supabase/types';

export interface TxFilterValue {
  types: Set<TxType>;
  accounts: Set<string>;
  categories: Set<string>;
  subcategories: Set<string>;
  months: Set<string>;
  search: string;
  sort: 'date' | 'amount';
  dir: 'asc' | 'desc';
}

export function emptyTxFilters(): TxFilterValue {
  return {
    types: new Set(),
    accounts: new Set(),
    categories: new Set(),
    subcategories: new Set(),
    months: new Set(),
    search: '',
    sort: 'date',
    dir: 'desc',
  };
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return yyyymm;
  return `${MONTH_LABELS[idx]} ${y}`;
}

const TYPE_PILLS: Array<{ value: TxType; label: string }> = [
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'adjustment', label: 'Adjustments' },
];

// Sort is date/amount only — a ledger reads top-to-bottom by when or by how
// much, not alphabetically by category (that's what the Filters category
// picker + Categories page are for).
const SORT_OPTIONS: Array<{ key: string; sort: 'date' | 'amount'; dir: 'asc' | 'desc'; label: string }> = [
  { key: 'date-desc', sort: 'date', dir: 'desc', label: 'Date · newest' },
  { key: 'date-asc', sort: 'date', dir: 'asc', label: 'Date · oldest' },
  { key: 'amount-desc', sort: 'amount', dir: 'desc', label: 'Amount · high → low' },
  { key: 'amount-asc', sort: 'amount', dir: 'asc', label: 'Amount · low → high' },
];

/**
 * Every filter here is multi-select and purely client-side state — no URL
 * params, no server round trip. The whole transaction list is already in
 * the browser (see TransactionsClient), so re-filtering on every click is
 * a synchronous, sub-millisecond array pass instead of a fresh page load.
 */
export function Filters({
  accounts,
  expenseCats,
  incomeCats,
  subcategories,
  months,
  value,
  onChange,
}: {
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategories: Subcategory[];
  months: string[];
  value: TxFilterValue;
  onChange: (next: TxFilterValue) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(value.search.length > 0);

  function patch(updates: Partial<TxFilterValue>) {
    onChange({ ...value, ...updates });
  }

  function toggleType(t: TxType) {
    const next = new Set(value.types);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    // All 3 selected reads the same as none selected ("All") — collapse it
    // so the "All" pill lights back up instead of showing three checks.
    if (next.size === TYPE_PILLS.length) next.clear();
    patch({ types: next });
  }

  const allCats = [...expenseCats, ...incomeCats];

  // Subcategory options only make sense scoped to the selected categories —
  // when categories are mixed or empty, show every subcategory rather than
  // guessing.
  const subcatScope =
    value.categories.size === 1 && !value.categories.has(UNCATEGORISED)
      ? (() => {
          const name = [...value.categories][0];
          const cat = allCats.find((c) => c.name === name);
          return cat ? subcategories.filter((s) => s.category_id === cat.id) : [];
        })()
      : subcategories;

  const hasAnyFilter =
    value.types.size > 0 ||
    value.accounts.size > 0 ||
    value.categories.size > 0 ||
    value.subcategories.size > 0 ||
    value.months.size > 0 ||
    value.search.length > 0 ||
    !(value.sort === 'date' && value.dir === 'desc');

  const sortKey = `${value.sort}-${value.dir}`;
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Date · newest';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type pills — multi-select; all 3 (or 0) reads as "All" */}
      <FilterPill active={value.types.size === 0} onClick={() => patch({ types: new Set() })}>
        All
      </FilterPill>
      {TYPE_PILLS.map((p) => (
        <FilterPill key={p.value} active={value.types.has(p.value)} onClick={() => toggleType(p.value)}>
          {p.label}
        </FilterPill>
      ))}

      <span className="mx-1 h-5 w-px self-center bg-rule" aria-hidden />

      <MultiPillSelect
        icon="filter"
        noun="account"
        selected={value.accounts}
        onChange={(next) => patch({ accounts: next })}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      />

      <MultiPillSelect
        icon="filter"
        noun="category"
        selected={value.categories}
        onChange={(next) => patch({ categories: next, subcategories: new Set() })}
        options={[
          { value: UNCATEGORISED, label: 'Uncategorised' },
          ...allCats.map((c) => ({ value: c.name, label: c.name })),
        ]}
      />

      <MultiPillSelect
        icon="filter"
        noun="subcategory"
        selected={value.subcategories}
        onChange={(next) => patch({ subcategories: next })}
        disabled={subcatScope.length === 0}
        options={subcatScope.map((s) => ({ value: s.name, label: s.name }))}
      />

      <MultiPillSelect
        icon="filter"
        noun="month"
        selected={value.months}
        onChange={(next) => patch({ months: next })}
        options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
      />

      {/* Search — collapses to icon-only when empty */}
      <div className="ml-auto flex items-center gap-2">
        {searchOpen ? (
          <div className="flex items-center gap-1.5 rounded-[10px] border border-rule bg-surface px-3 py-1.5">
            <Icon name="search" size={12} className="text-ink-mute" />
            <input
              type="search"
              autoFocus
              placeholder="Search description…"
              value={value.search}
              onChange={(e) => patch({ search: e.target.value })}
              onBlur={() => {
                if (!value.search) setSearchOpen(false);
              }}
              className="w-[180px] bg-transparent text-[12px] text-ink placeholder:text-ink-mute focus:outline-none"
            />
            {value.search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => patch({ search: '' })}
                className="text-ink-mute hover:text-ink"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : (
          <FilterPill icon="search" onClick={() => setSearchOpen(true)}>
            Search
          </FilterPill>
        )}

        {/* Sort — single-select, date/amount only */}
        <PillSelect
          icon="sort"
          label={sortLabel}
          active={sortKey !== 'date-desc'}
          value={sortKey}
          onChange={(v) => {
            const opt = SORT_OPTIONS.find((o) => o.key === v);
            if (opt) patch({ sort: opt.sort, dir: opt.dir });
          }}
          options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        />

        {hasAnyFilter ? (
          <button
            type="button"
            onClick={() => onChange(emptyTxFilters())}
            className="text-[11px] text-ink-mute hover:text-ink hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Single-select dropdown pill — used only for Sort now that every filter
 * field is multi-select (see MultiPillSelect below).
 */
function PillSelect({
  label,
  icon,
  active,
  value,
  onChange,
  disabled,
  options,
}: {
  label: string;
  icon?: 'filter' | 'sort';
  active?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: DropdownOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative inline-flex">
      <FilterPill
        active={active}
        icon={icon}
        trailingIcon="chevron-down"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </FilterPill>
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

/**
 * Multi-select dropdown pill. Stays open across multiple picks (closes only
 * on outside click / Escape, via useDismissable) so selecting several
 * accounts or categories at once doesn't mean reopening the popup each
 * time.
 */
function MultiPillSelect({
  noun,
  icon,
  selected,
  onChange,
  disabled,
  options,
}: {
  /** Singular noun used to build the placeholder ("Account") and the
   * multi-selected label ("3 accounts"). */
  noun: string;
  icon?: 'filter' | 'sort';
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  options: DropdownOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const placeholder = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
  let label: string;
  if (selected.size === 0) label = placeholder;
  else if (selected.size === 1) {
    label = options.find((o) => o.value === [...selected][0])?.label as string ?? placeholder;
  } else {
    label = `${selected.size} ${noun}s`;
  }

  function toggle(v: string) {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <FilterPill
        active={selected.size > 0}
        icon={icon}
        trailingIcon="chevron-down"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </FilterPill>
      {open ? (
        <OptionsList options={options} selected={selected} onSelect={toggle} />
      ) : null}
    </div>
  );
}
