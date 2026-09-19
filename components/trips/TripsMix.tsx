'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { subcategoryColor } from '@/lib/trips/subcategoryColor';
import { fmtEUR } from '@/lib/money';
import { Icon } from '@/components/ui';
import type { TripSummary } from '@/lib/trips/summary';

type Mode = 'share' | 'amount';

/**
 * "What the money went on" — per-trip subcategory mix, segmented bars +
 * legend. Click a trip to expand its full subcategory breakdown in place
 * (accordion — one open at a time, same pattern as the Categories page's
 * own row disclosure).
 */
export function TripsMix({ trips, colors }: { trips: TripSummary[]; colors: Map<string, string> }) {
  const [mode, setMode] = useState<Mode>('share');
  const [expanded, setExpanded] = useState<string | null>(null);
  const maxTotal = Math.max(...trips.map((t) => t.total), 1);

  const legendTotals = new Map<string, number>();
  for (const t of trips) {
    for (const s of t.bySubcategory) legendTotals.set(s.name, (legendTotals.get(s.name) ?? 0) + s.amount);
  }
  const legend = Array.from(legendTotals, ([name, total]) => ({
    name,
    total,
    color: subcategoryColor(colors, name),
  })).sort((a, b) => b.total - a.total);

  return (
    <section className="glass flex h-full flex-col gap-[18px] !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">What the money went on</div>
          <div className="mt-1 text-[13px] font-semibold text-ink-soft">
            Click a trip to see its full breakdown.
          </div>
        </div>
        <div className="flex gap-1 rounded-full bg-white/[0.44] p-1">
          {(
            [
              { key: 'share', label: 'Share of trip' },
              { key: 'amount', label: 'Absolute' },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12.5px] font-bold transition-[background,color] duration-200 ease-theus',
                m.key === mode
                  ? 'bg-indigo text-white [box-shadow:0_8px_20px_rgba(74,92,224,.32)]'
                  : 'text-ink-soft hover:bg-white/70',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {trips.map((t) => {
          const isOpen = expanded === t.trip;
          const top = t.bySubcategory.slice(0, 2);
          const rightLabel =
            mode === 'share'
              ? top
                  .map((s) => `${t.total > 0 ? Math.round((s.amount / t.total) * 100) : 0}% ${s.name}`)
                  .join(' · ')
              : fmtEUR(t.total, { decimals: 0 });
          const trackPct = mode === 'share' ? 100 : Math.max(2, (t.total / maxTotal) * 100);

          return (
            <div key={t.trip} className={cn('rounded-[16px] p-2 transition-colors', isOpen && 'bg-white/[0.4]')}>
              <button
                type="button"
                onClick={() => setExpanded((cur) => (cur === t.trip ? null : t.trip))}
                className="flex w-full items-center gap-2 text-left"
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-ink-mute">
                  <Icon
                    name="chevron-down"
                    size={12}
                    className={cn('transition-transform duration-200 ease-theus', isOpen && 'rotate-180')}
                  />
                </span>
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2.5">
                    <span className="text-[13.5px] font-bold text-ink">{t.trip}</span>
                    <span className="whitespace-nowrap text-[12.5px] font-bold tabular-nums text-ink-soft">
                      {rightLabel}
                    </span>
                  </span>
                  <span className="mt-[7px] flex h-5 gap-[2px]" style={{ width: `${trackPct}%` }}>
                    {t.bySubcategory.map((s) => {
                      const pct = t.total > 0 ? Math.round((s.amount / t.total) * 100) : 0;
                      return (
                        <span
                          key={s.name}
                          className="group/seg relative block h-full first:rounded-l-[8px] last:rounded-r-[8px] hover:brightness-[1.12]"
                          style={{
                            width: `${t.total > 0 ? (s.amount / t.total) * 100 : 0}%`,
                            background: subcategoryColor(colors, s.name),
                          }}
                        >
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white opacity-0 shadow-[0_10px_24px_rgba(21,26,45,.35)] transition-opacity duration-150 group-hover/seg:opacity-100">
                            {s.name} · {fmtEUR(s.amount, { decimals: 0 })} · {pct}%
                            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </span>
              </button>

              {isOpen ? (
                <ul className="ml-[30px] mt-2 flex flex-col divide-y divide-white/50">
                  {t.bySubcategory.map((s) => (
                    <li key={s.name} className="flex items-center gap-2.5 py-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ background: subcategoryColor(colors, s.name) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{s.name}</span>
                      <span className="whitespace-nowrap text-[11.5px] font-semibold text-ink-mute">
                        {s.count} {s.count === 1 ? 'tx' : 'txs'}
                      </span>
                      <span className="whitespace-nowrap text-[12px] font-bold tabular-nums text-ink-soft">
                        {t.total > 0 ? Math.round((s.amount / t.total) * 100) : 0}%
                      </span>
                      <span className="w-[70px] whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-ink">
                        {fmtEUR(s.amount, { decimals: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2.5 pt-1">
        {legend.map((l) => (
          <div key={l.name} className="flex items-center gap-[7px]">
            <span className="inline-block h-[11px] w-[11px] rounded-[4px]" style={{ background: l.color }} />
            <span className="text-[12px] font-semibold text-[#3f465c]">{l.name}</span>
            <span className="text-[12px] font-bold tabular-nums text-ink-mute">
              {fmtEUR(l.total, { decimals: 0 })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
