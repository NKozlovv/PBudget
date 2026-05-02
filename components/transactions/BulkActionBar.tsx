'use client';

import { Button, Mono } from '@/components/ui';
import { fmtEUR } from '@/lib/money';

export function BulkActionBar({
  count,
  totalEUR,
  onDelete,
  onClear,
  pending,
}: {
  count: number;
  totalEUR: number;
  onDelete: () => void;
  onClear: () => void;
  pending: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-5 rounded-2xl border border-accent/40 bg-bg-panel px-5 py-3 shadow-2xl">
        <div className="flex items-baseline gap-3">
          <Mono tone="accent">{count} selected</Mono>
          <span className="text-[13px] text-ink-soft">·</span>
          <span className="text-[13px] tabular-nums text-ink-soft">
            net {fmtEUR(totalEUR)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={pending}>
            Clear
          </Button>
          <Button size="sm" onClick={onDelete} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
