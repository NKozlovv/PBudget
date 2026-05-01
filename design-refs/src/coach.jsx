// Coach view — financial guide / lessons / insights surface
const Coach = () => {
  const { t } = useT();
  return (
    <AppShell activeView="coach" t={t}>
      <div style={{ padding: '28px 32px 64px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: t.accentSoft, color: t.accent, borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            <Icon name="sparkle" size={12} color={t.accent}/> Beta
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', maxWidth: 620, lineHeight: 1.15 }}>
            Your money has patterns. <span style={{ color: t.inkMute }}>Sterling reads them, and tells you what to do next.</span>
          </div>
        </div>

        {/* Streak / progress */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 22, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {[
            ['Coach streak', '14 days', t.accent, 'pulse'],
            ['Lessons completed', '7 / 24', t.pos, 'book'],
            ['Saved with Coach', '€428', t.pos, 'arrow-up'],
            ['Next check-in', 'Tomorrow', t.inkSoft, 'bell'],
          ].map(([l,v,c,ic]) => (
            <div key={l}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                <Icon name={ic} size={12} color={c}/> {l}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Insights + Lessons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>This week's insights</div>
            {[
              { tag: 'Pattern', title: 'Friday is your weakness', body: 'Dining out triples on Fridays. You spend €31 more than your weekly average.', cta: 'Try Friday cook-in', color: t.warn, icon: 'food' },
              { tag: 'Win', title: 'Groceries trending down', body: 'You\'re €58 below last month\'s grocery spend with 1 day to go. That\'s a 9% improvement.', cta: 'Keep going', color: t.pos, icon: 'food' },
              { tag: 'Suggestion', title: '€12.99 silent subscription', body: 'You haven\'t opened the FitnessPro app in 47 days but it still bills monthly.', cta: 'Cancel guide', color: t.accent, icon: 'film' },
            ].map((ins, i) => (
              <div key={i} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ins.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={ins.icon} size={18} color={ins.color}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: ins.color, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{ins.tag}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.ink, marginBottom: 4 }}>{ins.title}</div>
                  <div style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>{ins.body}</div>
                  <button style={{ background: 'transparent', border: `1px solid ${t.line}`, color: t.ink, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{ins.cta} <Icon name="arrow-right" size={11} color={t.inkMute}/></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>Your path</div>
            <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 12, color: t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Module 2 of 6</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Mastering variable spending</div>
              <div style={{ fontSize: 12, color: t.inkSoft, marginBottom: 16 }}>4 of 7 lessons · ~12 min left</div>
              <ProgressBar value={57} max={100} t={t} color={t.accent} height={6}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
                {[
                  { done: true, label: 'Find your hidden spending peaks' },
                  { done: true, label: 'The 24-hour rule' },
                  { done: true, label: 'Categorising vs. judging' },
                  { done: true, label: 'Setting category guardrails' },
                  { done: false, active: true, label: 'Run a 4-week dining audit' },
                  { done: false, label: 'Build a "joy budget"' },
                  { done: false, label: 'Lock-in: monthly review' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: l.active ? t.accentSoft : 'transparent', borderRadius: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${l.done ? t.pos : t.line}`, background: l.done ? t.pos : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {l.done && <Icon name="check" size={11} color="#fff"/>}
                    </span>
                    <span style={{ fontSize: 13, color: l.active ? t.ink : (l.done ? t.inkSoft : t.inkMute), fontWeight: l.active ? 600 : 400, flex: 1 }}>{l.label}</span>
                    {l.active && <Icon name="arrow-right" size={13} color={t.accent}/>}
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

window.Coach = Coach;
