import { useEffect, useState } from 'react';
import AppIcon from './AppIcon';
import { Link } from './nav';
import Comments from './Comments';
import './TiTimerPage.css';

// tiTimer'ın kendi tanıtım sayfası. Metinler src/data.js'teki kayıttan gelir;
// sunum tiTimer'ın Figma'daki diline dayanır (TITIMER_FIGMA_TOKENS.md):
// beyaz zeminde teal halka, coral vurgu, odak modunda tamamen siyah ekran.

const STAGE = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında' };
const isPlaceholder = v => !v || v.startsWith('[');

// Figma aileleri → Google Fonts karşılıkları:
// Monoton, Scheherazade New birebir; Kdam Thmor → Kdam Thmor Pro; Yuanti SC → Zen Maru Gothic (yuvarlak uçlu sans).
const FONTS =
  'https://fonts.googleapis.com/css2?family=Kdam+Thmor+Pro&family=Monoton&family=Scheherazade+New:wght@400;700&family=Zen+Maru+Gothic:wght@500;700&display=swap';

// Fontlar yalnız bu sayfada gerekiyor; genel index.html'e dokunmamak için burada yüklenir.
function useTiFonts() {
  useEffect(() => {
    if (document.getElementById('tt-fonts')) return;
    const link = document.createElement('link');
    link.id = 'tt-fonts';
    link.rel = 'stylesheet';
    link.href = FONTS;
    document.head.appendChild(link);
  }, []);
}

// Sayfa açıldığından beri geçen saniye. Hareket azaltma tercihinde sabit kalır.
function useTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setT(v => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const pad = n => String(n).padStart(2, '0');

// Kategori halkası (Figma: TimerNew). Kalın teal dış çember, içinde ince doluluk yayı
// ve doluluğu gösteren ibre. `fill` 0–1 arası.
function Ring({ fill = 0, size = 76, tone = 'teal', double = false }) {
  const c = size / 2;
  const outer = c - 3;
  const inner = outer - 7;
  const len = 2 * Math.PI * inner;
  const a = fill * 2 * Math.PI - Math.PI / 2;
  const hand = inner - 9;
  return (
    <svg className={`tt-ring tt-ring--${tone}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="tt-ring__outer" cx={c} cy={c} r={outer} />
      <circle className="tt-ring__track" cx={c} cy={c} r={inner} />
      <circle
        className="tt-ring__arc"
        cx={c}
        cy={c}
        r={inner}
        strokeDasharray={`${(double ? 1 : fill) * len} ${len}`}
        transform={`rotate(-90 ${c} ${c})`}
      />
      <line
        className="tt-ring__hand"
        x1={c + Math.cos(a) * 4}
        y1={c + Math.sin(a) * 4}
        x2={c + Math.cos(a) * hand}
        y2={c + Math.sin(a) * hand}
      />
    </svg>
  );
}

function AddRing({ size = 76 }) {
  const c = size / 2;
  return (
    <svg className="tt-ring tt-ring--add" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="tt-ring__outer" cx={c} cy={c} r={c - 3} />
      <path className="tt-ring__plus" d={`M${c - 9} ${c}H${c + 9}M${c} ${c - 9}V${c + 9}`} />
    </svg>
  );
}

const CATEGORIES = [
  { name: 'Reading', base: 0.62 },
  { name: 'Math.', base: 0.08 },
  { name: 'Sport', base: 0.5 },
  { name: 'Flutter', base: 0.98, double: true }
];

function StatusBar({ dark }) {
  return (
    <div className={`tt-status${dark ? ' is-dark' : ''}`} aria-hidden="true">
      <span>8:00</span>
      <span className="tt-status__icons">
        <i />
        <i />
        <b />
      </span>
    </div>
  );
}

// Ana ekran: teal alıntı bandı, 2×2 (+1) halka sayaçlar, yarı saydam teal alt bar.
function HomeScreen({ t }) {
  return (
    <div className="tt-phone tt-phone--home" role="img" aria-label="tiTimer ana ekranı: alıntı bandı, kategori halkaları ve Pomodoro çubuğu">
      <StatusBar />
      <div className="tt-banner">
        <p>
          “Zamanı birçok yolla <em>öldürebilirsin</em>, fakat bu her zaman <em>savaştığın</em> zamana bağlı…”
        </p>
        <span className="tt-banner__author">Martin Amis</span>
      </div>
      <ul className="tt-grid">
        {CATEGORIES.map(c => (
          <li key={c.name}>
            <Ring fill={c.double ? 1 : (c.base + t / 600) % 1} double={c.double} />
            <span className="tt-label">{c.name}</span>
          </li>
        ))}
        <li>
          <AddRing />
          <span className="tt-label">Add</span>
        </li>
      </ul>
      <div className="tt-bar">
        <span className="tt-bar__btn tt-bar__btn--add">+</span>
        <span className="tt-bar__btn">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 5h4M3 8h10M3 11h7" />
          </svg>
        </span>
        <span className="tt-bar__btn tt-bar__pomo">
          Pomo
          <br />
          doro
        </span>
        <span className="tt-bar__btn">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path className="is-fill" d="M8 2.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8L8 11l-3.4 1.9.7-3.8L2.5 6.5l3.8-.5z" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// Odak (Pomodoro) ekranı: tamamen siyah zemin, büyük beyaz halka, soluk bitiş saati.
const WORK = 25 * 60;

function useEnd(remaining) {
  const [now] = useState(() => new Date());
  const end = new Date(now.getTime() + remaining * 1000);
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function FocusScreen({ t, framed = true }) {
  const start = 13 * 60 + 20;
  const remaining = Math.max(start - t, 0);
  const end = useEnd(start);
  const size = 196;
  const c = size / 2;
  const r = c - 10;
  const len = 2 * Math.PI * r;
  const done = 1 - remaining / WORK;
  return (
    <div
      className={`tt-phone tt-phone--focus${framed ? '' : ' is-bare'}`}
      role="img"
      aria-label={`Odak modu: ${Math.ceil(remaining / 60)} dakika kaldı, bitiş ${end}`}
    >
      {framed && <StatusBar dark />}
      <p className="tt-idiom">Lost time is never found again.</p>
      <div className="tt-focus__ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className="tt-focus__track" cx={c} cy={c} r={r} />
          <circle
            className="tt-focus__arc"
            cx={c}
            cy={c}
            r={r}
            strokeDasharray={`${(1 - done) * len} ${len}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
        </svg>
        <span className="tt-focus__nums">
          <span className="tt-focus__num">{Math.floor(remaining / 60)}</span>
          <span className="tt-focus__sub">{pad(remaining % 60)}</span>
        </span>
      </div>
      <span className="tt-label tt-label--light">Math.</span>
      <p className="tt-focus__end">End : {end}</p>
    </div>
  );
}

export default function TiTimerPage({ app }) {
  useTiFonts();
  const t = useTick();
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  const points = (app.points || []).filter(p => !isPlaceholder(p));
  // Figma TimerNew'in üç doluluk durumu: 0, 50, 66.
  const states = [0, 0.5, 0.66];
  return (
    <article className="tt">
      <section className="tt-stage">
        <div className="wrap">
          <Link to="/uretiyorum" className="tt-back">
            ← Uygulamalar
          </Link>

          <div className="tt-sheet tt-hero">
            <div className="tt-hero__intro">
              <span className={`tt-pill tt-pill--${app.stage}`}>{STAGE[app.stage]}</span>
              <div className="tt-hero__name">
                <AppIcon name={app.name} size={64} />
                <h1>{app.name}</h1>
              </div>
              <blockquote className="tt-quote">
                <p>
                  “It’s <em>not enough</em> to be busy, so are the ants. The question is, what are we busy <em>about</em>?”
                </p>
                <cite>Henry David Thoreau</cite>
              </blockquote>
              {!isPlaceholder(app.short) && <p className="tt-hero__short">{app.short}</p>}
              {!isPlaceholder(app.lead) && <p className="tt-hero__lead">{app.lead}</p>}
              <div className="tt-hero__actions">
                {available ? (
                  <a className="tt-btn" href={app.download} target="_blank" rel="noopener noreferrer">
                    {app.downloadLabel || 'İndir'}
                  </a>
                ) : (
                  <span className="tt-btn is-off">Yakında</span>
                )}
                {!isPlaceholder(app.platform) && <span className="tt-hero__platform">{app.platform}</span>}
              </div>
            </div>
            <div className="tt-hero__device">
              <HomeScreen t={t} />
            </div>
          </div>

          <section className="tt-focus" aria-label="Odak modu">
            <div className="tt-focus__copy">
              <span className="tt-focus__kicker">Odak modu</span>
              <h2>Sayaç başlayınca ekran kararır.</h2>
              <p>
                Pomodoro açıldığında beyaz ana ekran çekilir; geriye siyah zemin, tek bir halka ve bitiş saati kalır.
              </p>
            </div>
            <FocusScreen t={t} framed={false} />
          </section>

          {points.length > 0 && (
            <section className="tt-sheet tt-points" aria-label="Neler yapar">
              <h2 className="tt-points__title">Neler yapar</h2>
              <ol className="tt-points__list">
                {points.map((p, i) => (
                  <li key={p} className="tt-point">
                    <Ring fill={states[i % states.length]} size={64} />
                    <span className="tt-point__num">{pad(i + 1)}</span>
                    <p className="tt-point__text">{p}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </section>

      <Comments term={app.name} />
    </article>
  );
}
