'use client';

import { cn } from '@/lib/utils';
import { fmtEUR } from '@/lib/money';
import { dateRangeDisplay } from '@/lib/date';
import { Icon } from '@/components/ui';
import type { TripSummary } from '@/lib/trips/summary';

const HEAD: { label: string; align: 'left' | 'right' }[] = [
  { label: 'Trip', align: 'left' },
  { label: 'Dates', align: 'right' },
  { label: 'Days', align: 'right' },
  { label: 'People', align: 'right' },
  { label: 'Total', align: 'right' },
  { label: 'Fixed', align: 'right' },
  { label: 'Per day', align: 'right' },
  { label: 'Per person-day', align: 'right' },
  { label: 'Verdict', align: 'right' },
];

/** Every trip, side by side — the full comparison table, always sorted by total spend. */
export function TripsTable({
  trips,
  selected,
  onSelect,
  onEditTravelers,
}: {
  trips: TripSummary[];
  selected: string | null;
  onSelect: (trip: string) => void;
  onEditTravelers: (trip: string) => void;
}) {
  const grand = trips.reduce((s, t) => s + t.total, 0);
  const days = trips.reduce((s, t) => s + t.days, 0);
  const personDays = trips.reduce((s, t) => s + t.days * t.travelers, 0);
  const avgPerDay = days > 0 ? grand / days : 0;
  const basePpd = personDays > 0 ? grand / personDays : 0;

  const rows = [...trips].sort((a, b) => b.total - a.total);

  return (
    <section className="glass flex flex-col gap-4 !rounded-[34px] p-[24px] px-[26px]">
      <div>
        <div className="text-[17px] font-bold -tracking-[0.02em] text-ink">Every trip, side by side</div>
        <div className="mt-1 text-[13px] font-semibold text-ink-soft">
          Fixed cost is getting there and sleeping; daily cost is everything you spend once you&rsquo;re there.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              {HEAD.map((h) => (
                <th
                  key={h.label}
                  className={cn(
                    'whitespace-nowrap border-b border-white/60 px-3 py-[9px] text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute',
                    h.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {h.label}
                </th>
              ))}
              <th className="border-b border-white/60 px-3 py-[9px]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const fixedPct = t.total > 0 ? Math.round((t.fixed / t.total) * 100) : 0;
              const good = t.perPersonDay < basePpd * 0.9;
              const bad = t.perPersonDay > basePpd * 1.1;
              const isSelected = selected === t.trip;

              return (
                <tr
                  key={t.trip}
                  onClick={() => onSelect(t.trip)}
                  className={cn(
                    'cursor-pointer transition-colors duration-150 hover:bg-white/[0.44]',
                    isSelected && 'bg-white/[0.5]',
                  )}
                >
                  <td className="border-b border-white/45 px-3 py-3">
                    <div className="whitespace-nowrap text-[14px] font-bold text-ink">{t.trip}</div>
                    <div className="whitespace-nowrap text-[11.5px] font-semibold text-[#7b8296]">
                      {t.txCount} {t.txCount === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-white/45 px-3 py-3 text-right text-[13px] font-semibold text-[#3f465c]">
                    {dateRangeDisplay(t.fromDate, t.toDate)}
                  </td>
                  <td className="border-b border-white/45 px-3 py-3 text-right text-[13px] font-semibold tabular-nums text-[#3f465c]">
                    {t.days}
                  </td>
                  <td className="border-b border-white/45 px-3 py-3 text-right text-[13px] font-semibold tabular-nums text-[#3f465c]">
                    {t.travelers}
                  </td>
                  <td className="border-b border-white/45 px-3 py-3 text-right text-[13.5px] font-extrabold tabular-nums text-ink">
                    {fmtEUR(t.total, { decimals: 0 })}
                  </td>
                  <td className="border-b border-white/45 px-3 py-3 text-right text-[13px] font-bold tabular-nums text-[#3f465c]">
                    {fixedPct}%
                  </td>
                  <td
                    className={cn(
                      'border-b border-white/45 px-3 py-3 text-right text-[13px] font-bold tabular-nums',
                      t.perDay > avgPerDay ? 'text-out' : 'text-in',
                    )}
                  >
                    {fmtEUR(Math.round(t.perDay), { decimals: 0 })}
                  </td>
                  <td
                    className={cn(
                      'border-b border-white/45 px-3 py-3 text-right text-[13px] font-bold tabular-nums',
                      bad ? 'text-out' : good ? 'text-in' : 'text-[#3f465c]',
                    )}
                  >
                    {fmtEUR(Math.round(t.perPersonDay), { decimals: 0 })}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/45 px-3 py-3 text-right">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
                        good && 'bg-in/[0.16] text-in',
                        bad && 'bg-out/[0.16] text-out',
                        !good && !bad && 'bg-indigo/[0.14] text-indigo-dark',
                      )}
                    >
                      {good ? 'Below average' : bad ? 'Above average' : 'On average'}
                    </span>
                  </td>
                  <td className="border-b border-white/45 px-2 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTravelers(t.trip);
                      }}
                      title="Set number of travelers"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-white/70 hover:text-ink"
                    >
                      <Icon name="pencil" size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[12.5px] font-semibold text-ink-soft">
        Fixed = flights, lodging and fees, the part you commit to before leaving. Daily = food, local transport,
        activities and shopping, divided by days away.
      </p>
    </section>
  );
}
