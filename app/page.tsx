export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-mono-label text-ink-mute">
          01 · in progress
        </p>

        <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight leading-none">
          Theus
        </h1>

        <p className="mt-3 font-display italic text-2xl text-ink-mute">money understood.</p>

        <div className="mt-10 border-t border-rule pt-6 grid gap-4">
          <Row label="branch" value="experimental/theus-rehaul" />
          <Row label="phase" value="2 · chunk 1 — design system" />
          <Row label="styleguide" value={<a href="/styleguide" className="text-accent hover:underline">/styleguide</a>} />
          <Row label="legacy" value={<a href="/legacy" className="text-accent hover:underline">/legacy</a>} />
        </div>

        <p className="mt-12 max-w-md text-sm text-ink-soft leading-relaxed">
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
      <span className="font-mono text-[10px] uppercase tracking-mono-label text-ink-mute w-20 shrink-0">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
