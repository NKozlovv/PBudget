// Auth screen — split layout: brand half + form half
const AuthScreen = ({ variant = 'login' }) => {
  const { t } = useT();
  return (
    <div style={{ width: 1280, height: 800, display: 'grid', gridTemplateColumns: '1.1fr 1fr', background: t.bg, color: t.ink, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* Left — brand panel */}
      <div style={{
        background: `linear-gradient(155deg, ${t.bgElev} 0%, ${t.bg} 60%)`,
        backgroundImage: `radial-gradient(ellipse at 20% 20%, ${t.accentSoft}, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.10), transparent 55%)`,
        padding: '56px 64px',
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: `1px solid ${t.line}`,
      }}>
        <SterlingWordmark size={28} color={t.ink} accentColor={t.accent} accentColor2={t.accentHi}/>

        <div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 64, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.02em', color: t.ink }}>
            Money,<br/><em style={{ color: t.accent }}>understood.</em>
          </div>
          <div style={{ fontSize: 15, color: t.inkSoft, marginTop: 22, lineHeight: 1.55, maxWidth: 440 }}>
            Track every euro, every dollar — across accounts and currencies. Then let Sterling explain what your spending is actually telling you.
          </div>

          {/* Mock card preview */}
          <div style={{ marginTop: 56, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 22, maxWidth: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Total balance</div>
              <div style={{ fontSize: 11, color: t.pos, fontFamily: 'JetBrains Mono' }}>+4.2% mo</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em' }}>€24,318.<span style={{ color: t.inkMute }}>50</span></div>
            <div style={{ marginTop: 16 }}>
              <Sparkline data={[12,14,13,16,18,17,20,22,21,24,23,24]} width={336} height={60} color={t.accent}/>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: t.inkFaint, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>
          STERLING · 2026 · v0.6
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{ padding: '56px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 380, width: '100%', alignSelf: 'center' }}>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', marginBottom: 14 }}>
            {variant === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
            {variant === 'login' ? 'Sign in' : 'Get started'}
          </div>
          <div style={{ fontSize: 14, color: t.inkSoft, marginBottom: 32 }}>
            {variant === 'login' ? 'Pick up where you left off.' : 'Three minutes. No card. Your data stays yours.'}
          </div>

          {/* Social */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
            <button style={{ flex: 1, background: t.surface, border: `1px solid ${t.line}`, color: t.ink, borderRadius: 10, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
              <Icon name="logo-google" size={16}/> Google
            </button>
            <button style={{ flex: 1, background: t.surface, border: `1px solid ${t.line}`, color: t.ink, borderRadius: 10, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
              <Icon name="logo-apple" size={16}/> Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 22px', color: t.inkMute, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
            <div style={{ flex: 1, height: 1, background: t.line }}/> or <div style={{ flex: 1, height: 1, background: t.line }}/>
          </div>

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field t={t} icon="mail" label="Email" value="hello@your.domain"/>
            <Field t={t} icon="lock" label="Password" value="••••••••••••" trailingIcon="eye-off"/>
            {variant === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: t.inkSoft }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.lineStrong}`, background: t.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={11} color="#fff"/>
                  </span>
                  Remember me
                </label>
                <a style={{ color: t.accent, cursor: 'pointer' }}>Forgot password</a>
              </div>
            )}
          </div>

          <button style={{ marginTop: 22, width: '100%', background: t.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {variant === 'login' ? 'Sign in' : 'Create account'} <Icon name="arrow-right" size={15}/>
          </button>

          <div style={{ marginTop: 22, fontSize: 13, color: t.inkMute, textAlign: 'center' }}>
            {variant === 'login' ? "New here? " : "Have an account? "}
            <a style={{ color: t.accent, cursor: 'pointer', fontWeight: 500 }}>{variant === 'login' ? 'Create an account' : 'Sign in'}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ t, icon, label, value, trailingIcon }) => (
  <div>
    <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10 }}>
      <Icon name={icon} size={15} color={t.inkMute}/>
      <div style={{ flex: 1, fontSize: 14, color: t.ink, fontFamily: 'inherit' }}>{value}</div>
      {trailingIcon && <Icon name={trailingIcon} size={15} color={t.inkMute}/>}
    </div>
  </div>
);

window.AuthScreen = AuthScreen;
