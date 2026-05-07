'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type Horizon = 3 | 6 | 12 | 24;

const OPTIONS: { value: Horizon; label: string }[] = [
  { value: 3, label: '3 mo' },
  { value: 6, label: '6 mo' },
  { value: 12, label: '12 mo' },
  { value: 24, label: '24 mo' },
];

/** Pill-row segmented control used in the Forecast page header. */
export function HorizonToggle({ current }: { current: Horizon }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(value: Horizon) {
    const next = new URLSearchParams(params.toString());
    if (value === 3) next.delete('h');
    else next.set('h', String(value));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-[10px] border border-rule bg-surface p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => set(opt.value)}
          className={cn(
            'rounded-[7px] px-3.5 py-1.5 text-[12px] font-medium transition-colors',
            current === opt.value
              ? 'bg-bg text-ink'
              : 'bg-transparent text-ink-mute hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
