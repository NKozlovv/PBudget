import { Mono, Num, Card, CardHeader, Pill, Button, KpiTile, KpiStrip } from '@/components/ui';

export const metadata = {
  title: 'Theus — Styleguide',
};

export default function StyleguidePage() {
  return (
    <main className="min-h-screen px-10 py-12">
      <div className="mx-auto max-w-5xl">
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
            <Swatch name="ink" value="#EFE9D8" cssVar="--ink" dark />
            <Swatch name="ink-soft" value="#C7BFA9" cssVar="--ink-soft" dark />
            <Swatch name="ink-mute" value="#8E866E" cssVar="--ink-mute" dark />
            <Swatch name="accent" value="#C9A24A" cssVar="--accent" dark />
            <Swatch name="pos" value="#7FB58A" cssVar="--pos" dark />
            <Swatch name="neg" value="#E9673E" cssVar="--neg" dark />
          </div>
        </Section>

        <Section label="Typography">
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
              <div key={label} className="flex items-baseline gap-6 border-b border-rule pb-3">
                <Mono size="xs" tone="mute" className="w-24 shrink-0">
                  {label}
                </Mono>
                <span style={{ fontSize: size, fontWeight: weight, letterSpacing: ls, lineHeight: 1.1 }}>
                  Theus
                </span>
              </div>
            ))}
            <div className="border-b border-rule pb-3">
              <Mono size="xs" tone="mute" className="w-24 shrink-0">
                Money
              </Mono>
              <div className="mt-2">
                <Num size={64} weight={700}>
                  €12,438.<span className="text-ink-mute">27</span>
                </Num>
              </div>
            </div>
            <div className="border-b border-rule pb-3">
              <Mono size="xs" tone="mute" className="w-24 shrink-0">
                Tagline
              </Mono>
              <p className="mt-2 font-display italic text-3xl text-ink-soft">money understood.</p>
            </div>
          </div>
        </Section>

        <Section label="Mono labels">
          <div className="flex flex-wrap gap-6">
            <Mono>default mute</Mono>
            <Mono tone="default">default</Mono>
            <Mono tone="soft">soft</Mono>
            <Mono tone="accent">accent</Mono>
            <Mono tone="pos">pos · ↗ +12%</Mono>
            <Mono tone="neg">neg · ↘ -4%</Mono>
          </div>
        </Section>

        <Section label="Pills">
          <div className="flex flex-wrap gap-2">
            <Pill>Default</Pill>
            <Pill variant="accent">Groceries</Pill>
            <Pill variant="pos">Income</Pill>
            <Pill variant="neg">Expense</Pill>
            <Pill variant="outline">Outline</Pill>
          </div>
        </Section>

        <Section label="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="ghost">Add account</Button>
            <Button variant="subtle">Subtle</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section label="KPI strip">
          <KpiStrip className="grid-cols-2 md:grid-cols-4">
            <KpiTile label="Net worth" value="€84,210" delta="+3.2%" sub="all accounts · 30d" />
            <KpiTile label="Income · MTD" value="€3,420" delta="+12.0%" sub="vs last month" />
            <KpiTile label="Spend · MTD" value="€1,840" delta="−4.0%" sub="under by €76" />
            <KpiTile label="Savings rate" value="46%" delta="+5pt" sub="rolling 90d" />
          </KpiStrip>
        </Section>

        <Section label="Cards">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader
                title="Income vs Spend"
                subtitle={<Mono size="xs">last 6 months</Mono>}
                right={
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-pos" /> <Mono size="xs">income</Mono>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-accent" /> <Mono size="xs">spend</Mono>
                    </span>
                  </div>
                }
              />
              <div className="mt-6 h-32 rounded-sm border border-dashed border-rule" aria-hidden />
            </Card>
            <Card>
              <CardHeader title="Cashflow" right={<Mono size="xs" tone="pos">↗ +21.4% ytd</Mono>} />
              <div className="mt-6 h-32 rounded-sm border border-dashed border-rule" aria-hidden />
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
      <Mono size="xs" tone="mute">
        {label}
      </Mono>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Swatch({
  name,
  value,
  cssVar,
  dark = false,
}: {
  name: string;
  value: string;
  cssVar: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 border border-rule"
        style={{ background: `var(${cssVar})` }}
        aria-label={`${name} swatch`}
      />
      <div>
        <div className={dark ? 'text-xs text-ink' : 'text-xs text-ink-soft'}>{name}</div>
        <div className="font-mono text-[10px] text-ink-mute">{value}</div>
      </div>
    </div>
  );
}
