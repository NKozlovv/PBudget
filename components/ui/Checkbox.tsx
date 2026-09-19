'use client';

import { cn } from '@/lib/utils';

/**
 * Standalone labelled checkbox — e.g. BulkEditModal's "change this field?"
 * toggles. Visually distinct from (but in the same style as) the row-select
 * checkbox baked directly into DayGroupedList, which has its own hit-target
 * and stopPropagation needs specific to sitting inside a clickable row.
 */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group/check flex items-center gap-2.5 text-left"
    >
      <span
        className={cn(
          'flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors',
          checked
            ? 'border-indigo bg-indigo'
            : 'border-[#c2c8d8] group-hover/check:border-indigo group-hover/check:bg-indigo/[0.16]',
        )}
      >
        {checked ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[10px] w-[10px]"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        ) : null}
      </span>
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
    </button>
  );
}
