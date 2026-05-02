import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-[10px] border border-rule bg-bg px-3.5 py-2.5 pr-9 text-[14px] text-ink',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'bg-[length:11px_11px] bg-[right_14px_center] bg-no-repeat',
          className,
        )}
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 11 11\'><path d=\'M2 4 L5.5 7.5 L9 4\' stroke=\'%238E866E\' stroke-width=\'1.4\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")',
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);
