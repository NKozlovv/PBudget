const TONE_CLASS = {
  ok: 'bg-teal/[0.18] text-in',
  info: 'bg-indigo/[0.14] text-indigo-dark',
  err: 'bg-coral/[0.18] text-out',
} as const;

/** Single status banner shared by the auth forms — success, neutral info, or error. */
export function AuthBanner({
  tone,
  children,
}: {
  tone: keyof typeof TONE_CLASS;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-5 flex items-start gap-[10px] rounded-[16px] px-[15px] py-[13px] text-[13.5px] font-semibold leading-relaxed ${TONE_CLASS[tone]}`}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {tone === 'err' ? '!' : '✓'}
      </span>
      <span>{children}</span>
    </div>
  );
}
