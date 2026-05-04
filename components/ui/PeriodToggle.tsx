'use client';

import { cn } from '@/lib/utils';

const DEFAULT_OPTIONS = ['Week', 'Month', 'Quarter', 'YTD', 'All'] as const;

/**
 * Segmented pill group. Modeled on design-refs/src/dashboard.jsx 117-121:
 * 4px-padded surface container with 1px line border, options as buttons
 * (7/14 padding, 7px radius). Active option uses bg/ink, inactive uses
 * transparent/inkMute.
 */
export function PeriodToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (next: T) => void;
  options?: readonly T[];
  className?: string;
}) {
  const opts = (options ?? (DEFAULT_OPTIONS as readonly string[])) as readonly T[];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface p-1',
        className,
      )}
    >
      {opts.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-[7px] px-3.5 py-[7px] text-[12px] font-medium transition-colors',
              active ? 'bg-bg text-ink' : 'bg-transparent text-ink-mute hover:text-ink-soft',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
