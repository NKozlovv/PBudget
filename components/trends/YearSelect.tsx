'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useDismissable } from '@/components/ui/useDismissable';
import { cn } from '@/lib/utils';

/** "{year} ▾" glass button — design_handoff_theus_rehaul README "Trends" header. */
export function YearSelect({ years, selected }: { years: number[]; selected: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  function select(y: number) {
    setOpen(false);
    router.push(`${pathname}?year=${y}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/90 px-[17px] py-[9px] text-[13.5px] font-semibold text-ink [background:var(--glass-sheen-tile)] backdrop-blur-xl transition-[transform,background] duration-200 ease-theus hover:-translate-y-0.5 hover:bg-white"
      >
        {selected}
        <Icon name="chevron-down" size={13} className={cn('transition-transform duration-200 ease-theus', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="glass glass-nohover absolute right-0 top-full z-30 mt-2 min-w-[100px] !rounded-[14px] p-1">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => select(y)}
              className={cn(
                'block w-full rounded-[10px] px-3 py-2 text-left text-[13.5px] font-semibold transition-colors',
                y === selected ? 'bg-indigo/[0.12] text-indigo-dark' : 'text-ink-soft hover:bg-white/70 hover:text-ink',
              )}
            >
              {y}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
