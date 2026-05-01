// Theus dashboard — a real, designed dashboard board (1280x800).
// Italic ONLY for the motto. Inter for everything else. JBM for numerals.
// Green = positive, Red = negative/spend.

const Mono = ({ children, color, size = 11, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.mono, fontSize: size, color,
    textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 500,
    ...style,
  }}>{children}</span>
);

const Num = ({ children, color, size = 16, weight = 500, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.mono, fontSize: size, color, fontWeight: weight,
    fontVariantNumeric: 'tabular-nums', ...style,
  }}>{children}</span>
);

const Sans = ({ children, color, size = 14, weight = 400, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.grotesk, fontSize: size, color, fontWeight: weight,
    letterSpacing: '-0.005em', ...style,
  }}>{children}</span>
);

// ─── Sparkline (cashflow-style) ───────────────────────────────────────
const SparkArea = ({ data, w = 320, h = 80, color, fill, axisColor }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 8) - 4,
  ]);
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = line + ` L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={fill}/>
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke={axisColor} strokeWidth="1"/>
    </svg>
  );
};

// ─── Income vs Spend bars (the "show me green and red" graph) ─────────
const IncomeSpendBars = ({ months, w = 540, h = 220, t }) => {
  const pad = { l: 36, r: 12, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...months.flatMap((m) => [m.income, m.spend]));
  const groupW = innerW / months.length;
  const barW = (groupW - 8) / 2;
  const yTicks = [0, max * 0.5, max];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      {/* gridlines */}
      {yTicks.map((y, i) => {
        const py = pad.t + innerH - (y / max) * innerH;
        return <g key={i}>
          <line x1={pad.l} y1={py} x2={w - pad.r} y2={py} stroke={t.rule} strokeWidth="0.5" strokeDasharray={i === 0 ? '0' : '2 3'}/>
          <text x={pad.l - 8} y={py + 3} fontSize="9" fontFamily="JetBrains Mono" fill={t.inkMute} textAnchor="end">{Math.round(y / 1000)}k</text>
        </g>;
      })}
      {months.map((m, i) => {
        const x = pad.l + i * groupW + 4;
        const incH = (m.income / max) * innerH;
        const spdH = (m.spend / max) * innerH;
        return (
          <g key={i}>
            <rect x={x} y={pad.t + innerH - incH} width={barW} height={incH} fill={t.pos}/>
            <rect x={x + barW + 4} y={pad.t + innerH - spdH} width={barW} height={spdH} fill={t.accent}/>
            <text x={x + barW + 2} y={h - 10} fontSize="9" fontFamily="JetBrains Mono" fill={t.inkMute} textAnchor="middle" letterSpacing="1">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Donut for category split ─────────────────────────────────────────
const DonutChart = ({ data, size = 140, strokeWidth = 22, t }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.rule} strokeWidth={strokeWidth}/>
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const dash = `${len} ${c - len}`;
        const dashOffset = -off;
        off += len;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color} strokeWidth={strokeWidth}
            strokeDasharray={dash} strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        );
      })}
    </svg>
  );
};

// ─── Dashboard board ──────────────────────────────────────────────────
const TBoardDashboard = () => {
  const { t } = useT();
  const cashflow = [4200, 4100, 4250, 4400, 4180, 4520, 4480, 4700, 4620, 4850, 4920, 5100];
  const months = [
    { label: 'NOV', income: 4200, spend: 3100 },
    { label: 'DEC', income: 4400, spend: 3800 },
    { label: 'JAN', income: 4500, spend: 3200 },
    { label: 'FEB', income: 4480, spend: 2900 },
    { label: 'MAR', income: 4700, spend: 3400 },
    { label: 'APR', income: 5100, spend: 2950 },
  ];
  const categories = [
    { name: 'Housing',    value: 1200, color: t.ink },
    { name: 'Groceries',  value: 480,  color: t.pos },
    { name: 'Transport',  value: 220,  color: t.accent },
    { name: 'Dining',     value: 310,  color: t.inkSoft },
    { name: 'Other',      value: 180,  color: t.inkMute },
  ];
  const transactions = [
    { d: '14 MAY', name: 'Salary — ACME Corp',    cat: 'Income',     amt: '+2,400.00', pos: true },
    { d: '13 MAY', name: 'Whole Foods',           cat: 'Groceries',  amt: '−84.20',    pos: false },
    { d: '13 MAY', name: 'Lufthansa',             cat: 'Travel',     amt: '−312.40',   pos: false },
    { d: '12 MAY', name: 'Spotify',               cat: 'Subscription', amt: '−9.99',  pos: false },
    { d: '12 MAY', name: 'Refund — Amazon',       cat: 'Refund',     amt: '+24.50',    pos: true },
    { d: '11 MAY', name: 'Berlin U-Bahn',         cat: 'Transit',    amt: '−6.50',     pos: false },
  ];

  return (
    <div style={{
      width: 1440, height: 900, background: t.bg, color: t.ink,
      fontFamily: TFONTS.grotesk, position: 'relative', overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '220px 1fr',
    }}>
      {/* SIDEBAR */}
      <aside style={{ borderRight: `1px solid ${t.rule}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <TheusLockup size={22} color={t.ink} accent={t.accent}/>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { k: 'Overview',     active: true },
            { k: 'Transactions', active: false },
            { k: 'Accounts',     active: false },
            { k: 'Categories',   active: false },
            { k: 'Forecast',     active: false },
            { k: 'Settings',     active: false, sep: true },
          ].map((it, i) => (
            <div key={i} style={{
              padding: '8px 10px',
              background: it.active ? t.accentSoft : 'transparent',
              borderLeft: `2px solid ${it.active ? t.accent : 'transparent'}`,
              marginTop: it.sep ? 16 : 0,
            }}>
              <Sans color={it.active ? t.ink : t.inkSoft} size={13} weight={it.active ? 500 : 400}>{it.k}</Sans>
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${t.rule}`, paddingTop: 16 }}>
          <Mono color={t.inkMute} size={9}>currencies</Mono>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['USD', 'EUR', 'GBP'].map((c) => (
              <span key={c} style={{ padding: '3px 8px', border: `1px solid ${t.rule}`, fontFamily: TFONTS.mono, fontSize: 10, letterSpacing: '0.1em', color: t.inkSoft }}>{c}</span>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Mono color={t.inkMute}>Thursday · 14 May 2026</Mono>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <Sans color={t.ink} size={28} weight={500} style={{ letterSpacing: '-0.02em' }}>Good morning, Alex.</Sans>
              <span style={{ fontFamily: TFONTS.display, fontStyle: 'italic', fontSize: 28, color: t.inkMute }}>money understood.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${t.rule}`, color: t.ink, fontFamily: TFONTS.grotesk, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Import XLSX</button>
            <button style={{ padding: '8px 14px', background: t.accent, border: 'none', color: '#fff', fontFamily: TFONTS.grotesk, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>+ Add transaction</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: t.rule, border: `1px solid ${t.rule}` }}>
          {[
            { label: 'Net worth',     val: '$84,210', delta: '+3.2%',  pos: true,  sub: 'all accounts · 30d' },
            { label: 'Income · MTD',  val: '$3,420',  delta: '+12.0%', pos: true,  sub: 'vs last month' },
            { label: 'Spend · MTD',   val: '$1,840',  delta: '−4.0%',  pos: true,  sub: 'under by $76' },
            { label: 'Savings rate',  val: '46%',     delta: '+5pt',   pos: true,  sub: 'rolling 90d' },
          ].map((k, i) => (
            <div key={i} style={{ background: t.bg, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Mono color={t.inkMute} size={10}>{k.label}</Mono>
              <Num color={t.ink} size={32} weight={500}>{k.val}</Num>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Mono color={k.pos ? t.pos : t.accent} size={10}>{k.delta}</Mono>
                <Sans color={t.inkMute} size={11}>{k.sub}</Sans>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          {/* Income vs Spend */}
          <div style={{ border: `1px solid ${t.rule}`, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <Sans color={t.ink} size={15} weight={500}>Income vs Spend</Sans>
                <div style={{ marginTop: 4 }}><Mono color={t.inkMute} size={10}>last 6 months</Mono></div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: t.pos }}/>
                  <Mono color={t.ink} size={10}>income</Mono>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: t.accent }}/>
                  <Mono color={t.ink} size={10}>spend</Mono>
                </span>
              </div>
            </div>
            <div style={{ marginTop: 16, flex: 1 }}>
              <IncomeSpendBars months={months} t={t}/>
            </div>
          </div>

          {/* Cashflow + Donut stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: `1px solid ${t.rule}`, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Sans color={t.ink} size={15} weight={500}>Cashflow</Sans>
                <Mono color={t.pos} size={10}>↗ +21.4% ytd</Mono>
              </div>
              <div style={{ marginTop: 4 }}><Mono color={t.inkMute} size={10}>net daily · 12 weeks</Mono></div>
              <div style={{ marginTop: 16 }}>
                <SparkArea data={cashflow} h={70} color={t.pos} fill={t.posSoft} axisColor={t.rule}/>
              </div>
            </div>
            <div style={{ border: `1px solid ${t.rule}`, padding: 20, flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
              <DonutChart data={categories} size={130} strokeWidth={22} t={t}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Mono color={t.inkMute} size={10} style={{ marginBottom: 4 }}>spend by category</Mono>
                {categories.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: c.color }}/>
                      <Sans color={t.ink} size={12}>{c.name}</Sans>
                    </span>
                    <Num color={t.inkSoft} size={11}>${c.value}</Num>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div style={{ border: `1px solid ${t.rule}`, padding: '0 0 8px 0' }}>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.rule}` }}>
            <Sans color={t.ink} size={15} weight={500}>Recent transactions</Sans>
            <Mono color={t.inkMute} size={10}>showing 6 of 412 · view all →</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr 140px', gap: 0 }}>
            {transactions.map((tx, i) => (
              <React.Fragment key={i}>
                <div style={{ padding: '12px 20px', borderBottom: i === transactions.length - 1 ? 'none' : `1px solid ${t.rule}` }}>
                  <Mono color={t.inkMute} size={10}>{tx.d}</Mono>
                </div>
                <div style={{ padding: '12px 8px', borderBottom: i === transactions.length - 1 ? 'none' : `1px solid ${t.rule}` }}>
                  <Sans color={t.ink} size={13}>{tx.name}</Sans>
                </div>
                <div style={{ padding: '12px 8px', borderBottom: i === transactions.length - 1 ? 'none' : `1px solid ${t.rule}` }}>
                  <Sans color={t.inkSoft} size={12}>{tx.cat}</Sans>
                </div>
                <div style={{ padding: '12px 20px', textAlign: 'right', borderBottom: i === transactions.length - 1 ? 'none' : `1px solid ${t.rule}` }}>
                  <Num color={tx.pos ? t.pos : t.ink} size={13} weight={500}>{tx.amt}</Num>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

window.TBoardDashboard = TBoardDashboard;
