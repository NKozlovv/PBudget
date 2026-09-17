'use client';

import { Icon } from '@/components/ui';
import { fmtEUR } from '@/lib/money';
import { BudgetRing } from './BudgetRing';
import { GLOBAL_ADD_TRANSACTION_EVENT } from '@/components/transactions/GlobalAddTransactionModal';

function splitFigure(n: number): { sign: string; whole: string; cents: string } {
  const sign = n < 0 ? '−' : '';
  const [whole, cents] = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).split('.');
  return { sign, whole: whole ?? '0', cents: cents ?? '00' };
}

/**
 * The Balance panel — left cell of the Overview hero row (design_handoff_
 * theus_rehaul README "Block 1 — hero row"). Headline (label, delta chip,
 * huge balance figure, page actions) over a ring + two projection tiles.
 */
export function BalancePanel({
  accountCount,
  totalBalance,
  monthDelta,
  monthPct,
  vsMonthLabel,
  spentThisMonth,
  incomeThisMonth,
  monthLabelUpper,
  avgSavingsRate,
  projectedEOY,
  avgNet,
  savingsThisYear,
  savingsIncome,
  savingsExpense,
}: {
  accountCount: number;
  totalBalance: number;
  monthDelta: number;
  monthPct: number;
  vsMonthLabel: string;
  spentThisMonth: number;
  incomeThisMonth: number;
  monthLabelUpper: string;
  avgSavingsRate: number;
  projectedEOY: number;
  avgNet: number;
  savingsThisYear: number;
  savingsIncome: number;
  savingsExpense: number;
}) {
  const figure = splitFigure(totalBalance);
  const down = monthDelta < 0;
  const avgRatePct = Math.round(avgSavingsRate * 100);

  return (
    <div className="glass flex flex-col gap-[18px] !rounded-[34px] p-[22px]">
      {/* Row 1 — headline */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Total balance · {accountCount} account{accountCount === 1 ? '' : 's'}
            </span>
            <span
              className={
                'inline-flex items-center rounded-full px-[11px] py-1 text-[11.5px] font-bold tabular-nums ' +
                (down ? 'bg-coral/[0.16] text-out' : 'bg-teal/[0.16] text-in')
              }
            >
              {down ? '↓' : '↑'} {Math.abs(monthPct).toFixed(1)}% · {fmtEUR(monthDelta, { decimals: 0 })} vs{' '}
              {vsMonthLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-nowrap items-baseline gap-1 whitespace-nowrap">
            <span className="text-[clamp(24px,2.2vw,32px)] font-bold text-ink-mute">
              {figure.sign}€
            </span>
            <span className="text-[clamp(44px,5.4vw,78px)] font-extrabold -tracking-[0.042em] tabular-nums text-ink">
              {figure.whole}
            </span>
            <span className="text-[clamp(26px,2.4vw,36px)] font-bold tabular-nums text-ink-mute">
              .{figure.cents}
            </span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-[9px]">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(GLOBAL_ADD_TRANSACTION_EVENT))}
            className="inline-flex items-center gap-[7px] rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-2 pl-4 pr-2 text-[13.5px] font-bold text-white [box-shadow:0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-[transform,box-shadow,background] duration-200 ease-theus hover:-translate-y-0.5 hover:bg-indigo-dark hover:bg-none hover:[box-shadow:0_12px_26px_rgba(74,92,224,.42)]"
          >
            Add transaction
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/[0.22]">
              <Icon name="arrow-right" size={13} strokeWidth={2.2} />
            </span>
          </button>
          <button
            type="button"
            className="rounded-full border border-white/90 px-[17px] py-[9px] text-[13.5px] font-semibold text-ink [background:var(--glass-sheen-tile)] backdrop-blur-xl transition-[transform,background] duration-200 ease-theus hover:-translate-y-0.5 hover:bg-white"
          >
            Transfer
          </button>
        </div>
      </div>

      {/* Row 2 — ring + figures */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(180px,0.95fr)_minmax(0,1.35fr)] items-stretch gap-4">
        <BudgetRing
          spent={spentThisMonth}
          income={incomeThisMonth}
          avgSavingsRate={avgSavingsRate}
          monthLabel={monthLabelUpper}
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-stretch gap-3">
          <div className="glass-tile flex min-h-[80px] flex-col justify-between gap-2 !rounded-[20px] p-4 px-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
              Projected 31 Dec
            </div>
            <div className="text-[clamp(23px,2.2vw,30px)] font-extrabold -tracking-[0.035em] tabular-nums text-in">
              {fmtEUR(projectedEOY, { decimals: 0 })}
            </div>
            <div className="text-[12px] font-semibold text-ink-mute">
              <span className="whitespace-nowrap">at {avgRatePct}% rate</span>{' '}
              ·{' '}
              <span className="whitespace-nowrap">
                {avgNet >= 0 ? '+' : '−'}
                {fmtEUR(Math.abs(avgNet), { decimals: 0 })}/mo
              </span>
            </div>
          </div>
          <div className="glass-tile flex min-h-[80px] flex-col justify-between gap-2 !rounded-[20px] p-4 px-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
              Net this year
            </div>
            <div
              className={
                'text-[clamp(23px,2.2vw,30px)] font-extrabold -tracking-[0.035em] tabular-nums ' +
                (savingsThisYear >= 0 ? 'text-in' : 'text-out')
              }
            >
              {savingsThisYear >= 0 ? '+' : ''}
              {fmtEUR(savingsThisYear, { decimals: 0 })}
            </div>
            <div className="text-[12px] font-semibold text-ink-mute">
              <span className="whitespace-nowrap">in {fmtEUR(savingsIncome, { decimals: 0 })}</span>{' '}
              ·{' '}
              <span className="whitespace-nowrap">out {fmtEUR(savingsExpense, { decimals: 0 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
