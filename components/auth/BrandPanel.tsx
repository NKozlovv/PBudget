import { Mono } from '@/components/ui';
import { Sparkline } from './Sparkline';
import { TheusLockup } from './TheusMark';

/**
 * Left-side brand panel for the auth split layout.
 * Modeled on design-refs/src/auth.jsx 8–42:
 *   diagonal gradient + soft accent radial; lockup top-left;
 *   centered editorial column with serif headline, paragraph,
 *   balance preview card; mono footer bottom-left.
 *
 * Layout uses absolute positioning for the lockup + footer so that
 * the central editorial block stays vertically centered regardless
 * of viewport height.
 */
export function BrandPanel() {
  const balanceTrend = [12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 23, 25];

  return (
    <aside
      className="hidden md:flex relative h-full overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse at 18% 22%, var(--accent-soft) 0%, transparent 55%)',
          'radial-gradient(ellipse at 85% 85%, rgba(127,181,138,0.08) 0%, transparent 55%)',
          'linear-gradient(155deg, var(--bg-panel) 0%, var(--bg) 70%)',
        ].join(', '),
      }}
    >
      {/* Top-left lockup */}
      <div className="absolute left-12 top-12 lg:left-16 lg:top-14">
        <TheusLockup size={26} />
      </div>

      {/* Bottom-left footer */}
      <div className="absolute left-12 bottom-12 lg:left-16 lg:bottom-14">
        <Mono size="xs" className="tracking-[0.18em]">
          THEUS · 2026 · v2.0.0-α
        </Mono>
      </div>

      {/* Vertically centered editorial column */}
      <div className="flex h-full w-full items-center px-12 lg:px-16">
        <div className="max-w-[460px]">
          <h1 className="font-display text-[64px] lg:text-[72px] leading-[1.02] font-normal tracking-tight">
            Money,
            <br />
            <em className="not-italic font-display italic text-accent">understood.</em>
          </h1>

          <p className="mt-6 text-[15px] leading-relaxed text-ink-soft max-w-[420px]">
            Track every euro, every dollar — across accounts and currencies. Then let Theus surface
            what your spending is actually telling you.
          </p>

          <div
            className="mt-12 max-w-sm rounded-2xl border border-rule bg-bg-soft p-6"
            style={{ boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)' }}
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
      </div>
    </aside>
  );
}
