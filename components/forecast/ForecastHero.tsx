import { fmtEUR } from '@/lib/money';
import { dateDisplay, dateToISO } from '@/lib/date';
import { ForecastLine } from '@/components/charts/ForecastLine';
import type { ProjectionPoint } from '@/lib/forecast/projection';

/**
 * Forecast hero — title, three KPI tiles, and the balance chart, all in
 * one glass card. No horizon picker: the projection always runs to
 * year-end at the average pace through the working month (same anchor as
 * Overview's own EOY figure — see app/(app)/forecast/page.tsx), so there's
 * nothing left for a toggle to change.
 */
export function ForecastHero({
  avgNet,
  monthsElapsed,
  year,
  todayBalance,
  eoyBalance,
  points,
}: {
  avgNet: number;
  monthsElapsed: number;
  year: number;
  todayBalance: number;
  eoyBalance: number;
  points: ProjectionPoint[];
}) {
  const now = new Date();
  const eoyDelta = eoyBalance - todayBalance;
  const avgIsPos = avgNet >= 0;
  const forwardMonths = points.filter((p) => p.projected).length;

  return (
    <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
      <div>
        <h1 className="text-[26px] font-extrabold -tracking-[0.03em] text-ink">Forecast</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        <KpiTile
          label="Balance today"
          value={fmtEUR(todayBalance)}
          sub={`Real net worth · ${dateDisplay(dateToISO(now))}`}
        />
        <KpiTile
          label={`Projected 31 Dec ${year}`}
          value={fmtEUR(eoyBalance)}
          valueColor={eoyDelta >= 0 ? 'var(--in)' : 'var(--out)'}
          sub={`${eoyDelta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(eoyDelta))} vs today`}
          subColor={eoyDelta >= 0 ? 'var(--in)' : 'var(--out)'}
        />
        <KpiTile
          label="Average monthly net"
          value={`${avgIsPos ? '+' : '−'}${fmtEUR(Math.abs(avgNet))}`}
          sub={`Across ${monthsElapsed} elapsed month${monthsElapsed === 1 ? '' : 's'} of ${year}`}
        />
      </div>

      <div className="glass-inner flex flex-col gap-3 !rounded-[22px] p-4 px-[22px]">
        <div className="flex flex-wrap items-baseline justify-between gap-[14px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
            Balance · 12 months back, {forwardMonths} to year-end
          </span>
          <div className="flex flex-wrap gap-4">
            <Legend color="var(--indigo)" dashed={false} label="Recorded" />
            <Legend color="var(--teal)" dashed label="Projected at your average pace" />
          </div>
        </div>
        <ForecastLine points={points} height={280} />
      </div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  sub,
  valueColor,
  subColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <div className="glass-tile flex min-h-[104px] flex-col justify-between gap-[9px] !rounded-[22px] p-4 px-5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">{label}</div>
      <div
        className="whitespace-nowrap text-[clamp(28px,2.6vw,36px)] font-extrabold -tracking-[0.038em] tabular-nums leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </div>
      <div className="text-[12.5px] font-bold tabular-nums" style={{ color: subColor ?? 'var(--ink-mute)' }}>
        {sub}
      </div>
    </div>
  );
}

function Legend({ color, dashed, label }: { color: string; dashed: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-ink-soft">
      {dashed ? (
        <svg width="18" height="4" aria-hidden>
          <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth={2.5} strokeDasharray="4 3" />
        </svg>
      ) : (
        <span className="inline-block h-[3px] w-[18px] rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}
