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
    <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(31,39,66,.06)] p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => set(opt.value)}
          className={cn(
            'whitespace-nowrap rounded-full px-[17px] py-[9px] text-[13px] font-bold transition-colors duration-200',
            current === opt.value
              ? 'bg-white text-ink shadow-[0_4px_12px_-6px_rgba(31,39,66,.3)]'
              : 'bg-transparent text-ink-soft hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
