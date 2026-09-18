import { fmtEUR } from '@/lib/money';
import { AddAccountButton } from './AddAccountButton';

export interface AccountShare {
  id: string;
  name: string;
  color: string;
  eur: number;
  pct: number;
}

export interface NegativeAccount {
  name: string;
  eur: number;
}

/**
 * Net-worth hero — Theus Accounts design handoff. One glass card: headline
 * (kicker + MTD-delta pill + huge balance + currency-mix sentence + Add
 * account CTA) over a "share of net worth" bar. No separate page title —
 * "Net worth" already frames the screen, matching the handoff exactly.
 *
 * Negative-balance accounts have no honest width in a share-of-total bar,
 * so they're excluded from both the bar and its percentages (denominator
 * is the sum of positive balances only) and named separately underneath
 * instead.
 */
export function AccountsHero({
  totalEUR,
  deltaEUR,
  accountCount,
  eurCount,
  usdCount,
  fxRate,
  shares,
  negatives,
}: {
  totalEUR: number;
  deltaEUR: number;
  accountCount: number;
  eurCount: number;
  usdCount: number;
  fxRate: number;
  shares: AccountShare[];
  negatives: NegativeAccount[];
}) {
  const deltaBase = totalEUR - deltaEUR;
  const deltaPct = deltaBase !== 0 ? (deltaEUR / Math.abs(deltaBase)) * 100 : 0;
  const deltaIsPos = deltaEUR >= 0;

  const abs = Math.abs(totalEUR);
  const sign = totalEUR < 0 ? '−' : '';
  const intPart = Math.floor(abs).toLocaleString('en-US');
  const cents = (abs % 1).toFixed(2).slice(1); // ".42"

  const mixParts: string[] = [];
  if (eurCount > 0) mixParts.push(`${eurCount} in EUR`);
  if (usdCount > 0) mixParts.push(`${usdCount} in USD`);
  const mixLabel =
    usdCount > 0 ? `${mixParts.join(' · ')}, converted at ${fxRate.toFixed(4)}` : mixParts.join(' · ');

  return (
    <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="min-w-0 flex-1 basis-[260px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Net worth · {accountCount} account{accountCount === 1 ? '' : 's'}
            </span>
            {Number.isFinite(deltaPct) && deltaEUR !== 0 ? (
              <span
                className={`whitespace-nowrap rounded-full px-[11px] py-1 text-[11.5px] font-bold tabular-nums ${
                  deltaIsPos ? 'bg-teal/[0.16] text-in' : 'bg-coral/[0.16] text-out'
                }`}
              >
                {deltaIsPos ? '↑' : '↓'} {Math.abs(deltaPct).toFixed(1)}% · {deltaIsPos ? '+' : '−'}
                {fmtEUR(Math.abs(deltaEUR))} this month
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-[clamp(24px,2.2vw,32px)] font-bold tabular-nums text-ink-mute">
              {sign}€
            </span>
            <span className="text-[clamp(44px,5.4vw,78px)] font-extrabold -tracking-[0.042em] tabular-nums leading-none text-ink">
              {intPart}
            </span>
            <span className="text-[clamp(26px,2.4vw,36px)] font-bold tabular-nums text-ink-mute">
              {cents}
            </span>
          </div>
          {mixLabel ? <div className="mt-2 text-[13.5px] font-semibold text-ink-soft">{mixLabel}</div> : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AddAccountButton />
        </div>
      </div>

      {shares.length > 0 || negatives.length > 0 ? (
        <div className="flex flex-col gap-[11px]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
              Share of net worth
            </span>
            {negatives.length > 0 ? (
              <span className="text-[12.5px] font-semibold text-ink-mute">
                Overdrafts are listed below the bar, not drawn in it
              </span>
            ) : null}
          </div>
          <div className="flex h-4 gap-[3px] overflow-hidden rounded-full bg-[#eef0f6]">
            {shares.map((s) => (
              <span
                key={s.id}
                title={`${s.name} — ${s.pct.toFixed(1)}% of net worth`}
                className="meter block h-full origin-left"
                style={{ flex: `${Math.max(s.pct, 0.05)} 1 0`, background: s.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-[18px] gap-y-2">
            {shares.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-ink-soft">
                <span className="h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ background: s.color }} />
                {s.name}
                <b className="font-bold tabular-nums text-ink">{s.pct.toFixed(1)}%</b>
              </span>
            ))}
            {negatives.map((n) => (
              <span key={n.name} className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-out">
                <span className="h-[9px] w-[9px] shrink-0 rounded-[3px] border-[1.5px] border-dashed border-out" />
                {n.name} {fmtEUR(n.eur)} · negative, excluded
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
