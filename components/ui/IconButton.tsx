'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
  /** Rotates the icon 180° over 200ms — used by the Categories disclosure caret. */
  rotated?: boolean;
};

/**
 * Round glass icon button — the top-nav notification bell, the Categories
 * disclosure caret, and similar icon-only controls. Lifts 1px on hover
 * like other pills/buttons; never the level-1 panel hover.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, size = 38, iconSize = 18, strokeWidth = 1.7, rotated, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      style={{ width: size, height: size }}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-white/[0.75] text-ink-soft transition-[transform,background] duration-200 ease-theus',
        'hover:-translate-y-px hover:bg-white',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <Icon
        name={icon}
        size={iconSize}
        strokeWidth={strokeWidth}
        className={cn('transition-transform duration-200 ease-theus', rotated && 'rotate-180')}
      />
    </button>
  );
});
