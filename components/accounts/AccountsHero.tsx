import { fmtEUR } from '@/lib/money';
import { NetWorthPie } from './NetWorthPie';

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
 * (kicker + MTD-delta pill + huge balance + currency-mix sentence) on the
 * left, a share-of-net-worth pie + legend on the right. No separate page
 * title — "Net worth" already frames the screen. "Add account" lives in
 * the accounts list's own header instead of here, now that this panel's
 * right side is a chart rather than a full-width bar with room to spare.
 *
 * Negative-balance accounts have no honest slice in a share-of-total pie,
 * so they're excluded from it (denominator is the sum of positive
 * balances only) and named separately underneath instead.
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
      <div className="flex flex-wrap items-start gap-[28px]">
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

          {negatives.length > 0 ? (
            <div className="mt-4 flex flex-col gap-1.5">
              {negatives.map((n) => (
                <span key={n.name} className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-out">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-[3px] border-[1.5px] border-dashed border-out" />
                  {n.name} {fmtEUR(n.eur)} · negative, excluded from the pie
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {shares.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-[22px]">
            <NetWorthPie shares={shares} />
            <div className="grid grid-cols-[repeat(2,minmax(0,auto))] gap-x-4 gap-y-1.5">
              {shares.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-ink-soft">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ background: s.color }} />
                  <span className="truncate">{s.name}</span>
                  <b className="shrink-0 font-bold tabular-nums text-ink">{Math.round(s.pct)}%</b>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
