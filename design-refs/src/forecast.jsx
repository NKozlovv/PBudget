// Forecast view
const Forecast = () => {
  const { t } = useT();
  const balanceData = [18500, 19700, 20610, 22000, 22930, 24130, 25450, 26450, 27550, 28860, 29970, 31380, 32650, 33920, 35190];
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

  const cats = [
    { name: 'Housing', avg: 1450, projected: 1450, color: '#7B8BFF' },
    { name: 'Groceries', avg: 622, projected: 640, color: '#A78BFA' },
    { name: 'Transit', avg: 304, projected: 318, color: '#5EE6A8' },
    { name: 'Dining', avg: 268, projected: 295, color: '#FFC979' },
    { name: 'Shopping', avg: 380, projected: 412, color: '#FF7A8A' },
  ];

  return (
    <AppShell activeView="forecast" t={t}>
      <div style={{ padding: '28px 32px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Looking ahead</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Forecast</div>
            <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 4 }}>Projection based on 12 months of history</div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 4, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10 }}>
            {['3 mo','6 mo','12 mo','24 mo'].map((p, i) => (
              <button key={p} style={{ background: i === 0 ? t.bg : 'transparent', color: i === 0 ? t.ink : t.inkMute, border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Hero projection */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 26, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Today</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>€31,380</div>
            </div>
            <div style={{ borderLeft: `1px solid ${t.line}`, paddingLeft: 32 }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>In 3 months</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: t.accent }}>€35,190</div>
              <div style={{ fontSize: 12, color: t.pos, fontFamily: 'JetBrains Mono', marginTop: 2 }}>+€3,810 (+12.1%)</div>
            </div>
            <div style={{ borderLeft: `1px solid ${t.line}`, paddingLeft: 32 }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>End of year</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: t.accentHi }}>€48,420</div>
              <div style={{ fontSize: 12, color: t.pos, fontFamily: 'JetBrains Mono', marginTop: 2 }}>+€17,040 projected</div>
            </div>
          </div>
          <LineChart data={balanceData} labels={labels} t={t} color={t.accent} projectedFrom={11}/>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: t.inkMute }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 2, background: t.accent }}/> Actual</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 2, background: t.accent, borderTop: `2px dashed ${t.accent}` }}/> Projected</span>
          </div>
        </div>

        {/* Two-up: per-category projection + insight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Per-category outlook</div>
            <div style={{ fontSize: 12, color: t.inkMute, marginBottom: 18 }}>Avg vs. projected · next month</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cats.map((c, i) => {
                const max = Math.max(...cats.map(x => x.projected));
                const w = (c.projected / max) * 100;
                const wAvg = (c.avg / max) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: t.inkSoft, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: t.ink }}>€{c.projected} <span style={{ color: t.inkMute }}>/ €{c.avg} avg</span></div>
                    </div>
                    <div style={{ height: 18, background: t.bgSubtle, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${wAvg}%`, background: `${c.color}40`, borderRight: `1.5px dashed ${c.color}` }}/>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`, background: c.color, opacity: 0.85, borderRadius: 4 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: `linear-gradient(135deg, ${t.accentSoft}, transparent)`, border: `1px solid ${t.lineStrong}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Icon name="sparkle" size={16} color={t.accent}/>
                <div style={{ fontSize: 11, color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Coach insight</div>
              </div>
              <div style={{ fontSize: 14, color: t.ink, lineHeight: 1.5, marginBottom: 12 }}>If you keep your current savings rate of <strong>29.3%</strong>, you'll reach <strong>€50,000</strong> by August — about 4 months early.</div>
              <button style={{ background: t.ink, color: t.bg, border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Set this as a goal</button>
            </div>

            <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Scenarios</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Cut dining −€100', delta: '+€1,200/yr', color: t.pos },
                  { label: 'Move to studio (−€300)', delta: '+€3,600/yr', color: t.pos },
                  { label: 'Skip vacation', delta: '+€800/yr', color: t.pos },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.bgSubtle, borderRadius: 8 }}>
                    <div style={{ fontSize: 13, color: t.inkSoft }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: s.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{s.delta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

window.Forecast = Forecast;
