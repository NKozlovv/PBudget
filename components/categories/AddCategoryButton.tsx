'use client';

import { Button, Icon } from '@/components/ui';

export const ADD_CATEGORY_EVENT = 'categories:add';

export function AddCategoryButton() {
  return (
    <Button onClick={() => window.dispatchEvent(new CustomEvent(ADD_CATEGORY_EVENT))}>
      <Icon name="plus" size={13} />
      New category
    </Button>
  );
}
