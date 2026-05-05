'use client';

import { Button, Icon } from '@/components/ui';

/**
 * Header trigger for the add-transaction modal. Dispatches a window
 * event the TransactionsTable orchestrator listens for. Keeps the
 * page server component free of state plumbing.
 */
export const ADD_TRANSACTION_EVENT = 'transactions:add';

export function AddTransactionButton() {
  return (
    <Button
      onClick={() => window.dispatchEvent(new CustomEvent(ADD_TRANSACTION_EVENT))}
    >
      <Icon name="plus" size={13} />
      Add transaction
    </Button>
  );
}
