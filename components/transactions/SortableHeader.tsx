'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TxSortField } from '@/lib/data/transactions';

export function SortableHeader({
  field,
  children,
  align = 'left',
  className = '',
}: {
  field: TxSortField;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentSort = (params.get('sort') ?? 'date') as TxSortField;
  const currentDir = (params.get('dir') ?? 'desc') as 'asc' | 'desc';
  const active = currentSort === field;

  function onClick() {
    const next = new URLSearchParams(params.toString());
    if (active) {
      next.set('dir', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      next.set('sort', field);
      next.set('dir', field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <th
      className={cn(
        'px-4 py-3 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 hover:text-ink transition-colors',
          active && 'text-ink',
        )}
      >
        <span>{children}</span>
        <span className="text-[8px]" aria-hidden>
          {active ? (currentDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
