'use client';

import { Button, Icon } from '@/components/ui';

/**
 * Header trigger for the add-account modal. Dispatches a window event
 * the AccountsGrid orchestrator listens for, so the page header can
 * stay in a server component.
 */
export const ADD_ACCOUNT_EVENT = 'accounts:add';

export function AddAccountButton() {
  return (
    <Button onClick={() => window.dispatchEvent(new CustomEvent(ADD_ACCOUNT_EVENT))}>
      <Icon name="plus" size={13} />
      Add account
    </Button>
  );
}
