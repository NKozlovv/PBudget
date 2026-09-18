import { fmtEUR } from '@/lib/money';

/**
 * Three stat cards — Net worth / This month / Accounts (same glass-card
 * construction as the Transactions and Categories stat strips — see
 * StatStrip.tsx / CategoriesSummaryCard.tsx). Accounts wasn't one of the
 * four design_handoff_theus_rehaul screens, but every other page in the
 * app opens on this exact pattern, so it follows suit rather than the
 * bespoke Sterling-era hero (big mono-kicker balance) it used before.
 */
export function AccountsHero({
  totalEUR,
  deltaEUR,
  accountCount,
}: {
  totalEUR: number;
  deltaEUR: number;
  accountCount: number;
}) {
  const deltaPos = deltaEUR >= 0;

  const tiles = [
    { hue: 'var(--navy)', label: 'Net worth', value: fmtEUR(totalEUR, { decimals: 0 }), color: '#151a2d' },
    {
      hue: deltaPos ? 'var(--teal)' : 'var(--coral)',
      label: 'This month',
      value: `${deltaPos ? '+' : ''}${fmtEUR(deltaEUR, { decimals: 0 })}`,
      color: deltaPos ? '#12a08c' : '#d94a6f',
    },
    {
      hue: 'var(--indigo)',
      label: 'Accounts',
      value: String(accountCount),
      color: '#3a49c4',
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
