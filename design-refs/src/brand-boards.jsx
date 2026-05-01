// Brand identity boards — the actual design output.
// Each is a single artboard for the design canvas.

const useBrand = (mode) => mode === 'light' ? BRAND.light : BRAND.dark;

// ─────────────────────────────────────────────────────────────
// BOARD 1 — COVER. Big editorial title moment.
// ─────────────────────────────────────────────────────────────
const BoardCover = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk,
    }}>
      <Grain dark={mode === 'dark'} opacity={0.09}/>
      {/* corner mono labels */}
      <div style={{ position: 'absolute', top: 32, left: 40, fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        Brand book · vol. 01
      </div>
      <div style={{ position: 'absolute', top: 32, right: 40, fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        2025 · {mode}-mode
      </div>
      <div style={{ position: 'absolute', bottom: 32, left: 40, fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        Personal finance, with feeling
      </div>
      <div style={{ position: 'absolute', bottom: 32, right: 40, fontFamily: FONTS.mono, fontSize: 11, color: c.accent, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        ●  Working draft
      </div>

      {/* horizontal rule */}
      <div style={{ position: 'absolute', top: 72, left: 40, right: 40, height: 1, background: c.rule }}/>
      <div style={{ position: 'absolute', bottom: 72, left: 40, right: 40, height: 1, background: c.rule }}/>

      {/* main title */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: '0.2em', color: c.accent, textTransform: 'uppercase', marginBottom: 24 }}>
          ⌘  An almanac for your money
        </div>
        <div style={{
          fontFamily: FONTS.display, fontStyle: 'italic',
          fontSize: 220, lineHeight: 0.86, letterSpacing: '-0.04em',
          color: c.ink, fontWeight: 400,
        }}>
          sterling<span style={{ color: c.accent }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 36, gap: 40 }}>
          <div style={{ fontFamily: FONTS.grotesk, fontSize: 22, lineHeight: 1.35, maxWidth: 520, color: c.inkSoft, textWrap: 'pretty' }}>
            A handsome little ledger that knows your habits, keeps an honest count, and gently teaches you how to keep more of what you earn.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Stamp text="STERLING · COUNT KINDLY · STERLING · " color={c.accent} size={140} rotate={-8}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOARD 2 — NAME STUDY. Sterling + 3 alternates as wordmark lockups.
// ─────────────────────────────────────────────────────────────
const BoardNames = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  const names = [
    { name: 'sterling', mark: 'tally', note: 'Honest, weighty. From "pound sterling" — a unit of value.', tag: 'CHOSEN' },
    { name: 'almanac', mark: 'sun', note: 'Yearly companion. Knows your seasons.', tag: 'ALT 01' },
    { name: 'ledger', mark: 'coin', note: 'Old-school accounting; folk-craft tone.', tag: 'ALT 02' },
    { name: 'tally', mark: 'spiral', note: 'Short, friendly, the act of counting.', tag: 'ALT 03' },
  ];
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="02" title="Name study" subtitle="Wordmarks set in Instrument Serif italic. Sterling stays — alternates kept for the family."/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 64, background: c.rule, border: `1px solid ${c.rule}` }}>
        {names.map((n) => (
          <div key={n.name} style={{ background: c.paper, padding: '56px 48px', minHeight: 260, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', color: n.tag === 'CHOSEN' ? c.accent : c.inkMute }}>
                ● {n.tag}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.12em' }}>
                MARK · {n.mark.toUpperCase()}
              </div>
            </div>
            <div>
              <Wordmark name={n.name} color={c.ink} accent={c.accent} size={84} markKind={n.mark}/>
            </div>
            <div style={{ fontFamily: FONTS.grotesk, fontSize: 14, color: c.inkSoft, marginTop: 28, maxWidth: 380, lineHeight: 1.4 }}>
              {n.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOARD 3 — LOGO SYSTEM. 5 marks + lockups + behavior.
// ─────────────────────────────────────────────────────────────
const BoardLogos = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  const marks = [
    { Sym: SymbolTally, name: 'Tally', note: 'Folk-ledger. A hand-counted set of five.' },
    { Sym: SymbolSunS, name: 'Half-Sun', note: 'Retro-optimism. Every day a fresh balance.' },
    { Sym: SymbolCoinS, name: 'Coin-S', note: 'Engraved S on a coin. Most direct read.' },
    { Sym: SymbolStack, name: 'Stack', note: 'A leaning tower of deposits. Playful.' },
    { Sym: SymbolSpiral, name: 'Spiral', note: 'Compounding, drawn by hand.' },
  ];
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="03" title="Symbol exploration" subtitle="Five abstract marks — a family that can rotate by surface and season. Tally is the lead."/>

      {/* Mark grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginTop: 56, background: c.rule, border: `1px solid ${c.rule}` }}>
        {marks.map((m, i) => (
          <div key={i} style={{ background: c.paper, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, minHeight: 240 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.16em', color: c.inkMute }}>0{i + 1}</div>
            <div style={{ color: c.ink }}>
              <m.Sym size={92} color={c.ink} accent={c.accent}/>
            </div>
            <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 22, color: c.ink }}>{m.name}</div>
            <div style={{ fontSize: 12, color: c.inkMute, lineHeight: 1.4, maxWidth: 160 }}>{m.note}</div>
          </div>
        ))}
      </div>

      {/* Lockups */}
      <div style={{ marginTop: 80 }}>
        <SectionLabel mode={mode} text="Primary lockups" hint="Symbol + wordmark"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 28 }}>
          <LockupCard mode={mode} bg={c.paper} ink={c.ink} accent={c.accent} label="A · Editorial · italic serif">
            <Wordmark name="sterling" color={c.ink} accent={c.accent} size={64} markKind="tally"/>
          </LockupCard>
          <LockupCard mode={mode} bg={c.ink} ink={c.paper} accent={c.accent} label="B · Inverse · italic serif">
            <Wordmark name="sterling" color={c.paper} accent={c.accent} size={64} markKind="tally"/>
          </LockupCard>
          <LockupCard mode={mode} bg={c.paper} ink={c.ink} accent={c.accent} label="C · Utility · grotesk caps">
            <WordmarkGrotesk name="STERLING" color={c.ink} accent={c.accent} size={32} markKind="tally"/>
          </LockupCard>
          <LockupCard mode={mode} bg={c.accent} ink={c.paper} accent={c.paper} label="D · Loud · accent ground">
            <Wordmark name="sterling" color={c.paper} accent={c.paper} size={64} markKind="tally"/>
          </LockupCard>
        </div>
      </div>

      {/* Behavior at sizes */}
      <div style={{ marginTop: 80 }}>
        <SectionLabel mode={mode} text="Mark at scale" hint="48 / 32 / 20 / 12 px"/>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 56, marginTop: 28, padding: 28, border: `1px solid ${c.rule}` }}>
          {[80, 56, 32, 20, 12].map((s) => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ color: c.ink }}><SymbolTally size={s} color={c.ink} accent={c.accent}/></div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: c.inkMute }}>{s}px</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LockupCard = ({ mode, bg, ink, accent, label, children }) => {
  const c = useBrand(mode);
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ background: bg, color: ink, padding: '64px 40px', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: `1px solid ${c.rule}` }}>
        {children}
      </div>
      <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.12em', color: c.inkMute, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOARD 4 — COLOR. Cream + ink + electric red, plus secondaries.
// ─────────────────────────────────────────────────────────────
const BoardColor = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  const all = mode === 'dark' ? BRAND.dark : BRAND.light;
  const swatches = [
    { name: 'Paper', hex: all.paper, role: 'Ground · canvas · cards', big: true },
    { name: 'Ink', hex: all.ink, role: 'Primary text · dark surfaces', big: true },
    { name: 'Accent / Electric', hex: all.accent, role: 'Action · alerts · spend', big: true },
    { name: 'Sun', hex: all.sun, role: 'Warmth · positive trends', big: false },
    { name: 'Leaf', hex: all.leaf, role: 'Saved · invested', big: false },
    { name: 'Ink soft', hex: all.inkSoft, role: 'Secondary text', big: false },
    { name: 'Ink mute', hex: all.inkMute, role: 'Tertiary · captions', big: false },
    { name: 'Paper soft', hex: all.paperSoft, role: 'Subtle fill', big: false },
  ];
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="04" title="Color" subtitle="A short, opinionated palette: cream, ink, one electric. Secondaries earn their place."/>

      {/* Hero row of three primary colors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginTop: 56, background: c.rule, border: `1px solid ${c.rule}` }}>
        {swatches.filter((s) => s.big).map((s) => (
          <div key={s.name} style={{ background: s.hex, padding: '48px 32px', minHeight: 260, position: 'relative', color: contrastFor(s.hex) }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>
              {s.name}
            </div>
            <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 56, marginTop: 80, lineHeight: 0.9 }}>
              {s.hex}
            </div>
            <div style={{ fontSize: 13, marginTop: 12, opacity: 0.75 }}>{s.role}</div>
          </div>
        ))}
      </div>

      {/* Secondary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginTop: 24, background: c.rule, border: `1px solid ${c.rule}` }}>
        {swatches.filter((s) => !s.big).map((s) => (
          <div key={s.name} style={{ background: s.hex, padding: '24px 20px', minHeight: 130, color: contrastFor(s.hex) }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>{s.name}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 13, marginTop: 32 }}>{s.hex}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7, lineHeight: 1.3 }}>{s.role}</div>
          </div>
        ))}
      </div>

      {/* Pair specimens */}
      <div style={{ marginTop: 80 }}>
        <SectionLabel mode={mode} text="Pairings" hint="Cream and ink do most of the work — accent intervenes."/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 28 }}>
          <PairSpecimen bg={all.paper} fg={all.ink} accent={all.accent} mode={mode} caption="Daily UI"/>
          <PairSpecimen bg={all.ink} fg={all.paper} accent={all.accent} mode={mode} caption="Editorial / hero"/>
          <PairSpecimen bg={all.accent} fg={all.paper} accent={all.ink} mode={mode} caption="Loud moments"/>
        </div>
      </div>
    </div>
  );
};

const PairSpecimen = ({ bg, fg, accent, caption, mode }) => {
  const c = useBrand(mode);
  return (
    <div>
      <div style={{ background: bg, color: fg, padding: '32px 28px', minHeight: 220, position: 'relative', overflow: 'hidden', border: `1px solid ${c.rule}` }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6 }}>This week</div>
        <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 60, marginTop: 12, lineHeight: 0.9 }}>$3,402<span style={{ color: accent }}>.</span></div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, marginTop: 14, opacity: 0.8 }}>↘ 12% vs. last · <span style={{ color: accent }}>see why</span></div>
      </div>
      <div style={{ marginTop: 10, fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{caption}</div>
    </div>
  );
};

const contrastFor = (hex) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#1A1614' : '#F1ECE0';
};

// ─────────────────────────────────────────────────────────────
// BOARD 5 — TYPE. Editorial display + grotesk + mono numbers.
// ─────────────────────────────────────────────────────────────
const BoardType = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="05" title="Type" subtitle="Three voices: Instrument Serif italic for moments, Inter Tight for product, JetBrains Mono for numbers."/>

      {/* Display specimen */}
      <div style={{ marginTop: 56, padding: '40px 0', borderTop: `1px solid ${c.rule}`, borderBottom: `1px solid ${c.rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, alignItems: 'baseline' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>Display<br/>Instrument Serif</div>
          <div>
            <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 124, lineHeight: 0.86, letterSpacing: '-0.03em' }}>
              count kindly<span style={{ color: c.accent }}>,</span><br/>
              <span style={{ fontStyle: 'normal' }}>spend honestly</span><span style={{ color: c.accent }}>.</span>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, marginTop: 16, letterSpacing: '0.1em' }}>
              124 / 96 / 72 / 56 / 40 PX  ·  ITALIC AT WILL
            </div>
          </div>
        </div>
      </div>

      {/* UI specimen */}
      <div style={{ padding: '40px 0', borderBottom: `1px solid ${c.rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, alignItems: 'baseline' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>Product<br/>Inter Tight</div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>You spent a bit more on takeout this week — want to talk about it?</div>
            <div style={{ display: 'flex', gap: 40, marginTop: 28, fontSize: 14, color: c.inkSoft, flexWrap: 'wrap' }}>
              <SpecRow label="H1" sample="Aa Bb 0123" size={32} weight={600}/>
              <SpecRow label="H2" sample="Aa Bb 0123" size={22} weight={600}/>
              <SpecRow label="Body" sample="Aa Bb 0123" size={16} weight={400}/>
              <SpecRow label="Caption" sample="Aa Bb 0123" size={13} weight={500}/>
            </div>
          </div>
        </div>
      </div>

      {/* Mono numerals — the craft moment */}
      <div style={{ padding: '40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, alignItems: 'baseline' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>Numerals<br/>JetBrains Mono</div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 64, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1, color: c.ink }}>
              <span style={{ color: c.inkMute }}>$</span>3,402.<span style={{ color: c.accent }}>17</span>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: c.inkSoft, marginTop: 16, letterSpacing: '0.04em' }}>
              0123456789 · $€£¥ · +14.2% · ↘ 11.4 · 02:45 PM · BNF —— END
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
              <Ticker color={c.inkSoft} accent={c.accent} items={['SPEND $312', 'SAVE $84', 'OWED $0', 'DAILY 02:45 PM', 'MOOD STEADY']}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecRow = ({ label, sample, size, weight }) => (
  <div>
    <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em', opacity: 0.6, textTransform: 'uppercase' }}>{label} · {size}px</div>
    <div style={{ fontSize: size, fontWeight: weight, marginTop: 4 }}>{sample}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// BOARD 6 — MASCOT.
// ─────────────────────────────────────────────────────────────
const BoardMascot = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  const cast = [
    { Comp: MascotPip, name: 'Pip', note: 'Folk-blob with antenna. Subtle, warm, can be tiny.', chosen: true },
    { Comp: MascotOwl, name: 'Hoot', note: 'Quiet observer. Reads as wisdom.', chosen: false },
    { Comp: MascotFox, name: 'Reynard', note: 'Cunning guide. Sharper edges.', chosen: false },
    { Comp: MascotBean, name: 'Bean', note: 'Anthro-coin. Most playful.', chosen: false },
  ];
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="06" title="The coach" subtitle="A small companion who shows up at the right moments. Subtle, not Clippy. We lead with Pip."/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 56, background: c.rule, border: `1px solid ${c.rule}` }}>
        {cast.map(({ Comp, name, note, chosen }) => (
          <div key={name} style={{ background: c.paper, padding: '40px 28px', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', color: chosen ? c.accent : c.inkMute }}>● {chosen ? 'LEAD' : 'ALT'}</div>
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 22 }}>{name}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: c.ink }}>
              <Comp size={140} color={c.ink} accent={c.accent}/>
            </div>
            <div style={{ fontSize: 13, color: c.inkSoft, lineHeight: 1.45 }}>{note}</div>
          </div>
        ))}
      </div>

      {/* Pip in scenes */}
      <div style={{ marginTop: 64 }}>
        <SectionLabel mode={mode} text="Pip in context" hint="Companion, not character. Speaks in mono."/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 28 }}>
          <PipScene mode={mode} body="Heads up — coffee crossed your usual line." cta="Talk to Pip"/>
          <PipScene mode={mode} body="Nice. You stayed under groceries 3 weeks running." cta="See the streak" tone="positive"/>
          <PipScene mode={mode} body="Want to trim $40/wk? I have one idea." cta="Hear it"/>
        </div>
      </div>
    </div>
  );
};

const PipScene = ({ mode, body, cta, tone = 'neutral' }) => {
  const c = useBrand(mode);
  const accent = tone === 'positive' ? c.leaf : c.accent;
  return (
    <div style={{ background: c.paperSoft, padding: 24, position: 'relative', border: `1px solid ${c.rule}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ color: c.ink, flexShrink: 0 }}>
        <MascotPip size={56} color={c.ink} accent={accent}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: c.ink, lineHeight: 1.45, textWrap: 'pretty' }}>{body}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.12em', color: accent, marginTop: 10, textTransform: 'uppercase' }}>→ {cta}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOARD 7 — MOTIFS / TEXTURES. Sun, rules, stamps, marks.
// ─────────────────────────────────────────────────────────────
const BoardMotifs = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paper, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="07" title="Motifs" subtitle="A small library of marks the brand can lean on. Use sparingly — one motif per moment."/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 56, background: c.rule, border: `1px solid ${c.rule}` }}>
        <MotifTile mode={mode} label="Sunburst" hint="Hero ground · seasonal">
          <div style={{ width: 160, height: 160 }}>
            <Sunburst rays={32} color={c.accent} cx={50} cy={50} r1={6} r2={48} strokeWidth={1.5}/>
          </div>
        </MotifTile>
        <MotifTile mode={mode} label="Half-sun" hint="Headers · daily reset">
          <div style={{ width: 200, height: 100 }}>
            <HalfSun color={c.accent} sunColor={c.sun} strokeWidth={1.5}/>
          </div>
        </MotifTile>
        <MotifTile mode={mode} label="Stamp" hint="Receipts · approvals">
          <Stamp text="STERLING · COUNT KINDLY · " color={c.accent} size={140} rotate={-10}/>
        </MotifTile>
        <MotifTile mode={mode} label="Hand marks" hint="Annotation · highlight">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <HandMark kind="underline" color={c.accent} size={120}/>
            <HandMark kind="circle" color={c.accent} size={120}/>
            <HandMark kind="arrow" color={c.accent} size={120}/>
          </div>
        </MotifTile>
      </div>

      {/* Ledger rules + ticker */}
      <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ position: 'relative', minHeight: 220, border: `1px solid ${c.rule}`, padding: 24, overflow: 'hidden' }}>
          <LedgerRules color={c.rule} spacing={28}/>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>Ledger rules</div>
            <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 44, lineHeight: 1, marginTop: 12 }}>an honest count</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: c.inkSoft, marginTop: 28, letterSpacing: '0.04em' }}>
              MAR 04 ····· COFFEE ······· $5.20<br/>
              MAR 04 ····· GROCERY ····· $42.18<br/>
              MAR 05 ····· SUBWAY ······ $2.90<br/>
              MAR 05 ····· LUNCH ······· $14.00
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', minHeight: 220, border: `1px solid ${c.rule}`, padding: 24, background: c.ink, color: c.paper }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', opacity: 0.6, textTransform: 'uppercase' }}>Ticker</div>
          <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 44, lineHeight: 1, marginTop: 12 }}>this week, in numbers</div>
          <div style={{ marginTop: 28 }}>
            <Ticker color={c.paper} accent={c.accent} items={['SPENT $312', 'SAVED $84', 'STREAK 12 DAYS', 'STEADY MOOD', 'NEXT BILL FRI']}/>
          </div>
          <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
            <HandMark kind="star" color={c.accent} size={140}/>
          </div>
        </div>
      </div>
    </div>
  );
};

const MotifTile = ({ mode, label, hint, children }) => {
  const c = useBrand(mode);
  return (
    <div style={{ background: c.paper, padding: 28, minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
      <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, opacity: 0.6 }}>{hint}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 0' }}>
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOARD 8 — BRAND IN USE. Poster, card, number moment, app glance.
// ─────────────────────────────────────────────────────────────
const BoardInUse = ({ mode = 'dark' }) => {
  const c = useBrand(mode);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: c.paperSoft, color: c.ink, fontFamily: FONTS.grotesk, padding: '64px 80px',
    }}>
      <Grain dark={mode === 'dark'} opacity={0.08}/>
      <BoardHeader mode={mode} num="08" title="Brand, in use" subtitle="A poster, a card, a number moment, an app glance. The system held loosely."/>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, marginTop: 56 }}>
        {/* POSTER */}
        <Sticker rotate={-1.2}>
          <div style={{ background: c.paper, padding: '56px 48px', minHeight: 540, position: 'relative', overflow: 'hidden', border: `1px solid ${c.rule}` }}>
            <Grain dark={mode === 'dark'} opacity={0.1}/>
            <div style={{ position: 'absolute', top: 24, right: 24, transform: 'rotate(8deg)' }}>
              <Stamp text="STERLING · COUNT KINDLY · " color={c.accent} size={120} rotate={0}/>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', color: c.inkMute, textTransform: 'uppercase' }}>
              Sterling · poster · 18 × 24
            </div>
            <div style={{ position: 'absolute', left: 48, top: 100, right: 48, bottom: 220 }}>
              <Sunburst rays={48} color={c.accent} cx={50} cy={100} r1={8} r2={130} strokeWidth={0.8} opacity={0.95}/>
            </div>
            <div style={{ position: 'absolute', left: 48, bottom: 48, right: 48 }}>
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 92, lineHeight: 0.86, letterSpacing: '-0.03em', color: c.ink }}>
                a kinder<br/>way to count<span style={{ color: c.accent }}>.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <Wordmark name="sterling" color={c.ink} accent={c.accent} size={24} markKind="tally"/>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: c.inkMute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>↗ JOIN THE LEDGER</div>
              </div>
            </div>
          </div>
        </Sticker>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* APP GLANCE */}
          <Sticker rotate={1.5}>
            <div style={{ background: c.ink, color: c.paper, padding: '28px 24px', minHeight: 220, position: 'relative', overflow: 'hidden', border: `1px solid ${c.rule}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', opacity: 0.7, textTransform: 'uppercase' }}>Tuesday · 02:45</div>
                <div style={{ color: c.paper }}><MascotPip size={28} color={c.paper} accent={c.accent}/></div>
              </div>
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 64, lineHeight: 0.9, marginTop: 16, letterSpacing: '-0.02em' }}>
                <span style={{ fontFamily: FONTS.mono, fontStyle: 'normal', fontSize: 56, fontWeight: 500 }}>$3,402<span style={{ color: c.accent }}>.</span>17</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 14, opacity: 0.8, lineHeight: 1.4, textWrap: 'pretty' }}>
                Steady week. Pip noticed you cooked twice — that saved you about $34.
              </div>
              <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
                <HandMark kind="underline" color={c.accent} size={70}/>
              </div>
            </div>
          </Sticker>

          {/* NUMBER MOMENT */}
          <Sticker rotate={-2}>
            <div style={{ background: c.accent, color: c.paper, padding: '36px 28px', minHeight: 200, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', opacity: 0.85, textTransform: 'uppercase' }}>Saved this year</div>
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 140, lineHeight: 0.86, letterSpacing: '-0.04em', marginTop: 4 }}>
                $1,284<span style={{ opacity: 0.6 }}>.</span>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 13, marginTop: 8, opacity: 0.9, letterSpacing: '0.04em' }}>
                ↗ +12% on your own pace
              </div>
            </div>
          </Sticker>

          {/* RECEIPT CARD */}
          <Sticker rotate={2.4}>
            <div style={{ background: c.paper, padding: '24px 24px', minHeight: 200, position: 'relative', overflow: 'hidden', border: `1px solid ${c.rule}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px dashed ${c.rule}`, paddingBottom: 8 }}>
                <Wordmark name="sterling" color={c.ink} accent={c.accent} size={18} markKind="tally"/>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: c.inkMute, letterSpacing: '0.14em' }}>RECEIPT · 0413</div>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: c.ink, marginTop: 14, lineHeight: 1.7, letterSpacing: '0.02em' }}>
                COFFEE  ······  $5.20<br/>
                LUNCH   ······ $14.00<br/>
                METRO   ······  $2.90<br/>
                <span style={{ color: c.accent }}>──── ────── ─────</span><br/>
                <span style={{ fontWeight: 600 }}>TODAY  ······ $22.10</span>
              </div>
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 13, color: c.inkMute, marginTop: 14 }}>thank you, kindly.</div>
            </div>
          </Sticker>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Shared header
// ─────────────────────────────────────────────────────────────
const BoardHeader = ({ mode, num, title, subtitle }) => {
  const c = useBrand(mode);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.18em', color: c.inkMute, textTransform: 'uppercase' }}>
          ● {num} · Sterling brand book
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.14em', color: c.inkMute, textTransform: 'uppercase' }}>
          {mode}-mode
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 88, lineHeight: 0.9, letterSpacing: '-0.03em', color: c.ink, fontWeight: 400 }}>
          {title}<span style={{ color: c.accent }}>.</span>
        </div>
        <div style={{ fontSize: 17, color: c.inkSoft, marginTop: 12, maxWidth: 720, lineHeight: 1.45, textWrap: 'pretty' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ mode, text, hint }) => {
  const c = useBrand(mode);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${c.rule}`, paddingBottom: 12 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '0.16em', color: c.ink, textTransform: 'uppercase' }}>{text}</div>
      <div style={{ fontFamily: FONTS.grotesk, fontSize: 13, color: c.inkMute }}>{hint}</div>
    </div>
  );
};

Object.assign(window, {
  BoardCover, BoardNames, BoardLogos, BoardColor, BoardType, BoardMascot, BoardMotifs, BoardInUse,
});
