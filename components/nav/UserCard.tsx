import { SignOutButton } from '@/components/auth/SignOutButton';
import { Icon } from '@/components/ui/Icon';

/**
 * Bottom-of-sidebar identity card. Modeled on design-refs/src/dashboard.jsx
 * 38-47: 32x32 gradient circular avatar with first initial, name in
 * Inter 12/600, "EUR · primary" subtitle in JBM 10/inkMute, settings
 * icon button on the right.
 */
export function UserCard({
  email,
  budgetName: _budgetName,
  baseCurrency,
}: {
  email: string;
  /** @deprecated kept for API compat; the switcher above shows this. */
  budgetName: string;
  baseCurrency: string;
}) {
  void _budgetName;
  const initial = (email[0] ?? '?').toUpperCase();
  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface p-3">
        <div
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hi))',
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-ink">{email}</div>
          <div className="mt-0.5 font-mono text-[10px] text-ink-mute">
            {baseCurrency} · primary
          </div>
        </div>
        <button
          type="button"
          aria-label="Settings"
          className="flex shrink-0 items-center justify-center rounded-md p-1 text-ink-mute hover:text-ink"
        >
          <Icon name="settings" size={14} />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
