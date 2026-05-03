import { SignOutButton } from '@/components/auth/SignOutButton';

/**
 * Bottom-of-sidebar identity card. Shows the signed-in user; budget info
 * lives in BudgetSwitcher above this.
 */
export function UserCard({
  email,
  budgetName: _budgetName,
  baseCurrency: _baseCurrency,
}: {
  email: string;
  /** @deprecated kept for API compat; the switcher above shows this. */
  budgetName: string;
  /** @deprecated kept for API compat; the switcher above shows this. */
  baseCurrency: string;
}) {
  void _budgetName;
  void _baseCurrency;
  const initial = (email[0] ?? '?').toUpperCase();
  return (
    <div>
      <div className="flex items-center gap-3 rounded-[10px] border border-rule bg-bg p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-bg"
          style={{
            background:
              'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--ink)))',
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{email}</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-mute">
            signed in
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
