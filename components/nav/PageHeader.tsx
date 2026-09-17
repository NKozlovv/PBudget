/**
 * Standard page header inside the (app) shell — v4: page title 34px/800,
 * an optional subtitle line, page actions at the right. No eyebrow kicker
 * or serif tagline — design_handoff_theus_rehaul's page headers (Trends,
 * Categories) are just title + subtitle.
 */
export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <h1 className="text-[34px] font-extrabold -tracking-[0.03em] text-ink">{title}</h1>
        {meta ? <p className="mt-2 max-w-[58ch] text-[14px] font-medium text-ink-soft">{meta}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
