import { fmtEUR } from '@/lib/money';
import { Mono } from '@/components/ui';
import { isoWeek, monthLong, timeOfDayGreeting } from '@/lib/dashboard/period';

/**
 * Top greeting + monthly insight subline. Modeled on
 * design-refs/src/dashboard.jsx 107-122.
 */
export function Greeting({
  now,
  userName,
  monthSpend,
  avgMonthSpend,
}: {
  now: Date;
  userName: string;
  monthSpend: number;
  avgMonthSpend: number;
}) {
  const kicker = `${monthLong(now.getMonth())} ${now.getFullYear()} · WK ${isoWeek(now)}`;
  const greeting = `Good ${timeOfDayGreeting(now)}, ${userName}.`;

  // Compare current month spend to a 6-month average. Positive = under (good).
  const hasAverage = avgMonthSpend > 0 && Number.isFinite(avgMonthSpend);
  const deltaPct = hasAverage ? ((avgMonthSpend - monthSpend) / avgMonthSpend) * 100 : 0;
  const under = deltaPct >= 0;
  const deltaToneClass = under ? 'text-pos' : 'text-neg';
  const deltaCopy = `${Math.abs(deltaPct).toFixed(1)}% ${under ? 'under' : 'over'}`;

  return (
    <div>
      <Mono size="xs" className="tracking-[0.18em]">
        {kicker}
      </Mono>
      <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.02em] text-ink">
        {greeting}
      </h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        You&apos;ve spent{' '}
        <span className="font-sans text-[14px] font-semibold tabular-nums text-ink">
          {fmtEUR(monthSpend, { decimals: 0 })}
        </span>{' '}
        this month
        {hasAverage ? (
          <>
            {' '}— <span className={`${deltaToneClass} font-medium`}>{deltaCopy}</span> your average.
          </>
        ) : (
          <>.</>
        )}
      </p>
    </div>
  );
}
