import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-[10px] border border-rule bg-bg px-3.5 py-2.5 text-[14px] text-ink',
          'placeholder:text-ink-mute',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
