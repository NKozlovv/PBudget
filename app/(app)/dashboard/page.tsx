import { createClient } from '@/lib/supabase/server';
import { Card, Mono } from '@/components/ui';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-10 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-end justify-between border-b border-rule pb-6">
          <div>
            <Mono>03 · auth verified</Mono>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 font-display italic text-xl text-ink-mute">money understood.</p>
          </div>
          <SignOutButton />
        </header>

        <Card className="mt-10 p-7">
          <div className="grid gap-4">
            <Row label="signed in as" value={user?.email ?? '—'} />
            <Row label="user id" value={<code className="font-mono text-[12px]">{user?.id}</code>} />
            <Row label="phase" value="2 · chunk 2 — auth shell" />
          </div>
        </Card>

        <p className="mt-10 max-w-2xl text-sm text-ink-soft leading-relaxed">
          Auth round-trip works. The real dashboard, sidebar shell, and data layer
          land in chunks 3 → 5.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-6">
      <Mono size="xs" className="w-32 shrink-0">
        {label}
      </Mono>
      <span className="text-sm">{value}</span>
    </div>
  );
}
