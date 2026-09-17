'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(180deg,#5a6be8,#4152d6)] text-white ' +
    '[box-shadow:0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] ' +
    'hover:bg-[linear-gradient(180deg,#3a49c4,#3a49c4)] hover:-translate-y-0.5 ' +
    'hover:[box-shadow:0_12px_26px_rgba(74,92,224,.42)]',
  secondary:
    'border border-white/90 text-ink [background:var(--glass-sheen-tile)] backdrop-blur-xl ' +
    'hover:bg-white hover:-translate-y-0.5',
  ghost: 'text-ink-soft hover:text-ink hover:bg-white/60',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-[12.5px] rounded-full gap-1.5',
  md: 'px-[17px] py-[9px] text-[13.5px] rounded-full gap-1.5',
  icon: 'p-2 rounded-full',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

/**
 * Capsule button — 999px radius, five states, 200ms movement / 160ms
 * state transitions (design_handoff_theus_rehaul README "Panel hover
 * contract"). Buttons lift 2px on hover; they never use the level-1
 * panel hover (translateY(-3px) + brighten) — that's reserved for glass
 * panels themselves.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-sans font-bold',
        'transition-[transform,box-shadow,background,color] duration-200 ease-theus',
        'focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(74,92,224,.25)]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
