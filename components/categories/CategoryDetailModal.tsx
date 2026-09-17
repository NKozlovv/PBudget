'use client';

import { useEffect, useState } from 'react';
import { Button, Icon, Modal, Mono } from '@/components/ui';
import { NameForm } from './NameForm';
import {
  createSubcategoryAction,
  deleteCategoryAction,
  deleteSubcategoryAction,
  renameCategoryAction,
  renameSubcategoryAction,
} from '@/app/actions/categories';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIcon } from '@/lib/dashboard/categoryIcon';
import { fmtEUR } from '@/lib/money';
import type { CategorySummary, SubcategorySummary } from '@/lib/categories/summary';
import type { Subcategory } from '@/lib/supabase/types';

type SubMode =
  | { kind: 'idle' }
  | { kind: 'add' }
  | { kind: 'rename'; sub: Subcategory }
  | { kind: 'delete'; sub: Subcategory };

/**
 * Drill-down modal for a single category. Shows the subcategories with
 * this-month + YTD totals, and folds Edit / Delete category +
 * Add / Rename / Delete subcategory into one place.
 */
export function CategoryDetailModal({
  open,
  onClose,
  budgetId,
  summary,
  subcategories,
  onMutated,
}: {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  summary: CategorySummary;
  subcategories: SubcategorySummary[];
  /** Called after a successful mutation; the parent page will re-fetch. */
  onMutated: () => void;
}) {
  const [renamingCat, setRenamingCat] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [subMode, setSubMode] = useState<SubMode>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  // Local, optimistic copy of the subcategory list. `router.refresh()` (via
  // `onMutated`) reconciles this with the server on the next render, but we
  // don't want to wait on that round-trip for the modal to reflect an add /
  // rename / delete the user just performed.
  const [localSubs, setLocalSubs] = useState(subcategories);
  useEffect(() => {
    setLocalSubs(subcategories);
  }, [subcategories]);

  const cat = summary.category;
  const color = categoryColor(cat.name);
  const icon = categoryIcon(cat.name);

  function close() {
    setRenamingCat(false);
    setConfirmingDelete(false);
    setSubMode({ kind: 'idle' });
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && close()}
      title={cat.name}
      description={`${summary.subCount} ${summary.subCount === 1 ? 'subcategory' : 'subcategories'} · ${summary.txCountThisMonth} transactions this month`}
    >
      <div className="flex flex-col gap-5">
        {/* Header strip */}
        <div className="glass-tile flex items-center gap-4 !rounded-[16px] p-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[12px]"
            style={{ background: `${color}1F` }}
          >
            <Icon name={icon} size={20} color={color} />
          </span>
          <div className="flex-1">
            <Mono size="xs">This month</Mono>
            <div className="font-mono text-[20px] font-semibold tabular-nums text-ink">
              {fmtEUR(summary.thisMonth, { decimals: 0 })}
            </div>
          </div>
          <div className="border-l border-white/60 pl-4">
            <Mono size="xs">YTD avg / mo</Mono>
            <div className="font-mono text-[14px] font-medium tabular-nums text-ink-soft">
              {fmtEUR(summary.avgMonthly, { decimals: 0 })}
            </div>
          </div>
        </div>

        {/* Subcategories */}
        <div className="glass-tile !rounded-[16px]">
          <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
            <Mono size="xs">Subcategories</Mono>
            <button
              type="button"
              onClick={() => setSubMode({ kind: 'add' })}
              className="text-[12px] text-accent hover:underline"
            >
              + Add subcategory
            </button>
          </div>

          {localSubs.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-ink-mute">
              No subcategories yet.
            </div>
          ) : (
            <ul className="divide-y divide-white/60">
              {localSubs.map((s) => (
                <li
                  key={s.subcategory.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">
                    {s.subcategory.name}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-ink">
                    {fmtEUR(s.thisMonth, { decimals: 0 })}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-ink-mute">
                    YTD {fmtEUR(s.ytd, { decimals: 0 })}
                  </span>
                  <div className="flex items-center gap-1 pl-2">
                    <button
                      type="button"
                      onClick={() => setSubMode({ kind: 'rename', sub: s.subcategory })}
                      className="text-[11px] text-ink-mute hover:text-accent hover:underline"
                    >
                      Rename
                    </button>
                    <span className="text-ink-mute">·</span>
                    <button
                      type="button"
                      onClick={() => setSubMode({ kind: 'delete', sub: s.subcategory })}
                      className="text-[11px] text-ink-mute hover:text-neg hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Category-level actions */}
        <div className="flex items-center justify-between border-t border-white/60 pt-4">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-[12px] text-ink-mute hover:text-neg hover:underline"
          >
            Delete category
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setRenamingCat(true)}>
              Rename
            </Button>
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
          </div>
        </div>

        {error ? (
          <p className="text-[13px] text-neg" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {/* Rename category */}
      {renamingCat ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setRenamingCat(false)}
          title="Rename category"
        >
          <NameForm
            defaultValue={cat.name}
            submitLabel="Save"
            onSubmit={async (newName) => {
              const res = await renameCategoryAction({
                id: cat.id,
                budget_id: budgetId,
                oldName: cat.name,
                newName,
              });
              if (res.ok) {
                setRenamingCat(false);
                onMutated();
              }
              return res;
            }}
            onCancel={() => setRenamingCat(false)}
          />
        </Modal>
      ) : null}

      {/* Delete category */}
      {confirmingDelete ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setConfirmingDelete(false)}
          title={`Delete ${cat.name}?`}
          description={
            summary.ytd > 0
              ? `Transactions labelled "${cat.name}" keep that text but no longer match an active category.`
              : 'No transactions reference this category.'
          }
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const res = await deleteCategoryAction(cat.id);
                if (res.ok) {
                  setConfirmingDelete(false);
                  onMutated();
                  close();
                } else {
                  setError(res.error);
                  setConfirmingDelete(false);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

      {/* Sub: add */}
      {subMode.kind === 'add' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setSubMode({ kind: 'idle' })}
          title={`Add subcategory to ${cat.name}`}
        >
          <NameForm
            submitLabel="Add"
            onSubmit={async (name) => {
              const res = await createSubcategoryAction({ category_id: cat.id, name });
              if (res.ok) {
                setLocalSubs((prev) => [
                  ...prev,
                  {
                    subcategory: { id: res.data.id, category_id: cat.id, name: name.trim() },
                    thisMonth: 0,
                    ytd: 0,
                    avgMonthly: 0,
                    txCountThisMonth: 0,
                  },
                ]);
                setSubMode({ kind: 'idle' });
                onMutated();
              }
              return res;
            }}
            onCancel={() => setSubMode({ kind: 'idle' })}
          />
        </Modal>
      ) : null}

      {/* Sub: rename */}
      {subMode.kind === 'rename' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setSubMode({ kind: 'idle' })}
          title="Rename subcategory"
        >
          <NameForm
            defaultValue={subMode.sub.name}
            submitLabel="Save"
            onSubmit={async (newName) => {
              const sub = subMode.kind === 'rename' ? subMode.sub : null;
              if (!sub) return { ok: false, error: 'Lost subcategory context.' };
              const res = await renameSubcategoryAction({
                id: sub.id,
                budget_id: budgetId,
                parentCategoryName: cat.name,
                oldName: sub.name,
                newName,
              });
              if (res.ok) {
                setLocalSubs((prev) =>
                  prev.map((s) =>
                    s.subcategory.id === sub.id
                      ? { ...s, subcategory: { ...s.subcategory, name: newName.trim() } }
                      : s,
                  ),
                );
                setSubMode({ kind: 'idle' });
                onMutated();
              }
              return res;
            }}
            onCancel={() => setSubMode({ kind: 'idle' })}
          />
        </Modal>
      ) : null}

      {/* Sub: delete */}
      {subMode.kind === 'delete' ? (
        <Modal
          open={true}
          onOpenChange={(o) => !o && setSubMode({ kind: 'idle' })}
          title={`Delete ${subMode.sub.name}?`}
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSubMode({ kind: 'idle' })}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const sub = subMode.kind === 'delete' ? subMode.sub : null;
                if (!sub) return;
                const res = await deleteSubcategoryAction(sub.id);
                if (res.ok) {
                  setLocalSubs((prev) => prev.filter((s) => s.subcategory.id !== sub.id));
                  setSubMode({ kind: 'idle' });
                  onMutated();
                } else {
                  setError(res.error);
                  setSubMode({ kind: 'idle' });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}
    </Modal>
  );
}
