import { Icon } from '@/components/ui';
import { Sparkline } from '@/components/charts/Sparkline';
import { TheusMark } from './TheusMark';

const SAMPLE_TREND = [58200, 59450, 63900, 65210, 66980, 68150, 69420, 68990, 71457, 70979];

/**
 * Left-side brand panel for the auth split shell — Theus Auth design
 * handoff. Logo, headline, subhead, and one decorative stat card. The
 * figures in that card are illustrative sample data, not a real account —
 * labelled as such so it's never mistaken for one.
 */
export function BrandPanel() {
  return (
    <aside className="glass hidden min-h-[600px] flex-col justify-between gap-[26px] !rounded-[34px] p-[34px] md:flex">
      <div className="flex items-center gap-[11px]">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-[linear-gradient(135deg,#f2708f,#4a5ce0)]">
          <TheusMark size={20} tone="white" />
        </span>
        <span className="text-[20px] font-extrabold -tracking-[0.02em] text-ink">Theus</span>
      </div>

      <div className="max-w-[20ch]">
        <h1 className="text-[clamp(40px,4.6vw,68px)] font-extrabold -tracking-[0.045em] leading-[1.02] text-ink">
          Money, understood.
        </h1>
        <p className="mt-[18px] max-w-[34ch] text-[17px] font-medium leading-relaxed text-ink-soft">
          Every euro and every dollar in one place, converted as you go, so the number at the top
          is the number you can trust.
        </p>
      </div>

      <div className="glass-inner flex max-w-[420px] flex-col gap-[14px] !rounded-[22px] p-5 px-[22px]">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">
              Net worth · sample
            </div>
            <div className="mt-1.5 flex items-baseline gap-[3px]">
              <span className="text-[20px] font-bold text-ink-mute">€</span>
              <span className="text-[34px] font-extrabold -tracking-[0.04em] tabular-nums leading-none text-ink">
                70,979
              </span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-teal/[0.18] px-3 py-[5px] text-[11.5px] font-bold text-in">
            <Icon name="arrow-up" size={11} /> 6 months up
          </span>
        </div>
        <Sparkline data={SAMPLE_TREND} width={320} height={72} />
        <div className="text-[12px] font-semibold text-ink-mute">
          Illustrative figures — not a real account.
        </div>
      </div>
    </aside>
  );
}
