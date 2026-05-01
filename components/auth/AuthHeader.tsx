import { Mono } from '@/components/ui';

/**
 * Header group for an auth form (mono kicker → 36px headline → subtitle).
 * Modeled on design-refs/src/auth.jsx 46–53.
 */
export function AuthHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <Mono size="sm" className="tracking-[0.18em]">
        {kicker}
      </Mono>
      <h2 className="mt-3 text-[36px] font-semibold leading-tight tracking-tight">{title}</h2>
      <p className="mt-2 text-[14px] text-ink-soft">{subtitle}</p>
    </div>
  );
}
