// Brand cover — hero presentation of the identity
const BrandCover = () => {
  const { t, mode } = useT();
  return (
    <div style={{
      width: '100%', minHeight: 720,
      background: t.bg,
      backgroundImage: t.glow,
      color: t.ink,
      padding: '64px 72px',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Top meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 96 }}>
        <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
          Brand Identity · v1.0
        </div>
        <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
          Personal Finance · 2026
        </div>
      </div>

      {/* Big mark */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginBottom: 48 }}>
        <SterlingMark size={180} color={t.accent} accentColor={t.accentHi}/>
        <div style={{ paddingBottom: 18 }}>
          <div style={{ fontSize: 13, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>introducing</div>
          <div style={{ fontSize: 14, color: t.inkSoft }}>The personal finance app that pays attention.</div>
        </div>
      </div>

      {/* Wordmark giant */}
      <h1 style={{
        fontSize: 220, fontWeight: 600, letterSpacing: '-0.06em',
        margin: 0, lineHeight: 0.85, color: t.ink,
      }}>
        Sterling<span style={{ color: t.accent }}>.</span>
      </h1>

      {/* Tagline */}
      <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>tagline</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 38, lineHeight: 1.05, color: t.ink, fontWeight: 400 }}>
            Money, <em style={{ color: t.accent }}>understood.</em>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>positioning</div>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: t.inkSoft }}>
            A budget tracker that becomes a financial coach. We don't just record where your money went — we explain why, and what to do next.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>voice</div>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: t.inkSoft }}>
            Calm. Direct. Numerate. Never moralizing about spending — just precise about consequences.
          </div>
        </div>
      </div>
    </div>
  );
};

window.BrandCover = BrandCover;
