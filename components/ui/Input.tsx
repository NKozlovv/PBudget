import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-full border border-white/90 bg-white/[0.72] px-[18px] py-[11px] text-[14px] text-ink',
          'backdrop-blur-xl transition-colors duration-200',
          'placeholder:text-ink-mute',
          'hover:bg-white focus:bg-white focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.25)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
