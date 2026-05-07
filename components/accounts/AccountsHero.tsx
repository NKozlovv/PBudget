import { Icon, Mono } from '@/components/ui';
import { fmtEUR } from '@/lib/money';
import { AddAccountButton } from './AddAccountButton';

/**
 * Net-worth hero block at the top of the Accounts page.
 *
 * Mirrors design-refs/src/transactions.jsx const Accounts (lines 132-143):
 * mono kicker · 44/600 tabular balance with mute cents · MTD delta in
 * JBM mono with arrow · brass Add button on the right.
 */
export function AccountsHero({
  totalEUR,
  deltaEUR,
}: {
  totalEUR: number;
  deltaEUR: number;
}) {
  const deltaPct = totalEUR - deltaEUR > 0 ? (deltaEUR / (totalEUR - deltaEUR)) * 100 : 0;
  const deltaIsPos = deltaEUR >= 0;

  // Split the absolute total into integer + cents so we can mute the cents.
  const abs = Math.abs(totalEUR);
  const sign = totalEUR < 0 ? '−' : '';
  const intPart = Math.floor(abs).toLocaleString('en-US');
  const cents = (abs % 1).toFixed(2).slice(1); // ".42"

  return (
    <header className="flex items-end justify-between gap-6 border-b border-rule pb-6">
      <div className="min-w-0">
        <Mono>Net worth</Mono>
        <div
          className="mt-3 font-sans tabular-nums text-ink"
          style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em' }}
        >
          {sign}€{intPart}
          <span className="text-ink-mute">{cents}</span>
        </div>
        <div
          className={
            'mt-1.5 inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold tabular-nums ' +
            (deltaIsPos ? 'text-pos' : 'text-neg')
          }
        >
          <Icon name={deltaIsPos ? 'arrow-up' : 'arrow-down'} size={12} />
          {deltaIsPos ? '+' : '−'}
          {fmtEUR(Math.abs(deltaEUR))}
          {Number.isFinite(deltaPct) && deltaPct !== 0 ? (
            <span className="text-ink-mute">
              ({deltaIsPos ? '+' : '−'}
              {Math.abs(deltaPct).toFixed(1)}%)
            </span>
          ) : null}
          <span className="text-ink-mute">this month</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AddAccountButton />
      </div>
    </header>
  );
}
