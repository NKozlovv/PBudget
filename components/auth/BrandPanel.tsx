import { Mono } from '@/components/ui';
import { Sparkline } from './Sparkline';

/**
 * Left-side brand panel for the auth split layout.
 * Modeled on design-refs/src/auth.jsx 8–42:
 *   diagonal gradient + soft accent radials; wordmark; serif headline;
 *   description paragraph; balance preview card; mono footer.
 */
export function BrandPanel() {
  const balanceTrend = [12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 23, 25];

  return (
    <aside
      className="hidden md:flex flex-col justify-between border-r border-rule p-14 lg:p-16 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(155deg, var(--bg-soft) 0%, var(--bg) 60%), ' +
          'radial-gradient(ellipse at 20% 20%, var(--accent-soft), transparent 60%)',
      }}
    >
      <div className="text-2xl font-semibold tracking-tight">Theus</div>

      <div className="max-w-md">
        <h1 className="font-display text-[56px] lg:text-[64px] leading-[1.05] font-normal tracking-tight">
          Money,
          <br />
          <em className="not-italic font-display italic text-accent">understood.</em>
        </h1>

        <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">
          Track every euro, every dollar — across accounts and currencies. Then let Theus surface
          what your spending is actually telling you.
        </p>

        <div
          className="mt-14 max-w-sm rounded-2xl border border-rule bg-bg-soft p-6"
          style={{ boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)' }}
        >
          <div className="flex items-center justify-between">
            <Mono>Total balance</Mono>
            <Mono tone="pos" size="xs">
              ↗ +4.2% mo
            </Mono>
          </div>
          <div className="mt-3 text-[36px] font-semibold leading-none tracking-tight tabular-nums">
            €24,318<span className="text-ink-mute">.50</span>
          </div>
          <div className="mt-4">
            <Sparkline data={balanceTrend} height={56} />
          </div>
        </div>
      </div>

      <Mono size="xs" className="tracking-[0.18em]">
        THEUS · 2026 · v2.0.0-α
      </Mono>
    </aside>
  );
}
