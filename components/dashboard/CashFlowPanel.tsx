import { fmtCurrency, fmtEUR } from '@/lib/money';

export interface CashFlowMonth {
  label: string;
  income: number;
  expense: number;
  projected: boolean;
}

export interface TopAccount {
  id: string;
  name: string;
  currency: string;
  native: number;
  hue: string;
}

const kFmt = (n: number) => (n === 0 ? '0' : `${(n / 1000).toFixed(1)}k`);

/**
 * Cash flow panel — left cell of the Overview's second row. Twelve
 * months (real + YTD-average-projected), a y-axis instead of per-bar
 * labels (design_handoff_theus_rehaul README "Block 2 — cash flow +
 * spending mix"): with 12 columns there isn't room for two always-on
 * figures per column, so the axis carries the scale and each column's
 * `title` carries the exact numbers on hover.
 */
export function CashFlowPanel({
  months,
  ytdIncome,
  ytdExpense,
  ytdNet,
  year,
  topAccounts,
}: {
  months: CashFlowMonth[];
  ytdIncome: number;
  ytdExpense: number;
  ytdNet: number;
  year: number;
  /** Biggest accounts by EUR balance — fills the panel's leftover height below the chart. */
  topAccounts?: TopAccount[];
}) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const ticks = [max, (max * 2) / 3, max / 3, 0];

  return (
    <div className="glass !rounded-[28px] p-[24px] px-[26px]">
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

      <div className="mt-5 flex items-end gap-1.5">
        <div
          className="flex flex-none flex-col justify-between pb-[23px] text-right text-[9.5px] font-bold tabular-nums text-ink-mute"
          style={{ height: 153 }}
        >
          {ticks.map((t, i) => (
            <span key={i}>{kFmt(t)}</span>
          ))}
        </div>

        <div className="relative flex flex-1 items-end gap-1.5">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: 153 }}>
            {ticks.map((_, i) => (
              <span key={i} className="block h-px w-full bg-[rgba(31,39,66,.10)]" />
            ))}
          </div>

          {months.map((m, i) => {
            const incomeH = (m.income / max) * 153;
            const expenseH = (m.expense / max) * 153;
            return (
              <div
                key={i}
                className="relative flex flex-1 flex-col items-center gap-1.5 rounded-[8px] transition-colors duration-[160ms] hover:bg-white/[0.55]"
                title={`${m.label}: in ${fmtEUR(m.income, { decimals: 0 })} · out ${fmtEUR(m.expense, { decimals: 0 })} · net ${fmtEUR(m.income - m.expense, { decimals: 0 })}${m.projected ? ' (projected)' : ''}`}
              >
                <div className="flex h-[153px] w-full items-end gap-[3px] px-0.5">
                  <div
                    className="bar w-[46%] rounded-[7px_7px_3px_3px] transition-[filter] duration-200 hover:brightness-[1.08]"
                    style={{
                      height: incomeH,
                      background: m.projected ? 'rgba(31,185,164,.14)' : 'linear-gradient(180deg,#1fb9a4,#12a08c)',
                      border: m.projected ? '1.5px dashed #1fb9a4' : undefined,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    className="bar w-[46%] rounded-[7px_7px_3px_3px] transition-[filter] duration-200 hover:brightness-[1.08]"
                    style={{
                      height: expenseH,
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
      </div>

      {topAccounts && topAccounts.length > 0 ? (
        <div className="mt-4 flex flex-col">
          <div className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
            Biggest accounts
          </div>
          {topAccounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 rounded-[14px] px-3 py-[9px] transition-colors duration-[160ms] hover:bg-white/[0.72]"
            >
              <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: a.hue }} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{a.name}</span>
              <span className="shrink-0 text-[14px] font-bold tabular-nums text-ink">
                {fmtCurrency(a.native, a.currency, { decimals: 0 })}
              </span>
            </div>
          ))}
        </div>
      ) : null}
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
