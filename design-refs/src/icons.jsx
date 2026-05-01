// Minimal stroke icons, monoline, 1.5 stroke
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.6 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...props}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>;
    case 'list': return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'wallet': return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 13h2"/><path d="M3 10h18"/></svg>;
    case 'tag': return <svg {...props}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>;
    case 'chart': return <svg {...props}><path d="M3 20h18M6 16V9M11 16V5M16 16v-7M21 16v-3"/></svg>;
    case 'sparkle': return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'arrow-up': return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...props}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case 'arrow-up-right': return <svg {...props}><path d="M7 17L17 7M9 7h8v8"/></svg>;
    case 'arrow-down-right': return <svg {...props}><path d="M7 7l10 10M9 17h8V9"/></svg>;
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'chevron-right': return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'check': return <svg {...props}><path d="M5 12l5 5L20 7"/></svg>;
    case 'filter': return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'sort': return <svg {...props}><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>;
    case 'download': return <svg {...props}><path d="M12 4v12M6 12l6 6 6-6M5 20h14"/></svg>;
    case 'upload': return <svg {...props}><path d="M12 20V8M6 12l6-6 6 6M5 4h14"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'bell': return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'eye': return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...props}><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
    case 'food': return <svg {...props}><path d="M4 4v7a4 4 0 0 0 4 4v6M8 4v7M12 4v7M20 4c-1.5 0-3 1-3 4 0 2 1 3 3 3v9"/></svg>;
    case 'home-icon': return <svg {...props}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>;
    case 'car': return <svg {...props}><path d="M3 13l2-6h14l2 6M5 13h14v5H5zM7 18v2M17 18v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>;
    case 'plane': return <svg {...props}><path d="M2 12l8-2 4-7 2 1-2 7 7 2v2l-7-1-3 6-2-1 1-5-8-1z"/></svg>;
    case 'shopping': return <svg {...props}><path d="M5 7h14l-1 13H6L5 7zM9 7V5a3 3 0 0 1 6 0v2"/></svg>;
    case 'film': return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4"/></svg>;
    case 'health': return <svg {...props}><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10"/></svg>;
    case 'book': return <svg {...props}><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></svg>;
    case 'gift': return <svg {...props}><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8s-3-5-5.5-2.5C5 7 7 8 12 8M12 8s3-5 5.5-2.5C19 7 17 8 12 8"/></svg>;
    case 'tools': return <svg {...props}><path d="M14 7l3-3 3 3-3 3M14 7l-9 9-2 5 5-2 9-9M14 7l3 3"/></svg>;
    case 'briefcase': return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>;
    case 'pulse': return <svg {...props}><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>;
    case 'lock': return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'mail': return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case 'logo-google': return <svg width={size} height={size} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8C4 20.4 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.9 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.2C1.4 8.5 1 10.2 1 12s.4 3.5 1.2 5l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.7 1 4 3.6 2.2 7l3.7 2.8C6.8 7.3 9.2 5.4 12 5.4z"/></svg>;
    case 'logo-apple': return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2c-1 .1-2.2.7-3 1.5-.7.7-1.3 1.8-1.1 2.9 1.1.1 2.2-.5 2.9-1.3.7-.7 1.3-1.8 1.2-3.1zM20 17.4c-.5 1.2-.8 1.7-1.5 2.7-1 1.5-2.4 3.4-4.1 3.4-1.6 0-2-1-4.1-1-2.1 0-2.6 1-4.2 1-1.7 0-3-1.7-4.1-3.2-2.9-4.2-3.2-9.2-1.4-11.8 1.3-1.9 3.3-3 5.2-3 1.9 0 3.1 1.1 4.7 1.1 1.5 0 2.4-1.1 4.7-1.1 1.7 0 3.5.9 4.8 2.6-4.2 2.3-3.5 8.3.0 9.3z"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
