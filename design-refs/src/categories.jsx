// Categories view
const Categories = () => {
  const { t } = useT();
  const cats = [
    { name: 'Housing', spent: 1450, budget: 1500, color: '#7B8BFF', icon: 'home-icon', subs: 2, txCount: 4 },
    { name: 'Groceries', spent: 642, budget: 700, color: '#A78BFA', icon: 'food', subs: 3, txCount: 18 },
    { name: 'Transit', spent: 318, budget: 350, color: '#5EE6A8', icon: 'car', subs: 4, txCount: 24 },
    { name: 'Dining out', spent: 287, budget: 250, color: '#FFC979', icon: 'food', subs: 2, txCount: 12, over: true },
    { name: 'Shopping', spent: 412, budget: 300, color: '#FF7A8A', icon: 'shopping', subs: 5, txCount: 9, over: true },
    { name: 'Health', spent: 196, budget: 200, color: '#7DD3FC', icon: 'health', subs: 2, txCount: 6 },
    { name: 'Travel', spent: 238, budget: 400, color: '#F472B6', icon: 'plane', subs: 1, txCount: 1 },
    { name: 'Subscriptions', spent: 89, budget: 100, color: '#FBBF24', icon: 'film', subs: 6, txCount: 6 },
    { name: 'Other', spent: 105, budget: 150, color: '#94A3B8', icon: 'tools', subs: 3, txCount: 7 },
  ];
  const totalSpent = cats.reduce((s,c)=>s+c.spent,0);
  const totalBudget = cats.reduce((s,c)=>s+c.budget,0);

  return (
    <AppShell activeView="categories" t={t}>
      <div style={{ padding: '28px 32px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Where it goes</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Categories</div>
            <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 4 }}>April 2026 · 9 categories tracked</div>
          </div>
          <button style={{ background: t.accent, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff"/> New category
          </button>
        </div>

        {/* Summary card with donut */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, padding: 24, marginBottom: 18, display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
          <Donut segments={cats.map(c=>({value:c.spent,color:c.color}))} t={t} size={180} thickness={24} label={`€${(totalSpent/1000).toFixed(2)}k`} sublabel="of budget"/>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Spent</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em' }}>€{totalSpent.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Budget</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', color: t.inkSoft }}>€{totalBudget.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', color: t.pos }}>€{(totalBudget-totalSpent).toLocaleString()}</div>
              </div>
            </div>
            <ProgressBar segmented segments={cats.map(c => ({ value: c.spent, color: c.color }))} t={t} height={8}/>
            <div style={{ fontSize: 12, color: t.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
              You're <span style={{ color: t.pos, fontWeight: 600 }}>€213 under budget</span> with 1 day left in the month. Two categories are running over: <span style={{ color: t.warn }}>Dining out</span> and <span style={{ color: t.warn }}>Shopping</span>.
            </div>
          </div>
        </div>

        {/* Category rows */}
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 110px 60px', gap: 16, padding: '12px 22px', background: t.bgSubtle, borderBottom: `1px solid ${t.line}`, fontSize: 10, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
            <div></div>
            <div>Category</div>
            <div>Spent / Budget</div>
            <div>Progress</div>
            <div style={{ textAlign: 'right' }}>Avg / month</div>
            <div></div>
          </div>
          {cats.map((c,i) => {
            const pct = (c.spent/c.budget)*100;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 110px 60px', gap: 16, padding: '16px 22px', alignItems: 'center', borderBottom: i<cats.length-1 ? `1px solid ${t.line}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={c.icon} size={16} color={c.color}/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.ink }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: t.inkMute }}>{c.subs} subcategories · {c.txCount} transactions</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: c.over ? t.neg : t.ink }}>€{c.spent}<span style={{ color: t.inkMute, fontWeight: 400 }}> / €{c.budget}</span></div>
                  <div style={{ fontSize: 10, color: t.inkMute, fontFamily: 'JetBrains Mono', marginTop: 2 }}>{pct.toFixed(0)}% used</div>
                </div>
                <div>
                  <div style={{ height: 6, background: t.line, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: c.over ? t.neg : c.color, borderRadius: 3 }}/>
                    {pct > 100 && <div style={{ position: 'absolute', top: -1, right: 0, bottom: -1, width: 2, background: t.neg }}/>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>€{(c.spent * 0.92).toFixed(0)}</div>
                <div style={{ textAlign: 'right' }}>
                  <Icon name="chevron-right" size={16} color={t.inkMute}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

window.Categories = Categories;
