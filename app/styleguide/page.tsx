import { Mono, Num, Card, CardHeader, Pill, Button, KpiTile } from '@/components/ui';

export const metadata = {
  title: 'Theus — Styleguide',
};

export default function StyleguidePage() {
  return (
    <main className="min-h-screen px-10 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-rule pb-6">
          <Mono>02 · system</Mono>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Theus styleguide</h1>
          <p className="mt-2 font-display italic text-xl text-ink-mute">money understood.</p>
        </header>

        <Section label="Palette">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            <Swatch name="bg" value="#0F1A14" cssVar="--bg" />
            <Swatch name="bg-soft" value="#162420" cssVar="--bg-soft" />
            <Swatch name="bg-panel" value="#1C2C26" cssVar="--bg-panel" />
            <Swatch name="ink" value="#EFE9D8" cssVar="--ink" />
            <Swatch name="ink-soft" value="#C7BFA9" cssVar="--ink-soft" />
            <Swatch name="ink-mute" value="#8E866E" cssVar="--ink-mute" />
            <Swatch name="accent" value="#C9A24A" cssVar="--accent" />
            <Swatch name="pos" value="#7FB58A" cssVar="--pos" />
            <Swatch name="neg" value="#E9673E" cssVar="--neg" />
          </div>
        </Section>

        <Section label="Typography">
          <Card>
            <div className="space-y-4">
              {(
                [
                  ['Display 96', 96, 700, '-0.04em'],
                  ['Headline 44', 44, 600, '-0.03em'],
                  ['Title 22', 22, 600, '-0.02em'],
                  ['Body 14', 14, 400, '0'],
                  ['Caption 11', 11, 500, '0.04em'],
                ] as const
              ).map(([label, size, weight, ls]) => (
                <div key={label} className="flex items-baseline gap-6 border-b border-rule pb-3 last:border-0 last:pb-0">
                  <Mono size="xs" className="w-24 shrink-0">
                    {label}
                  </Mono>
                  <span style={{ fontSize: size, fontWeight: weight, letterSpacing: ls, lineHeight: 1.1 }}>
                    Theus
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section label="Hero balance · Sterling-style display">
          <Card className="relative overflow-hidden p-7">
            <div className="flex items-baseline justify-between">
              <Mono>Total balance</Mono>
              <Mono tone="soft" size="xs">
                ↗ +4.2% · 30d
              </Mono>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-ink-mute text-base">€</span>
              <span className="text-[56px] font-semibold leading-none tracking-tight tabular-nums">
                31,380
              </span>
              <span className="text-ink-mute text-[22px] font-medium tabular-nums">.42</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <Mono tone="pos" size="xs">
                ↗ +€1,240
              </Mono>
              <span className="text-[12px] text-ink-mute">vs. last month</span>
            </div>
          </Card>
        </Section>

        <Section label="KPI cards · Sterling grid (separate rounded cards)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiTile
              label="Income · April"
              value="€4,820"
              cents=".00"
              delta="↗ +12.0%"
              sub="vs last month"
            />
            <KpiTile
              label="Spending · April"
              value="€3,410"
              cents=".00"
              delta="↘ −4.0%"
              deltaTone="pos"
              sub="under by €76"
            />
            <KpiTile
              label="Savings rate"
              value="46%"
              delta="+5pt"
              sub="rolling 90d"
            />
          </div>
        </Section>

        <Section label="Mono labels">
          <Card>
            <div className="flex flex-wrap gap-6">
              <Mono>default mute</Mono>
              <Mono tone="default">default</Mono>
              <Mono tone="soft">soft</Mono>
              <Mono tone="accent">accent</Mono>
              <Mono tone="pos">pos · ↗ +12%</Mono>
              <Mono tone="neg">neg · ↘ -4%</Mono>
            </div>
          </Card>
        </Section>

        <Section label="Pills">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Pill>Default</Pill>
              <Pill variant="accent">Groceries</Pill>
              <Pill variant="pos">Income</Pill>
              <Pill variant="neg">Expense</Pill>
              <Pill variant="outline">Outline</Pill>
            </div>
          </Card>
        </Section>

        <Section label="Buttons · Sterling proportions (rounded-[10px], 22×12 pad)">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Continue</Button>
              <Button variant="ghost">Add account</Button>
              <Button variant="subtle">Subtle</Button>
              <Button size="sm">Small</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Card>
        </Section>

        <Section label="Time range pill (Sterling pattern)">
          <Card>
            <div className="inline-flex gap-1.5 rounded-[10px] border border-rule bg-bg p-1">
              {['1M', '3M', 'YTD', 'ALL'].map((p, i) => (
                <button
                  key={p}
                  className={
                    'rounded-[7px] px-4 py-2 text-xs font-medium ' +
                    (i === 1 ? 'bg-bg-soft text-ink' : 'text-ink-mute hover:text-ink')
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>
        </Section>

        <Section label="Cards · 16px radius, 24px pad">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader
                title="Income vs Spend"
                subtitle={<Mono size="xs">last 6 months</Mono>}
                right={
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-pos" /> <Mono size="xs">income</Mono>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent" /> <Mono size="xs">spend</Mono>
                    </span>
                  </div>
                }
              />
              <div className="mt-6 h-32 rounded-lg border border-dashed border-rule" aria-hidden />
            </Card>
            <Card>
              <CardHeader title="Cashflow" right={<Mono size="xs" tone="pos">↗ +21.4% ytd</Mono>} />
              <div className="mt-6 h-32 rounded-lg border border-dashed border-rule" aria-hidden />
            </Card>
          </div>
        </Section>

        <footer className="mt-16 border-t border-rule pt-6">
          <Mono size="xs">end · styleguide v1</Mono>
        </footer>
      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <Mono size="xs" tone="mute" className="block">
        {label}
      </Mono>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Swatch({ name, value, cssVar }: { name: string; value: string; cssVar: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 rounded-lg border border-rule"
        style={{ background: `var(${cssVar})` }}
        aria-label={`${name} swatch`}
      />
      <div>
        <div className="text-xs text-ink">{name}</div>
        <div className="text-[10px] text-ink-mute tabular-nums">{value}</div>
      </div>
    </div>
  );
}
