// Mobile screens — wrapped in iOS frame
const MobileHome = () => {
  const { t } = useT();
  return (
    <IOSFrame statusBar={{ time: '9:41', mode: 'dark' }} bg={t.bg}>
      <div style={{ background: t.bg, color: t.ink, height: '100%', overflow: 'hidden', fontFamily: 'Inter', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff' }}>A</div>
            <div>
              <div style={{ fontSize: 11, color: t.inkMute }}>Welcome back</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Alex</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.surface, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="search" size={15} color={t.inkSoft}/></div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.surface, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Icon name="bell" size={15} color={t.inkSoft}/>
              <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, background: t.accent, borderRadius: '50%' }}/>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          {/* Hero balance card */}
          <div style={{ background: `linear-gradient(155deg, ${t.surface}, ${t.bgElev})`, border: `1px solid ${t.line}`, borderRadius: 18, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 90% 10%, ${t.accentSoft}, transparent 60%)` }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Total balance</div>
              <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>€31,380<span style={{ color: t.inkMute, fontSize: 22 }}>.42</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: t.pos, fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                <Icon name="arrow-up" size={11}/> +€1,410 (4.7%) · April
              </div>
              <div style={{ marginTop: 14 }}>
                <Sparkline data={[18,19,20,22,22,24,25,26,27,28,29,31]} width={300} height={48} color={t.accent}/>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>In · Apr</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'JetBrains Mono', color: t.pos }}>€4,820</div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Out · Apr</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'JetBrains Mono', color: t.ink }}>€3,410</div>
            </div>
          </div>

          {/* Coach card */}
          <div style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`, borderRadius: 14, padding: 16, marginBottom: 14, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="sparkle" size={14} color="#fff"/>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.9 }}>Coach</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 4 }}>You're on a 14-day tracking streak</div>
            <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.45 }}>Skip Friday takeout once this week → save €48</div>
          </div>

          {/* Recent */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>Recent</div>
            <span style={{ fontSize: 11, color: t.accent }}>See all</span>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {[
              { m: 'Carrefour', cat: 'Groceries', amt: -42.18, icon: 'food', color: '#A78BFA' },
              { m: 'Bolt', cat: 'Transit', amt: -8.40, icon: 'car', color: '#5EE6A8' },
              { m: 'Deel payroll', cat: 'Salary', amt: 5836.00, ccy: '$', icon: 'briefcase', color: '#5EE6A8', pos: true },
              { m: 'Spotify', cat: 'Subscriptions', amt: -9.99, icon: 'film', color: '#FFC979' },
            ].map((tx, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${tx.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={tx.icon} size={14} color={tx.color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.m}</div>
                  <div style={{ fontSize: 11, color: t.inkMute }}>{tx.cat}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: tx.pos ? t.pos : t.ink }}>{tx.pos ? '+' : '−'}{tx.ccy || '€'}{Math.abs(tx.amt).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${t.line}`, padding: '8px 8px 4px', background: t.bg }}>
          {[
            { ic: 'home', l: 'Home', active: true },
            { ic: 'list', l: 'Ledger' },
            { ic: 'plus', l: '', special: true },
            { ic: 'chart', l: 'Forecast' },
            { ic: 'sparkle', l: 'Coach' },
          ].map((tb, i) => tb.special ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${t.accentSoft}`, marginTop: -10 }}>
                <Icon name="plus" size={22} color="#fff"/>
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0' }}>
              <Icon name={tb.ic} size={18} color={tb.active ? t.accent : t.inkMute}/>
              <span style={{ fontSize: 9, color: tb.active ? t.accent : t.inkMute, fontWeight: tb.active ? 600 : 400 }}>{tb.l}</span>
            </div>
          ))}
        </div>
      </div>
    </IOSFrame>
  );
};

const MobileTransactions = () => {
  const { t } = useT();
  return (
    <IOSFrame statusBar={{ time: '9:41', mode: 'dark' }} bg={t.bg}>
      <div style={{ background: t.bg, color: t.ink, height: '100%', fontFamily: 'Inter', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Transactions</div>
            <Icon name="filter" size={18} color={t.inkSoft}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, marginTop: 12 }}>
            <Icon name="search" size={14} color={t.inkMute}/>
            <span style={{ fontSize: 13, color: t.inkMute }}>Search…</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, overflow: 'hidden' }}>
            {['All', 'Out', 'In', 'Adjust'].map((p,i) => (
              <div key={p} style={{ padding: '6px 12px', background: i === 0 ? t.ink : t.surface, color: i === 0 ? t.bg : t.inkSoft, border: `1px solid ${i === 0 ? t.ink : t.line}`, borderRadius: 100, fontSize: 12, fontWeight: 500 }}>{p}</div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {[
            { day: 'Today · 29 Apr', total: -50.58, items: [
              { m: 'Carrefour', cat: 'Groceries', amt: -42.18, icon: 'food', c: '#A78BFA' },
              { m: 'Bolt', cat: 'Transit', amt: -8.40, icon: 'car', c: '#5EE6A8' },
            ]},
            { day: 'Yesterday · 28 Apr', total: 5826.01, items: [
              { m: 'Deel payroll', cat: 'Salary', amt: 5836.00, ccy: '$', icon: 'briefcase', c: '#5EE6A8', pos: true },
              { m: 'Spotify', cat: 'Subs', amt: -9.99, icon: 'film', c: '#FFC979' },
            ]},
            { day: '27 Apr', total: -1492.50, items: [
              { m: 'Sonae rent', cat: 'Housing', amt: -1450, icon: 'home-icon', c: '#7B8BFF' },
              { m: 'EDP energy', cat: 'Housing', amt: -42.50, icon: 'home-icon', c: '#7B8BFF' },
            ]},
          ].map((d, di) => (
            <div key={di} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 11, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
                <span>{d.day}</span>
                <span style={{ color: d.total > 0 ? t.pos : t.inkSoft }}>{d.total > 0 ? '+' : '−'}€{Math.abs(d.total).toFixed(2)}</span>
              </div>
              <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden' }}>
                {d.items.map((tx,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < d.items.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${tx.c}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={tx.icon} size={14} color={tx.c}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.m}</div>
                      <div style={{ fontSize: 11, color: t.inkMute }}>{tx.cat}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: tx.pos ? t.pos : t.ink }}>{tx.pos ? '+' : '−'}{tx.ccy || '€'}{Math.abs(tx.amt).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </IOSFrame>
  );
};

const MobileAddTx = () => {
  const { t } = useT();
  return (
    <IOSFrame statusBar={{ time: '9:41', mode: 'dark' }} bg={t.bg}>
      <div style={{ background: t.bg, color: t.ink, height: '100%', fontFamily: 'Inter', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Backdrop showing dashboard hint */}
        <div style={{ position: 'absolute', inset: 0, background: t.bgSubtle, opacity: 0.5 }}/>

        {/* Sheet */}
        <div style={{ marginTop: 'auto', background: t.bgElev, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '12px 20px 24px', position: 'relative', borderTop: `1px solid ${t.line}`, boxShadow: '0 -16px 48px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 36, height: 4, background: t.line, borderRadius: 2, margin: '4px auto 16px' }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>New transaction</div>
            <Icon name="settings" size={18} color={t.inkMute}/>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {['Expense','Income','Adjust'].map((p,i) => (
              <div key={p} style={{ flex: 1, padding: '9px 0', textAlign: 'center', background: i === 0 ? t.ink : t.surface, color: i === 0 ? t.bg : t.inkSoft, border: `1px solid ${i === 0 ? t.ink : t.line}`, borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{p}</div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '14px 0 22px' }}>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Amount</div>
            <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color: t.ink }}>
              <span style={{ color: t.inkMute }}>€</span>42<span style={{ color: t.inkMute }}>.18</span>
            </div>
            <div style={{ fontSize: 12, color: t.accent, marginTop: 4 }}>≈ $49.39 · live rate</div>
          </div>

          {[
            { l: 'Category', v: 'Groceries', icon: 'food', c: '#A78BFA' },
            { l: 'Account', v: 'Revolut · €', icon: 'wallet', c: '#7B8BFF' },
            { l: 'Date', v: 'Today, 29 Apr', icon: 'home', c: t.inkSoft },
            { l: 'Note', v: 'Carrefour Express', icon: 'tag', c: t.inkSoft },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < 3 ? `1px solid ${t.line}` : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: typeof f.c === 'string' && f.c.startsWith('#') ? `${f.c}1F` : t.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={14} color={f.c}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.l}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{f.v}</div>
              </div>
              <Icon name="chevron-right" size={14} color={t.inkMute}/>
            </div>
          ))}

          <button style={{ width: '100%', marginTop: 18, background: t.accent, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Save transaction</button>
        </div>
      </div>
    </IOSFrame>
  );
};

const MobileCoach = () => {
  const { t } = useT();
  return (
    <IOSFrame statusBar={{ time: '9:41', mode: 'dark' }} bg={t.bg}>
      <div style={{ background: t.bg, color: t.ink, height: '100%', fontFamily: 'Inter', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: t.accentSoft, color: t.accent, borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            <Icon name="sparkle" size={11} color={t.accent}/> Coach
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Hi Alex — let's check on Fridays.</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          {/* Streak */}
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Streak</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', color: t.accent }}>14 days</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,1,1,1,1,1,0].map((d,i) => (
                <span key={i} style={{ width: 9, height: 22, background: d ? t.accent : t.line, borderRadius: 2 }}/>
              ))}
            </div>
          </div>

          {/* Insight card */}
          <div style={{ background: `linear-gradient(155deg, ${t.surface}, ${t.bgElev})`, border: `1px solid ${t.line}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.warn}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="food" size={14} color={t.warn}/>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.warn, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Pattern detected</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>You spend 31% more on dining out on Fridays.</div>
            <div style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.5, marginBottom: 14 }}>Past 8 Fridays you've averaged €38, vs. €29 other days. Want a 4-week challenge?</div>

            {/* Mini bar */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50, marginBottom: 14 }}>
              {[22,28,30,26,38,32,28,34,29,42,35,38].map((v,i) => (
                <div key={i} style={{ flex: 1, height: `${(v/45)*100}%`, background: i % 5 === 4 ? t.warn : t.lineStrong, borderRadius: 2 }}/>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: t.ink, color: t.bg, border: 'none', padding: 11, borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Start challenge</button>
              <button style={{ background: 'transparent', color: t.inkSoft, border: `1px solid ${t.line}`, padding: '11px 14px', borderRadius: 10, fontSize: 12, fontFamily: 'inherit' }}>Later</button>
            </div>
          </div>

          {/* Lessons mini */}
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Continue learning</div>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Module 2 · Lesson 5</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Run a 4-week dining audit</div>
            <div style={{ fontSize: 12, color: t.inkSoft, marginBottom: 12 }}>~4 min read · interactive</div>
            <ProgressBar value={57} max={100} t={t} color={t.accent} height={5}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: t.inkMute }}>
              <span>4 of 7 lessons</span>
              <span style={{ color: t.accent, fontWeight: 600 }}>Continue →</span>
            </div>
          </div>
        </div>
      </div>
    </IOSFrame>
  );
};

Object.assign(window, { MobileHome, MobileTransactions, MobileAddTx, MobileCoach });


Object.assign(window, { MobileHome, MobileTransactions, MobileAddTx, MobileCoach });
