// Web app shell — sidebar + topbar wrapper
const AppShell = ({ activeView = 'dashboard', children, t }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: 'home' },
    { id: 'transactions', label: 'Transactions', icon: 'list' },
    { id: 'accounts', label: 'Accounts', icon: 'wallet' },
    { id: 'categories', label: 'Categories', icon: 'tag' },
    { id: 'forecast', label: 'Forecast', icon: 'chart' },
    { id: 'coach', label: 'Coach', icon: 'sparkle', badge: 'New' },
  ];
  return (
    <div style={{ width: 1440, minHeight: 900, background: t.bg, color: t.ink, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '232px 1fr' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: `1px solid ${t.line}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', background: t.bgSubtle }}>
        <div style={{ padding: '4px 8px 24px' }}>
          <SterlingWordmark size={22} color={t.ink} accentColor={t.accent} accentColor2={t.accentHi}/>
        </div>
        <div style={{ fontSize: 10, color: t.inkFaint, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '8px 10px', fontFamily: 'JetBrains Mono' }}>Manage</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: n.id === activeView ? t.ink : t.inkSoft,
              background: n.id === activeView ? t.surface : 'transparent',
              border: `1px solid ${n.id === activeView ? t.line : 'transparent'}`,
              cursor: 'pointer',
            }}>
              <Icon name={n.icon} size={16} color={n.id === activeView ? t.accent : t.inkMute}/>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && (
                <span style={{ fontSize: 9, background: t.accentSoft, color: t.accent, padding: '2px 6px', borderRadius: 100, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{n.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: 12, background: t.surface, borderRadius: 10, border: `1px solid ${t.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>Alex Petrov</div>
              <div style={{ fontSize: 10, color: t.inkMute, fontFamily: 'JetBrains Mono' }}>EUR · primary</div>
            </div>
            <Icon name="settings" size={14} color={t.inkMute}/>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '20px 32px', borderBottom: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, maxWidth: 380 }}>
            <Icon name="search" size={14} color={t.inkMute}/>
            <span style={{ fontSize: 13, color: t.inkMute }}>Search transactions, accounts…</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: t.inkFaint, padding: '2px 6px', border: `1px solid ${t.line}`, borderRadius: 4, fontFamily: 'JetBrains Mono' }}>⌘ K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, fontSize: 11, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.pos }}/>
            1 USD = 0.854 EUR
          </div>
          <button style={{ background: 'transparent', border: `1px solid ${t.line}`, borderRadius: 8, padding: 7, color: t.inkSoft, cursor: 'pointer', display: 'flex' }}>
            <Icon name="bell" size={15}/>
          </button>
          <button style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff"/> New
          </button>
        </header>
        <div style={{ flex: 1 }}>{children}</div>
      </main>
    </div>
  );
};

// === DASHBOARD ===
const Dashboard = () => {
  const { t } = useT();
  const incomeData = [4200, 4180, 4250, 4400, 4380, 4420, 4500, 4520, 4480, 4600, 4750, 4820];
  const expenseData = [3100, 2980, 3340, 3010, 3450, 3220, 3180, 3520, 3380, 3290, 3640, 3410];
  const balanceData = [18500, 19700, 20610, 22000, 22930, 24130, 25450, 26450, 27550, 28860, 29970, 31380];
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const categories = [
    { name: 'Housing', value: 1450, color: '#7B8BFF', icon: 'home-icon' },
    { name: 'Groceries', value: 642, color: '#A78BFA', icon: 'food' },
    { name: 'Transit', value: 318, color: '#5EE6A8', icon: 'car' },
    { name: 'Dining out', value: 287, color: '#FFC979', icon: 'food' },
    { name: 'Shopping', value: 412, color: '#FF7A8A', icon: 'shopping' },
    { name: 'Health', value: 196, color: '#7DD3FC', icon: 'health' },
    { name: 'Other', value: 105, color: '#94A3B8', icon: 'tools' },
  ];
  const totalSpent = categories.reduce((s,c)=>s+c.value,0);

  const recentTx = [
    { id:1, day:'Today', date:'29 Apr', merchant:'Carrefour Express', cat:'Groceries', acc:'Revolut, €', amt:-42.18, icon:'food', color:'#A78BFA' },
    { id:2, day:'Today', date:'29 Apr', merchant:'Bolt', cat:'Transit', acc:'N26, €', amt:-8.40, icon:'car', color:'#5EE6A8' },
    { id:3, day:'Yesterday', date:'28 Apr', merchant:'Deel payroll', cat:'Salary', acc:'Deel, $', amt:+5836.00, ccy:'$', icon:'briefcase', color:'#5EE6A8' },
    { id:4, day:'Yesterday', date:'28 Apr', merchant:'Spotify', cat:'Subscriptions', acc:'Revolut, €', amt:-9.99, icon:'film', color:'#FFC979' },
    { id:5, day:'27 Apr', date:'27 Apr', merchant:'Sonae rent', cat:'Housing', acc:'Millennium, €', amt:-1450.00, icon:'home-icon', color:'#7B8BFF' },
    { id:6, day:'26 Apr', date:'26 Apr', merchant:'TAP flight', cat:'Travel', acc:'Revolut, €', amt:-238.50, icon:'plane', color:'#FF7A8A' },
  ];

  return (
    <AppShell activeView="dashboard" t={t}>
      <div style={{ padding: '28px 32px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Greeting + insight */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>April 2026 · WK 18</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Good evening, Alex.
            </div>
            <div style={{ fontSize: 14, color: t.inkSoft, marginTop: 4 }}>
              You've spent <span style={{ color: t.ink, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>€3,410</span> this month — <span style={{ color: t.pos }}>6.3% under</span> your average.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 4, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10 }}>
            {['Week','Month','Quarter','YTD','All'].map((p, i) => (
              <button key={p} style={{ background: i === 1 ? t.bg : 'transparent', color: i === 1 ? t.ink : t.inkMute, border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 90% 0%, ${t.accentSoft}, transparent 55%)`, pointerEvents: 'none' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Total balance</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>
                  <Icon name="eye" size={13} color={t.inkMute}/> 7 accounts
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 14, color: t.inkMute }}>€</span>
                <span style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums' }}>31,380</span>
                <span style={{ fontSize: 22, color: t.inkMute, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>.42</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: t.pos, fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  <Icon name="arrow-up" size={12}/> +€1,410 (4.7%)
                </div>
                <div style={{ fontSize: 12, color: t.inkMute }}>vs. last month</div>
              </div>
              <div style={{ marginTop: 22 }}>
                <Sparkline data={balanceData} width={500} height={64} color={t.accent}/>
              </div>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Income · April</div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.pos }}/>
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>€4,820<span style={{ color: t.inkMute, fontSize: 18 }}>.00</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: t.pos, fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600, marginTop: 6 }}>
              <Icon name="arrow-up" size={11}/> +1.5%
            </div>
            <div style={{ marginTop: 22 }}>
              <Sparkline data={incomeData} width={300} height={48} color={t.pos}/>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Spending · April</div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.neg }}/>
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>€3,410<span style={{ color: t.inkMute, fontSize: 18 }}>.00</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: t.pos, fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600, marginTop: 6 }}>
              <Icon name="arrow-down" size={11}/> −6.3%
            </div>
            <div style={{ marginTop: 22 }}>
              <Sparkline data={expenseData} width={300} height={48} color={t.neg}/>
            </div>
          </div>
        </div>

        {/* Coach insight bar */}
        <div style={{
          background: `linear-gradient(135deg, ${t.accentSoft}, transparent)`,
          border: `1px solid ${t.lineStrong}`,
          borderRadius: 14, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={18} color="#fff"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink, marginBottom: 2 }}>Sterling noticed: you spend 31% more on dining out on Fridays.</div>
            <div style={{ fontSize: 12, color: t.inkSoft }}>Cooking at home one Friday/month would save ~€48 — about €580/year. Want a 4-week challenge?</div>
          </div>
          <button style={{ background: t.ink, color: t.bg, border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>See plan</button>
          <button style={{ background: 'transparent', color: t.inkMute, border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}>×</button>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Cash flow</div>
                <div style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>Income vs spending · monthly</div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: t.inkSoft }}>
                <Legend dot={t.pos}>Income</Legend>
                <Legend dot={t.neg}>Spending</Legend>
              </div>
            </div>
            <BarChart income={incomeData} expenses={expenseData} labels={labels} t={t} posColor={t.pos} negColor={t.neg} height={210}/>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Spending mix</div>
                <div style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>April · 7 categories</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <Donut segments={categories.map(c => ({ value: c.value, color: c.color }))} t={t} size={150} thickness={20} label={`€${(totalSpent/1000).toFixed(1)}k`} sublabel="total"/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
                    <span style={{ flex: 1, color: t.inkSoft }}>{c.name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.ink, fontWeight: 500 }}>€{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Accounts + Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Accounts</div>
              <a style={{ fontSize: 11, color: t.accent, cursor: 'pointer' }}>Manage →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Revolut', sub: 'Daily · €', amt: 4218.50, ccy: '€', share: 14, color: '#7B8BFF' },
                { name: 'N26', sub: 'Salary · €', amt: 8420.20, ccy: '€', share: 27, color: '#A78BFA' },
                { name: 'Millennium', sub: 'Long-term · €', amt: 11804.72, ccy: '€', share: 38, color: '#5EE6A8' },
                { name: 'Deel', sub: 'Income · $', amt: 5836.00, ccy: '$', share: 16, color: '#FFC979' },
                { name: 'Cash', sub: 'Wallet · €', amt: 1101.00, ccy: '€', share: 5, color: '#FF7A8A' },
              ].map((a,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i<4 ? `1px solid ${t.line}` : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color, opacity: 0.18, position: 'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ position:'absolute', fontSize: 12, color: a.color, fontWeight: 700, fontFamily: 'JetBrains Mono', opacity: 1 }}>{a.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: t.inkMute }}>{a.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: t.ink }}>{a.ccy}{a.amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 10, color: t.inkMute, fontFamily: 'JetBrains Mono' }}>{a.share}% of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Recent activity</div>
              <a style={{ fontSize: 11, color: t.accent, cursor: 'pointer' }}>All transactions →</a>
            </div>
            <div>
              {recentTx.map((tx, i) => {
                const showDay = i === 0 || recentTx[i-1].day !== tx.day;
                return (
                  <React.Fragment key={tx.id}>
                    {showDay && <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', padding: '12px 0 6px' }}>{tx.day}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.line}` }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${tx.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={tx.icon} size={16} color={tx.color}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.merchant}</div>
                        <div style={{ fontSize: 11, color: t.inkMute }}>{tx.cat} · {tx.acc}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: tx.amt >= 0 ? t.pos : t.ink, fontVariantNumeric: 'tabular-nums' }}>
                        {tx.amt >= 0 ? '+' : '−'}{tx.ccy || '€'}{Math.abs(tx.amt).toFixed(2)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const Legend = ({ dot, children }) => {
  const { t } = useT();
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: dot }}/>{children}</span>;
};

Object.assign(window, { AppShell, Dashboard, Legend });


Object.assign(window, { AppShell, Dashboard });
