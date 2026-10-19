// Apple tarzı uygulama ikonu: sürekli köşeli kare (squircle), renk geçişli zemin,
// üstte cam parlaması ve beyaz, hafif şeffaf "liquid glass" sembol.

const SQUIRCLE =
  'M50 0C80 0 91 0 95.5 4.5S100 20 100 50 100 91 95.5 95.5 80 100 50 100 9 100 4.5 95.5 0 80 0 50 0 9 4.5 4.5 20 0 50 0Z';

export const ICONS = {
  SesVer: {
    colors: ['#ff4f7b', '#ff9f0a'],
    glyph: (
      <>
        <rect x="4" y="5" width="40" height="24" rx="12" fill="none" stroke="#fff" strokeWidth="3.4" />
        <path d="M14 27 L8 40 L24 29 Z" fill="#fff" />
        <rect x="11" y="13" width="4" height="8" rx="2" fill="#fff" />
        <rect x="17" y="10" width="4" height="14" rx="2" fill="#fff" />
        <rect x="23" y="8" width="4" height="18" rx="2" fill="#fff" />
        <rect x="29" y="10" width="4" height="14" rx="2" fill="#fff" />
        <rect x="35" y="13" width="4" height="8" rx="2" fill="#fff" />
      </>
    ),
    filled: true
  },
  WingWire: {
    colors: ['#5ad8ff', '#1a5cff'],
    glyph: (
      <>
        <path d="M6 38 Q18 30 30 34" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 5.5" />
        <path d="M44 6 L4 20 L20 24 L26 44 Z" fill="#fff" />
        <path d="M44 6 L20 24" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
    filled: true
  },
  'Income vs Desires': {
    colors: ['#3ddc84', '#0a8f6a'],
    glyph: (
      <>
        <circle cx="24" cy="8" r="2.4" />
        <path d="M24 10.6v31.4M14 42h20M8 17h32M8 17v10M40 17v10" />
        <path d="M3 27a5 5 0 0 0 10 0M35 27a5 5 0 0 0 10 0" />
      </>
    )
  },
  tiTimer: {
    colors: ['#ffd84d', '#ff8a00'],
    glyph: (
      <>
        <rect x="12" y="7" width="24" height="4" rx="2" />
        <rect x="12" y="37" width="24" height="4" rx="2" />
        <path d="M14 11 L34 11 L24 23 Z" />
        <path d="M14 37 L34 37 L24 25 Z" />
      </>
    ),
    filled: true
  },
  Kitabe: {
    colors: ['#e9c27a', '#8c5a24'],
    glyph: (
      <>
        <path d="M24 14C24 11 20 8 10 8 6 8 4 9.3 4 11.4V36.6C4 38.7 6 40 10 40 18 40 22 42 24 45 26 42 30 40 38 40 42 40 44 38.7 44 36.6V11.4C44 9.3 42 8 38 8 28 8 24 11 24 14Z" />
        <path d="M24 14V45" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.6" />
        <rect x="9" y="16" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="9" y="21" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="9" y="26" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="9" y="31" width="8" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="28" y="16" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="28" y="21" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="28" y="26" width="11" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
        <rect x="28" y="31" width="8" height="2.2" rx="1.1" fill="rgba(0,0,0,0.28)" />
      </>
    ),
    filled: true
  },
  'Pomodoro Restoran': {
    colors: ['#ff6a5b', '#c81e1e'],
    glyph: (
      <>
        <ellipse cx="22" cy="28" rx="15" ry="13.5" />
        <path d="M24 15C19 10 13 11 10 16 16 17 21 16 24 15Z" />
        <path d="M24 15C29 10 35 11 38 16 32 17 27 16 24 15Z" />
        <rect x="22.5" y="11" width="3" height="7" rx="1.5" />
        <path d="M35 30v6M39 29v7M43 30v6M35 36h8M39 36v9" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    filled: true
  },
  'Duo for X': {
    colors: ['#c86bff', '#6a35f0'],
    glyph: (
      <>
        <g opacity="0.55">
          <circle cx="15" cy="15" r="7" />
          <path d="M3 41C3 28 8 23 15 23 22 23 27 28 27 41Z" />
        </g>
        <circle cx="31" cy="18" r="8" />
        <path d="M16 44C16 30 22 25 31 25 40 25 46 30 46 44Z" />
      </>
    ),
    filled: true
  }
};

export default function AppIcon({ name, size = 88 }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const id = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const [c1, c2] = icon.colors;
  const paint = icon.filled
    ? { fill: `url(#gl-${id})`, stroke: 'none' }
    : { fill: 'none', stroke: `url(#gl-${id})`, strokeWidth: 4.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

  return (
    <svg
      className="appicon"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${name} ikonu`}
      style={{ '--icon-shadow': `${c2}55` }}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`gl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.78" />
        </linearGradient>
        <radialGradient id={`hl-${id}`} cx="0.3" cy="0" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`sq-${id}`}>
          <path d={SQUIRCLE} />
        </clipPath>
        <filter id={`sh-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.6" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>
      <g clipPath={`url(#sq-${id})`}>
        <rect width="100" height="100" fill={`url(#bg-${id})`} />
        <ellipse cx="38" cy="2" rx="78" ry="46" fill={`url(#hl-${id})`} />
      </g>
      <g transform="translate(20 20) scale(1.25)" filter={`url(#sh-${id})`} {...paint}>
        {icon.glyph}
      </g>
      <path d={SQUIRCLE} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
