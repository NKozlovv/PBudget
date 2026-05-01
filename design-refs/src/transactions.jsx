// Transactions, Accounts, Categories, Forecast page modules

const Transactions = () => {
  const { t } = useT();
  const days = [
    { label: 'Today · 29 Apr', total: -50.58, items: [
      { merchant: 'Carrefour Express', cat: 'Groceries', sub: 'Supermarket', acc: 'Revolut, €', amt: -42.18, icon: 'food', color: '#A78BFA' },
      { merchant: 'Bolt', cat: 'Transit', sub: 'Ride share', acc: 'N26, €', amt: -8.40, icon: 'car', color: '#5EE6A8' },
    ]},
    { label: 'Yesterday · 28 Apr', total: 5826.01, items: [
      { merchant: 'Deel payroll', cat: 'Salary', sub: 'Monthly', acc: 'Deel, $', amt: 5836.00, ccy: '$', icon: 'briefcase', color: '#5EE6A8', positive: true },
      { merchant: 'Spotify', cat: 'Subscriptions', sub: 'Music', acc: 'Revolut, €', amt: -9.99, icon: 'film', color: '#FFC979' },
    ]},
    { label: '27 Apr', total: -1492.50, items: [
      { merchant: 'Sonae rent', cat: 'Housing', sub: 'Rent', acc: 'Millennium, €', amt: -1450.00, icon: 'home-icon', color: '#7B8BFF' },
      { merchant: 'EDP energy', cat: 'Housing', sub: 'Utilities', acc: 'Millennium, €', amt: -42.50, icon: 'home-icon', color: '#7B8BFF' },
    ]},
    { label: '26 Apr', total: -276.30, items: [
      { merchant: 'TAP Air Portugal', cat: 'Travel', sub: 'Flights', acc: 'Revolut, €', amt: -238.50, icon: 'plane', color: '#FF7A8A' },
      { merchant: 'Time Out Market', cat: 'Dining', sub: 'Restaurants', acc: 'N26, €', amt: -37.80, icon: 'food', color: '#FFC979' },
    ]},
    { label: '25 Apr', total: -89.40, items: [
      { merchant: 'Wells pharmacy', cat: 'Health', sub: 'Pharmacy', acc: 'Revolut, €', amt: -23.40, icon: 'health', color: '#7DD3FC' },
      { merchant: 'Continente', cat: 'Groceries', sub: 'Supermarket', acc: 'Revolut, €', amt: -66.00, icon: 'food', color: '#A78BFA' },
    ]},
  ];

  return (
    <AppShell activeView="transactions" t={t}>
      <div style={{ padding: '28px 32px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Ledger</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Transactions</div>
            <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 4 }}>248 entries · April 2026</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: t.surface, border: `1px solid ${t.line}`, color: t.ink, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="upload" size={13} color={t.inkMute}/> Import</button>
            <button style={{ background: t.surface, border: `1px solid ${t.line}`, color: t.ink, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="download" size={13} color={t.inkMute}/> Export</button>
            <button style={{ background: t.accent, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={13} color="#fff"/> Add transaction</button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: t.line, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
          {[
            ['In','€4,820.00', t.pos, 'arrow-up'],
            ['Out','€3,410.00', t.neg, 'arrow-down'],
            ['Net','€1,410.00', t.ink, 'pulse'],
            ['Avg / day','€113.66', t.ink, 'chart'],
          ].map(([l,v,c,ic]) => (
            <div key={l} style={{ background: t.surface, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}><Icon name={ic} size={11} color={c}/> {l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', color: c === t.pos || c === t.neg ? c : t.ink }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <FilterPill t={t} active>All</FilterPill>
          <FilterPill t={t}>Expenses</FilterPill>
          <FilterPill t={t}>Income</FilterPill>
          <FilterPill t={t}>Adjustments</FilterPill>
          <div style={{ width: 1, background: t.line, margin: '0 6px' }}/>
          <FilterPill t={t} icon="filter">Account: All</FilterPill>
          <FilterPill t={t} icon="filter">Category: All</FilterPill>
          <FilterPill t={t} icon="filter">Apr 2026</FilterPill>
          <div style={{ flex: 1 }}/>
          <FilterPill t={t} icon="sort">Date · newest</FilterPill>
        </div>

        {/* List */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden' }}>
          {days.map((d, di) => (
            <div key={di}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: t.bgSubtle, borderBottom: `1px solid ${t.line}`, borderTop: di > 0 ? `1px solid ${t.line}` : 'none' }}>
                <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>{d.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: d.total >= 0 ? t.pos : t.inkSoft, fontFamily: 'JetBrains Mono' }}>
                  {d.total >= 0 ? '+' : '−'}€{Math.abs(d.total).toLocaleString('en-US', {minimumFractionDigits: 2})}
                </div>
              </div>
              {d.items.map((tx, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1fr 1fr 1fr 120px', gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: i < d.items.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${tx.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={tx.icon} size={15} color={tx.color}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{tx.merchant}</div>
                    <div style={{ fontSize: 11, color: t.inkMute }}>{tx.sub}</div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: `${tx.color}1A`, color: tx.color, fontSize: 11, fontWeight: 500, borderRadius: 100 }}>{tx.cat}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>{tx.acc}</div>
                  <div style={{ fontSize: 11, color: t.inkMute, fontFamily: 'JetBrains Mono' }}>{tx.ccy === '$' ? `(× 0.854)` : '—'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono', color: tx.positive ? t.pos : t.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {tx.positive ? '+' : '−'}{tx.ccy || '€'}{Math.abs(tx.amt).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

const FilterPill = ({ t, children, active, icon }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: active ? t.ink : t.surface, color: active ? t.bg : t.inkSoft, border: `1px solid ${active ? t.ink : t.line}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
    {icon && <Icon name={icon} size={12} color={active ? t.bg : t.inkMute}/>}
    {children}
  </div>
);

// === ACCOUNTS ===
const Accounts = () => {
  const { t } = useT();
  const accounts = [
    { name: 'Revolut', sub: 'Daily spending', balance: 4218.50, ccy: '€', native: '€4,218.50', delta: 124, color: '#7B8BFF', icon: 'wallet', spark: [4100,4080,4220,4180,4250,4218] },
    { name: 'N26', sub: 'Salary inbox', balance: 8420.20, ccy: '€', native: '€8,420.20', delta: -210, color: '#A78BFA', icon: 'wallet', spark: [8500,8650,8480,8520,8430,8420] },
    { name: 'Millennium', sub: 'Long-term savings', balance: 11804.72, ccy: '€', native: '€11,804.72', delta: 800, color: '#5EE6A8', icon: 'wallet', spark: [11000,11200,11400,11500,11700,11804] },
    { name: 'Deel', sub: 'Payroll · USD', balance: 5836.00, ccy: '$', native: '$5,836.00', balanceEur: 4983.94, delta: 320, color: '#FFC979', icon: 'briefcase', spark: [5500,5520,5680,5700,5800,5836] },
    { name: 'Cash', sub: 'Wallet', balance: 1101.00, ccy: '€', native: '€1,101.00', delta: -45, color: '#FF7A8A', icon: 'wallet', spark: [1200,1180,1140,1120,1110,1101] },
  ];
  const total = 31380.42;

  return (
    <AppShell activeView="accounts" t={t}>
      <div style={{ padding: '28px 32px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Net worth</div>
            <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>€31,380<span style={{ color: t.inkMute }}>.42</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: t.pos, fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 600, marginTop: 6 }}>
              <Icon name="arrow-up" size={12}/> +€1,410 (4.7%) this month
            </div>
          </div>
          <button style={{ background: t.accent, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff"/> Add account
          </button>
        </div>

        {/* Distribution bar */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Distribution</div>
          <div style={{ height: 10, display: 'flex', borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            {accounts.map((a,i) => (
              <div key={i} style={{ flex: a.balance, background: a.color, height: '100%' }}/>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
            {accounts.map((a,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.inkSoft }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color }}/>
                <span>{a.name}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkMute }}>{((a.balance / total) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {accounts.map((a,i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: a.color }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={a.icon} size={18} color={a.color}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: t.inkMute }}>{a.sub} · {a.ccy === '$' ? 'USD' : 'EUR'}</div>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} color={t.inkMute}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: t.ink }}>{a.native}</span>
              </div>
              {a.balanceEur && <div style={{ fontSize: 11, color: t.inkMute, fontFamily: 'JetBrains Mono', marginBottom: 6 }}>≈ €{a.balanceEur.toLocaleString('en-US', {minimumFractionDigits:2})}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: a.delta >= 0 ? t.pos : t.neg, fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  <Icon name={a.delta >= 0 ? 'arrow-up' : 'arrow-down'} size={11}/> {a.delta >= 0 ? '+' : '−'}{a.ccy}{Math.abs(a.delta)}
                </div>
                <Sparkline data={a.spark} width={140} height={36} color={a.color} fill={false}/>
              </div>
            </div>
          ))}

          {/* Add */}
          <div style={{ background: 'transparent', border: `1.5px dashed ${t.line}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.inkMute, cursor: 'pointer', minHeight: 180 }}>
            <Icon name="plus" size={20} color={t.inkMute}/>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Connect or add manually</div>
            <div style={{ fontSize: 11 }}>Bank, brokerage, cash, crypto</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

Object.assign(window, { Transactions, Accounts, FilterPill });


Object.assign(window, { Transactions, Accounts });
