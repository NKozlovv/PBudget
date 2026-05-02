import { Mono } from '@/components/ui';

/**
 * Standard page header inside the (app) shell.
 * Mono kicker → 32 px headline → optional sub-line. Pass `tagline` for the
 * italic Instrument Serif brand moment (only the home/auth/dashboard hero
 * uses this), or `meta` for plain caption-style text under the title.
 */
export function PageHeader({
  kicker,
  title,
  tagline,
  meta,
  actions,
}: {
  kicker: string;
  title: string;
  tagline?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-6 border-b border-rule pb-6">
      <div className="min-w-0">
        <Mono>{kicker}</Mono>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight">{title}</h1>
        {tagline ? (
          <p className="mt-2 font-display italic text-lg text-ink-mute">{tagline}</p>
        ) : meta ? (
          <p className="mt-2 text-[13px] text-ink-soft">{meta}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
