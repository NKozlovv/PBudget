import { Card, Icon, Mono } from '@/components/ui';
import { TrendLineChart, type TrendPoint } from '@/components/charts/TrendLineChart';
import { fmtEUR } from '@/lib/money';

/**
 * Income / Spending KPI tile. Modeled on
 * design-refs/src/dashboard.jsx 152-178: kicker + colored dot,
 * big tabular number with separate cents, % delta vs prior period
 * (in the "good" direction's color), year-to-date + forecast line chart.
 */
export function MonthKpiTile({
  label,
  amount,
  prevAmount,
  avgAmount,
  series,
  tone,
  /** When `tone === 'spending'`, "down" is good — show ↓ in pos color. */
  kind,
}: {
  label: string;
  amount: number;
  prevAmount: number;
  /** YTD average monthly amount, shown as a quick "vs. typical" reference. */
  avgAmount: number;
  series: TrendPoint[];
  tone: 'pos' | 'neg';
  kind: 'income' | 'spending';
}) {
  const [whole, cents] = splitMoney(amount);
  const dotClass = tone === 'pos' ? 'bg-pos' : 'bg-neg';
  const sparkColor = tone === 'pos' ? 'var(--pos)' : 'var(--neg)';

  const hasPrev = Number.isFinite(prevAmount) && prevAmount !== 0;
  const pct = hasPrev ? ((amount - prevAmount) / Math.abs(prevAmount)) * 100 : 0;
  const up = pct >= 0;
  // Income: up is good. Spending: down is good.
  const isGood = kind === 'income' ? up : !up;
  const deltaToneClass = isGood ? 'text-pos' : 'text-neg';
  const arrowName = up ? 'arrow-up' : 'arrow-down';
  const sign = up ? '+' : '−';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <Mono size="xs" className="tracking-[0.14em]">
          {label}
        </Mono>
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      </div>

      <div className="mt-4 flex items-baseline">
        <span className="text-[18px] font-medium text-ink-mute">€</span>
        <span
          className="font-sans tabular-nums text-ink"
          style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          {whole}
        </span>
        <span
          className="font-sans tabular-nums text-ink-mute"
          style={{ fontSize: 18, fontWeight: 500 }}
        >
          {cents}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2.5">
        {hasPrev ? (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[12px] font-semibold ${deltaToneClass}`}
          >
            <Icon name={arrowName} size={11} />
            {sign}
            {Math.abs(pct).toFixed(1)}%
          </span>
        ) : (
          <span className="text-[12px] text-ink-mute">no prior period</span>
        )}
        <span className="text-[11px] text-ink-mute">
          avg {fmtEUR(avgAmount, { decimals: 0 })}/mo
        </span>
      </div>

      {series.length > 1 ? (
        <div className="mt-5">
          <TrendLineChart data={series} width={300} height={104} color={sparkColor} />
        </div>
      ) : null}
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
