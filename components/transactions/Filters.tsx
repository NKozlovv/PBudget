'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FilterPill, Icon, OptionsList, useDismissable, type DropdownOption } from '@/components/ui';
import { UNCATEGORISED } from '@/lib/transactions/constants';
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

const TYPE_PILLS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'adjustment', label: 'Adjustments' },
];

const SORT_OPTIONS: Array<{ key: string; sort: string; dir: string; label: string }> = [
  { key: 'date-desc', sort: 'date', dir: 'desc', label: 'Date · newest' },
  { key: 'date-asc', sort: 'date', dir: 'asc', label: 'Date · oldest' },
  { key: 'amount-desc', sort: 'amount', dir: 'desc', label: 'Amount · high → low' },
  { key: 'amount-asc', sort: 'amount', dir: 'asc', label: 'Amount · low → high' },
  { key: 'category-asc', sort: 'category', dir: 'asc', label: 'Category · A → Z' },
];

function findSortLabel(sort: string | null, dir: string | null): string {
  if (!sort) return 'Date · newest';
  return SORT_OPTIONS.find((o) => o.sort === sort && o.dir === (dir ?? 'asc'))?.label ?? 'Date · newest';
}

/** Debounce so typing a search term doesn't fire a full server round-trip per keystroke. */
const SEARCH_DEBOUNCE_MS = 350;

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

  const currentType = params.get('type') ?? '';
  const currentCategory = params.get('category') ?? '';
  const currentSub = params.get('subcategory') ?? '';
  const currentAccount = params.get('account') ?? '';
  const currentMonth = params.get('month') ?? '';
  const currentSearch = params.get('q') ?? '';
  const currentSort = params.get('sort');
  const currentDir = params.get('dir');

  const [searchOpen, setSearchOpen] = useState<boolean>(currentSearch.length > 0);
  const [searchValue, setSearchValue] = useState<string>(currentSearch);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local search in sync if URL changes externally (e.g. Clear).
  useEffect(() => {
    setSearchValue(currentSearch);
    if (currentSearch) setSearchOpen(true);
  }, [currentSearch]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  function update(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  function onSearchChange(next: string) {
    setSearchValue(next);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => update({ q: next }), SEARCH_DEBOUNCE_MS);
  }

  function clearSearch() {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchValue('');
    update({ q: '' });
  }

  const allCats = [...expenseCats, ...incomeCats];

  const subcatScope = (() => {
    if (!currentCategory) return [] as Subcategory[];
    const cat = allCats.find((c) => c.name === currentCategory);
    if (!cat) return [];
    return subcategories.filter((s) => s.category_id === cat.id);
  })();

  const accountLabel =
    accounts.find((a) => a.id === currentAccount)?.name ?? 'Account';
  const categoryLabel =
    currentCategory === UNCATEGORISED ? 'Uncategorised' : currentCategory || 'Category';
  const monthPillLabel = currentMonth ? monthLabel(currentMonth) : 'Month';
  const sortLabel = findSortLabel(currentSort, currentDir);

  const hasAnyFilter =
    currentType ||
    currentCategory ||
    currentSub ||
    currentAccount ||
    currentMonth ||
    currentSearch ||
    currentSort;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type pills */}
      {TYPE_PILLS.map((p) => (
        <FilterPill
          key={p.value || 'all'}
          active={currentType === p.value}
          onClick={() => update({ type: p.value })}
        >
          {p.label}
        </FilterPill>
      ))}

      <span className="mx-1 h-5 w-px self-center bg-rule" aria-hidden />

      {/* Account */}
      <PillSelect
        icon="filter"
        label={accountLabel}
        active={!!currentAccount}
        value={currentAccount}
        onChange={(v) => update({ account: v })}
        options={[
          { value: '', label: 'All accounts' },
          ...accounts.map((a) => ({ value: a.id, label: a.name })),
        ]}
      />

      {/* Category */}
      <PillSelect
        icon="filter"
        label={categoryLabel}
        active={!!currentCategory}
        value={currentCategory}
        onChange={(v) => update({ category: v, subcategory: '' })}
        options={[
          { value: '', label: 'All categories' },
          { value: UNCATEGORISED, label: 'Uncategorised' },
          ...allCats.map((c) => ({ value: c.name, label: c.name })),
        ]}
      />

      {/* Subcategory — cascades from category (meaningless for Uncategorised) */}
      {currentCategory && currentCategory !== UNCATEGORISED ? (
        <PillSelect
          icon="filter"
          label={currentSub || 'Subcategory'}
          active={!!currentSub}
          value={currentSub}
          onChange={(v) => update({ subcategory: v })}
          disabled={subcatScope.length === 0}
          options={[
            { value: '', label: 'All subcategories' },
            ...subcatScope.map((s) => ({ value: s.name, label: s.name })),
          ]}
        />
      ) : null}

      {/* Month */}
      <PillSelect
        icon="filter"
        label={monthPillLabel}
        active={!!currentMonth}
        value={currentMonth}
        onChange={(v) => update({ month: v })}
        options={[
          { value: '', label: 'All months' },
          ...months.map((m) => ({ value: m, label: monthLabel(m) })),
        ]}
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
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchValue) setSearchOpen(false);
              }}
              className="w-[180px] bg-transparent text-[12px] text-ink placeholder:text-ink-mute focus:outline-none"
            />
            {searchValue ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
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

        {/* Sort */}
        <PillSelect
          icon="sort"
          label={sortLabel}
          active={!!currentSort}
          value={currentSort && currentDir ? `${currentSort}-${currentDir}` : 'date-desc'}
          onChange={(v) => {
            const opt = SORT_OPTIONS.find((o) => o.key === v);
            if (!opt) return;
            // Default sort is date-desc; clear params when matched so the URL stays clean.
            if (opt.key === 'date-desc') {
              update({ sort: '', dir: '' });
            } else {
              update({ sort: opt.sort, dir: opt.dir });
            }
          }}
          options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        />

        {hasAnyFilter ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
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
 * Themed filter pill + popup — replaces the old transparent-native-<select>
 * overlay (whose popup rendered with unthemeable OS chrome) with the same
 * OptionsList used by the form Select.
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
