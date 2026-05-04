import { Card } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';

export default function CoachPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="flex flex-col items-center gap-4 px-12 py-16 text-center">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hi))',
          }}
        >
          <Icon name="sparkle" size={22} className="text-white" />
        </div>
        <div className="text-[18px] font-semibold text-ink">Coach — coming soon</div>
        <div className="max-w-sm text-[13px] text-ink-soft">
          Personalized insights and challenges from Sterling. We&rsquo;ll surface
          patterns in your spending and help you act on them.
        </div>
      </Card>
    </div>
  );
}
