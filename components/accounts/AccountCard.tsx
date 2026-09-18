'use client';

import { fmtCurrency, fmtEUR } from '@/lib/money';
import type { AccountSummary } from '@/lib/accounts/summary';
import { AccountMiniChart } from './AccountMiniChart';

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Single account row — Theus Accounts design handoff. A horizontal glass
 * row (icon+name / native+EUR balance / MTD delta / sparkline / actions),
 * replacing the old vertical "bank card" grid — the handoff renders every
 * account as one list, not a grid of tiles.
 */
export function AccountCard({
  summary,
  color,
  shareLabel,
  fxRate,
  onEdit,
  onDelete,
}: {
  summary: AccountSummary;
  color: string;
  /** Precomputed "X% of net worth" / "Overdraft · excluded from share" — shares the same denominator as the hero's bar. */
  shareLabel: string;
  fxRate: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { account, native, deltaNative, spark } = summary;
  const showEurLine = account.currency !== 'EUR';
  const symbol = account.currency === 'USD' ? '$' : '€';
  const isPos = deltaNative >= 0;
  // A simple native × current-rate conversion, not summary.eur/deltaEUR —
  // those accumulate each transaction's own historical fx_rate (correct
  // for the net-worth total, which tracks real realized FX gains/losses
  // over time), which can leave a non-zero "≈ €" next to a $0.00 balance
  // once an account has been drawn down across several different
  // historical rates. This line promises "at {rate}", so it has to
  // actually be native × that one rate to avoid contradicting itself.
  const rate = account.currency === 'EUR' ? 1 : fxRate;
  const eurNow = native * rate;
  const eurDelta = deltaNative * rate;
  // Same reasoning for the sparkline: each point's own `eur` field is the
  // historical-accumulated figure, so re-derive it from that point's
  // native balance at today's single rate instead, for the same reason.
  const sparkAtCurrentRate = spark.map((p) => ({ ...p, eur: p.native * rate }));

  return (
    <div className="glass-inner flex flex-wrap items-center gap-[18px] !rounded-[22px] p-4 px-[18px] transition-transform duration-200 ease-theus hover:-translate-y-0.5">
      <div className="flex min-w-0 flex-1 basis-[220px] items-center gap-[13px]">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-[14px] font-extrabold text-white"
          style={{ background: color }}
        >
          {initials(account.name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[16px] font-extrabold -tracking-[0.015em] text-ink">
              {account.name}
            </span>
            <span className="rounded-full bg-[rgba(31,39,66,.07)] px-2 py-0.5 text-[10.5px] font-bold tracking-[0.06em] text-ink-soft">
              {account.currency}
            </span>
          </div>
          <div className="mt-1 text-[12.5px] font-semibold text-ink-mute">{shareLabel}</div>
        </div>
      </div>

      <div className="min-w-[120px] flex-none basis-[170px] text-right">
        <div
          className="whitespace-nowrap text-[21px] font-extrabold -tracking-[0.03em] tabular-nums"
          style={{ color: native < 0 ? 'var(--out)' : 'var(--ink)' }}
        >
          {native < 0 ? '−' : ''}
          {symbol}
          {fmtCurrency(Math.abs(native), account.currency, { noSymbol: true })}
        </div>
        <div className="mt-[3px] whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-ink-mute">
          {showEurLine ? `≈ ${fmtEUR(eurNow)} at ${fxRate.toFixed(4)}` : 'Held in euro'}
        </div>
      </div>

      <div className="min-w-[110px] flex-none basis-[150px] text-right">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-mute">Month to date</div>
        <div
          className="mt-1 whitespace-nowrap text-[14.5px] font-extrabold tabular-nums"
          style={{ color: isPos ? 'var(--in)' : 'var(--out)' }}
        >
          {isPos ? '+' : '−'}
          {symbol}
          {fmtCurrency(Math.abs(deltaNative), account.currency, { noSymbol: true, decimals: 0 })}
        </div>
        {showEurLine ? (
          <div className="mt-0.5 whitespace-nowrap text-[11.5px] font-semibold tabular-nums text-ink-mute">
            ≈ {isPos ? '+' : '−'}
            {fmtEUR(Math.abs(eurDelta), { decimals: 0 })}
          </div>
        ) : null}
      </div>

      <div className="min-w-[96px] flex-none basis-[128px]">
        <AccountMiniChart data={sparkAtCurrentRate} color={color} width={128} height={44} />
      </div>

      <div className="flex flex-none items-center gap-[7px]">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-white/90 bg-white/[0.66] px-[15px] py-[9px] text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-out/45 bg-white/50 px-[15px] py-[9px] text-[13px] font-semibold text-out transition-colors duration-200 hover:bg-coral/[0.14]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
