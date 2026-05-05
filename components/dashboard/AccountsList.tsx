import Link from 'next/link';
import { Card } from '@/components/ui';
import type { Account } from '@/lib/supabase/types';
import { fmtCurrency, fmtEUR } from '@/lib/money';
import { categoryColor } from '@/lib/categoryColor';

export interface AccountRow {
  account: Account;
  native: number;
  eur: number;
}

/**
 * Accounts list card. Modeled on design-refs/src/dashboard.jsx 239-267:
 * per-row tinted initial tile + name/sub + native amount + share-of-total.
 */
export function AccountsList({ rows }: { rows: AccountRow[] }) {
  const totalEUR = rows.reduce((s, r) => s + r.eur, 0);
  const sorted = [...rows].sort((a, b) => b.eur - a.eur);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Accounts</h2>
        <Link href="/accounts" className="text-[11px] text-accent hover:underline">
          Manage →
        </Link>
      </div>

      <ul className="mt-4 flex flex-col">
        {sorted.length === 0 ? (
          <li className="py-3 text-sm text-ink-mute">No accounts yet.</li>
        ) : (
          sorted.map(({ account, native, eur }, i) => {
            const share = totalEUR > 0 ? Math.round((eur / totalEUR) * 100) : 0;
            const color = categoryColor(account.name);
            const last = i === sorted.length - 1;
            return (
              <li
                key={account.id}
                className={`flex items-center gap-3 py-2.5 ${last ? '' : 'border-b border-rule'}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold"
                  style={{ background: `${color}2E`, color }}
                >
                  {account.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{account.name}</div>
                  <div className="truncate text-[11px] text-ink-mute">
                    {account.currency} · {account.currency === 'EUR' ? 'primary' : 'foreign'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                    {fmtCurrency(native, account.currency, { decimals: 2 })}
                  </div>
                  <div className="font-mono text-[10px] text-ink-mute">
                    {share}% · {fmtEUR(eur, { decimals: 0 })}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
