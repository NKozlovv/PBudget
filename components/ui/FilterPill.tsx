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
 * Sign-filter pill (All / Expenses / Income / Adjustments). Rest: white
 * glass on a white border; hover lifts 1px; active/selected is a solid
 * indigo fill with the action shadow. See design_handoff_theus_rehaul
 * README "Transactions" filter row.
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
        'inline-flex items-center gap-1.5 rounded-full px-[18px] py-[10px] text-[13.5px] font-semibold',
        'transition-[transform,background,color,box-shadow] duration-200 ease-theus',
        active
          ? 'bg-indigo text-white [box-shadow:0_8px_20px_rgba(74,92,224,.32)]'
          : 'border border-white/90 bg-white/70 text-ink-soft hover:-translate-y-px hover:bg-white',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      <span>{children}</span>
      {trailingIcon ? <Icon name={trailingIcon} size={13} /> : null}
    </button>
  );
});
