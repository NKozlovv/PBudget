// Brand system reference page — colors, type, logo variants, components
const Swatch = ({ name, value, code, t, dark = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{
      height: 92, borderRadius: 10, background: value,
      border: `1px solid ${t.line}`, position: 'relative',
    }}/>
    <div>
      <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 11, color: t.inkMute, fontFamily: 'JetBrains Mono', marginTop: 2 }}>{code}</div>
    </div>
  </div>
);

const BrandSystem = () => {
  const { t, mode } = useT();
  return (
    <div style={{ width: '100%', minHeight: 1100, background: t.bg, color: t.ink, padding: '56px 64px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${t.line}`, paddingBottom: 24, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>02 · System</div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em' }}>The Sterling System</div>
        </div>
        <SterlingWordmark size={28} color={t.ink} accentColor={t.accent} accentColor2={t.accentHi}/>
      </div>

      {/* Logo variants */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel t={t}>Mark · primary + alt</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <LogoTile t={t} label="Primary"><SterlingMark size={72} color={t.accent} accentColor={t.accentHi}/></LogoTile>
          <LogoTile t={t} label="Mono inverse" bg={t.ink}><SterlingMark size={72} color={t.bg} accentColor={t.bg}/></LogoTile>
          <LogoTile t={t} label="Arc alternate"><SterlingMarkAlt size={72} color={t.accent} accentColor={t.accentHi}/></LogoTile>
          <LogoTile t={t} label="Stack alternate"><SterlingMarkArrow size={72} color={t.accent} accentColor={t.accentHi}/></LogoTile>
        </div>
      </section>

      {/* Wordmark */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel t={t}>Wordmark · lockups</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
          <LogoTile t={t} label="Horizontal" tall>
            <SterlingWordmark size={42} color={t.ink} accentColor={t.accent} accentColor2={t.accentHi}/>
          </LogoTile>
          <LogoTile t={t} label="Stacked" tall>
            <SterlingWordmark size={36} color={t.ink} accentColor={t.accent} accentColor2={t.accentHi} layout="stacked"/>
          </LogoTile>
          <LogoTile t={t} label="App icon" tall bg={t.surface}>
            <div style={{ width: 96, height: 96, borderRadius: 22, background: `linear-gradient(140deg, ${t.accent}, ${t.accentHi})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(123,139,255,0.25)' }}>
              <SterlingMark size={62} color={t.bg} accentColor="rgba(255,255,255,0.6)"/>
            </div>
          </LogoTile>
        </div>
      </section>

      {/* Color */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel t={t}>Palette</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          <Swatch name="Ink (bg)" value="#0A0E1A" code="#0A0E1A" t={t}/>
          <Swatch name="Surface" value="#141a2e" code="#141A2E" t={t}/>
          <Swatch name="Indigo" value="#7B8BFF" code="#7B8BFF" t={t}/>
          <Swatch name="Lavender" value="#A78BFA" code="#A78BFA" t={t}/>
          <Swatch name="Mint (positive)" value="#5EE6A8" code="#5EE6A8" t={t}/>
          <Swatch name="Coral (negative)" value="#FF7A8A" code="#FF7A8A" t={t}/>
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel t={t}>Typography</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>Inter · system</div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', color: t.ink, lineHeight: 1 }}>€12,438.<span style={{ color: t.inkMute }}>27</span></div>
            <div style={{ fontSize: 22, fontWeight: 500, color: t.ink, marginTop: 24, letterSpacing: '-0.02em' }}>Display · headlines</div>
            <div style={{ fontSize: 14, color: t.inkSoft, marginTop: 12, lineHeight: 1.55 }}>Body text. Sterling uses Inter for the entire interface — tabular numerals are enabled by default for any monetary value, so columns line up across rows.</div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: t.inkMute, marginTop: 16, letterSpacing: '0.05em' }}>JetBrains Mono · ledger entries · 02·14·26 — €248.50</div>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>Scale</div>
            {[
              ['Display 96', 96, 700, '-0.04em'],
              ['Headline 44', 44, 600, '-0.03em'],
              ['Title 22', 22, 600, '-0.02em'],
              ['Body 14', 14, 400, '0'],
              ['Caption 11', 11, 500, '0.04em'],
            ].map(([label, sz, w, ls]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '10px 0', borderBottom: `1px solid ${t.line}` }}>
                <div style={{ fontSize: 10, color: t.inkMute, fontFamily: 'JetBrains Mono', width: 90 }}>{label}</div>
                <div style={{ fontSize: sz, fontWeight: w, letterSpacing: ls, color: t.ink, lineHeight: 1.1, flex: 1 }}>Sterling</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Component primitives */}
      <section>
        <SectionLabel t={t}>Building blocks</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Tile t={t} label="Button · primary"><button style={{ background: t.accent, color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Continue</button></Tile>
          <Tile t={t} label="Button · ghost"><button style={{ background: 'transparent', color: t.ink, border: `1px solid ${t.line}`, padding: '12px 22px', borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Add account</button></Tile>
          <Tile t={t} label="Pill · category">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: t.accentSoft, color: t.accent, borderRadius: 100, fontSize: 12, fontWeight: 500 }}>
              <Icon name="food" size={12}/> Groceries
            </div>
          </Tile>
          <Tile t={t} label="Delta · positive">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: t.pos, fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
              <Icon name="arrow-up" size={12}/> +12.4%
            </div>
          </Tile>
        </div>
      </section>
    </div>
  );
};

const SectionLabel = ({ t, children }) => (
  <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 18 }}>{children}</div>
);

const LogoTile = ({ t, label, children, bg = null, tall = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: bg || t.surface, border: `1px solid ${t.line}`, borderRadius: 12, height: tall ? 160 : 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    <div style={{ fontSize: 10, color: t.inkMute, marginTop: 8, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

const Tile = ({ t, label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    <div style={{ fontSize: 10, color: t.inkMute, marginTop: 8, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

window.BrandSystem = BrandSystem;
