import { fmtEUR } from '@/lib/money';
import type { CategorySummary } from '@/lib/categories/summary';

/**
 * Three stat cards — Spent / YTD average / pace vs average (design_handoff_
 * theus_rehaul README "Categories"). Same glass-card construction as the
 * Transactions stat strip. Expense categories only — income has its own
 * recap section below the table.
 */
export function CategoriesSummaryCard({
  summaries,
  monthLabel,
}: {
  summaries: CategorySummary[];
  monthLabel: string;
}) {
  const totalThisMonth = summaries.reduce((s, x) => s + x.thisMonth, 0);
  const totalAvg = summaries.reduce((s, x) => s + x.avgMonthly, 0);
  const pace = totalThisMonth - totalAvg;
  const over = pace > 0;

  const tiles = [
    { hue: 'var(--coral)', label: `Spent · ${monthLabel}`, value: fmtEUR(totalThisMonth, { decimals: 0 }), color: '#d94a6f' },
    { hue: 'var(--indigo)', label: 'YTD average', value: fmtEUR(totalAvg, { decimals: 0 }), color: '#3a49c4' },
    {
      hue: over ? 'var(--amber)' : 'var(--teal)',
      label: over ? 'Over pace by' : 'Under pace by',
      value: `${pace >= 0 ? '+' : ''}${fmtEUR(pace, { decimals: 0 })}`,
      color: over ? '#d94a6f' : '#12a08c',
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="glass !rounded-[22px] p-5 px-[22px]">
          <div className="flex items-center gap-2">
            <span className="h-[9px] w-[9px] shrink-0 rounded-[2px]" style={{ background: tile.hue }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">{tile.label}</span>
          </div>
          <div
            className="mt-2 text-[27px] font-extrabold -tracking-[0.03em] tabular-nums"
            style={{ color: tile.color }}
          >
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}
