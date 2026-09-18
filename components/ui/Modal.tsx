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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#151a2d]/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn('glass glass-nohover fixed left-1/2 top-1/2 z-50 w-full max-w-md !rounded-[30px] p-6 outline-none', className)}
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
