'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rule bg-bg-soft p-6 shadow-2xl outline-none',
            className,
          )}
        >
          <Dialog.Title className="text-[18px] font-semibold tracking-tight">{title}</Dialog.Title>
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
