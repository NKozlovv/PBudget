import { SignOutButton } from '@/components/auth/SignOutButton';

/**
 * Bottom-of-sidebar identity card.
 * Modeled on design-refs/src/dashboard.jsx 38–46.
 */
export function UserCard({
  email,
  budgetName,
  baseCurrency,
}: {
  email: string;
  budgetName: string;
  baseCurrency: string;
}) {
  const initial = (email[0] ?? '?').toUpperCase();
  return (
    <div>
      <div className="flex items-center gap-3 rounded-[10px] border border-rule bg-bg p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-bg"
          style={{
            background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--ink)))',
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{email}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-ink-mute font-mono">
            {budgetName} · {baseCurrency}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
