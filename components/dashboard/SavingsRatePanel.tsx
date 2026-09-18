import { fmtEUR } from '@/lib/money';

const SCALE = 25; // fixed ±25% scale
const POS_H = 74; // px headroom above the zero line
const BASE = 70; // px below the zero line, down to the month-label row
const NEG_H = 46; // px max height for the deepest negative bar

export interface SavingsRateMonth {
  label: string;
  /** Signed percentage, e.g. 8 or -25. */
  pct: number;
  /** Signed EUR net for the month. */
  net: number;
}

/**
 * Savings rate panel — right cell of the Overview hero row. A signed bar
 * chart (zero line + fixed ±25% scale) plus a three-row ranked summary.
 * design_handoff_theus_rehaul README "Savings rate panel".
 */
export function SavingsRatePanel({ months, avgRatePct, savingsThisYear }: {
  months: SavingsRateMonth[];
  avgRatePct: number;
  savingsThisYear: number;
}) {
  const clampedAvg = Math.max(-SCALE, Math.min(SCALE, avgRatePct));
  const avgLineTop = POS_H - (clampedAvg / SCALE) * POS_H;

  const ranked = [...months].sort((a, b) => b.pct - a.pct);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  const summaryRows: { hue: string; label: string; pct: number; amount: number }[] = [
    { hue: 'var(--indigo)', label: 'Saved this year', pct: Math.round(avgRatePct), amount: savingsThisYear },
    ...(best ? [{ hue: 'var(--teal)', label: 'Best month', pct: Math.round(best.pct), amount: best.net }] : []),
    ...(worst && worst !== best
      ? [{ hue: 'var(--coral)', label: 'Weakest month', pct: Math.round(worst.pct), amount: worst.net }]
      : []),
  ];

  return (
    <div className="glass flex h-full flex-col !rounded-[28px] p-[24px] px-[26px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-ink">Savings rate</div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-indigo/[0.12] px-3 py-1.5">
          <span className="block h-0 w-[14px] border-t-2 border-dashed border-indigo" />
          <span className="text-[11.5px] font-bold text-indigo-dark">Avg {Math.round(avgRatePct)}%</span>
        </div>
      </div>

      <div className="relative mt-4 h-[144px]">
        <div
          className="absolute inset-x-0 border-t border-[rgba(31,39,66,.22)]"
          style={{ top: POS_H }}
        />
        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-[rgba(74,92,224,.55)]"
          style={{ top: avgLineTop }}
        />
        <div className="absolute inset-0 flex items-stretch gap-[7px]">
          {months.map((m) => {
            const clamped = Math.max(-SCALE, Math.min(SCALE, m.pct));
            const positive = clamped >= 0;
            const height = positive ? (clamped / SCALE) * POS_H : (Math.abs(clamped) / SCALE) * NEG_H;
            const labelTop = positive ? POS_H - height - 17 : POS_H + height + 4;
            const tone = positive ? 'var(--in)' : 'var(--out)';
            return (
              <div key={m.label} className="relative flex-1" title={`${m.label}: ${fmtEUR(m.net, { decimals: 0 })}`}>
                <div
                  className={'bar absolute left-[14%] right-[14%]' + (positive ? '' : ' bar-negative')}
                  style={{
                    bottom: positive ? BASE : BASE - height,
                    height,
                    borderRadius: positive ? '7px 7px 2px 2px' : '2px 2px 7px 7px',
                    background: positive
                      ? 'linear-gradient(180deg,#1fb9a4,#12a08c)'
                      : 'linear-gradient(180deg,#f2708f,#d94a6f)',
                  }}
                />
                <div
                  className="absolute inline-block whitespace-nowrap rounded-[6px] bg-white/70 px-1 text-[10.5px] font-bold tabular-nums backdrop-blur-[8px]"
                  style={{ top: labelTop, left: '50%', transform: 'translateX(-50%)', color: tone }}
                >
                  {m.pct > 0 ? '+' : m.pct < 0 ? '−' : ''}
                  {Math.abs(Math.round(m.pct))}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-[7px]">
        {months.map((m) => (
          <div
            key={m.label}
            className="flex-1 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-mute"
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-end gap-[3px]">
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className="glass-tile !rounded-[13px] px-[13px] py-[7px] transition-colors duration-[160ms] hover:!bg-white/[0.85]"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: row.hue }} />
              <span className="flex-1 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
                {row.label}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-[15px]">
              <span
                className="flex-1 text-[17px] font-extrabold -tracking-[0.02em] tabular-nums"
                style={{ color: row.pct >= 0 ? 'var(--in)' : 'var(--out)' }}
              >
                {row.pct >= 0 ? '+' : '−'}
                {Math.abs(row.pct)}%
              </span>
              <span
                className="shrink-0 pb-[5px] text-[20px] font-extrabold leading-none tabular-nums"
                style={{ color: row.amount >= 0 ? 'var(--in)' : 'var(--out)' }}
              >
                {row.amount >= 0 ? '+' : ''}
                {fmtEUR(row.amount, { decimals: 0 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
