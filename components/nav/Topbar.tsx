'use client';

import { Icon } from '@/components/ui/Icon';
import { GLOBAL_ADD_TRANSACTION_EVENT } from '@/components/transactions/GlobalAddTransactionModal';

/**
 * Topbar — visual 1:1 match with design-refs/src/dashboard.jsx 52-68.
 * Search and bell are non-functional placeholders. The "+ New" button
 * (and the global "N" shortcut) opens GlobalAddTransactionModal, mounted
 * once in the app shell.
 */
export function Topbar({
  fxRate,
  baseCurrency,
}: {
  fxRate?: number | null;
  baseCurrency?: string;
}) {
  const fxLabel =
    fxRate && baseCurrency
      ? `1 USD = ${fxRate.toFixed(3)} ${baseCurrency}`
      : '1 USD = — EUR';
  return (
    <header className="flex items-center gap-4 border-b border-line px-8 py-5">
      {/* Search visual */}
      <div className="flex max-w-[380px] flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-2">
        <Icon name="search" size={14} className="text-ink-mute" />
        <span className="text-[13px] text-ink-mute">Search transactions, accounts…</span>
        <span className="ml-auto rounded-[4px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
          ⌘ K
        </span>
      </div>

      {/* FX chip */}
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-[7px] font-mono text-[11px] text-ink-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-pos" />
        {fxLabel}
      </div>

      {/* Bell */}
      <button
        type="button"
        aria-label="Notifications"
        className="flex items-center justify-center rounded-lg border border-line bg-transparent p-[7px] text-ink-soft hover:bg-surface"
      >
        <Icon name="bell" size={15} />
      </button>

      {/* New */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(GLOBAL_ADD_TRANSACTION_EVENT))}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:brightness-110"
        title="Add transaction (N)"
      >
        <Icon name="plus" size={14} />
        New
      </button>
    </header>
  );
}
