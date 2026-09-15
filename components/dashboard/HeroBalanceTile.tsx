import { Card, Icon, Mono } from '@/components/ui';
import { TrendLineChart, type TrendPoint } from '@/components/charts/TrendLineChart';
import { fmtEUR } from '@/lib/money';

/**
 * Large "Total balance" hero. Modeled on
 * design-refs/src/dashboard.jsx 126-150: brass radial accent, tabular
 * Inter big number with separate cents, a month-over-month delta, three
 * YTD stat chips (saved this year / savings rate / projected EOY), then a
 * year-to-date + forecast line chart.
 *
 * Used to also show a separate "+€X saved this year" pill above the big
 * number — dropped as a distinct element since it just duplicated the
 * first stat chip below; its in/out breakdown moved into that chip's own
 * sub-line instead. Card was accumulating one stacked block per feature
 * round (badge → breakdown → delta → stat strip → chart) and reading as
 * cluttered/misaligned next to the much simpler Income/Spending tiles.
 */
export function HeroBalanceTile({
  balance,
  monthDelta,
  monthPct,
  monthDeltaLabel,
  savingsThisYear,
  savingsIncome,
  savingsExpense,
  savingsRateAvg,
  projectedEOY,
  series,
  accountCount,
}: {
  balance: number;
  /** EOM(last completed month) − EOM(the month before it) — a stable,
   * always-real comparison, unlike "vs today" which reads as stuck at €0
   * for most of the month if no transactions have been entered yet. */
  monthDelta: number;
  monthPct: number;
  /** e.g. "Aug vs Jul". */
  monthDeltaLabel: string;
  /** YTD real income − expenses (not projected). */
  savingsThisYear: number;
  /** YTD real income, for the "€X in − €Y out" sub-line. */
  savingsIncome: number;
  /** YTD real expenses, for the same sub-line. */
  savingsExpense: number;
  /** Average of each real month's (income − expense) / income, 0..1. */
  savingsRateAvg: number;
  /** Balance projected forward to Dec 31 at the YTD average net pace. */
  projectedEOY: number;
  series: TrendPoint[];
  accountCount: number;
}) {
  const [whole, cents] = splitMoney(balance);
  const up = monthDelta >= 0;
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
            {fmtEUR(Math.abs(monthDelta), { decimals: 0 })} ({pctLabel(monthPct)})
          </span>
          <span className="text-[12px] text-ink-mute">{monthDeltaLabel}</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-3">
          <Stat
            label="Saved this year"
            value={fmtEUR(savingsThisYear, { decimals: 0 })}
            sub={`${fmtEUR(savingsIncome, { compact: true, decimals: 0 })} in − ${fmtEUR(savingsExpense, { compact: true, decimals: 0 })} out`}
            tone={savingsThisYear >= 0 ? 'pos' : 'neg'}
          />
          <Stat
            label="Savings rate"
            value={`${(savingsRateAvg * 100).toFixed(0)}%`}
            tone={savingsRateAvg >= 0 ? 'pos' : 'neg'}
          />
          <Stat label="Projected EOY" value={fmtEUR(projectedEOY, { decimals: 0 })} tone="accent" />
        </div>

        {series.length > 1 ? (
          <div className="mt-5">
            <TrendLineChart data={series} width={500} height={116} color="var(--accent)" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  /** Optional small caption under the value — wraps rather than truncates,
   * since it's already kept short by the caller (compact euro formatting). */
  sub?: string;
  tone: 'pos' | 'neg' | 'accent';
}) {
  const toneClass = tone === 'pos' ? 'text-pos' : tone === 'neg' ? 'text-neg' : 'text-accent';
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] uppercase tracking-wide text-ink-mute">{label}</div>
      <div className={`mt-0.5 truncate text-[15px] font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[10px] leading-tight text-ink-mute">{sub}</div> : null}
    </div>
  );
}

function pctLabel(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function splitMoney(n: number): [string, string] {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const [w, c] = abs.toFixed(2).split('.');
  const wWith = sign + (w ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [wWith, `.${c ?? '00'}`];
}
