'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Mono } from '@/components/ui';
import { TransactionForm } from './TransactionForm';
import { createTransactionAction } from '@/app/actions/transactions';
import { getTransactionFormDataAction, type TransactionFormData } from '@/app/actions/transactionFormData';

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

/**
 * Mounted once in (app)/layout.tsx, prop-less on purpose: its form data
 * (accounts/categories/subcategories) is fetched on demand via a server
 * action the first time it's opened, not eagerly by the layout on every
 * navigation. Cached in state afterwards, so it only ever fetches once per
 * page session (this component doesn't remount on client-side navigation).
 */
export function GlobalAddTransactionModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TransactionFormData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function openModal() {
      setOpen(true);
      if (!data && !loading) {
        setLoading(true);
        getTransactionFormDataAction()
          .then((res) => setData(res))
          .finally(() => setLoading(false));
      }
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'n') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Don't stack on top of another open dialog.
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      openModal();
    }
    window.addEventListener(GLOBAL_ADD_TRANSACTION_EVENT, openModal);
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener(GLOBAL_ADD_TRANSACTION_EVENT, openModal);
      window.removeEventListener('keydown', onKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading]);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Add transaction"
      description="A new entry on this budget. Press N anywhere to open this."
    >
      {data ? (
        <TransactionForm
          budgetId={data.budgetId}
          accounts={data.accounts}
          expenseCats={data.expenseCats}
          incomeCats={data.incomeCats}
          subcategoriesByCategory={data.subcategoriesByCategory}
          mostUsedSubcategory={data.mostUsedSubcategory}
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
      ) : (
        <div className="py-8 text-center">
          <Mono size="xs">{loading ? 'Loading…' : 'Could not load form data.'}</Mono>
        </div>
      )}
    </Modal>
  );
}
