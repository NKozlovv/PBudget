import { Mono } from '@/components/ui';

/**
 * Standard page header inside the (app) shell.
 * Mono kicker → 32 px headline → optional italic Instrument Serif tagline.
 * Right-aligned slot for action buttons.
 */
export function PageHeader({
  kicker,
  title,
  tagline,
  actions,
}: {
  kicker: string;
  title: string;
  tagline?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-6 border-b border-rule pb-6">
      <div className="min-w-0">
        <Mono>{kicker}</Mono>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight">{title}</h1>
        {tagline ? (
          <p className="mt-2 font-display italic text-lg text-ink-mute">{tagline}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
