import { Icon, Mono } from '@/components/ui';

const STREAK_TILES = [
  { label: 'Coach streak', value: '—', icon: 'pulse' as const },
  { label: 'Lessons completed', value: '0 / —', icon: 'book' as const },
  { label: 'Saved with Coach', value: '—', icon: 'arrow-up' as const },
  { label: 'Next check-in', value: '—', icon: 'bell' as const },
];

export default function CoachPage() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo/[0.12] px-3 py-[5px] text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-dark mb-3">
          <Icon name="sparkle" size={12} /> Beta
        </div>
        <h1 className="max-w-[620px] text-[34px] font-extrabold leading-[1.15] -tracking-[0.03em] text-ink">
          Your money has patterns.{' '}
          <span className="text-ink-mute">
            Theus reads them, and tells you what to do next.
          </span>
        </h1>
      </div>

      <div className="glass grid grid-cols-1 gap-6 !rounded-[26px] p-[22px] sm:grid-cols-2 lg:grid-cols-4">
        {STREAK_TILES.map((tile) => (
          <div key={tile.label}>
            <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              <Icon name={tile.icon} size={12} /> {tile.label}
            </div>
            <div className="font-mono font-semibold text-[22px] tracking-[-0.02em] text-ink-mute">
              {tile.value}
            </div>
          </div>
        ))}
      </div>

      <div>
        <Mono size="sm" className="tracking-[0.14em]">
          This week&rsquo;s insights
        </Mono>
        <div className="glass mt-3 flex items-start gap-3.5 !rounded-[20px] p-5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-indigo/[0.12]">
            <Icon name="sparkle" size={18} className="text-indigo" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-ink mb-1">
              Coach is learning your patterns.
            </div>
            <div className="text-[13px] leading-[1.5] text-ink-soft">
              Insights appear here once Coach has analysed at least four weeks
              of transactions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
