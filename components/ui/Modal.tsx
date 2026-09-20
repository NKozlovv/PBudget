'use client';

import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// Module-level (not per-instance) — several screens nest a Modal inside
// another (e.g. CategoryDetailModal's rename/delete confirmations stay
// open underneath it, per Radix Dialog's own nesting support). A plain
// per-instance boolean toggle would remove the pause the moment the INNER
// modal closes, even though the outer one is still on screen. Counting
// how many Modal instances are currently open — across the whole app, not
// just one component tree — means the class only comes off once the last
// one closes.
let openModalCount = 0;

function markModalOpen() {
  openModalCount += 1;
  document.documentElement.classList.add('modal-open');
}

function markModalClosed() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.documentElement.classList.remove('modal-open');
  }
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Pausing the continuously-animating .ambient-blob elements while a
  // modal is open (kept below — harmless, and still a reasonable thing to
  // do) did NOT stop the reported white flash. That means backdrop-filter
  // on a fixed, viewport-covering element is itself the trigger (a known
  // Chromium/WebKit GPU-compositing bug), independent of whatever's
  // animating behind it — not something pausing the background fixes.
  // Overlay and Content below now use plain opaque-ish backgrounds instead
  // of backdrop-filter (see .modal-surface, app/globals.css) to remove
  // that combination entirely.
  useEffect(() => {
    if (!open) return;
    markModalOpen();
    return () => markModalClosed();
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#151a2d]/55" />
        <Dialog.Content
          className={cn('modal-surface fixed left-1/2 top-1/2 z-50 w-full max-w-md !rounded-[30px] p-6 outline-none', className)}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Dialog.Title className="text-[19px] font-bold -tracking-[0.02em] text-ink">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-[13px] text-ink-soft">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
