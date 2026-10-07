'use client';

import { useMemo, useState, useTransition, type ChangeEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, Icon, Select } from '@/components/ui';
import { fmtCurrency } from '@/lib/money';
import { monthName } from '@/lib/date';
import { workingMonth } from '@/lib/dashboard/period';
import { importSparkasseAction } from '@/app/actions/import';
import {
  decodeCsvBytes,
  findLikelyDuplicates,
  merchantKey,
  parseSparkasseCsv,
} from '@/lib/csv/sparkasse';
import type { Currency, TxType } from '@/lib/supabase/types';

export interface ImportContext {
  accounts: { id: string; name: string; currency: Currency; balance: number }[];
  expenseCategories: string[];
  incomeCategories: string[];
  subcategoriesByCategory: Record<string, string[]>;
  mostUsedSubcategory: Record<string, string>;
  /** merchantKey(comment) → how that merchant was booked most recently. */
  suggestions: Record<string, { type: TxType; category: string; subcategory: string }>;
  /** account id → its existing transactions as (date, signed amount), for duplicate checks. */
  existingByAccount: Record<string, { date: string; amount: number }[]>;
}

interface ReviewRow {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  pending: boolean;
  type: TxType;
  category: string;
  subcategory: string;
  /** null = follow the default (include unless it looks like a duplicate). */
  include: boolean | null;
}

const ALL = 'all';

function monthLabel(key: string): string {
  return `${monthName(Number(key.slice(5, 7)) - 1)} ${key.slice(0, 4)}`;
}

function defaultAccountId(accounts: ImportContext['accounts']): string {
  return (
    accounts.find((a) => /sparkasse/i.test(a.name))?.id ??
    accounts.find((a) => a.currency === 'EUR')?.id ??
    accounts[0]?.id ??
    ''
  );
}

const MAX_CSV_BYTES = 5 * 1024 * 1024;

export function SparkasseImport({ context }: { context: ImportContext }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState<string>(ALL);
  const [accountId, setAccountId] = useState(() => defaultAccountId(context.accounts));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const account = context.accounts.find((a) => a.id === accountId);
  const currency = account?.currency ?? 'EUR';

  async function loadFile(f: File | null) {
    setError(null);
    setDone(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setError('That doesn’t look like a CSV file — export “CSV-CAMT” from Sparkasse online banking.');
      return;
    }
    if (f.size > MAX_CSV_BYTES) {
      setError('That file is larger than 5 MB — a bank statement export should be far smaller.');
      return;
    }
    const parsed = parseSparkasseCsv(decodeCsvBytes(await f.arrayBuffer()));
    if (parsed.rows.length === 0) {
      setError('No transactions found. Is this the CSV export from Sparkasse online banking?');
      return;
    }
    setFileName(f.name);
    setRows(
      parsed.rows.map((r, id) => {
        const type: TxType = r.amount < 0 ? 'expense' : 'income';
        const hint = context.suggestions[merchantKey(r.merchant)];
        const useHint = hint && hint.type === type;
        return {
          id,
          date: r.date,
          merchant: r.merchant,
          amount: r.amount,
          pending: r.pending,
          type,
          category: useHint ? hint.category : '',
          subcategory: useHint ? hint.subcategory : '',
          include: null,
        };
      }),
    );
    setMonths(parsed.months);
    const wm = workingMonth(new Date());
    const wmKey = `${wm.year}-${String(wm.month + 1).padStart(2, '0')}`;
    setMonth(parsed.months.includes(wmKey) ? wmKey : parsed.months.length === 1 ? parsed.months[0]! : ALL);
  }

  function reset() {
    setRows([]);
    setMonths([]);
    setFileName(null);
    setError(null);
  }

  const visible = useMemo(
    () => (month === ALL ? rows : rows.filter((r) => r.date.startsWith(month) || !r.date)),
    [rows, month],
  );

  const duplicates = useMemo(() => {
    const flagged = findLikelyDuplicates(visible, context.existingByAccount[accountId] ?? []);
    return new Set([...flagged].map((i) => visible[i]!.id));
  }, [visible, accountId, context.existingByAccount]);

  const isIncluded = (r: ReviewRow) => r.include ?? !duplicates.has(r.id);
  const selected = visible.filter(isIncluded);
  const delta = selected.reduce((s, r) => s + r.amount, 0);
  const missingDate = selected.some((r) => !r.date);
  const uncategorised = selected.filter((r) => r.type !== 'adjustment' && !r.category).length;

  function patch(id: number, p: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  function setAll(include: boolean) {
    const ids = new Set(visible.map((r) => r.id));
    setRows((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, include } : r)));
  }

  function submit() {
    if (!account || selected.length === 0 || missingDate) return;
    setError(null);
    startTransition(async () => {
      const res = await importSparkasseAction({
        accountId: account.id,
        rows: selected.map((r) => ({
          date: r.date,
          type: r.type,
          amount: r.amount,
          category: r.category || null,
          subcategory: r.subcategory || null,
          comment: r.merchant.slice(0, 500),
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const n = res.data.inserted;
      setDone(`Imported ${n} transaction${n === 1 ? '' : 's'} into ${account.name}.`);
      reset();
      router.refresh();
    });
  }

  if (context.accounts.length === 0) {
    return (
      <section className="glass glass-nohover !rounded-[34px] px-8 py-14 text-center text-[14px] font-semibold text-ink-soft">
        Add an account first — imported transactions need an account to land in.
      </section>
    );
  }

  return (
    <>
      {done ? (
        <div className="rounded-[20px] border border-in/40 bg-in/[0.12] px-5 py-4 text-[13.5px] font-semibold text-in" role="status">
          {done}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[20px] border border-out/40 bg-out/[0.12] px-5 py-4 text-[13.5px] font-semibold text-out" role="alert">
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <section className="glass glass-nohover grid gap-6 !rounded-[34px] p-[26px] lg:grid-cols-[1.6fr_1fr]">
          <div
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setDragOver(false);
              void loadFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              'rounded-[24px] border-2 border-dashed transition-colors',
              dragOver ? 'border-indigo bg-indigo/[0.08]' : 'border-white/90 bg-white/50 hover:bg-white/70',
            )}
          >
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  void loadFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo/[0.12] text-indigo-dark">
                <Icon name="upload" size={20} />
              </span>
              <div className="text-[15px] font-bold text-ink">
                {dragOver ? 'Drop it' : 'Drop your Sparkasse CSV here'}
              </div>
              <div className="text-[13px] font-semibold text-ink-soft">
                or <span className="text-indigo underline-offset-2 hover:underline">browse</span>
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-3 text-[13px] font-medium leading-relaxed text-ink-soft">
            <div className="text-[15px] font-bold text-ink">How it works</div>
            <p>In Sparkasse online banking, open the account’s transactions and export them as CSV (CSV-CAMT).</p>
            <p>The file is read in your browser. Nothing is saved until you press Import.</p>
            <p>
              Merchants you’ve booked before get the same category again. Rows that look already imported (same
              amount within 3 days) start unticked.
            </p>
            <p>Pending (“vorgemerkt”) transactions are included and marked.</p>
          </div>
        </section>
      ) : (
        <section className="glass glass-nohover flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">Review transactions</div>
              <div className="mt-1 truncate text-[13px] font-semibold text-ink-soft">{fileName}</div>
            </div>
            <label className="flex w-[220px] flex-col gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Into account</span>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Account">
                {context.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex w-[180px] flex-col gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Month</span>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
                {months.length > 1 ? <option value={ALL}>Whole file</option> : null}
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </Select>
            </label>
            <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
              Choose another file
            </Button>
          </div>

          {currency !== 'EUR' ? (
            <p className="text-[12.5px] font-semibold text-out">
              {account?.name} is a {currency} account, but Sparkasse amounts are in EUR — they’ll be stored as {currency}{' '}
              as-is.
            </p>
          ) : null}

          <div className="flex flex-col">
            <div className="hidden grid-cols-[24px_128px_minmax(160px,1fr)_110px_130px_minmax(140px,190px)_minmax(140px,190px)] items-center gap-3 border-b border-white/60 px-2 pb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute lg:grid">
              <RowCheck
                checked={selected.length === visible.length && visible.length > 0}
                onChange={(v) => setAll(v)}
                label="Select all"
              />
              <span>Date</span>
              <span>Merchant / note</span>
              <span className="text-right">Amount</span>
              <span>Type</span>
              <span>Category</span>
              <span>Subcategory</span>
            </div>
            {visible.map((r) => (
              <Row
                key={r.id}
                row={r}
                included={isIncluded(r)}
                duplicate={duplicates.has(r.id)}
                currency={currency}
                context={context}
                onChange={(p) => patch(r.id, p)}
              />
            ))}
          </div>

          <div className="glass-tile flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
            <Figure label="Current balance" value={fmtCurrency(account?.balance ?? 0, currency)} />
            <Figure
              label={`Import total · ${selected.length} tx`}
              value={(delta > 0 ? '+' : '') + fmtCurrency(delta, currency)}
              tone={delta < 0 ? 'out' : 'in'}
            />
            <Figure label="Balance after" value={fmtCurrency((account?.balance ?? 0) + delta, currency)} />
            <div className="ml-auto flex items-center gap-3">
              {missingDate ? (
                <span className="text-[12.5px] font-semibold text-out">Some selected rows have no date.</span>
              ) : uncategorised > 0 ? (
                <span className="text-[12.5px] font-semibold text-ink-mute">{uncategorised} without a category</span>
              ) : null}
              <Button onClick={submit} disabled={pending || selected.length === 0 || missingDate}>
                {pending ? 'Importing…' : `Import ${selected.length} transaction${selected.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Row({
  row,
  included,
  duplicate,
  currency,
  context,
  onChange,
}: {
  row: ReviewRow;
  included: boolean;
  duplicate: boolean;
  currency: Currency;
  context: ImportContext;
  onChange: (p: Partial<ReviewRow>) => void;
}) {
  const cats =
    row.type === 'expense' ? context.expenseCategories : row.type === 'income' ? context.incomeCategories : [];
  // A suggested/legacy category that isn't in the list any more still shows as selected.
  const catOptions = row.category && !cats.includes(row.category) ? [row.category, ...cats] : cats;
  const subs = context.subcategoriesByCategory[row.category] ?? [];
  const subOptions = row.subcategory && !subs.includes(row.subcategory) ? [row.subcategory, ...subs] : subs;

  function setType(type: TxType) {
    onChange({ type, category: '', subcategory: '' });
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[24px_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-white/45 px-2 py-2.5 transition-opacity',
        'lg:grid-cols-[24px_128px_minmax(160px,1fr)_110px_130px_minmax(140px,190px)_minmax(140px,190px)]',
        !included && 'opacity-45',
      )}
    >
      <RowCheck checked={included} onChange={(v) => onChange({ include: v })} label={`Include ${row.merchant}`} />
      <input
        type="date"
        value={row.date}
        onChange={(e) => onChange({ date: e.target.value })}
        aria-label="Date"
        className={cn(
          'w-[128px] rounded-full border bg-white/[0.6] px-3 py-[7px] text-[12.5px] font-semibold text-ink',
          'focus:outline-none focus:border-indigo',
          row.date ? 'border-white/90' : 'border-out/60',
        )}
      />
      <div className="col-span-3 min-w-0 lg:col-span-1">
        <input
          value={row.merchant}
          onChange={(e) => onChange({ merchant: e.target.value })}
          aria-label="Merchant / note"
          className="w-full truncate rounded-full border border-transparent bg-transparent px-3 py-[7px] text-[13.5px] font-semibold text-ink hover:border-white/90 focus:border-indigo focus:bg-white/70 focus:outline-none"
        />
        {row.pending || duplicate ? (
          <div className="flex gap-1.5 px-3">
            {row.pending ? <Tag>Pending</Tag> : null}
            {duplicate ? <Tag tone="out">Possibly already imported</Tag> : null}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'row-start-1 col-start-3 text-right text-[13.5px] font-extrabold tabular-nums lg:row-auto lg:col-auto',
          row.amount < 0 ? 'text-out' : 'text-in',
        )}
      >
        {(row.amount > 0 ? '+' : '') + fmtCurrency(row.amount, currency)}
      </div>
      <div className="col-span-3 grid grid-cols-3 gap-2 lg:contents">
        <Select value={row.type} onChange={(e) => setType(e.target.value as TxType)} aria-label="Type">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="adjustment">Transfer</option>
        </Select>
        <Select
          value={row.category}
          onChange={(e) =>
            onChange({ category: e.target.value, subcategory: context.mostUsedSubcategory[e.target.value] ?? '' })
          }
          disabled={row.type === 'adjustment'}
          aria-label="Category"
        >
          <option value="">{row.type === 'adjustment' ? 'No category' : '— category —'}</option>
          {catOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={row.subcategory}
          onChange={(e) => onChange({ subcategory: e.target.value })}
          disabled={row.type === 'adjustment' || subOptions.length === 0}
          aria-label="Subcategory"
        >
          <option value="">— sub —</option>
          {subOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function RowCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[16px] w-[16px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors',
        checked ? 'border-indigo bg-indigo text-white' : 'border-[#c2c8d8] hover:border-indigo hover:bg-indigo/[0.16]',
      )}
    >
      {checked ? <Icon name="check" size={10} /> : null}
    </button>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'out' }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-[1px] text-[10.5px] font-bold',
        tone === 'out' ? 'bg-out/[0.14] text-out' : 'bg-indigo/[0.12] text-indigo-dark',
      )}
    >
      {children}
    </span>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'in' | 'out' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">{label}</span>
      <span
        className={cn(
          'text-[18px] font-extrabold tabular-nums -tracking-[0.02em]',
          tone === 'out' ? 'text-out' : tone === 'in' ? 'text-in' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}
