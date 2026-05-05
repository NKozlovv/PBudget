import { Icon, Mono, Num } from '@/components/ui';
import { fmtEUR, txToEUR } from '@/lib/money';
import type { IconName } from '@/components/ui';
import type { Transaction } from '@/lib/supabase/types';

/**
 * 4-column In/Out/Net/Avg-per-day stat strip. Sterling 1px-grid pattern:
 * tiles share a `bg-rule` track via `gap-px` so divider lines come for free.
 */
export function StatStrip({
  transactions,
  budgetFxRate,
}: {
  transactions: Transaction[];
  budgetFxRate: number;
}) {
  let inEUR = 0;
  let outEUR = 0;
  const days = new Set<string>();
  for (const t of transactions) {
    days.add(t.date);
    const eur = txToEUR(t, budgetFxRate);
    if (t.type === 'income') inEUR += eur;
    else if (t.type === 'expense') outEUR += eur;
  }
  const net = inEUR - outEUR;
  const dayCount = Math.max(1, days.size);
  const avg = (inEUR + outEUR) / dayCount;

  const tiles: { label: string; value: string; tone: 'pos' | 'neg' | 'default'; icon: IconName }[] = [
    { label: 'In', value: fmtEUR(inEUR), tone: 'pos', icon: 'arrow-up' },
    { label: 'Out', value: fmtEUR(outEUR), tone: 'neg', icon: 'arrow-down' },
    {
      label: 'Net',
      value: `${net >= 0 ? '+' : '−'}${fmtEUR(Math.abs(net))}`,
      tone: net >= 0 ? 'pos' : 'neg',
      icon: 'pulse',
    },
    { label: 'Avg / day', value: fmtEUR(avg), tone: 'default', icon: 'chart' },
  ];

  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-2xl border border-rule bg-rule">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-bg-soft px-5 py-4">
          <div
            className={
              tile.tone === 'pos'
                ? 'flex items-center gap-1.5 text-pos'
                : tile.tone === 'neg'
                  ? 'flex items-center gap-1.5 text-neg'
                  : 'flex items-center gap-1.5 text-ink-mute'
            }
          >
            <Icon name={tile.icon} size={11} />
            <Mono size="xs" tone={tile.tone === 'default' ? 'mute' : tile.tone}>
              {tile.label}
            </Mono>
          </div>
          <div className="mt-1.5">
            <Num size={22} weight={600} tone={tile.tone === 'default' ? 'default' : tile.tone}>
              {tile.value}
            </Num>
          </div>
        </div>
      ))}
    </div>
  );
}
