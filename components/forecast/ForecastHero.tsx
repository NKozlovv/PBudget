import { fmtEUR } from '@/lib/money';
import { dateDisplay, dateToISO } from '@/lib/date';
import { ForecastLine } from '@/components/charts/ForecastLine';
import { HorizonToggle, type Horizon } from './HorizonToggle';
import type { ProjectionPoint } from '@/lib/forecast/projection';

/**
 * Forecast hero — Theus Forecast design handoff. Title, subtitle (the
 * straight-line-from-average-net methodology, spelled out so the chart
 * never implies more precision than it has), the horizon toggle, four KPI
 * tiles, and the balance chart, all in one glass card.
 */
export function ForecastHero({
  horizon,
  avgNet,
  monthsElapsed,
  year,
  todayBalance,
  forwardBalance,
  eoyBalance,
  points,
}: {
  horizon: Horizon;
  avgNet: number;
  monthsElapsed: number;
  year: number;
  todayBalance: number;
  forwardBalance: number;
  eoyBalance: number;
  points: ProjectionPoint[];
}) {
  const now = new Date();
  const fwdDelta = forwardBalance - todayBalance;
  const fwdPct = todayBalance !== 0 ? (fwdDelta / Math.abs(todayBalance)) * 100 : 0;
  const eoyDelta = eoyBalance - todayBalance;
  const avgIsPos = avgNet >= 0;

  return (
    <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="min-w-0 flex-1 basis-[300px]">
          <h1 className="text-[26px] font-extrabold -tracking-[0.03em] text-ink">Forecast</h1>
          <p className="mt-[7px] max-w-[62ch] text-[14px] font-medium text-ink-soft">
            Straight-line from this year&apos;s average monthly net of{' '}
            <b className="font-bold text-ink">
              {avgIsPos ? '+' : '−'}
              {fmtEUR(Math.abs(avgNet))}
            </b>
            . No seasonality, no model — if your pace changes, this changes with it.
          </p>
        </div>
        <div className="shrink-0">
          <HorizonToggle current={horizon} />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        <KpiTile
          label="Balance today"
          value={fmtEUR(todayBalance)}
          sub={`Real net worth · ${dateDisplay(dateToISO(now))}`}
        />
        <KpiTile
          label={`Projected · ${horizon} months`}
          value={fmtEUR(forwardBalance)}
          valueColor={fwdDelta >= 0 ? 'var(--in)' : 'var(--out)'}
          sub={`${fwdDelta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(fwdDelta))} · ${fwdPct >= 0 ? '+' : ''}${fwdPct.toFixed(1)}%`}
          subColor={fwdDelta >= 0 ? 'var(--in)' : 'var(--out)'}
        />
        <KpiTile
          label={`Projected 31 Dec ${year}`}
          value={fmtEUR(eoyBalance)}
          valueColor={eoyDelta >= 0 ? 'var(--in)' : 'var(--out)'}
          sub={`${eoyDelta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(eoyDelta))} · fixed to year-end`}
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
            Balance · 12 months back, {horizon} forward
          </span>
          <div className="flex flex-wrap gap-4">
            <Legend color="var(--indigo)" dashed={false} label="Recorded" />
            <Legend color="var(--teal)" dashed label="Projected at today's pace" />
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
