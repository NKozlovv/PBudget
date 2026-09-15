import { Card, Mono } from '@/components/ui';
import { TrendLineChart, type TrendPoint } from '@/components/charts/TrendLineChart';
import { fmtEUR } from '@/lib/money';

/**
 * Income / Spending KPI tile. Shows the YTD average monthly amount — not
 * a single month's total, which used to read as stale/uninteresting for
 * most of the month (the "current" month in this app is always the last
 * *completed* one — see workingMonth() — so a one-month total doesn't
 * update until month-end and doesn't say much about the typical pace on
 * its own) — plus the year-to-date + forecast line chart for the month-
 * to-month shape.
 */
export function MonthKpiTile({
  label,
  avgAmount,
  series,
  tone,
}: {
  label: string;
  /** YTD average monthly amount. */
  avgAmount: number;
  series: TrendPoint[];
  tone: 'pos' | 'neg';
}) {
  const [whole, cents] = splitMoney(avgAmount);
  const dotClass = tone === 'pos' ? 'bg-pos' : 'bg-neg';
  const sparkColor = tone === 'pos' ? 'var(--pos)' : 'var(--neg)';

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

      <div className="mt-1.5 text-[12px] text-ink-mute">avg / month · YTD</div>

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
