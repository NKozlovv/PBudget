import { Mono } from '@/components/ui';
import { Sparkline } from '@/components/charts/Sparkline';
import { TheusLockup } from './TheusMark';

/**
 * Left-side brand panel for the auth split layout.
 * Modeled on design-refs/src/auth.jsx 8–42 but adapted for fluid widths
 * (Sterling reference is fixed 1280×800; we render edge-to-edge).
 *
 * Layout: lockup pinned top-left, footer pinned bottom-left, editorial
 * column horizontally + vertically centered. Single brass radial on a
 * flat bg-panel base — three layered gradients were creating muddy
 * bands on the green bg, this version reads cleaner.
 */
export function BrandPanel() {
  const balanceTrend = [12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 23, 25];

  return (
    <aside
      className="hidden md:block relative h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-panel)',
        backgroundImage:
          'radial-gradient(circle 900px at 22% 28%, var(--accent-soft) 0%, transparent 55%)',
      }}
    >
      {/* Top-left lockup */}
      <div className="absolute left-12 top-12 lg:left-16 lg:top-14 z-10">
        <TheusLockup size={26} />
      </div>

      {/* Bottom-left footer */}
      <div className="absolute left-12 bottom-12 lg:left-16 lg:bottom-14 z-10">
        <Mono size="xs" className="tracking-[0.18em]">
          THEUS · 2026 · v2.0.0-α
        </Mono>
      </div>

      {/* Centered editorial column */}
      <div className="flex h-full w-full items-center justify-center px-8">
        <div className="w-full max-w-[520px]">
          <h1 className="font-display text-[64px] lg:text-[76px] xl:text-[84px] leading-[1.02] font-normal tracking-tight">
            Money,
            <br />
            <em className="not-italic font-display italic text-accent">understood.</em>
          </h1>

          <p className="mt-6 text-[15px] leading-relaxed text-ink-soft max-w-[440px]">
            Track every euro, every dollar — across accounts and currencies. Then let Theus surface
            what your spending is actually telling you.
          </p>

          <div
            className="mt-12 max-w-[400px] rounded-2xl border border-rule bg-bg-soft p-6"
            style={{ boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)' }}
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
