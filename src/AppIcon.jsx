// HamaratLabs "liquid glass" uygulama ikonu.
// Apple'ın cam ikon dili (tek renk ailesi zemin, buzlu cam sembol, iç gölge, üstte ışık)
// Tamamı SVG: cam hissi feSpecularLighting + iç gölge filtreleriyle yaklaşık olarak kurulur.

// Apple "continuous corner" (iOS 7+ UIBezierPath roundedRect / ikon maskesi): köşe tek bir
// çember yayı değil; eğrilik düz kenarda 0'dan başlayıp yumuşakça artar. Sabitler PaintCode'un
// UIKit çıktısından ölçtüğü sağ-üst köşe noktaları: her nokta (W - u·r, v·r). Köşe kenar boyunca
// 1.52866483·r uzanır; diğer köşeler 90° döndürülerek elde edilir.
const CORNER_EXTENT = 1.52866483;
const CORNER = [
  ['C', [1.08849323, 0], [0.86840689, 0], [0.66993427, 0.065496]],
  ['L', [0.63149399, 0.074911]],
  ['C', [0.37282392, 0.16905899], [0.16906013, 0.37282401], [0.07491176, 0.63149399]],
  ['C', [0, 0.86840701], [0, 1.08849299], [0, CORNER_EXTENT]]
];

// w x h alanında, r köşe yarıçaplı Apple squircle path'i üretir.
function squirclePath(w, h, r) {
  const k = Math.min(r, Math.min(w, h) / 2 / CORNER_EXTENT);
  const n = v => +v.toFixed(3);
  // Saat yönünde köşeler: (u, v) köşe-yerel → mutlak koordinat
  const corners = [
    (u, v) => [w - u * k, v * k], // sağ-üst
    (u, v) => [w - v * k, h - u * k], // sağ-alt
    (u, v) => [u * k, h - v * k], // sol-alt
    (u, v) => [v * k, u * k] // sol-üst
  ];
  let d = `M${n(CORNER_EXTENT * k)} 0`;
  for (const at of corners) {
    d += `L${at(CORNER_EXTENT, 0).map(n).join(' ')}`;
    for (const [cmd, ...pts] of CORNER) d += cmd + pts.map(p => at(...p).map(n).join(' ')).join(' ');
  }
  return `${d}Z`;
}

// r = 26.1: macOS'un gerçek ikon maskesine (824 px gövde, 1024 tuval) en iyi oturan değer.
const SQUIRCLE = squirclePath(100, 100, 26.1);

const INK = '#101317';
const LIME = '#d0ff63';
const IVORY = '#fffdf8';

// İki hex rengi t oranında karıştırır (0 = a, 1 = b).
const mix = (a, b, t) => {
  const pa = a.match(/\w\w/g).map(h => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

// glyph: 48x48 alanında cam gövde (filtre tüm grubu tek cam kütlesi gibi işler).
// inset: camın içine oyulmuş koyu ayrıntılar (çubuklar, kum, satırlar).
// p = { c1, c2, deep } ürün renkleri.
export const ICONS = {
  SesVer: {
    colors: ['#ff5c86', '#ff8f1f'],
    glyph: () => (
      <path d="M18 4H30A15 15 0 0 1 30 34H22C18 37.5 13.5 41 9.8 42.6 9 43 8.4 42.4 8.9 41.7 10.8 39 12.4 36.4 13 33.2A15 15 0 0 1 18 4Z" />
    ),
    inset: () => (
      <>
        <rect x="9.1" y="15" width="4.2" height="8" rx="2.1" />
        <rect x="15.5" y="12" width="4.2" height="14" rx="2.1" />
        <rect x="21.9" y="10" width="4.2" height="18" rx="2.1" />
        <rect x="28.3" y="12" width="4.2" height="14" rx="2.1" />
        <rect x="34.7" y="15" width="4.2" height="8" rx="2.1" />
      </>
    )
  },
  WingWire: {
    colors: ['#5ad2ff', '#1f5cff'],
    glyph: p => (
      <>
        <path
          d="M7 40C11 35 15 34 19 36"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="0.1 4.6"
        />
        <path d="M43 6 5 20.5 20 25 26 43Z" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M43 6 20 25 26 43Z" fill={p.c2} fillOpacity="0.22" stroke={p.c2} strokeOpacity="0.22" strokeWidth="3.6" strokeLinejoin="round" />
      </>
    )
  },
  'Income vs Desires': {
    colors: ['#43e08c', '#0c9a6c'],
    glyph: () => (
      <>
        <circle cx="24" cy="8.5" r="3.6" />
        <rect x="22" y="9" width="4" height="31" rx="2" />
        <path d="M12 45C12 39.5 16.5 37 24 37S36 39.5 36 45Z" />
        <rect x="5" y="13.5" width="38" height="4.2" rx="2.1" />
        <path
          d="M8.5 16 3.5 29M8.5 16 13.5 29M39.5 16 34.5 29M39.5 16 44.5 29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M2 28.5H15A6.5 6.5 0 0 1 2 28.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M33 28.5H46A6.5 6.5 0 0 1 33 28.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </>
    )
  },
  tiTimer: {
    colors: ['#ffd64a', '#ff8a0a'],
    glyph: () => (
      <>
        <rect x="9" y="4" width="30" height="5.5" rx="2.75" />
        <rect x="9" y="38.5" width="30" height="5.5" rx="2.75" />
        <path
          d="M12.5 9.5H35.5C35.5 18 27 21 27 24S35.5 30 35.5 38.5H12.5C12.5 30 21 27 21 24S12.5 18 12.5 9.5Z"
          fillOpacity="0.78"
        />
      </>
    ),
    inset: () => (
      <>
        <path d="M16.5 13.5H31.5C30.5 17.5 26 19.5 24 22 22 19.5 17.5 17.5 16.5 13.5Z" />
        <path d="M15.5 36C16.5 31 21.5 29.5 24 27.5 26.5 29.5 31.5 31 32.5 36Z" />
        <rect x="23.1" y="22" width="1.8" height="7" rx="0.9" />
      </>
    )
  },
  Kitabe: {
    colors: ['#ebc47c', '#9a6428'],
    glyph: () => (
      <path d="M24 14C24 11 20 8 10 8 6 8 4 9.3 4 11.4V36.6C4 38.7 6 40 10 40 18 40 22 42 24 45 26 42 30 40 38 40 42 40 44 38.7 44 36.6V11.4C44 9.3 42 8 38 8 28 8 24 11 24 14Z" />
    ),
    inset: () => (
      <>
        <rect x="23.2" y="14.5" width="1.6" height="29" rx="0.8" opacity="0.7" />
        <g opacity="0.55">
          <rect x="9" y="16" width="11" height="2.2" rx="1.1" />
          <rect x="9" y="21.5" width="11" height="2.2" rx="1.1" />
          <rect x="9" y="27" width="11" height="2.2" rx="1.1" />
          <rect x="9" y="32.5" width="7" height="2.2" rx="1.1" />
          <rect x="28" y="16" width="11" height="2.2" rx="1.1" />
          <rect x="28" y="21.5" width="11" height="2.2" rx="1.1" />
          <rect x="28" y="27" width="11" height="2.2" rx="1.1" />
          <rect x="28" y="32.5" width="7" height="2.2" rx="1.1" />
        </g>
      </>
    )
  },
  'Pomodoro Restoran': {
    colors: ['#ff6b5c', '#d0262a'],
    glyph: () => (
      <>
        <ellipse cx="21" cy="29" rx="16" ry="14.5" />
        <path
          d="M37.5 27v7.5M41.5 26.5v8.5M45.5 27v7.5M37.5 35h8M41.5 35v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    inset: () => (
      <>
        <path d="M21 16.5C16.5 11.5 10.5 12 7.5 16.5 13.5 18.5 18 18 21 16.5Z" fill={LIME} />
        <path d="M21 16.5C25.5 11.5 31.5 12 34.5 16.5 28.5 18.5 24 18 21 16.5Z" fill={LIME} />
        <rect x="19.5" y="10.5" width="3" height="7.5" rx="1.5" fill={LIME} />
      </>
    )
  },
  'Duo for X': {
    colors: ['#c06bff', '#6236f0'],
    glyph: () => (
      <>
        <g opacity="0.6">
          <circle cx="15" cy="15" r="7.5" />
          <path d="M2.5 42C2.5 29 8 24 15 24S27.5 29 27.5 42Z" />
        </g>
        <circle cx="31" cy="17" r="8.5" />
        <path d="M16 45C16 31 22 26 31 26S46 31 46 45Z" />
      </>
    )
  },
  'Düşen Top': {
    // Nostaljik, siyah-beyaz dikenlerden kaçma oyunu: diğer ikonlar sıcak/doygun
    // renklerden kurulu — burada bilinçli olarak soğuk, metalik bir çift seçildi
    // (eski arcade kabini çeliği), sade top+diken siluetiyle eşleşsin diye.
    colors: ['#b7c3d6', '#333b4a'],
    glyph: () => (
      <>
        {/* tavandaki dikenler, aşağı sarkıyor */}
        <path d="M2 2H46V8L40 18 35 8 30 18 25 8 20 18 15 8 10 18 4 8V2Z" />
        {/* zeminden yukarı uzanan dikenler */}
        <path d="M2 46H46V40L40 30 35 40 30 30 25 40 20 30 15 40 10 30 4 40V46Z" />
        {/* aralarından düşen top */}
        <circle cx="24" cy="24" r="6" />
      </>
    ),
    inset: () => <circle cx="21.6" cy="21.6" r="2" />
  }
};

export default function AppIcon({ name, size = 88 }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const id = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const [c1, c2] = icon.colors;
  const deep = mix(c2, INK, 0.3);
  const p = { c1, c2, deep };
  const u = k => `url(#${k}-${id})`;

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
        <clipPath id={`sq-${id}`}>
          <path d={SQUIRCLE} />
        </clipPath>
        {/* Zemin: tek renk ailesi, altta Ink'e doğru derinleşir */}
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={mix(c1, IVORY, 0.1)} />
          <stop offset="0.66" stopColor={c2} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id={`halo-${id}`} cx="0.5" cy="0.48" r="0.42">
          <stop offset="0" stopColor={IVORY} stopOpacity="0.34" />
          <stop offset="1" stopColor={IVORY} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`sheen-${id}`} cx="0.4" cy="0" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
        {/* Cam gövde: üstte Ivory, altta ürün rengini emer */}
        <linearGradient id={`body-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="46">
          <stop offset="0" stopColor={IVORY} stopOpacity="0.98" />
          <stop offset="1" stopColor={mix(IVORY, c1, 0.42)} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`well-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="40">
          <stop offset="0" stopColor={mix(deep, INK, 0.3)} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.2 0 0 0 -0.08" />
        </filter>
        {/* Cam filtresi: yumuşak gölge + kabarık yüzey ışığı + altta renkli iç gölge + üstte ışık kenarı */}
        <filter
          id={`glass-${id}`}
          filterUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="68"
          height="72"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.7" result="b" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="sb" />
          <feOffset in="sb" dy="3" result="so" />
          <feFlood floodColor={deep} floodOpacity="0.55" />
          <feComposite in2="so" operator="in" result="shadow" />
          <feSpecularLighting
            in="b"
            surfaceScale="3.6"
            specularConstant="1.3"
            specularExponent="18"
            lightingColor="#fff"
            result="sp"
          >
            <feDistantLight azimuth="240" elevation="38" />
          </feSpecularLighting>
          <feComposite in="sp" in2="SourceAlpha" operator="in" result="spec" />
          <feOffset in="b" dy="-1.9" result="bu" />
          <feComposite in="SourceAlpha" in2="bu" operator="out" result="bottomEdge" />
          <feFlood floodColor={c2} floodOpacity="0.6" />
          <feComposite in2="bottomEdge" operator="in" result="bottomShade" />
          <feOffset in="b" dy="1.3" result="bd" />
          <feComposite in="SourceAlpha" in2="bd" operator="out" result="topEdge" />
          <feFlood floodColor="#fff" floodOpacity="0.95" />
          <feComposite in2="topEdge" operator="in" result="topLight" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="bottomShade" />
            <feMergeNode in="topLight" />
            <feMergeNode in="spec" />
          </feMerge>
        </filter>
        {/* Camın içine oyulmuş ayrıntı: üstte koyu, altta ışık */}
        <filter id={`inset-${id}`} filterUnits="userSpaceOnUse" x="-4" y="-4" width="56" height="56">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.7" result="b" />
          <feOffset in="b" dy="0.9" result="bd" />
          <feComposite in="SourceAlpha" in2="bd" operator="out" result="top" />
          <feFlood floodColor={INK} floodOpacity="0.55" />
          <feComposite in2="top" operator="in" result="topShade" />
          <feOffset in="b" dy="-0.9" result="bu" />
          <feComposite in="SourceAlpha" in2="bu" operator="out" result="bot" />
          <feFlood floodColor="#fff" floodOpacity="0.45" />
          <feComposite in2="bot" operator="in" result="botLight" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="topShade" />
            <feMergeNode in="botLight" />
          </feMerge>
        </filter>
      </defs>

      <g clipPath={u('sq')}>
        <rect width="100" height="100" fill={u('bg')} />
        <rect width="100" height="100" fill={u('halo')} />
        <rect width="100" height="100" filter={u('grain')} />
        <ellipse cx="44" cy="-4" rx="80" ry="44" fill={u('sheen')} />
        <path d={SQUIRCLE} fill="none" stroke={u('rim')} strokeWidth="2.2" />
      </g>

      {/* İmza kaldırıldı: sembol alanı (48x48 → 60x60) dikeyde ortalandı; cam gölgesi aşağı
          düştüğü için 2 birim yukarıda optik merkez */}
      <g transform="translate(20 18) scale(1.25)">
        <g filter={u('glass')} fill={u('body')} color={IVORY} stroke="none">
          {icon.glyph(p)}
        </g>
        {icon.inset && (
          <g filter={u('inset')} fill={u('well')}>
            {icon.inset(p)}
          </g>
        )}
      </g>
    </svg>
  );
}
