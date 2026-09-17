import { Mono } from '@/components/ui';

/**
 * Horizontal stacked-bar distribution + legend, replacing the donut.
 * Matches design-refs/src/transactions.jsx Accounts lines 146-162:
 * 10px stacked bar, 2px gaps so each segment reads as its own swatch,
 * legend below with name + percentage. Negative balances are clamped to
 * zero for the segment width (legend still shows the real value).
 */
export function AccountsDistributionBar({
  segments,
}: {
  segments: { id: string; name: string; eur: number; color: string }[];
}) {
  const positives = segments.map((s) => ({ ...s, eur: Math.max(0, s.eur) }));
  const total = positives.reduce((s, x) => s + x.eur, 0);

  return (
    <div className="glass !rounded-[26px] p-5">
      <Mono size="xs">Distribution</Mono>
      <div className="mt-3 flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {total > 0 ? (
          positives.map((s) => (
            <span
              key={s.id}
              className="meter h-full"
              style={{ flex: s.eur > 0 ? s.eur : 0.0001, background: s.color }}
              aria-label={`${s.name} ${(total > 0 ? (s.eur / total) * 100 : 0).toFixed(0)}%`}
            />
          ))
        ) : (
          <span className="h-full flex-1 bg-white/70" />
        )}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => {
          const pct = total > 0 ? (Math.max(0, s.eur) / total) * 100 : 0;
          return (
            <li key={s.id} className="flex items-center gap-2 text-[12px] text-ink-soft">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: s.color }}
                aria-hidden
              />
              <span>{s.name}</span>
              <span className="font-mono text-[11px] tabular-nums text-ink-mute">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
