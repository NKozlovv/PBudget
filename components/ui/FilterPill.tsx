'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

type FilterPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: IconName;
  trailingIcon?: IconName;
};

/**
 * Sterling filter pill — used in transactions filter row and similar
 * inline-filter UIs. `active` inverts to ink-on-bg.
 */
export const FilterPill = forwardRef<HTMLButtonElement, FilterPillProps>(function FilterPill(
  { active, icon, trailingIcon, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-bg'
          : 'border-rule bg-surface text-ink-soft hover:text-ink hover:border-line-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      <span>{children}</span>
      {trailingIcon ? <Icon name={trailingIcon} size={12} /> : null}
    </button>
  );
});
