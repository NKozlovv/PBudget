import { Mono } from '@/components/ui';
import { fmtEUR } from '@/lib/money';
import { ForecastLine } from '@/components/charts/ForecastLine';
import type { ProjectionPoint } from '@/lib/forecast/projection';

/**
 * Single hero card for the Forecast page. 3-up KPIs (Today / In N months /
 * End of year) with vertical 1-px dividers, balance line below, legend
 * at the bottom.
 *
 * Mirrors design-refs/src/forecast.jsx lines 32-54.
 */
export function ForecastHero({
  todayBalance,
  forwardBalance,
  forwardMonths,
  eoyBalance,
  points,
}: {
  todayBalance: number;
  forwardBalance: number;
  forwardMonths: number;
  eoyBalance: number;
  points: ProjectionPoint[];
}) {
  const fwdDelta = forwardBalance - todayBalance;
  const fwdPct = todayBalance !== 0 ? (fwdDelta / todayBalance) * 100 : 0;
  const eoyDelta = eoyBalance - todayBalance;

  return (
    <div className="glass !rounded-[28px] p-7">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <Kpi label="Today" value={fmtEUR(todayBalance, { decimals: 0 })} valueClass="text-ink" />
        <Kpi
          label={`In ${forwardMonths} ${forwardMonths === 1 ? 'month' : 'months'}`}
          value={fmtEUR(forwardBalance, { decimals: 0 })}
          valueClass="text-accent"
          delta={`${fwdDelta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(fwdDelta), { decimals: 0 })} (${fwdPct >= 0 ? '+' : ''}${fwdPct.toFixed(1)}%)`}
          deltaTone={fwdDelta >= 0 ? 'pos' : 'neg'}
          divided
        />
        <Kpi
          label="End of year"
          value={fmtEUR(eoyBalance, { decimals: 0 })}
          valueClass="text-accent-hi"
          delta={`${eoyDelta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(eoyDelta), { decimals: 0 })} projected`}
          deltaTone={eoyDelta >= 0 ? 'pos' : 'neg'}
          divided
        />
      </div>

      <div className="mt-6">
        <ForecastLine points={points} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-5 text-[11px] text-ink-mute">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[2px] w-4 bg-indigo" /> Actual
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="20" height="4" aria-hidden>
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke="var(--indigo)"
              strokeOpacity={0.65}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          </svg>{' '}
          Projected
        </span>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  valueClass,
  delta,
  deltaTone,
  divided,
}: {
  label: string;
  value: string;
  valueClass: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg';
  divided?: boolean;
}) {
  return (
    <div className={divided ? 'sm:border-l sm:border-white/60 sm:pl-8' : ''}>
      <Mono size="xs">{label}</Mono>
      <div
        className={`mt-2 font-sans tabular-nums ${valueClass}`}
        style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      {delta ? (
        <div
          className={
            'mt-1 font-mono text-[12px] tabular-nums ' +
            (deltaTone === 'pos' ? 'text-pos' : deltaTone === 'neg' ? 'text-neg' : 'text-ink-mute')
          }
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
}
