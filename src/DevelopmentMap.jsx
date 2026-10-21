import { useEffect, useRef } from 'react';
import { FEATURED, APPS } from './data';
import './DevelopmentMap.css';

// Gelişim Haritası: her ürün bir metro hattı, zaman alttan üste akar.
// İstasyonlar ürün repolarının GERÇEK commit tarihlerinden alındı
// (git log --format="%ad" --date=short); docs(qa)/kanıt/rapor commit'leri elendi.
// Boş günler eksende sıkıştırılır (≈ işaretiyle gösterilir), sıra ve tarihler korunur.

const ORIGIN = '2026-09-26'; // 0: ilk ürünün (tiTimer) ilk commit'i
const TODAY = '2026-10-21'; // en son commit (WingWire v0.1.1)
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const dayOf = d => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${ORIGIN}T00:00:00Z`)) / 86400000);
const fmt = d => {
  const [, m, dd] = d.split('-');
  return `${Number(dd)} ${MONTHS[Number(m) - 1]}`;
};

const TYPES = [
  ['feature', 'Özellik'],
  ['major', 'Büyük özellik'],
  ['release', 'Sürüm / paket'],
  ['design', 'Tasarım / arayüz'],
  ['fix', 'Düzeltme'],
  ['idea', 'Fikir (henüz iş yok)']
];
const TYPE_LABEL = Object.fromEntries(TYPES);
const STAGE_LABEL = { idea: 'fikir', dev: 'geliştirmede', beta: 'açık beta', live: 'yayında' };

// s(tarih, hash, başlık, tür, şerit, ek) — şerit (lane) hattın 45° kırılması içindir.
const s = (date, hash, title, type, lane = 0, extra = {}) => ({ date, hash, title, type, lane, ...extra });

const LINES = [
  {
    name: 'Income vs Desires',
    fallback: ['#C2451F', '#962D12'],
    col: 290,
    stations: [
      s('2026-09-28', '040b69c', 'Eklenti + tanıtım sitesi', 'release'),
      s('2026-10-19', '9a39c98', 'Kur tazeleme hatası düzeltildi', 'fix', 1),
      s('2026-10-19', 'ef54c0e', 'Site GitHub Pages’e hazır', 'feature', 1),
      s('2026-10-20', '874bfd3', 'Alan adı + canonical/sitemap', 'feature', 0),
      s('2026-10-20', '7ddf013', 'Alan adı düzeltmesi: ivd', 'fix', 0),
      s('2026-10-20', '696a632', 'Geri al: github.io adresi', 'fix', 1)
    ]
  },
  {
    name: 'SesVer',
    fallback: ['#ff5c86', '#ff8f1f'],
    col: 530,
    stations: [
      s('2026-10-17', '5c3f010', 'Türkçe ses + klonlama arayüzü', 'major'),
      s('2026-10-17', '8b88131', 'Ad: SesKlon → SesVer', 'feature'),
      s('2026-10-17', 'fa8a833', 'Arayüz sıfırdan tasarlandı', 'design', 1),
      s('2026-10-17', '0b9fded', 'Ses Kütüphanesi + Tasarımcı', 'major', 1),
      s('2026-10-18', '057ab96', 'HamaratLabs marka imzası', 'design', 0, { slot: 1, hub: true }),
      s('2026-10-18', 'c74af0c', 'Yerel pencere (pywebview)', 'major', 0, { slot: 2 }),
      s('2026-10-18', '8761c05', 'macOS SesVer.app paketi', 'release', 1, { slot: 3 }),
      s('2026-10-19', 'aa3f673', 'Uygulama ikonu', 'design', 1),
      s('2026-10-19', 'd94d96b', 'Windows kurulum CI testi', 'feature', 0),
      s('2026-10-20', '92b869c', 'macOS açılış çökmesi giderildi', 'fix', 0)
    ]
  },
  {
    name: 'WingWire',
    fallback: ['#5A86FF', '#1F5CFF'],
    col: 770,
    stations: [
      s('2026-10-12', '6a1ae1d', 'Compose iskeleti + tema', 'major'),
      s('2026-10-12', 'f0c3b0e', 'Canlı akış motoru', 'major', 1),
      s('2026-10-14', '60362b9', 'Talk Mode: sesli görüşme', 'major', 1),
      s('2026-10-15', '872efeb', 'Gömülü Tailscale (tsnet)', 'major', 0),
      s('2026-10-16', '1c9153e', 'Tailscale güvenlik düzeltmesi', 'fix', 0),
      s('2026-10-16', '73872a1', 'Liquid-glass üst çubuk', 'design', 1),
      s('2026-10-17', 'c302405', 'Sohbette görsel ekleri', 'feature', 1),
      s('2026-10-18', '4f51417', 'Ad: Conduit → WingWire', 'feature', 0, { slot: 0 }),
      s('2026-10-18', '787a2c4', 'by HamaratLabs marka imzası', 'design', 0, { slot: 1, hub: true }),
      s('2026-10-20', 'f18a8cf', 'Kanban sekmesi (MVP)', 'major', 1),
      s('2026-10-21', '8e68cde', 'v0.1.0 ilk açık indirme', 'release', 1),
      s('2026-10-21', '22dd2da', 'v0.1.1 release varyantı', 'release', 0)
    ]
  }
];

// Fikir aşamasındaki ürünler: tek, soluk halka; hat çizilmez (sitedeki "fikir" rozetiyle tutarlı).
const IDEAS = [
  { name: 'tiTimer', date: '2026-09-26', hash: 'e8f981c', note: 'Repoda ilk kod bugün yazıldı; sitede hâlâ fikir aşamasında.' },
  { name: 'Kitabe', date: '2026-10-19', hash: 'e5e3a96', note: 'hamaratlabs.com ilk sürümünde listeye eklendi.' },
  { name: 'Pomodoro Restoran', date: '2026-10-19', hash: 'e5e3a96', note: 'hamaratlabs.com ilk sürümünde listeye eklendi.' },
  { name: 'Duo for X', date: '2026-10-19', hash: 'e5e3a96', note: 'hamaratlabs.com ilk sürümünde listeye eklendi.' }
];

const PRODUCTS = [...FEATURED, ...APPS];
const productOf = name => PRODUCTS.find(p => p.name === name) || {};
const colorsOf = line => {
  const hex = (productOf(line.name).visitAccent || '').match(/#[0-9a-f]{6}/gi);
  return hex && hex.length >= 2 ? hex.slice(0, 2) : line.fallback;
};

// ---------- Yerleşim (statik veri, modül düzeyinde bir kez hesaplanır) ----------
const W = 1000;
const AXIS_X = 92;
const IDEA_X = 136;
const LANE = 24;
const SLOT = 32;
const BAND_PAD = 14;
const GAP_SHORT = 14;
const GAP_LONG = 64;
const PAD_TOP = 96;
const PAD_BOTTOM = 52;
const CAP = 18;

const slotted = list => {
  const seen = {};
  return list.map(item => {
    const i = seen[item.date] ?? 0;
    seen[item.date] = i + 1;
    return { ...item, slot: item.slot ?? i };
  });
};

const lines = LINES.map(line => ({
  ...line,
  stage: productOf(line.name).stage || 'dev',
  colors: colorsOf(line),
  stations: slotted(line.stations)
}));
const ideas = slotted(IDEAS).map(idea => ({ ...idea, stage: productOf(idea.name).stage || 'idea' }));

const allPoints = [...lines.flatMap(l => l.stations), ...ideas];
const dates = [...new Set([ORIGIN, TODAY, ...allPoints.map(p => p.date)])].sort();
const bands = {};
const gaps = [];
let h = 0;
dates.forEach((d, i) => {
  if (i > 0) {
    const empty = dayOf(d) - dayOf(dates[i - 1]) - 1;
    if (empty > 2) {
      gaps.push({ at: h + GAP_LONG / 2, days: empty });
      h += GAP_LONG;
    } else if (empty > 0) {
      h += GAP_SHORT;
    }
  }
  const n = Math.max(1, ...allPoints.filter(p => p.date === d).map(p => p.slot + 1));
  bands[d] = { from: h, height: BAND_PAD + n * SLOT };
  h += bands[d].height;
});
const H = PAD_TOP + h + PAD_BOTTOM;
const yFromBottom = v => H - PAD_BOTTOM - v;
const yOf = p => yFromBottom(bands[p.date].from + BAND_PAD / 2 + (p.slot + 0.5) * SLOT);
const bandMid = d => yFromBottom(bands[d].from + bands[d].height / 2);

lines.forEach(line => {
  line.points = line.stations.map(st => ({ ...st, x: line.col + st.lane * LANE, y: yOf(st) }));
});
ideas.forEach(idea => {
  idea.x = IDEA_X;
  idea.y = yOf(idea);
});

const hubs = lines.flatMap(l => l.points.filter(p => p.hub)).sort((a, b) => a.x - b.x);
const hubLinks = hubs.slice(1).map((b, i) => [hubs[i], b]).filter(([a, b]) => a.date === b.date && a.y === b.y);

// Dikey + 45° segmentlerden oluşan köşeli hat (bezier yok).
function railPath(pts) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M${first.x} ${first.y + CAP} L${first.x} ${first.y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dy = a.y - b.y;
    const dx = b.x - a.x;
    const k = Math.min(Math.abs(dx), dy);
    const y1 = a.y - (dy - k) / 2;
    const x2 = a.x + Math.sign(dx) * k;
    d += ` L${a.x} ${y1} L${x2} ${y1 - k}`;
    if (x2 !== b.x) d += ` L${b.x} ${y1 - k}`;
    d += ` L${b.x} ${b.y}`;
  }
  return `${d} L${last.x} ${last.y - CAP}`;
}

const polygon = (x, y, n, r, inner = 0, rot = -Math.PI / 2) => {
  const pts = [];
  const steps = inner ? n * 2 : n;
  for (let i = 0; i < steps; i++) {
    const rr = inner && i % 2 ? inner : r;
    const a = rot + (i * 2 * Math.PI) / steps;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

function Shape({ type, x, y, color, hub = false }) {
  const common = { fill: 'var(--ivory)', stroke: color, strokeWidth: 3, strokeLinejoin: 'round' };
  if (hub) {
    return (
      <g>
        <circle cx={x} cy={y} r={11.5} fill="var(--ivory)" stroke="var(--ink)" strokeWidth={3.5} />
        <circle cx={x} cy={y} r={5} fill="var(--ivory)" stroke={color} strokeWidth={3} />
      </g>
    );
  }
  switch (type) {
    case 'major':
      return <rect x={x - 7} y={y - 7} width={14} height={14} {...common} />;
    case 'fix':
      return <polygon points={polygon(x, y + 1.5, 3, 9)} {...common} />;
    case 'release':
      return <polygon points={polygon(x, y + 0.5, 5, 10, 4.4)} {...common} />;
    case 'design':
      return <polygon points={polygon(x, y + 0.5, 5, 8.5)} {...common} />;
    case 'idea':
      return <circle cx={x} cy={y} r={6.5} {...common} stroke="#aaa597" strokeWidth={2.5} strokeDasharray="3 2.6" />;
    default:
      return <circle cx={x} cy={y} r={6.5} {...common} />;
  }
}

const LegendShape = props => (
  <svg className="dm-legend__ico" viewBox="0 0 28 28" aria-hidden="true">
    <Shape x={14} y={14} color="var(--ink)" {...props} />
  </svg>
);

export default function DevelopmentMap() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return undefined;
    el.classList.add('dm--armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('dm--in');
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const top = yFromBottom(h);
  const bottom = yFromBottom(0);

  return (
    <div className="dm" id="gelisim-haritasi" ref={ref}>
      <div className="dm__head">
        <span className="mono muted">GELİŞİM HARİTASI</span>
        <h3>Her ürün bir hat</h3>
        <p className="muted">
          26 Eylül 2026’daki ilk koddan bugüne. Zaman alttan üste akar; istasyonlar repolardaki gerçek commit tarihleri.
          Boş günler sıkıştırıldı.
        </p>
      </div>

      <div className="dm__grid">
        <div className="dm__scroll" tabIndex={0} aria-label="Gelişim haritası, yana kaydırılabilir">
          <svg className="dm__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="dm-title">
            <title id="dm-title">Ürünlerin 26 Eylül 2026’dan bugüne gelişim haritası</title>
            <defs>
              {lines.map((line, i) => (
                <linearGradient
                  key={line.name}
                  id={`dm-g-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={line.points[0].y}
                  x2="0"
                  y2={line.points[line.points.length - 1].y}
                >
                  <stop offset="0" stopColor={line.colors[0]} />
                  <stop offset="1" stopColor={line.colors[1]} />
                </linearGradient>
              ))}
            </defs>

            {/* Zaman ekseni */}
            <g className="dm-axis">
              {dates.map(d => (
                <line key={`g-${d}`} className="dm-axis__grid" x1={AXIS_X} x2={W - 12} y1={bandMid(d)} y2={bandMid(d)} />
              ))}
              <line className="dm-axis__line" x1={AXIS_X} x2={AXIS_X} y1={bottom + 10} y2={top - 30} />
              <polygon className="dm-axis__arrow" points={`${AXIS_X - 5},${top - 26} ${AXIS_X + 5},${top - 26} ${AXIS_X},${top - 36}`} />
              {dates.map(d => {
                const n = dayOf(d);
                const y = bandMid(d);
                return (
                  <g key={`t-${d}`}>
                    <line className="dm-axis__tick" x1={AXIS_X - 4} x2={AXIS_X + 4} y1={y} y2={y} />
                    <text className="dm-axis__date" x={AXIS_X - 10} y={y - 1} textAnchor="end">
                      {fmt(d)}
                    </text>
                    <text className="dm-axis__day" x={AXIS_X - 10} y={y + 12} textAnchor="end">
                      {n === 0 ? '0' : d === TODAY ? `bugün · ${n}` : `+${n}`}
                    </text>
                  </g>
                );
              })}
              {gaps.map(g => {
                const y = yFromBottom(g.at);
                return (
                  <g key={`gap-${g.at}`} className="dm-axis__gap">
                    <rect x={AXIS_X - 7} y={y - 6} width={14} height={12} fill="var(--paper)" />
                    <line x1={AXIS_X - 7} y1={y - 1} x2={AXIS_X + 7} y2={y - 6} />
                    <line x1={AXIS_X - 7} y1={y + 6} x2={AXIS_X + 7} y2={y + 1} />
                    <text x={AXIS_X - 12} y={y + 4} textAnchor="end">
                      ≈ {g.days} gün
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Ortak marka olayı: aynı gün iki hatta — aktarma bağlantısı */}
            {hubLinks.map(([a, b]) => (
              <line key={`${a.hash}-${b.hash}`} className="dm-transfer" x1={a.x + 12} y1={a.y} x2={b.x - 12} y2={b.y} />
            ))}

            {/* Hatlar */}
            {lines.map((line, i) => {
              const pts = line.points;
              const first = pts[0];
              const last = pts[pts.length - 1];
              const pillW = line.name.length * 7.6 + 24;
              return (
                <g
                  key={line.name}
                  className={`dm-line dm-line--${line.stage}`}
                  style={{ '--d': `${i * 0.25}s` }}
                >
                  <path
                    className="dm-rail"
                    d={railPath(pts)}
                    pathLength={1}
                    stroke={`url(#dm-g-${i})`}
                  />
                  <line className="dm-cap" x1={first.x - 9} x2={first.x + 9} y1={first.y + CAP} y2={first.y + CAP} stroke={line.colors[0]} />
                  <line className="dm-cap" x1={last.x - 9} x2={last.x + 9} y1={last.y - CAP} y2={last.y - CAP} stroke={line.colors[1]} />
                  <g className="dm-pill">
                    <rect x={last.x - pillW / 2} y={last.y - CAP - 34} width={pillW} height={24} rx={12} fill={line.colors[1]} />
                    <text x={last.x} y={last.y - CAP - 17.5} textAnchor="middle">
                      {line.name}
                    </text>
                  </g>
                  {pts.map((p, j) => (
                    <g key={p.hash} className="dm-stop" style={{ '--i': j }}>
                      <title>{`${fmt(p.date)} 2026 · ${line.name} · ${TYPE_LABEL[p.type]}${p.hub ? ' · ortak marka olayı' : ''}\n${p.hash} — ${p.title}`}</title>
                      <Shape type={p.type} x={p.x} y={p.y} color={line.colors[1]} hub={p.hub} />
                      <text className="dm-label" x={p.x + (p.hub ? 19 : 15)} y={p.y + 4.5}>
                        {p.title}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Fikirler: tek soluk halka, hat yok */}
            <g className="dm-ideas">
              {ideas.map(idea => (
                <g key={idea.name} className="dm-stop dm-stop--idea" style={{ '--i': 0 }}>
                  <title>{`${fmt(idea.date)} 2026 · ${idea.name} · fikir\n${idea.note}`}</title>
                  <Shape type="idea" x={idea.x} y={idea.y} />
                  <text className="dm-label dm-label--idea" x={idea.x + 14} y={idea.y + 4.5}>
                    {idea.name}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        <aside className="dm-legend" aria-label="Harita açıklaması">
          <div className="dm-legend__group">
            <h4 className="mono">Hatlar</h4>
            <ul className="dm-legend__lines">
              {lines.map(line => (
                <li key={line.name}>
                  <span className="dm-legend__dot" style={{ background: `linear-gradient(135deg, ${line.colors[0]}, ${line.colors[1]})` }} />
                  <span>
                    {line.name} <span className="muted">· {STAGE_LABEL[line.stage] || line.stage}</span>
                  </span>
                </li>
              ))}
              {ideas.map(idea => (
                <li key={idea.name} className="is-idea">
                  <span className="dm-legend__dot dm-legend__dot--idea" />
                  <span>
                    {idea.name} <span className="muted">· {STAGE_LABEL[idea.stage] || idea.stage}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="dm-legend__group">
            <h4 className="mono">İstasyonlar</h4>
            <ul className="dm-legend__shapes">
              {TYPES.map(([type, label]) => (
                <li key={type}>
                  <LegendShape type={type} />
                  <span>{label}</span>
                </li>
              ))}
              <li>
                <LegendShape hub />
                <span>Ortak marka olayı (aynı gün, iki hat)</span>
              </li>
            </ul>
          </div>
          <div className="dm-legend__group dm-legend__notes">
            <h4 className="mono">Okuma</h4>
            <p>Canlı renk: geliştirmede / açık beta. Soluk gri halka: fikir, henüz çizilecek hat yok.</p>
            <p>Alttan üste zaman · 0 = 26 Eyl 2026. ≈ boş günler sıkıştırıldı.</p>
          </div>
        </aside>
      </div>

      <p className="dm__hint mono muted" aria-hidden="true">← haritayı yana kaydır →</p>

      <ol className="dm-sr">
        {lines.map(line => (
          <li key={line.name}>
            {line.name} ({STAGE_LABEL[line.stage] || line.stage}):{' '}
            {line.stations.map(st => `${fmt(st.date)} ${st.title} (${TYPE_LABEL[st.type]})`).join('; ')}.
          </li>
        ))}
        {ideas.map(idea => (
          <li key={idea.name}>
            {idea.name}: fikir aşamasında, {fmt(idea.date)}. {idea.note}
          </li>
        ))}
      </ol>
    </div>
  );
}
