import { fmtEUR, txToEUR } from '@/lib/money';
import type { Transaction } from '@/lib/supabase/types';

/**
 * Three stat cards — Money in / Money out / Net (design_handoff_theus_
 * rehaul README "Transactions"). Same glass-card + hover contract as
 * every other level-1 panel.
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
  for (const t of transactions) {
    const eur = txToEUR(t, budgetFxRate);
    if (t.type === 'income') inEUR += eur;
    else if (t.type === 'expense') outEUR += eur;
  }
  const net = inEUR - outEUR;

  const tiles = [
    { hue: 'var(--teal)', label: 'Money in', value: fmtEUR(inEUR), color: '#12a08c' },
    { hue: 'var(--coral)', label: 'Money out', value: fmtEUR(-outEUR), color: '#d94a6f' },
    { hue: 'var(--navy)', label: 'Net', value: fmtEUR(net), color: '#151a2d' },
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
