// Lightweight inline SVG charts — green/red as background fills, ink/accent for shape
// Philosophy: the chart's geometry is the hero. Color is the field.

const Sparkline = ({ data = [], width = 200, height = 50, color = '#7B8BFF', fill = true, strokeWidth = 1.6 }) => {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.9 - height * 0.05;
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fillPath = `${path} L${width},${height} L0,${height} Z`;
  const id = `sg-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${id})`}/>}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// BarChart — bars are INK (or muted ink) outlines/fills, background bands tint the chart area
// green for "income side" and red for "spend side". Color is the field, not the bars.
const BarChart = ({ income = [], expenses = [], labels = [], width = 600, height = 220, t }) => {
  const all = [...income, ...expenses];
  const max = Math.max(...all, 1);
  const padL = 36, padR = 8, padT = 16, padB = 28;
  const cw = width - padL - padR;
  const ch = height - padT - padB;
  const groupW = cw / labels.length;
  const barW = Math.min(10, groupW * 0.32);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={padL} y1={padT + ch * (1 - p)} x2={width - padR} y2={padT + ch * (1 - p)} stroke={t.line} strokeWidth="1"/>
          <text x={padL - 6} y={padT + ch * (1 - p) + 3} fill={t.inkFaint} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
            {(max * p / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      {/* Bars — income solid ink, spend hollow ink with subtle posSoft/negSoft tints */}
      {labels.map((l, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const incH = (income[i] / max) * ch;
        const expH = (expenses[i] / max) * ch;
        return (
          <g key={i}>
            {/* income — solid ink bar over a faint green wash */}
            <rect x={cx - barW - 2} y={padT} width={barW} height={ch} fill={t.posSoft} rx="2"/>
            <rect x={cx - barW - 2} y={padT + ch - incH} width={barW} height={incH} fill={t.ink} rx="2"/>
            {/* spend — hollow ink bar over a faint red wash */}
            <rect x={cx + 2} y={padT} width={barW} height={ch} fill={t.negSoft} rx="2"/>
            <rect x={cx + 2} y={padT + ch - expH} width={barW} height={expH} fill={t.accent} rx="2"/>
            <text x={cx} y={height - 8} fill={t.inkMute} fontSize="10" textAnchor="middle" fontFamily="Inter">{l}</text>
          </g>
        );
      })}
    </svg>
  );
};

// LineChart — line drawn in ink/accent, the area underneath fills with green tint
// when net positive (above start) and red tint when net negative (below start).
const LineChart = ({ data = [], labels = [], width = 600, height = 220, color, t, projectedFrom = null }) => {
  if (!data.length) return null;
  const padL = 40, padR = 12, padT = 16, padB = 28;
  const cw = width - padL - padR;
  const ch = height - padT - padB;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const range = max - min || 1;
  const lineColor = color || t.ink;
  const points = data.map((v, i) => {
    const x = padL + (i / (data.length - 1)) * cw;
    const y = padT + ch - ((v - min) / range) * ch;
    return [x, y, v];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');

  // Baseline = first value (so we can color above as positive, below as negative)
  const baseY = padT + ch - ((data[0] - min) / range) * ch;

  // Mask above the line — fills with green where line is above baseline
  const greenAreaPath = `${path} L${points[points.length - 1][0]},${baseY} L${points[0][0]},${baseY} Z`;
  const redAreaPath = `${path} L${points[points.length - 1][0]},${baseY} L${points[0][0]},${baseY} Z`;

  const greenId = `gp-${Math.random().toString(36).slice(2, 8)}`;
  const redId = `rp-${Math.random().toString(36).slice(2, 8)}`;

  // Solid vs dashed (projection)
  let solidPath = path, dashedPath = '';
  if (projectedFrom != null && projectedFrom < points.length - 1) {
    solidPath = points.slice(0, projectedFrom + 1).map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    dashedPath = points.slice(projectedFrom).map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <clipPath id={greenId}>
          <rect x={padL} y={padT} width={cw} height={Math.max(0, baseY - padT)}/>
        </clipPath>
        <clipPath id={redId}>
          <rect x={padL} y={baseY} width={cw} height={Math.max(0, padT + ch - baseY)}/>
        </clipPath>
      </defs>
      {/* Field tints — green above baseline, red below baseline of the chart area */}
      <rect x={padL} y={padT} width={cw} height={Math.max(0, baseY - padT)} fill={t.posSoft}/>
      <rect x={padL} y={baseY} width={cw} height={Math.max(0, padT + ch - baseY)} fill={t.negSoft}/>
      {/* Baseline */}
      <line x1={padL} y1={baseY} x2={width - padR} y2={baseY} stroke={t.lineStrong} strokeWidth="1" strokeDasharray="2 3"/>
      {/* Grid */}
      {[0, 0.5, 1].map((p, i) => (
        <g key={i}>
          {i !== 1 && <line x1={padL} y1={padT + ch * p} x2={width - padR} y2={padT + ch * p} stroke={t.line} strokeWidth="1"/>}
          <text x={padL - 6} y={padT + ch * p + 3} fill={t.inkFaint} fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
            {((max - range * p) / 1000).toFixed(1)}k
          </text>
        </g>
      ))}
      {/* The line itself */}
      <path d={solidPath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {dashedPath && <path d={dashedPath} fill="none" stroke={lineColor} strokeWidth="2" strokeDasharray="4 4" opacity="0.7"/>}
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 0} fill={lineColor} stroke={t.bg} strokeWidth="2"/>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={padL + (i / (labels.length - 1)) * cw} y={height - 8} fill={t.inkMute} fontSize="10" textAnchor="middle" fontFamily="Inter">{l}</text>
      ))}
    </svg>
  );
};

const Donut = ({ segments = [], size = 180, thickness = 22, t, label, sublabel }) => {
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.line} strokeWidth={thickness}/>
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const dashOff = -offset;
          offset += len;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={dashOff} strokeLinecap="butt"/>;
        })}
      </svg>
      {label && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: size * 0.13, fontWeight: 600, color: t.ink, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em' }}>{label}</div>
          {sublabel && <div style={{ fontSize: 10, color: t.inkMute, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ value = 0, max = 100, color = '#7B8BFF', height = 6, t, segmented = false, segments = [] }) => {
  if (segmented && segments.length) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    return (
      <div style={{ display: 'flex', height, gap: 2, width: '100%', borderRadius: height/2, overflow: 'hidden', background: t.line }}>
        {segments.map((s, i) => (
          <div key={i} style={{ flex: s.value / total, background: s.color }}/>
        ))}
      </div>
    );
  }
  return (
    <div style={{ height, background: t.line, borderRadius: height/2, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(100, (value/max)*100)}%`, height: '100%', background: color, borderRadius: height/2, transition: 'width 0.3s' }}/>
    </div>
  );
};

Object.assign(window, { Sparkline, BarChart, LineChart, Donut, ProgressBar });
