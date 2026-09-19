'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tripSubcategoryColor } from '@/lib/trips/subcategoryColor';
import { fmtEUR } from '@/lib/money';
import type { TripSummary } from '@/lib/trips/summary';

type Mode = 'share' | 'amount';

/** "What the money went on" — per-trip subcategory mix, segmented bars + legend. */
export function TripsMix({ trips }: { trips: TripSummary[] }) {
  const [mode, setMode] = useState<Mode>('share');
  const maxTotal = Math.max(...trips.map((t) => t.total), 1);

  const legendTotals = new Map<string, number>();
  for (const t of trips) {
    for (const s of t.bySubcategory) legendTotals.set(s.name, (legendTotals.get(s.name) ?? 0) + s.amount);
  }
  const legend = Array.from(legendTotals, ([name, total]) => ({
    name,
    total,
    color: tripSubcategoryColor(name),
  })).sort((a, b) => b.total - a.total);

  return (
    <section className="glass flex flex-col gap-[18px] !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">What the money went on</div>
          <div className="mt-1 text-[13px] font-semibold text-ink-soft">
            {mode === 'share'
              ? 'Each bar is one trip at full width, split by subcategory.'
              : "Bar length is the trip total, so you can see size and mix at once."}
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

      <div className="flex flex-col gap-5">
        {trips.map((t) => {
          const top = t.bySubcategory.slice(0, 2);
          const rightLabel =
            mode === 'share'
              ? top
                  .map((s) => `${t.total > 0 ? Math.round((s.amount / t.total) * 100) : 0}% ${s.name}`)
                  .join(' · ')
              : fmtEUR(t.total, { decimals: 0 });
          const trackPct = mode === 'share' ? 100 : Math.max(2, (t.total / maxTotal) * 100);

          return (
            <div key={t.trip}>
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="text-[13.5px] font-bold text-ink">{t.trip}</span>
                <span className="whitespace-nowrap text-[12.5px] font-bold tabular-nums text-ink-soft">
                  {rightLabel}
                </span>
              </div>
              <div className="mt-[7px] flex h-5 gap-[2px]" style={{ width: `${trackPct}%` }}>
                {t.bySubcategory.map((s) => {
                  const pct = t.total > 0 ? Math.round((s.amount / t.total) * 100) : 0;
                  return (
                    <div
                      key={s.name}
                      className="group/seg relative h-full transition-[filter] duration-150 first:rounded-l-[8px] last:rounded-r-[8px] hover:brightness-[1.12]"
                      style={{
                        width: `${t.total > 0 ? (s.amount / t.total) * 100 : 0}%`,
                        background: tripSubcategoryColor(s.name),
                      }}
                    >
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white opacity-0 shadow-[0_10px_24px_rgba(21,26,45,.35)] transition-opacity duration-150 group-hover/seg:opacity-100">
                        {s.name} · {fmtEUR(s.amount, { decimals: 0 })} · {pct}%
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2.5 pt-1">
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
