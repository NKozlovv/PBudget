'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { TransactionForm } from './TransactionForm';
import { createTransactionAction } from '@/app/actions/transactions';
import type { Account, Category } from '@/lib/supabase/types';

/**
 * Fired by the Topbar's "+ New" button and by the global "N" keyboard
 * shortcut so a transaction can be added from any page, not just
 * /transactions (which has its own, page-local add flow keyed off
 * ADD_TRANSACTION_EVENT in AddTransactionButton/TransactionsTable).
 */
export const GLOBAL_ADD_TRANSACTION_EVENT = 'transactions:global-add';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function GlobalAddTransactionModal({
  budgetId,
  accounts,
  expenseCats,
  incomeCats,
  subcategoriesByCategory,
  mostUsedSubcategory,
}: {
  budgetId: string;
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategoriesByCategory: Record<string, string[]>;
  mostUsedSubcategory: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpenEvent() {
      setOpen(true);
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'n') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Don't stack on top of another open dialog.
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener(GLOBAL_ADD_TRANSACTION_EVENT, onOpenEvent);
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener(GLOBAL_ADD_TRANSACTION_EVENT, onOpenEvent);
      window.removeEventListener('keydown', onKeydown);
    };
  }, []);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Add transaction"
      description="A new entry on this budget. Press N anywhere to open this."
    >
      <TransactionForm
        budgetId={budgetId}
        accounts={accounts}
        expenseCats={expenseCats}
        incomeCats={incomeCats}
        subcategoriesByCategory={subcategoriesByCategory}
        mostUsedSubcategory={mostUsedSubcategory}
        submitLabel="Add transaction"
        onSubmit={async (input) => {
          const res = await createTransactionAction(input);
          if (res.ok) {
            setOpen(false);
            router.refresh();
          }
          return res;
        }}
        onCancel={() => setOpen(false)}
      />
    </Modal>
  );
}
