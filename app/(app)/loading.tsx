/**
 * Shared loading UI for every route under `(app)/` — Next.js nests this
 * inside the layout and wraps `children` (i.e. every page below this
 * segment) in a Suspense boundary automatically, so it fires on every
 * navigation between Dashboard/Transactions/Accounts/Categories/Forecast/
 * Trends/Import/Members/Trips without needing a copy per route.
 *
 * The Sidebar/Topbar (rendered by the layout, above this) stay mounted and
 * interactive immediately; only the main content area shows this skeleton
 * while the new page's data loads — that's what makes navigation feel
 * instant instead of the whole app going blank.
 *
 * Was flat `bg-white/[0.7-0.75]` blocks — fixed 2026-09-20 (user report:
 * "a millisecond of white screen" on every navigation, no difference which
 * page). That's this skeleton: it's large enough to cover nearly the whole
 * viewport, and flat ~75%-opacity white reads as a stark flash against the
 * ambient gradient + real content everywhere else uses translucent,
 * backdrop-blurred `.glass-tile` panels, not solid white. Switched every
 * block to `glass-tile` (own radius overridden per block via `!rounded-*`,
 * same pattern used throughout `components/`) so the loading state looks
 * like soft glass settling in, not a blown-out flash.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="glass-tile h-3 w-24 animate-pulse !rounded-full" />
          <div className="glass-tile h-6 w-48 animate-pulse !rounded-full" />
        </div>
        <div className="glass-tile h-9 w-28 animate-pulse !rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-tile h-[180px] animate-pulse !rounded-[26px]" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass-tile h-[320px] animate-pulse !rounded-[28px]" />
        <div className="glass-tile h-[320px] animate-pulse !rounded-[28px]" />
      </div>

      <div className="glass-tile h-[220px] animate-pulse !rounded-[26px]" />
    </div>
  );
}
