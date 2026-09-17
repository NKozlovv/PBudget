'use client';

import { Icon, type IconName } from '@/components/ui';
import { fmtCurrency, fmtEUR } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { AccountSummary } from '@/lib/accounts/summary';
import { AccountMiniChart } from './AccountMiniChart';

const PAYROLL_RE = /(payroll|deel|salary|wage|payslip)/i;

function iconFor(name: string): IconName {
  return PAYROLL_RE.test(name) ? 'briefcase' : 'wallet';
}

function subline(name: string, currency: string): string {
  return `${currency === 'EUR' ? 'EUR' : currency === 'USD' ? 'USD' : currency} · ${name.split(/[\s,]/, 1)[0] ?? 'Account'}`;
}

/**
 * Single account card. Click anywhere on the card → opens the edit
 * modal (handled by parent). Layout matches design-refs/src/transactions.jsx
 * Accounts cards (lines 165-192): top color bar, icon tile + name +
 * sub, big native amount, ≈ EUR mute line for non-EUR, MTD delta with
 * arrow + mini chart on the right.
 */
export function AccountCard({
  summary,
  color,
  onEdit,
}: {
  summary: AccountSummary;
  color: string;
  onEdit: () => void;
}) {
  const { account, native, eur, deltaNative, deltaEUR, spark } = summary;
  const showEurLine = account.currency !== 'EUR';
  const symbol = account.currency === 'EUR' ? '€' : account.currency === 'USD' ? '$' : '';
  const isPos = deltaNative >= 0;
  const icon = iconFor(account.name);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="glass group/account relative w-full overflow-hidden !rounded-[26px] p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo"
    >
      {/* Top color bar */}
      <span
        aria-hidden
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{ background: color }}
      />

      {/* Header: icon + name + sub + chevron */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: `${color}24` }}
          >
            <Icon name={icon} size={18} color={color} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-ink">{account.name}</div>
            <div className="truncate text-[11px] text-ink-mute">
              {subline(account.name, account.currency)}
            </div>
          </div>
        </div>
        <Icon
          name="chevron-right"
          size={16}
          className="text-ink-mute transition-colors group-hover/account:text-ink"
        />
      </div>

      {/* Native current balance */}
      <div
        className="font-sans tabular-nums text-ink"
        style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        {symbol}
        {fmtCurrency(native, account.currency, { noSymbol: true })}
      </div>

      {/* ≈ EUR mute line for non-EUR */}
      {showEurLine ? (
        <div className="mt-1 font-mono text-[11px] tabular-nums text-ink-mute">
          ≈ {fmtEUR(eur)}
        </div>
      ) : null}

      {/* Delta + chart */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold tabular-nums',
            isPos ? 'text-pos' : 'text-neg',
          )}
        >
          <Icon name={isPos ? 'arrow-up' : 'arrow-down'} size={11} />
          {isPos ? '+' : '−'}
          {symbol}
          {fmtCurrency(Math.abs(deltaNative), account.currency, { noSymbol: true, decimals: 0 })}
          {showEurLine ? (
            <span className="text-ink-mute">
              · ≈ {isPos ? '+' : '−'}
              {fmtEUR(Math.abs(deltaEUR), { decimals: 0 })}
            </span>
          ) : null}
        </div>
        <div className="w-[220px] shrink-0">
          <AccountMiniChart data={spark} color={color} width={220} height={70} />
        </div>
      </div>
    </button>
  );
}

/** Dashed-border placeholder card matching design-refs lines 195-199. */
export function AddAccountCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[26px] border-[1.5px] border-dashed border-white/90 bg-transparent p-5 text-ink-mute transition-colors hover:border-indigo hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo"
    >
      <Icon name="plus" size={20} />
      <div className="text-[13px] font-medium">Add account</div>
      <div className="text-[11px]">Bank, brokerage, cash, USD payroll</div>
    </button>
  );
}
