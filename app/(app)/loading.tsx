/**
 * Shared loading UI for every route under `(app)/` — Next.js nests this
 * inside the layout and wraps `children` (i.e. every page below this
 * segment) in a Suspense boundary automatically, so it fires on every
 * navigation between Dashboard/Transactions/Accounts/Categories/Forecast/
 * Trends/Import/Members without needing a copy per route.
 *
 * The Sidebar/Topbar (rendered by the layout, above this) stay mounted and
 * interactive immediately; only the main content area shows this skeleton
 * while the new page's data loads — that's what makes navigation feel
 * instant instead of the whole app going blank.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/70" />
          <div className="h-6 w-48 animate-pulse rounded-full bg-white/70" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full bg-white/70" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[180px] animate-pulse rounded-[26px] bg-white/[0.75]" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/[0.75]" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/[0.75]" />
      </div>

      <div className="h-[220px] animate-pulse rounded-[26px] bg-white/[0.75]" />
    </div>
  );
}
