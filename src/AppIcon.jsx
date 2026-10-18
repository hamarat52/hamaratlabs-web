// Apple tarzı uygulama ikonu: sürekli köşeli kare (squircle), renk geçişli zemin,
// üstte cam parlaması ve beyaz, hafif şeffaf "liquid glass" sembol.

const SQUIRCLE =
  'M50 0C80 0 91 0 95.5 4.5S100 20 100 50 100 91 95.5 95.5 80 100 50 100 9 100 4.5 95.5 0 80 0 50 0 9 4.5 4.5 20 0 50 0Z';

export const ICONS = {
  SesVer: {
    colors: ['#ff4f7b', '#ff9f0a'],
    glyph: (
      <>
        <rect x="6" y="20" width="5" height="8" rx="2.5" />
        <rect x="14" y="13" width="5" height="22" rx="2.5" />
        <rect x="22" y="6" width="5" height="36" rx="2.5" />
        <rect x="30" y="14" width="5" height="20" rx="2.5" />
        <rect x="38" y="19" width="5" height="10" rx="2.5" />
      </>
    ),
    filled: true
  },
  WingWire: {
    colors: ['#5ad8ff', '#1a5cff'],
    glyph: <path d="M6 36c6-14 18-21 34-21M10 41c8-10 18-14 30-14M24 18l16-8M28 26l14-4" />
  },
  'Income vs Desires': {
    colors: ['#3ddc84', '#0a8f6a'],
    glyph: <path d="M13 8h22M13 40h22M16 8c0 9 8 12 8 16s-8 7-8 16M32 8c0 9-8 12-8 16s8 7 8 16" />
  },
  tiTimer: {
    colors: ['#ffd84d', '#ff8a00'],
    glyph: (
      <>
        <circle cx="24" cy="27" r="14" />
        <path d="M24 27v-8M19 7h10M24 7v6" />
      </>
    )
  },
  Kitabe: {
    colors: ['#e9c27a', '#8c5a24'],
    glyph: <path d="M12 40V23c0-8 6-13 12-17 6 4 12 9 12 17v17zM18 27h12M18 33h12" />
  },
  'Pomodoro Restoran': {
    colors: ['#ff6a5b', '#c81e1e'],
    glyph: (
      <>
        <circle cx="24" cy="28" r="13" />
        <path d="M24 15V9M24 15c-2-3-6-4-9-3M24 15c2-3 6-4 9-3" />
      </>
    )
  },
  'Duo for X': {
    colors: ['#c86bff', '#6a35f0'],
    glyph: (
      <>
        <circle cx="19" cy="24" r="10" />
        <circle cx="29" cy="24" r="10" />
      </>
    )
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
