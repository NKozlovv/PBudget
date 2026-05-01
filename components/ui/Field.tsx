'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (props: { id: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[12px] font-medium text-ink-soft">
        {label}
      </label>
      {children({ id })}
      {error ? (
        <p className="text-[12px] text-neg" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-mute">{hint}</p>
      ) : null}
    </div>
  );
}
