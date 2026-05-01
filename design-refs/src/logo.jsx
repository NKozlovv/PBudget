// Theus logo — exported under Sterling* names so the v1 product screens
// continue to work unchanged. Symbol is a leaning stack of slabs:
// two flat slabs at the base (ink) + one tilted slab on top (accent).

// Primary mark — three slabs, top one tilted
const SterlingMark = ({ size = 32, color = '#7B8BFF', accentColor = '#A78BFA', bg = null }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {bg && <rect width="40" height="40" rx="10" fill={bg}/>}
      {/* base slab — widest */}
      <rect x="5"  y="27" width="30" height="6" rx="1.4" fill={color}/>
      {/* mid slab */}
      <rect x="8"  y="19" width="24" height="6" rx="1.4" fill={color}/>
      {/* top slab — tilted, accent */}
      <g transform="rotate(-13 20 13)">
        <rect x="11" y="10" width="18" height="6" rx="1.4" fill={accentColor}/>
      </g>
    </svg>
  );
};

// Alternate — neat aligned stack (no tilt), four slabs
const SterlingMarkAlt = ({ size = 32, color = '#7B8BFF', accentColor = '#A78BFA' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="5"  y="29" width="30" height="5" rx="1.2" fill={color} opacity="0.55"/>
      <rect x="7"  y="22" width="26" height="5" rx="1.2" fill={color} opacity="0.75"/>
      <rect x="9"  y="15" width="22" height="5" rx="1.2" fill={color}/>
      <rect x="12" y="8"  width="16" height="5" rx="1.2" fill={accentColor}/>
    </svg>
  );
};

// Outline alternate — same leaning stack but stroked
const SterlingMarkArrow = ({ size = 32, color = '#7B8BFF', accentColor = '#A78BFA' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="5.5"  y="27.5" width="29" height="5" rx="1.2" fill="none" stroke={color} strokeWidth="1.4"/>
      <rect x="8.5"  y="19.5" width="23" height="5" rx="1.2" fill="none" stroke={color} strokeWidth="1.4"/>
      <g transform="rotate(-13 20 13)">
        <rect x="11.5" y="10.5" width="17" height="5" rx="1.2" fill={accentColor}/>
      </g>
    </svg>
  );
};

const SterlingWordmark = ({ size = 32, color = '#F5F6FA', accentColor = '#7B8BFF', accentColor2 = '#A78BFA', layout = 'horizontal' }) => {
  if (layout === 'stacked') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.3 }}>
        <SterlingMark size={size * 1.4} color={accentColor} accentColor={accentColor2}/>
        <span style={{ fontSize: size * 0.62, fontWeight: 600, color, letterSpacing: '-0.03em' }}>Theus</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}>
      <SterlingMark size={size} color={accentColor} accentColor={accentColor2}/>
      <span style={{ fontSize: size * 0.68, fontWeight: 600, color, letterSpacing: '-0.03em' }}>Theus</span>
    </div>
  );
};

Object.assign(window, { SterlingMark, SterlingMarkAlt, SterlingMarkArrow, SterlingWordmark });
