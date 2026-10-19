import { useEffect, useState } from 'react';
import AppIcon from './AppIcon';
import { Link } from './nav';
import Comments from './Comments';
import './TiTimerPage.css';

// tiTimer'ın kendi tanıtım sayfası. Metinler src/data.js'teki kayıttan gelir;
// burada yalnız sunum var: hamaratlabs'ın koyu zemini üstünde tiTimer'ın kağıt/teal/mercan dili.

const STAGE = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında' };
const isPlaceholder = v => !v || v.startsWith('[');
const FONTS = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap';

// Kalam + Nunito yalnız bu sayfada gerekiyor; genel index.html'e dokunmamak için burada yüklenir.
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
const fmt = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};

// Örnek görünüm verisi (yalnız çizim için; ürün iddiası değil).
const TIMERS = [
  { label: 'Odak', tone: 'teal', base: 25 * 60 + 12, running: true },
  { label: 'Okuma', tone: 'coral', base: 47 * 60 + 3, running: true },
  { label: 'Mola', tone: 'sand', base: 8 * 60 + 40, running: false }
];
const COUNT_FROM = 25 * 60;
const COUNT_START = 18 * 60 + 42;
const WEEK = [
  ['Pt', 0.55],
  ['Sa', 0.8],
  ['Ça', 0.4],
  ['Pe', 0.95],
  ['Cu', 0.62],
  ['Ct', 0.3],
  ['Pz', 0.18]
];

function Ring({ remaining, size = 132, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, remaining) / COUNT_FROM;
  return (
    <svg className="tt-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="tt-ring__track" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="tt-ring__fill"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function TimerList({ t }) {
  return (
    <ul className="tt-timers">
      {TIMERS.map(x => (
        <li key={x.label} className={`tt-timer tt-timer--${x.tone}${x.running ? ' is-on' : ''}`}>
          <span className="tt-timer__dot" />
          <span className="tt-timer__label">{x.label}</span>
          <span className="tt-timer__time">{fmt(x.base + (x.running ? t : 0))}</span>
        </li>
      ))}
    </ul>
  );
}

function Week() {
  return (
    <div className="tt-week" aria-hidden="true">
      {WEEK.map(([d, v], i) => (
        <div key={d} className={`tt-week__col${i === 3 ? ' is-today' : ''}`}>
          <span className="tt-week__bar" style={{ '--h': v }} />
          <span className="tt-week__day">{d}</span>
        </div>
      ))}
    </div>
  );
}

// Telefon çerçevesi: gerçek ekranlardan esinlenen ama birebir olmayan bir kompozisyon.
function Phone({ t }) {
  const remaining = Math.max(0, COUNT_START - t);
  return (
    <div className="tt-phone" role="img" aria-label="tiTimer ekran taslağı: çalışan sayaçlar ve ters sayaç">
      <div className="tt-phone__screen">
        <div className="tt-phone__notch" />
        <div className="tt-app__bar">
          <span className="tt-app__title">tiTimer</span>
          <span className="tt-app__chip">bugün</span>
        </div>
        <div className="tt-focus">
          <div className="tt-focus__ring">
            <Ring remaining={remaining} />
            <div className="tt-focus__center">
              <span className="tt-focus__time">{fmt(remaining)}</span>
              <span className="tt-focus__cap">ters sayaç</span>
            </div>
          </div>
        </div>
        <TimerList t={t} />
        <div className="tt-app__week">
          <span className="tt-app__weekcap">bu hafta</span>
          <Week />
        </div>
      </div>
    </div>
  );
}

// Her özelliğe kendi küçük sahnesi; metin data.js'ten sırayla gelir.
const SCENES = [
  t => <TimerList t={t} />,
  t => {
    const remaining = Math.max(0, COUNT_START - t);
    return (
      <div className="tt-scene-ring">
        <Ring remaining={remaining} size={148} stroke={12} />
        <span className="tt-focus__time">{fmt(remaining)}</span>
      </div>
    );
  },
  () => <Week />
];

export default function TiTimerPage({ app }) {
  useTiFonts();
  const t = useTick();
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  const points = (app.points || []).filter(p => !isPlaceholder(p));
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
              <Phone t={t} />
            </div>
          </div>

          {points.length > 0 && (
            <section className="tt-sheet tt-notes" aria-label="Neler yapar">
              <h2 className="tt-notes__title">Neler yapar</h2>
              <ol className="tt-notes__list">
                {points.map((p, i) => (
                  <li key={p} className="tt-note">
                    <span className="tt-note__num">{pad(i + 1)}</span>
                    <p className="tt-note__text">{p}</p>
                    {SCENES[i] && <div className="tt-note__scene" aria-hidden="true">{SCENES[i](t)}</div>}
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
