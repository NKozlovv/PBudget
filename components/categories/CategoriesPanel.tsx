'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, Modal, Mono, Num } from '@/components/ui';
import { NameForm } from './NameForm';
import {
  createCategoryAction,
  createSubcategoryAction,
  deleteCategoryAction,
  deleteSubcategoryAction,
  renameCategoryAction,
  renameSubcategoryAction,
} from '@/app/actions/categories';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import type { Category, Subcategory } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'addCat' }
  | { kind: 'editCat'; cat: Category }
  | { kind: 'deleteCat'; cat: Category; impact: number }
  | { kind: 'addSub'; cat: Category }
  | { kind: 'editSub'; cat: Category; sub: Subcategory }
  | { kind: 'deleteSub'; sub: Subcategory; cat: Category };

export function CategoriesPanel({
  budgetId,
  kind,
  title,
  categories,
  subcategoriesById,
  totalsThisMonth,
  totalsYTD,
  subTotalsYTD,
}: {
  budgetId: string;
  kind: 'expense' | 'income';
  title: string;
  categories: Category[];
  /** category.id → subcategories[] */
  subcategoriesById: Record<string, Subcategory[]>;
  /** category name → EUR this month */
  totalsThisMonth: Record<string, number>;
  /** category name → EUR YTD */
  totalsYTD: Record<string, number>;
  /** "category::subcategory" → EUR YTD */
  subTotalsYTD: Record<string, number>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  const totalThisMonth = useMemo(
    () => Object.values(totalsThisMonth).reduce((s, v) => s + v, 0),
    [totalsThisMonth],
  );

  function close() {
    setMode({ kind: 'idle' });
    setError(null);
  }

  async function refresh() {
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={
          <Mono size="xs">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </Mono>
        }
        right={
          <Mono size="xs" tone={kind === 'expense' ? 'neg' : 'pos'}>
            {fmtEUR(totalThisMonth, { decimals: 0 })} this month
          </Mono>
        }
      />

      <div className="mt-5 flex flex-col gap-1.5">
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-mute">
            No {kind} categories yet.
          </p>
        ) : (
          categories.map((c) => {
            const subs = subcategoriesById[c.id] ?? [];
            const thisMonth = totalsThisMonth[c.name] ?? 0;
            const ytd = totalsYTD[c.name] ?? 0;
            return (
              <CategoryRow
                key={c.id}
                cat={c}
                subs={subs}
                thisMonth={thisMonth}
                ytd={ytd}
                kind={kind}
                onEdit={() => setMode({ kind: 'editCat', cat: c })}
                onDelete={() =>
                  setMode({ kind: 'deleteCat', cat: c, impact: ytd })
                }
                onAddSub={() => setMode({ kind: 'addSub', cat: c })}
                onEditSub={(sub) => setMode({ kind: 'editSub', cat: c, sub })}
                onDeleteSub={(sub) => setMode({ kind: 'deleteSub', cat: c, sub })}
                subTotalsYTD={subTotalsYTD}
              />
            );
          })
        )}
      </div>

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode({ kind: 'addCat' })}
        >
          + Add {kind} category
        </Button>
      </div>

      <Modal
        open={mode.kind === 'addCat'}
        onOpenChange={(o) => !o && close()}
        title={`Add ${kind} category`}
      >
        <NameForm
          submitLabel="Add"
          placeholder={kind === 'expense' ? 'Food, Transport…' : 'Salary, Side income…'}
          onSubmit={async (name) => {
            const res = await createCategoryAction({ budget_id: budgetId, name, kind });
            if (res.ok) {
              close();
              await refresh();
            }
            return res;
          }}
          onCancel={close}
        />
      </Modal>

      {mode.kind === 'editCat' ? (
        <Modal open onOpenChange={(o) => !o && close()} title="Rename category">
          <NameForm
            defaultValue={mode.cat.name}
            submitLabel="Save"
            onSubmit={async (newName) => {
              const res = await renameCategoryAction({
                id: mode.cat.id,
                budget_id: budgetId,
                oldName: mode.cat.name,
                newName,
              });
              if (res.ok) {
                close();
                await refresh();
              }
              return res;
            }}
            onCancel={close}
          />
        </Modal>
      ) : null}

      {mode.kind === 'deleteCat' ? (
        <Modal
          open
          onOpenChange={(o) => !o && close()}
          title={`Delete ${mode.cat.name}?`}
          description={
            mode.impact > 0
              ? `Transactions labelled “${mode.cat.name}” keep that text but no longer match an active category. You can reassign them on /transactions.`
              : `No transactions reference this category.`
          }
        >
          {error ? (
            <p className="mb-3 text-[13px] text-neg" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const res = await deleteCategoryAction(mode.cat.id);
                if (res.ok) {
                  close();
                  await refresh();
                } else {
                  setError(res.error);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

      {mode.kind === 'addSub' ? (
        <Modal open onOpenChange={(o) => !o && close()} title={`Add subcategory to ${mode.cat.name}`}>
          <NameForm
            submitLabel="Add"
            onSubmit={async (name) => {
              const res = await createSubcategoryAction({ category_id: mode.cat.id, name });
              if (res.ok) {
                close();
                await refresh();
              }
              return res;
            }}
            onCancel={close}
          />
        </Modal>
      ) : null}

      {mode.kind === 'editSub' ? (
        <Modal open onOpenChange={(o) => !o && close()} title="Rename subcategory">
          <NameForm
            defaultValue={mode.sub.name}
            submitLabel="Save"
            onSubmit={async (newName) => {
              const res = await renameSubcategoryAction({
                id: mode.sub.id,
                budget_id: budgetId,
                parentCategoryName: mode.cat.name,
                oldName: mode.sub.name,
                newName,
              });
              if (res.ok) {
                close();
                await refresh();
              }
              return res;
            }}
            onCancel={close}
          />
        </Modal>
      ) : null}

      {mode.kind === 'deleteSub' ? (
        <Modal open onOpenChange={(o) => !o && close()} title={`Delete ${mode.sub.name}?`}>
          {error ? (
            <p className="mb-3 text-[13px] text-neg" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const res = await deleteSubcategoryAction(mode.sub.id);
                if (res.ok) {
                  close();
                  await refresh();
                } else {
                  setError(res.error);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

function CategoryRow({
  cat,
  subs,
  thisMonth,
  ytd,
  kind,
  onEdit,
  onDelete,
  onAddSub,
  onEditSub,
  onDeleteSub,
  subTotalsYTD,
}: {
  cat: Category;
  subs: Subcategory[];
  thisMonth: number;
  ytd: number;
  kind: 'expense' | 'income';
  onEdit: () => void;
  onDelete: () => void;
  onAddSub: () => void;
  onEditSub: (sub: Subcategory) => void;
  onDeleteSub: (sub: Subcategory) => void;
  subTotalsYTD: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const hasSubs = subs.length > 0;

  return (
    <div className="rounded-lg border border-rule bg-bg/40 transition-colors hover:bg-bg-panel/30">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 min-w-0 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ background: categoryColor(cat.name) }}
            aria-hidden
          />
          <span className="truncate text-[14px] font-medium text-ink">{cat.name}</span>
          {hasSubs ? (
            <span className="text-[10px] uppercase tracking-[0.06em] text-ink-mute font-medium">
              {open ? '▾' : '▸'} {subs.length}
            </span>
          ) : null}
        </button>
        <div className="flex shrink-0 items-baseline gap-4">
          <div className="text-right">
            <Num size={13} weight={500} tone={kind === 'expense' ? 'neg' : 'pos'}>
              {fmtEUR(thisMonth, { decimals: 0 })}
            </Num>
            <div className="text-[10px] uppercase tracking-[0.06em] text-ink-mute font-medium">
              this mo
            </div>
          </div>
          <div className="text-right">
            <Num size={13} weight={500} tone="soft">
              {fmtEUR(ytd, { decimals: 0 })}
            </Num>
            <div className="text-[10px] uppercase tracking-[0.06em] text-ink-mute font-medium">
              ytd
            </div>
          </div>
          <div className="flex items-center gap-1 pl-3 border-l border-rule">
            <button
              type="button"
              onClick={onEdit}
              className="text-[12px] text-ink-soft hover:text-accent hover:underline"
            >
              Edit
            </button>
            <span className="text-ink-mute">·</span>
            <button
              type="button"
              onClick={onDelete}
              className="text-[12px] text-ink-soft hover:text-neg hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-rule/60 px-4 py-3 flex flex-col gap-1">
          {subs.map((s) => {
            const ytdSub = subTotalsYTD[`${cat.name}::${s.name}`] ?? 0;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 py-1 text-[13px]"
              >
                <span className="text-ink-mute pl-6">↳</span>
                <span className="flex-1 truncate text-ink-soft">{s.name}</span>
                <Num size={12} tone="mute">
                  {fmtEUR(ytdSub, { decimals: 0 })}
                </Num>
                <div className="flex items-center gap-1 pl-3">
                  <button
                    type="button"
                    onClick={() => onEditSub(s)}
                    className="text-[11px] text-ink-mute hover:text-accent hover:underline"
                  >
                    Edit
                  </button>
                  <span className="text-ink-mute">·</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSub(s)}
                    className="text-[11px] text-ink-mute hover:text-neg hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={onAddSub}
            className="ml-6 text-left text-[12px] text-accent hover:underline"
          >
            + Add subcategory
          </button>
        </div>
      ) : null}
    </div>
  );
}
