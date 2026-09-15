import { Icon, Mono, Num } from '@/components/ui';
import { fmtEUR } from '@/lib/money';
import type { IconName } from '@/components/ui';

/**
 * 4-tile summary strip above the trend table — same 1px-grid pattern as
 * Transactions' StatStrip, so the page reads as part of the same app
 * instead of a bare spreadsheet.
 */
export function TrendsSummary({
  categoryCount,
  latestMonthLabel,
  latestTotal,
  pctChange,
  monthCount,
}: {
  categoryCount: number;
  latestMonthLabel: string;
  latestTotal: number;
  /** null when there's no prior month to compare against. */
  pctChange: number | null;
  monthCount: number;
}) {
  // Spending less than the prior month is the "good" direction.
  const changeTone: 'pos' | 'neg' | 'default' =
    pctChange == null ? 'default' : pctChange <= 0 ? 'pos' : 'neg';
  const changeValue =
    pctChange == null
      ? '—'
      : `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%`;

  const tiles: { label: string; value: string; tone: 'pos' | 'neg' | 'default'; icon: IconName }[] = [
    { label: 'Categories', value: String(categoryCount), tone: 'default', icon: 'tag' },
    { label: latestMonthLabel, value: fmtEUR(latestTotal, { decimals: 0 }), tone: 'default', icon: 'chart' },
    { label: 'Vs prior month', value: changeValue, tone: changeTone, icon: 'pulse' },
    { label: 'History shown', value: `${monthCount} mo`, tone: 'default', icon: 'sort' },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-4">
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
