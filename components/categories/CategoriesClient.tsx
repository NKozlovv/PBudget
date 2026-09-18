'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { CategoriesSummaryCard } from './CategoriesSummaryCard';
import { CategoryRow } from './CategoryRow';
import { CategoryDetailModal } from './CategoryDetailModal';
import { IncomeRecap } from './IncomeRecap';
import { NameForm } from './NameForm';
import { ADD_CATEGORY_EVENT } from './AddCategoryButton';
import { createCategoryAction } from '@/app/actions/categories';
import type { CategorySummary, SubcategorySummary } from '@/lib/categories/summary';

export function CategoriesClient({
  budgetId,
  expense,
  income,
  subSummariesByCatId,
  monthLabel,
}: {
  budgetId: string;
  expense: CategorySummary[];
  income: CategorySummary[];
  /** category.id → its subcategory summaries (this month + YTD). */
  subSummariesByCatId: Record<string, SubcategorySummary[]>;
  monthLabel: string;
}) {
  const router = useRouter();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [addingExpense, setAddingExpense] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);

  useEffect(() => {
    function onAdd() {
      setAddingExpense(true);
    }
    window.addEventListener(ADD_CATEGORY_EVENT, onAdd);
    return () => window.removeEventListener(ADD_CATEGORY_EVENT, onAdd);
  }, []);

  const allSummaries = [...expense, ...income];
  const editingSummary = editingCatId
    ? allSummaries.find((s) => s.category.id === editingCatId) ?? null
    : null;

  return (
    <>
      <CategoriesSummaryCard summaries={expense} monthLabel={monthLabel} />

      <div className="glass !rounded-[26px] p-[10px]">
        {expense.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink-mute">No expense categories yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(150px,1.1fr)_minmax(0,1.6fr)_110px_100px_34px] gap-4 px-[18px] pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              <span>Category</span>
              <span>Pace vs avg</span>
              <span>This month</span>
              <span>YTD avg / mo</span>
              <span />
            </div>
            {expense.map((s) => (
              <CategoryRow
                key={s.category.id}
                summary={s}
                open={openCategory === s.category.id}
                onToggle={() => setOpenCategory((cur) => (cur === s.category.id ? null : s.category.id))}
                onEdit={() => setEditingCatId(s.category.id)}
                subcategories={subSummariesByCatId[s.category.id] ?? []}
              />
            ))}
          </>
        )}
      </div>

      <IncomeRecap summaries={income} onEdit={(id) => setEditingCatId(id)} onAdd={() => setAddingIncome(true)} />

      {/* Add expense category (from header button) */}
      <Modal
        open={addingExpense}
        onOpenChange={(o) => !o && setAddingExpense(false)}
        title="New expense category"
      >
        <NameForm
          submitLabel="Add"
          placeholder="Food, Transport…"
          onSubmit={async (name) => {
            const res = await createCategoryAction({ budget_id: budgetId, name, kind: 'expense' });
            if (res.ok) {
              setAddingExpense(false);
              router.refresh();
            }
            return res;
          }}
          onCancel={() => setAddingExpense(false)}
        />
      </Modal>

      {/* Add income category (button in the income recap's own header) */}
      <Modal
        open={addingIncome}
        onOpenChange={(o) => !o && setAddingIncome(false)}
        title="New income category"
      >
        <NameForm
          submitLabel="Add"
          placeholder="Salary, Side income…"
          onSubmit={async (name) => {
            const res = await createCategoryAction({ budget_id: budgetId, name, kind: 'income' });
            if (res.ok) {
              setAddingIncome(false);
              router.refresh();
            }
            return res;
          }}
          onCancel={() => setAddingIncome(false)}
        />
      </Modal>

      {/* Rename/delete category, add/rename/delete subcategory — the
          mockup's row has no room for this, so it's reached via the
          row's hue tile (CategoryRow) or the income recap row instead. */}
      {editingSummary ? (
        <CategoryDetailModal
          open={true}
          onClose={() => setEditingCatId(null)}
          budgetId={budgetId}
          summary={editingSummary}
          subcategories={subSummariesByCatId[editingSummary.category.id] ?? []}
          onMutated={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
