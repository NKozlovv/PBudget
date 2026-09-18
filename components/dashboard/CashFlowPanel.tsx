'use client';

import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { useChartHover } from '@/components/charts/useChartHover';

export interface CashFlowMonth {
  label: string;
  income: number;
  expense: number;
  projected: boolean;
}

const kFmt = (n: number) => (n === 0 ? '0' : `${(n / 1000).toFixed(1)}k`);
/** Reserved for the month-label row below the bars — matches its rendered height. */
const LABEL_H = 23;

/**
 * Cash flow panel — left cell of the Overview's second row. Twelve
 * months (real + YTD-average-projected), a y-axis instead of per-bar
 * labels (design_handoff_theus_rehaul README "Block 2 — cash flow +
 * spending mix"): with 12 columns there isn't room for two always-on
 * figures per column, so the axis carries the scale and a themed
 * tooltip carries the exact numbers on hover.
 *
 * The chart fills whatever height the grid row stretches this panel
 * to (via percentage-height bars, not a fixed pixel plot) — Spending
 * Mix's row count varies, and a fixed chart height left dead space
 * below it whenever Spending Mix was naturally taller.
 */
export function CashFlowPanel({
  months,
  ytdIncome,
  ytdExpense,
  ytdNet,
  year,
}: {
  months: CashFlowMonth[];
  ytdIncome: number;
  ytdExpense: number;
  ytdNet: number;
  year: number;
}) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const ticks = [max, (max * 2) / 3, max / 3, 0];
  const { containerRef, hover, show, hide } = useChartHover<CashFlowMonth>();

  return (
    <div className="glass flex h-full flex-col !rounded-[28px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[19px] font-bold -tracking-[0.02em] text-ink">Cash flow</div>
          <div className="mt-1 text-[12.5px] font-medium text-ink-mute">
            YTD in {fmtEUR(ytdIncome, { decimals: 0 })} · out {fmtEUR(ytdExpense, { decimals: 0 })} · net{' '}
            {ytdNet >= 0 ? '+' : ''}
            {fmtEUR(ytdNet, { decimals: 0 })} · {year} projected at the elapsed-month average
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3.5">
          <LegendSwatch color="var(--teal)">Income</LegendSwatch>
          <LegendSwatch color="var(--coral)">Spending</LegendSwatch>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
            <span className="h-[10px] w-[10px] rounded-[3px] border border-dashed border-ink-mute" />
            Projected
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-5 flex min-h-0 flex-1 items-stretch gap-1.5"
        style={{ minHeight: 153 + LABEL_H }}
      >
        <div
          className="flex flex-none flex-col justify-between text-right text-[9.5px] font-bold tabular-nums text-ink-mute"
          style={{ paddingBottom: LABEL_H }}
        >
          {ticks.map((t, i) => (
            <span key={i}>{kFmt(t)}</span>
          ))}
        </div>

        <div className="relative flex flex-1 items-stretch gap-1.5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between"
            style={{ bottom: LABEL_H }}
          >
            {ticks.map((_, i) => (
              <span key={i} className="block h-px w-full bg-[rgba(31,39,66,.10)]" />
            ))}
          </div>

          {months.map((m, i) => {
            const incomePct = (m.income / max) * 100;
            const expensePct = (m.expense / max) * 100;
            return (
              <div
                key={i}
                className="relative flex flex-1 flex-col items-center gap-1.5 rounded-[8px] transition-colors duration-[160ms] hover:bg-white/[0.55]"
                onMouseEnter={(e) => show(e, m)}
                onMouseMove={(e) => show(e, m)}
                onMouseLeave={hide}
              >
                <div className="flex w-full flex-1 items-end gap-[3px] px-0.5">
                  <div
                    className="bar w-[46%] rounded-[7px_7px_3px_3px] transition-[filter] duration-200 hover:brightness-[1.08]"
                    style={{
                      height: `${incomePct}%`,
                      background: m.projected ? 'rgba(31,185,164,.14)' : 'linear-gradient(180deg,#1fb9a4,#12a08c)',
                      border: m.projected ? '1.5px dashed #1fb9a4' : undefined,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    className="bar w-[46%] rounded-[7px_7px_3px_3px] transition-[filter] duration-200 hover:brightness-[1.08]"
                    style={{
                      height: `${expensePct}%`,
                      background: m.projected ? 'rgba(242,112,143,.14)' : 'linear-gradient(180deg,#f2708f,#d94a6f)',
                      border: m.projected ? '1.5px dashed #f2708f' : undefined,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div
                  className="text-[10px] font-bold tracking-[0.04em]"
                  style={{ color: m.projected ? 'rgba(91,98,120,.55)' : 'var(--ink-mute)' }}
                >
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>

        {hover ? (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={hover.containerWidth}>
            <span className="font-bold text-ink">{hover.data.label}</span>
            {hover.data.projected ? <span className="ml-1 text-ink-mute">(projected)</span> : null}
            <br />
            <span style={{ color: 'var(--in)' }}>in {fmtEUR(hover.data.income, { decimals: 0 })}</span>
            <span className="mx-1 text-ink-mute">·</span>
            <span style={{ color: 'var(--out)' }}>out {fmtEUR(hover.data.expense, { decimals: 0 })}</span>
            <span className="mx-1 text-ink-mute">·</span>
            <span className="text-ink">net {fmtEUR(hover.data.income - hover.data.expense, { decimals: 0 })}</span>
          </ChartTooltip>
        ) : null}
      </div>
    </div>
  );
}

function LegendSwatch({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
      <span className="h-[10px] w-[10px] rounded-[3px]" style={{ background: color }} />
      {children}
    </span>
  );
}
