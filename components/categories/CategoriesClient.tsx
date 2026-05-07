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
}: {
  budgetId: string;
  expense: CategorySummary[];
  income: CategorySummary[];
  /** category.id → its subcategory summaries (this month + YTD). */
  subSummariesByCatId: Record<string, SubcategorySummary[]>;
}) {
  const router = useRouter();
  const [openCatId, setOpenCatId] = useState<string | null>(null);
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
  const openSummary = openCatId
    ? allSummaries.find((s) => s.category.id === openCatId) ?? null
    : null;

  return (
    <>
      <CategoriesSummaryCard summaries={expense} />

      <div className="mt-5">
        <div className="overflow-hidden rounded-2xl border border-rule bg-bg-soft">
          <div className="grid grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_110px_28px] gap-4 border-b border-rule bg-bg px-5 py-3">
            <span />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Category
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Spent / Avg
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Progress
            </span>
            <span className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Avg / month
            </span>
            <span />
          </div>

          {expense.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-ink-mute">
              No expense categories yet.
            </div>
          ) : (
            expense.map((s, i) => (
              <CategoryRow
                key={s.category.id}
                summary={s}
                onClick={() => setOpenCatId(s.category.id)}
                isLast={i === expense.length - 1}
              />
            ))
          )}
        </div>
      </div>

      <IncomeRecap summaries={income} />

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

      {/* Add income category (button below the income recap) */}
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

      {/* Drill-down */}
      {openSummary ? (
        <CategoryDetailModal
          open={true}
          onClose={() => setOpenCatId(null)}
          budgetId={budgetId}
          summary={openSummary}
          subcategories={subSummariesByCatId[openSummary.category.id] ?? []}
          onMutated={() => router.refresh()}
        />
      ) : null}

      {/* Inline trigger for adding an income category — small ghost link
          below the recap. Lives here because the page header's
          AddCategoryButton dispatches an expense add by default. */}
      {income.length === 0 && expense.length === 0 ? null : (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setAddingIncome(true)}
            className="text-[12px] text-ink-mute hover:text-accent hover:underline"
          >
            + New income category
          </button>
        </div>
      )}
    </>
  );
}
