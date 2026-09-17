import { Icon, Mono } from '@/components/ui';
import { fmtEUR } from '@/lib/money';
import { milestoneEta, nextMilestone } from '@/lib/forecast/projection';
import { monthName } from '@/lib/date';

/**
 * Static "coach insight" card. Computes a friendly milestone projection
 * based on YTD savings rate and current pace.
 *
 * The "Set this as a goal" button is intentionally omitted — goals infra
 * doesn't exist yet (per CLAUDE.md §7, Coach view is out of scope).
 *
 * Mirrors design-refs/src/forecast.jsx lines 82-90 visually (gradient
 * brass-tinted card with sparkle kicker).
 */
export function CoachInsightCard({
  balanceNow,
  avgNet,
  savingsRate,
  now,
}: {
  balanceNow: number;
  avgNet: number;
  savingsRate: number; // 0..1
  now: Date;
}) {
  const milestone = nextMilestone(balanceNow);
  const eta = milestoneEta({ balance: balanceNow, avgNet, milestone, now });

  return (
    <div
      className="glass !rounded-[28px] p-6"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(74,92,224,.14) 0%, transparent 70%), var(--glass-sheen)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon name="sparkle" size={14} className="text-indigo" />
        <Mono tone="accent">Coach insight</Mono>
      </div>

      {avgNet <= 0 || !eta ? (
        <p className="text-[14px] leading-relaxed text-ink">
          Your YTD pace is breaking even or trending down. Once you log a
          few months of net-positive activity, I&apos;ll start projecting
          milestones here.
        </p>
      ) : (
        <p className="text-[14px] leading-relaxed text-ink">
          If you keep your savings rate of{' '}
          <strong>{Math.round(savingsRate * 100)}%</strong>, you&apos;ll reach{' '}
          <strong>{fmtEUR(milestone, { decimals: 0 })}</strong> by{' '}
          <strong>
            {monthName(eta.date.getMonth())} {eta.date.getFullYear()}
          </strong>{' '}
          — about {eta.months} {eta.months === 1 ? 'month' : 'months'} from
          now.
        </p>
      )}
    </div>
  );
}
