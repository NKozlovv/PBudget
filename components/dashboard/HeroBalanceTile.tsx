import { Card, Icon, Mono } from '@/components/ui';
import { Sparkline } from '@/components/charts/Sparkline';
import { fmtEUR } from '@/lib/money';

/**
 * Large "Total balance" hero. Modeled on
 * design-refs/src/dashboard.jsx 126-150: brass radial accent,
 * tabular Inter big number with separate cents, "+X (Y%) vs last month"
 * delta, then a 12-month sparkline.
 */
export function HeroBalanceTile({
  balance,
  prevBalance,
  trend,
  trendLabels,
  accountCount,
}: {
  balance: number;
  prevBalance: number;
  trend: number[];
  trendLabels?: string[];
  accountCount: number;
}) {
  const [whole, cents] = splitMoney(balance);
  const delta = balance - prevBalance;
  const pct = prevBalance !== 0 ? (delta / Math.abs(prevBalance)) * 100 : 0;
  const up = delta >= 0;
  const deltaToneClass = up ? 'text-pos' : 'text-neg';
  const deltaSign = up ? '+' : '−';

  return (
    <Card className="relative overflow-hidden p-7 lg:p-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 0%, var(--accent-soft), transparent 55%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <Mono size="xs" className="tracking-[0.14em]">
            Total balance
          </Mono>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <Icon name="eye" size={13} className="text-ink-mute" />
            <span className="font-mono">{accountCount} accounts</span>
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[14px] text-ink-mute">€</span>
          <span
            className="font-sans tabular-nums text-ink"
            style={{
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {whole}
          </span>
          <span
            className="font-sans tabular-nums text-ink-mute"
            style={{ fontSize: 22, fontWeight: 500 }}
          >
            {cents}
          </span>
        </div>

        <div className="mt-3.5 flex items-center gap-3.5">
          <span
            className={`inline-flex items-center gap-1 font-mono text-[13px] font-semibold ${deltaToneClass}`}
          >
            <Icon name={up ? 'arrow-up' : 'arrow-down'} size={12} />
            {deltaSign}
            {fmtEUR(Math.abs(delta), { decimals: 0 }).replace('€', '€')} ({pct >= 0 ? '+' : ''}
            {pct.toFixed(1)}%)
          </span>
          <span className="text-[12px] text-ink-mute">vs. last month</span>
        </div>

        {trend.length > 1 ? (
          <div className="mt-5">
            <Sparkline
              data={trend}
              labels={trendLabels}
              width={500}
              height={64}
              color="var(--accent)"
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function splitMoney(n: number): [string, string] {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const [w, c] = abs.toFixed(2).split('.');
  const wWith = sign + (w ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [wWith, `.${c ?? '00'}`];
}
