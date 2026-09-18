/**
 * Header for an auth form — Theus Auth design handoff: title (30px
 * extrabold) directly over a subtitle, no eyebrow kicker.
 */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[30px] font-extrabold -tracking-[0.03em] text-ink">{title}</h2>
      <p className="mt-2 text-[14.5px] font-medium leading-relaxed text-ink-soft">{subtitle}</p>
    </div>
  );
}
