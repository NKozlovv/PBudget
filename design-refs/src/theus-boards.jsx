// Theus brand boards — italic ONLY for the "money understood" motto.
// Inter for everything else. JBM for numerals/labels.

const Mono = ({ children, color, size = 11, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.mono, fontSize: size, color,
    textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 500,
    ...style,
  }}>{children}</span>
);

const Italic = ({ children, color, size = 96, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.display, fontStyle: 'italic',
    fontSize: size, fontWeight: 400, color, lineHeight: 0.95,
    letterSpacing: '-0.01em', ...style,
  }}>{children}</span>
);

const Sans = ({ children, color, size = 16, weight = 400, style = {} }) => (
  <span style={{
    fontFamily: TFONTS.grotesk, fontSize: size, fontWeight: weight,
    color, lineHeight: 1.25, letterSpacing: '-0.01em', ...style,
  }}>{children}</span>
);

const Rule = ({ color, vertical, length = '100%' }) => (
  <div style={{ background: color, width: vertical ? 1 : length, height: vertical ? length : 1 }}/>
);

const BoardFrame = ({ t, width = 1280, height = 800, padding = 64, label, page, children }) => (
  <div style={{
    width, height, background: t.bg, color: t.ink,
    fontFamily: TFONTS.grotesk, position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 24, left: padding, right: padding,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      <Mono color={t.inkMute}>theus · brand system</Mono>
      <Mono color={t.inkMute}>{label}</Mono>
      <Mono color={t.inkMute}>{page}</Mono>
    </div>
    <div style={{ padding, paddingTop: 72, height: '100%', boxSizing: 'border-box' }}>
      {children}
    </div>
  </div>
);

// ─── 1. COVER ───────────────────────────────────────────────────────
const TBoardCover = () => {
  const { t } = useT();
  return (
    <BoardFrame t={t} label="cover" page="01 / 05">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', height: '100%', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <Mono color={t.accent} size={12}>est. 2026 — personal finance, kept slowly</Mono>
            <div style={{ marginTop: 40 }}>
              <Sans color={t.ink} size={140} weight={600} style={{ display: 'block', letterSpacing: '-0.05em', lineHeight: 0.92 }}>theus.</Sans>
              <div style={{ marginTop: 24 }}>
                <Italic color={t.accent} size={72}>Money understood.</Italic>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
            <div style={{ maxWidth: 380 }}>
              <Mono color={t.inkMute}>chapter one</Mono>
              <div style={{ marginTop: 8 }}>
                <Sans color={t.inkSoft} size={15} style={{ lineHeight: 1.55 }}>
                  Brand identity in five pages — wordmark, palette, type, voice, application.
                </Sans>
              </div>
            </div>
            <Mono color={t.inkMute}>v1.0 — apr 2026</Mono>
          </div>
        </div>
        <div style={{ width: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <TheusStack size={150} ink={t.ink} accent={t.accent}/>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            <Mono color={t.inkMute}>private finance · self-directed · multi-currency</Mono>
          </div>
        </div>
      </div>
    </BoardFrame>
  );
};

// ─── 2. LOGO ────────────────────────────────────────────────────────
const TBoardLogo = () => {
  const { t } = useT();
  return (
    <BoardFrame t={t} label="logo" page="02 / 05">
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <Mono color={t.inkMute}>the mark</Mono>
            <div style={{ marginTop: 12, maxWidth: 480 }}>
              <Sans color={t.ink} size={32} weight={500} style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                A leaning tower of deposits — three slabs, the top one tilted, off-balance, alive.
              </Sans>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <TheusStack size={300} ink={t.ink} accent={t.accent}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: t.rule, border: `1px solid ${t.rule}` }}>
            {[
              { label: 'primary', el: <TheusStack size={56} ink={t.ink} accent={t.accent}/>, bg: t.bg },
              { label: 'mono ink', el: <TheusStack size={56} ink={t.ink} accent={t.ink}/>, bg: t.bg },
              { label: 'reversed', el: <TheusStack size={56} ink={t.bg} accent={t.accent}/>, bg: t.ink },
              { label: 'on accent', el: <TheusStack size={56} ink={t.bg} accent={t.bg}/>, bg: t.accent },
            ].map((x, i) => (
              <div key={i} style={{ background: x.bg, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {x.el}
                <Mono color={x.bg === t.ink || x.bg === t.accent ? 'rgba(255,255,255,0.6)' : t.inkMute} size={9}>{x.label}</Mono>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Mono color={t.inkMute}>lockups</Mono>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 28, padding: 28, border: `1px solid ${t.rule}` }}>
              <TheusLockup size={56} color={t.ink} accent={t.accent}/>
              <TheusLockup size={36} color={t.ink} accent={t.accent}/>
              <TheusLockup size={22} color={t.ink} accent={t.accent}/>
            </div>
          </div>
          <div>
            <Mono color={t.inkMute}>icon · favicon · pwa</Mono>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              {[120, 64, 32].map((s, i) => (
                <div key={i} style={{ width: s, height: s, background: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TheusStack size={s * 0.7} ink={t.bg} accent={t.accent}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BoardFrame>
  );
};

// ─── 3. COLOR ───────────────────────────────────────────────────────
const TBoardColor = () => {
  const { t, mode } = useT();
  const palette = THEUS[mode];
  const swatches = [
    { hex: palette.bg,     name: 'ink',    role: 'primary surface' },
    { hex: palette.ink,    name: 'cream',  role: 'primary type' },
    { hex: palette.accent, name: 'red',    role: 'accent · spend · alert' },
    { hex: palette.pos,    name: 'green',  role: 'positive · gains' },
    { hex: palette.inkSoft,name: 'silt',   role: 'secondary type' },
    { hex: palette.inkMute,name: 'shadow', role: 'muted type · labels' },
  ];
  return (
    <BoardFrame t={t} label="color" page="03 / 05">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Mono color={t.inkMute}>palette</Mono>
            <div style={{ marginTop: 12, maxWidth: 460 }}>
              <Sans color={t.ink} size={36} weight={500} style={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                Warm ink, cream, electric red. Green earns its place — only when something good happened.
              </Sans>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, flex: 1 }}>
            {swatches.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: s.hex, height: 110, border: `1px solid ${t.rule}` }}/>
                <div style={{ padding: '10px 0', borderBottom: `1px solid ${t.rule}` }}>
                  <Sans color={t.ink} size={14} weight={500}>{s.name}</Sans>
                  <div><Mono color={t.inkMute} size={10}>{s.hex}</Mono></div>
                </div>
                <Mono color={t.inkMute} size={9} style={{ marginTop: 8 }}>{s.role}</Mono>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Mono color={t.inkMute}>signals</Mono>
          {/* gain card */}
          <div style={{ background: palette.bgSoft, padding: 24, border: `1px solid ${t.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Mono color={t.pos} size={10}>income · received</Mono>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: TFONTS.mono, fontSize: 36, color: t.pos, fontWeight: 500 }}>+ $2,400.00</span>
              </div>
              <div style={{ marginTop: 4 }}><Sans color={t.inkSoft} size={12}>Salary — ACME Corp</Sans></div>
            </div>
            <div style={{ width: 64, height: 64, background: palette.posSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M 4 14 L 16 6 M 16 6 L 16 12 M 16 6 L 10 6" stroke={t.pos} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
            </div>
          </div>
          {/* loss card */}
          <div style={{ background: palette.bgSoft, padding: 24, border: `1px solid ${t.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Mono color={t.accent} size={10}>spend · groceries</Mono>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: TFONTS.mono, fontSize: 36, color: t.ink, fontWeight: 500 }}>− $84.20</span>
              </div>
              <div style={{ marginTop: 4 }}><Sans color={t.inkSoft} size={12}>Whole Foods</Sans></div>
            </div>
            <div style={{ width: 64, height: 64, background: palette.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M 4 6 L 16 14 M 16 14 L 16 8 M 16 14 L 10 14" stroke={t.accent} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
            </div>
          </div>
          {/* mini ticker */}
          <div style={{ background: palette.bg, border: `1px solid ${t.rule}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, background: t.pos }}/>
                <Mono color={t.ink} size={10}>income +12%</Mono>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, background: t.accent }}/>
                <Mono color={t.ink} size={10}>dining −4%</Mono>
              </span>
            </div>
            <Mono color={t.inkMute} size={10}>this month</Mono>
          </div>
        </div>
      </div>
    </BoardFrame>
  );
};

// ─── 4. TYPE ────────────────────────────────────────────────────────
const TBoardType = () => {
  const { t } = useT();
  return (
    <BoardFrame t={t} label="type" page="04 / 05">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 28 }}>
        <div>
          <Mono color={t.inkMute}>type system</Mono>
          <div style={{ marginTop: 8, maxWidth: 600 }}>
            <Sans color={t.ink} size={22} weight={400} style={{ lineHeight: 1.4 }}>
              Inter does the work. Instrument Serif italic appears once — as the motto. JetBrains Mono carries every numeral and label.
            </Sans>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'baseline', borderTop: `1px solid ${t.rule}`, paddingTop: 24 }}>
          <Mono color={t.inkMute}>display</Mono>
          <Sans color={t.ink} size={88} weight={600} style={{ letterSpacing: '-0.045em', lineHeight: 1 }}>theus</Sans>
          <Mono color={t.inkMute}>inter · 600 · −4.5%</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'baseline', borderTop: `1px solid ${t.rule}`, paddingTop: 24 }}>
          <Mono color={t.inkMute}>motto</Mono>
          <Italic color={t.accent} size={64}>Money understood.</Italic>
          <Mono color={t.inkMute}>instrument serif italic</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'baseline', borderTop: `1px solid ${t.rule}`, paddingTop: 24 }}>
          <Mono color={t.inkMute}>headline</Mono>
          <Sans color={t.ink} size={40} weight={500} style={{ letterSpacing: '-0.025em' }}>Good morning, Alex.</Sans>
          <Mono color={t.inkMute}>inter · 500</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'baseline', borderTop: `1px solid ${t.rule}`, paddingTop: 24 }}>
          <Mono color={t.inkMute}>body</Mono>
          <Sans color={t.inkSoft} size={17} weight={400} style={{ lineHeight: 1.55, maxWidth: 600 }}>
            Theus is a personal finance app for people who track money the slow way — by hand, with intention, and across whatever currencies they happen to live in.
          </Sans>
          <Mono color={t.inkMute}>inter · 400</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'baseline', borderTop: `1px solid ${t.rule}`, paddingTop: 24 }}>
          <Mono color={t.inkMute}>numerals</Mono>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <span style={{ fontFamily: TFONTS.mono, fontSize: 40, color: t.pos, fontWeight: 500 }}>+12,408.52</span>
            <span style={{ fontFamily: TFONTS.mono, fontSize: 32, color: t.accent, fontWeight: 500 }}>−84.20</span>
            <span style={{ fontFamily: TFONTS.mono, fontSize: 22, color: t.inkMute }}>0123456789</span>
          </div>
          <Mono color={t.inkMute}>jetbrains mono · tabular</Mono>
        </div>
      </div>
    </BoardFrame>
  );
};

// ─── 5. IN USE ──────────────────────────────────────────────────────
const TBoardInUse = () => {
  const { t, mode } = useT();
  const palette = THEUS[mode];
  return (
    <BoardFrame t={t} label="in use" page="05 / 05">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, height: '100%' }}>
        {/* poster — spans 2 rows */}
        <div style={{ gridRow: 'span 2', background: palette.ink, color: palette.bg, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <TheusStack size={56} ink={palette.bg} accent={palette.accent}/>
            <Mono color={palette.bg} style={{ opacity: 0.5 }}>n° 001</Mono>
          </div>
          <div>
            <Sans color={palette.bg} size={88} weight={600} style={{ letterSpacing: '-0.045em', lineHeight: 0.95, display: 'block' }}>theus.</Sans>
            <div style={{ marginTop: 16 }}>
              <Italic color={palette.accent} size={56}>Money understood.</Italic>
            </div>
            <div style={{ marginTop: 36, maxWidth: 320 }}>
              <Sans color={palette.bg} size={14} style={{ lineHeight: 1.5, opacity: 0.7 }}>
                A personal ledger for everyday money. Multi-currency. Quiet, by design.
              </Sans>
            </div>
            <div style={{ marginTop: 24 }}><Mono color={palette.accent}>theus.app</Mono></div>
          </div>
        </div>

        {/* app icon */}
        <div style={{ background: palette.accent, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TheusStack size={130} ink={palette.bg} accent={palette.bg}/>
        </div>

        {/* number moment */}
        <div style={{ background: palette.bg, border: `1px solid ${t.rule}`, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Mono color={t.inkMute}>net worth · all accounts</Mono>
          <div>
            <span style={{ fontFamily: TFONTS.mono, fontSize: 56, fontWeight: 500, color: t.ink }}>$84,210</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Mono color={t.pos}>↗ +3.2%</Mono>
            <Mono color={t.inkMute}>30d</Mono>
          </div>
        </div>

        {/* receipt */}
        <div style={{ background: palette.bgSoft, padding: 20, fontFamily: TFONTS.mono, fontSize: 11, color: t.ink, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, letterSpacing: '0.1em' }}>THEUS</span>
            <span style={{ color: t.inkMute }}>RCP — 0421</span>
          </div>
          <Rule color={t.rule}/>
          {[['groceries', '−42.10', false], ['transit', '−6.50', false], ['coffee', '−4.20', false], ['salary', '+2,400.00', true]].map(([k, v, p], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: t.inkSoft }}>{k}</span>
              <span style={{ color: p ? t.pos : t.ink }}>{v}</span>
            </div>
          ))}
          <Rule color={t.rule}/>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>NET</span>
            <span style={{ color: t.pos, fontWeight: 600 }}>+2,347.20</span>
          </div>
        </div>

        {/* business card */}
        <div style={{ background: palette.bg, border: `1px solid ${t.rule}`, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <TheusLockup size={26} color={t.ink} accent={t.accent}/>
          <div>
            <Sans color={t.ink} size={14} weight={500}>Alex Morgan</Sans>
            <div style={{ marginTop: 2 }}><Mono color={t.inkMute} size={10}>founder</Mono></div>
            <div style={{ marginTop: 12 }}><Mono color={t.accent} size={10}>alex@theus.app</Mono></div>
          </div>
        </div>
      </div>
    </BoardFrame>
  );
};

Object.assign(window, { TBoardCover, TBoardLogo, TBoardColor, TBoardType, TBoardInUse });
