import { Card, Mono } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <Mono>01 · in progress</Mono>

        <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight leading-none">
          Theus
        </h1>

        <p className="mt-3 font-display italic text-2xl text-ink-mute">money understood.</p>

        <Card className="mt-10 p-7">
          <div className="grid gap-4">
            <Row label="branch" value="experimental/theus-rehaul" />
            <Row label="phase" value="2 · chunk 2 — auth shell" />
            <Row
              label="sign in"
              value={
                <a href="/login" className="text-accent hover:underline">
                  /login
                </a>
              }
            />
            <Row
              label="dashboard"
              value={
                <a href="/dashboard" className="text-accent hover:underline">
                  /dashboard
                </a>
              }
            />
            <Row
              label="styleguide"
              value={
                <a href="/styleguide" className="text-accent hover:underline">
                  /styleguide
                </a>
              }
            />
            <Row
              label="legacy"
              value={
                <a href="/legacy" className="text-accent hover:underline">
                  /legacy
                </a>
              }
            />
          </div>
        </Card>

        <p className="mt-10 max-w-md text-sm text-ink-soft leading-relaxed">
          The previous build remains fully functional and reachable at{' '}
          <a href="/legacy" className="text-accent underline-offset-2 hover:underline">
            /legacy
          </a>
          . This branch is a structural rehaul; pages will appear here as chunks land.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-6">
      <Mono size="xs" className="w-24 shrink-0">
        {label}
      </Mono>
      <span className="text-sm">{value}</span>
    </div>
  );
}
