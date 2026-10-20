import { Suspense, lazy, useEffect, useState } from 'react';
import './App.css';
import { FEATURED, APPS, SERIES, TOOLS, INSPIRATION, LINKS, slugOf } from './data';
import AppPage from './AppPage';
import PrivacyPage from './PrivacyPage';
import TiTimerPage from './TiTimerPage';
import InstagramFeed from './InstagramFeed';
import { NavContext, Link } from './nav';
import { asset, stripBase } from './base';
import BorderGlow from './components/rb/BorderGlow/BorderGlow';
import AppIcon, { ICONS } from './AppIcon';
import FlexCarousel from './components/rb/FlexCarousel/FlexCarousel';
import PixelSnow from './components/rb/PixelSnow/PixelSnow';
import TechText from './components/rb/TechText/TechText';
import GradientASCII from './components/rb/GradientASCII/GradientASCII';
import GhostFibers from './components/rb/GhostFibers/GhostFibers';
import LetterGlitch from './components/rb/LetterGlitch/LetterGlitch';
import Lanyard from './components/rb/Lanyard/Lanyard';
import FadeContent from './components/rb/FadeContent/FadeContent';
import DriftWall from './components/rb/DriftWall/DriftWall';
import SiriOrb from './components/rb/SiriOrb/SiriOrb';

// Kendi tasarım dili olan uygulamalar genel AppPage yerine özel sayfayla açılır.
// Anahtar slugOf(ad); yol yine /uretiyorum/<slugOf(ad)>. WingWire ayrı parça olarak yüklenir.
const CUSTOM_PAGES = {
  titimer: TiTimerPage,
  wingwire: lazy(() => import('./wingwire/WingWirePage'))
};

// Özel sayfası olmayan uygulamalar aşamalarına göre şablon alır; beta/tanımsız → AppPage.
// Fikir panosu (Three.js buruşturma) ve geliştirme şablonu ayrı parça olarak yüklenir.
const STAGE_PAGES = {
  idea: lazy(() => import('./IdeaBoardPage')),
  dev: lazy(() => import('./DevStagePage'))
};

/* Kullanılan efektler (bölüm başına en fazla bir):
   ilk ekran: ziyaretçinin seçtiği zemin (Pixel Snow / Gradient ASCII / Ghost Fibers)
   uygulama kartları: BorderGlow · footer: FlexCarousel.
   Diğer bileşenler src/components/rb altında rafta bekliyor. */

const Glyph = ({ d, circles = [], size = 46 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {circles.map(([cx, cy, r]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
    ))}
    {d && <path d={d} />}
  </svg>
);

export const GLYPHS = {
  'Income vs Desires': { d: 'M13 8h22M13 40h22M16 8c0 9 8 12 8 16s-8 7-8 16M32 8c0 9-8 12-8 16s8 7 8 16' },
  tiTimer: { circles: [[24, 27, 14]], d: 'M24 27v-8M19 7h10M24 7v6' },
  Kitabe: { d: 'M12 40V23c0-8 6-13 12-17 6 4 12 9 12 17v17zM18 27h12M18 33h12' },
  'Pomodoro Restoran': { circles: [[24, 28, 13]], d: 'M24 15V9M24 15c-2-3-6-4-9-3M24 15c2-3 6-4 9-3' },
  'Duo for X': { circles: [[19, 24, 10], [29, 24, 10]] },
  SesVer: { d: 'M8 24v0M15 18v12M22 10v28M29 16v16M36 20v8M42 24v0' },
  WingWire: { d: 'M6 30c8-14 18-18 30-16M10 36c8-10 18-13 28-12M24 14l18-6M30 22l12-2' }
};


const PAGES = {
  '/uretiyorum': { title: 'Üretiyorum', lead: 'Uygulamalarımın mağazası.' },
  '/paylasiyorum': { title: 'Paylaşıyorum', lead: 'Sosyal medyada paylaştıklarım.' },
  '/anlatiyorum': { title: 'Anlatıyorum', lead: 'Yapay zekâ ve araçlar üzerine eğitici içerikler.' },
  '/oneriyorum': { title: 'Öneriyorum', lead: 'Kullandığım, ücretsiz veya açık kaynak araçlar.' }
};

// Google OAuth onay ekranı gibi dış servislerin gerektirdiği statik, bağımsız sayfa.
// Genel PageHead şablonunu kullanmaz; kendi başlığını PrivacyPage içinde çizer.
const STATIC_PAGES = {
  '/privacy': PrivacyPage
};

function usePath() {
  const [path, setPath] = useState(() => stripBase(window.location.pathname));
  useEffect(() => {
    const onPop = () => setPath(stripBase(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = to => {
    const [p, hash] = to.split('#');
    if (p && p !== stripBase(window.location.pathname)) {
      window.history.pushState({}, '', asset(to));
      setPath(p);
    }
    requestAnimationFrame(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView();
      else window.scrollTo(0, 0);
    });
  };
  return [path, navigate];
}


export default function App() {
  const [path, navigate] = usePath();
  const page = PAGES[path];
  const StaticPage = STATIC_PAGES[path];
  const appMatch = path.startsWith('/uretiyorum/')
    ? [...FEATURED, ...APPS].find(a => `/uretiyorum/${slugOf(a.name)}` === path)
    : null;
  return (
    <NavContext.Provider value={navigate}>
      <Header path={path} />
      <main>
        {StaticPage ? (
          <StaticPage />
        ) : appMatch ? (
          (() => {
            // Öncelik: özel sayfa → fikir panosu (idea) → geliştirme şablonu (dev) → genel AppPage.
            const Custom = CUSTOM_PAGES[slugOf(appMatch.name)];
            const Page = Custom || STAGE_PAGES[appMatch.stage];
            return Page ? (
              <Suspense fallback={<div style={{ minHeight: '100vh', background: Custom ? '#0b0f14' : undefined }} />}>
                <Page app={appMatch} />
              </Suspense>
            ) : (
              <AppPage app={appMatch} />
            );
          })()
        ) : page ? (
          <>
            <PageHead title={page.title} lead={page.lead} />
            {path === '/uretiyorum' && <Apps page />}
            {path === '/paylasiyorum' && <Share page />}
            {path === '/anlatiyorum' && <Teach page />}
            {path === '/oneriyorum' && <Tools />}
          </>
        ) : (
          <>
            <Breath />
            <Apps />
            <Share />
            <Teach />
          </>
        )}
      </main>
      <Footer />
    </NavContext.Provider>
  );
}

function PageHead({ title, lead }) {
  return (
    <section className="pagehead">
      <div className="wrap">
        <Link to="/" className="mono muted pagehead__back">
          ← ANA SAYFA
        </Link>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
    </section>
  );
}

const More = ({ to }) => (
  <Link to={to} className="more">
    Tümünü gör <span aria-hidden="true">→</span>
  </Link>
);

function Header({ path }) {
  const tabs = [
    ['/uretiyorum', 'Üretiyorum'],
    ['/paylasiyorum', 'Paylaşıyorum'],
    ['/anlatiyorum', 'Anlatıyorum'],
    ['/oneriyorum', 'Öneriyorum']
  ];
  // Ana sayfanın en üstünde bar şeffaf durur; efekt ekranın tepesine kadar uzanır. Kaydırınca bar belirir.
  const [clear, setClear] = useState(false);
  useEffect(() => {
    if (path !== '/') {
      setClear(false);
      return;
    }
    const onScroll = () => setClear(window.scrollY < window.innerHeight - 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [path]);

  // Dar ekranda yatay menü gizli; düğmeyle açılan panel aynı linkleri gösterir.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`topbar${clear && !open ? ' topbar--clear' : ''}${open ? ' topbar--open' : ''}`}>
      <div className="wrap topbar__row">
        <Link to="/" aria-label="hamaratlabs ana sayfa">
          <img src={asset('/brand/hamaratlabs-logo-main.svg')} alt="hamaratlabs" className="topbar__logo" />
        </Link>
        <button
          type="button"
          className="topbar__menu"
          aria-expanded={open}
          aria-controls="ana-menu"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setOpen(o => !o)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...ICON}>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <nav id="ana-menu" aria-label="Ana menü" className="topbar__nav" onClick={e => e.target.closest('a') && setOpen(false)}>
          {tabs.map(([to, label]) => (
            <Link key={to} to={to} aria-current={path === to || path.startsWith(`${to}/`) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
          <a href={LINKS.contact} target="_blank" rel="noopener noreferrer" className="topbar__contact">
            İletişim
          </a>
        </nav>
      </div>
    </header>
  );
}


// Sitenin ilk ekranı: neredeyse boş. Zemin efektini ziyaretçi seçebilir, seçim tarayıcıda hatırlanır.
const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const GROUNDS = [
  {
    id: 'snow',
    label: 'Kar',
    icon: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5" />
  },
  {
    id: 'ascii',
    label: 'ASCII',
    icon: <path d="M5 6h3M11 6h3M17 6h2M5 12h2M10 12h4M17 12h2M5 18h4M12 18h2M17 18h2" />
  },
  {
    id: 'fibers',
    label: 'Lifler',
    icon: <path d="M3 8c4-4 8 4 12 0s5-2 6-1M3 13c4-4 8 4 12 0s5-2 6-1M3 18c4-4 8 4 12 0s5-2 6-1" />
  },
  {
    id: 'glitch',
    label: 'Glitch',
    icon: <path d="M4 6h10M4 10h6M13 10h7M4 14h12M8 18h12" />
  }
];

const TINTS = [
  { id: 'green', label: 'Yeşil', color: '#7fae12' },
  { id: 'ink', label: 'Koyu', color: '#101317' },
  { id: 'grey', label: 'Gri', color: '#9aa0a6' },
  { id: 'amber', label: 'Turuncu', color: '#e8833a' }
];

const remember = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* depolama kapalıysa seçim yalnız bu ziyarette kalır */
  }
};

function Ground({ id, color }) {
  if (id === 'snow') return <PixelSnow color={color} lightMode density={0.32} speed={0.55} pixelSize={3} opacity={0.7} glow={0} />;
  if (id === 'ascii')
    return (
      <GradientASCII
        lightMode
        colors={['#fffdf8', '#f2efe6', color, '#101317']}
        shape="horizon"
        cellSize={16}
        glyphOpacity={0.4}
        gradientOpacity={0.45}
        flicker={0.12}
        fontFamily="'JetBrains Mono', monospace"
      />
    );
  if (id === 'fibers') return <GhostFibers lightMode glowColor={color} secondaryColor="#101317" speed={0.35} threads={56} vignette={0.2} />;
  // Açık zemin üstünde soluk harf ızgarası; parıltılar seçili tonla yanar.
  if (id === 'glitch')
    return <LetterGlitch background="#fffdf8" glitchColors={['#e7e2d6', '#d3cdbf', color]} glitchSpeed={70} flashChance={0.04} outerVignette={false} />;
  return null;
}

function Breath() {
  const [ground, setGround] = useState(() => {
    const g = remember('hl-ground', 'snow');
    return GROUNDS.some(x => x.id === g) ? g : 'snow';
  });
  const [tint, setTint] = useState(() => remember('hl-tint', 'green'));
  const color = (TINTS.find(t => t.id === tint) || TINTS[0]).color;
  const pick = id => {
    setGround(id);
    store('hl-ground', id);
  };
  const pickTint = id => {
    setTint(id);
    store('hl-tint', id);
  };

  return (
    <section className="breath" aria-label="Giriş">
      <div className="breath__bg" aria-hidden="true" key={`${ground}-${tint}`}>
        <Ground id={ground} color={color} />
      </div>
      <Lanyard
        className="breath__lanyard"
        image={asset('/brand/hamaratlabs-lockup-card.webp')}
        imageAlt="hamaratlabs kartı"
        color={tint === 'ink' || tint === 'grey' ? '#d0ff63' : color}
        cardWidth={232}
        cardHeight={268}
        ropeLength={0.17}
        minRope={90}
        maxRope={190}
      />
      <div className="grounds" role="group" aria-label="Zemini değiştir">
        {GROUNDS.map(g => (
          <button
            key={g.id}
            type="button"
            aria-pressed={ground === g.id}
            aria-label={g.label}
            title={g.label}
            style={ground === g.id ? { color } : undefined}
            onClick={() => pick(g.id)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...ICON}>
              {g.icon}
            </svg>
          </button>
        ))}
      </div>
      <div className="tints" role="group" aria-label="Rengi değiştir">
        {TINTS.map(t => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tint === t.id}
            aria-label={t.label}
            title={t.label}
            style={{ background: t.color }}
            onClick={() => pickTint(t.id)}
          />
        ))}
      </div>
      <div className="breath__foot">
        <p className="sr-only">Ürettiğim, anlattığım ve paylaştığım laboratuvarıma hoş geldin.</p>
        <div className="breath__tech" aria-hidden="true">
          <div className="breath__techline">
            <TechText
              text="Ürettiğim, anlattığım ve paylaştığım"
              fontFamily="'Geist', Arial, sans-serif"
              fontWeight={500}
              letterSpacing={-0.03}
              color="#101317"
              accentColor={color}
              align="center"
              intro="type"
              introDuration={1.6}
              sweep={false}
              reach={170}
              dashLength={3}
              dashGap={2}
              strokeWidth={1.2}
              specks={0}
              draggable={false}
              clickKick={false}
            />
          </div>
          <div className="breath__techline">
            <TechText
              text="laboratuvarıma hoş geldin."
              fontFamily="'Geist', Arial, sans-serif"
              fontWeight={500}
              letterSpacing={-0.03}
              color="#101317"
              accentColor={color}
              align="center"
              intro="type"
              introDuration={1.6}
              sweep={false}
              reach={170}
              dashLength={3}
              dashGap={2}
              strokeWidth={1.2}
              specks={0}
              draggable={false}
              clickKick={false}
            />
          </div>
        </div>
        <a href="#uretiyorum" className="breath__down" aria-label="Aşağı in">
          <svg viewBox="0 0 24 48" width="18" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="breath__down-line" d="M12 2v38" />
            <path d="M5 33l7 7 7-7" />
          </svg>
        </a>
      </div>
    </section>
  );
}

const STAGE = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında' };
const isPlaceholder = v => !v || v.startsWith('[');

// Uygulama kartı: tek sakin yüzey, büyük logo, kısa bilgi. Kenarında imleci izleyen ışık (Border Glow).
function AppCard({ app, big = false }) {
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  return (
    <BorderGlow
      className={`card${big ? ' card--big' : ''}`}
      backgroundColor="#f4f1e9"
      glowColor="78 100 69"
      colors={['#b6e04a', '#d0ff63', '#101317']}
      borderRadius={24}
      glowRadius={30}
      edgeSensitivity={26}
    >
      <Link to={`/uretiyorum/${slugOf(app.name)}`} className="card__body" aria-label={`${app.name} sayfası`}>
        <div className="card__logo">
          <AppIcon name={app.name} size={big ? 132 : 92} />
        </div>
        <div className="card__info">
          <span className={`card__stage card__stage--${app.stage}`}>{STAGE[app.stage]}</span>
          <h3>{app.name}</h3>
          {!isPlaceholder(app.lead) && <p>{app.lead}</p>}
          <div className="card__foot">
            {!isPlaceholder(app.platform) && <span className="card__platform">{app.platform}</span>}
            <span className={available ? 'card__get' : 'card__soon'}>{available ? (app.stage === 'beta' ? 'Açık betada →' : 'İndir →') : 'Yakında'}</span>
          </div>
        </div>
      </Link>
    </BorderGlow>
  );
}

function Apps({ page = false }) {
  const [filter, setFilter] = useState('all');
  const all = [...FEATURED, ...APPS];
  const count = st => all.filter(a => a.stage === st).length;
  const chips = [
    ['all', 'Tümü', all.length],
    ['dev', 'Geliştirmede', count('dev')],
    ['idea', 'Fikir', count('idea')],
    ['beta', 'Açık beta', count('beta')],
    ['live', 'Yayında', count('live')]
  ];
  const show = a => filter === 'all' || a.stage === filter;
  const featured = FEATURED.filter(show);
  const rest = APPS.filter(show);

  return (
    <section id="uretiyorum" className="wrap section">
      <div className="section__head">
        <FadeContent>
          {!page && <span className="mono muted">ÜRETİYORUM</span>}
          <h2>Uygulamalar</h2>
          <p className="muted">Geliştirdiğim bütün uygulamalar tek yerde.</p>
          {!page && <More to="/uretiyorum" />}
        </FadeContent>
        <div className="chips" role="group" aria-label="Aşamaya göre süz">
          {chips.map(([key, label, n]) => (
            <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="mono">{n}</span>
            </button>
          ))}
        </div>
      </div>

      {featured.length > 0 && (
        <div className="cards cards--big">
          {featured.map(app => (
            <AppCard key={app.name} app={app} big />
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="cards">
          {rest.map(app => (
            <AppCard key={app.name} app={app} />
          ))}
        </div>
      )}
      {featured.length + rest.length === 0 && (
        <div className="empty">Henüz yayında bir uygulama yok. Yayına çıkan ilk uygulama burada görünecek.</div>
      )}
    </section>
  );
}

// Öneriyorum: ücretsiz / açık kaynak üçüncü taraf araçlar (data.js → TOOLS, taslak liste).
// Üstte eğik düzlemde süzülen isim duvarı (DriftWall, dekoratif); asıl içerik altındaki kart ızgarası.
function Tools() {
  const tiles = TOOLS.map(t => (
    <span key={t.name} className="toolwall__tile">
      <strong>{t.name}</strong>
      <span className="mono">{t.license}</span>
    </span>
  ));
  return (
    <section className="wrap section tools">
      {/* Gölgeli kutucuklar DriftWall'un içinde; duvarın kendi kırpma kenarına iç boşluk bırakılır (bkz. .toolwall). */}
      <div className="toolwall" aria-hidden="true">
        <DriftWall columns={6} minColumnWidth={150} duration={46} gap={16} height="clamp(240px, 32vw, 340px)" pauseOnHover={false}>
          {tiles}
        </DriftWall>
      </div>
      <ul className="toolgrid">
        {TOOLS.map(t => (
          <li key={t.name}>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="tool">
              <span className="tool__meta mono">
                {t.category} · {t.license}
              </span>
              <strong className="tool__name">{t.name}</strong>
              <span className="tool__lead">{t.lead}</span>
              <span className="tool__go mono">
                {t.url.replace(/^https?:\/\/(www\.)?/, '')} <span aria-hidden="true">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Share({ page = false }) {
  return (
    <section id="paylasiyorum" className="wrap section">
      <div className="section__head">
        <FadeContent>
          {!page && <span className="mono muted">PAYLAŞIYORUM</span>}
          <h2>Sosyal medya</h2>
          <p className="muted">Instagram ve YouTube'da paylaştıklarım.</p>
          {!page && <More to="/paylasiyorum" />}
        </FadeContent>
        <div className="channels">
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className="channel">
            <strong>Instagram</strong>
            <span className="mono muted">{LINKS.instagramHandle}</span>
          </a>
          <span className="channel channel--off">
            <strong>YouTube</strong>
            <span className="mono muted">yakında</span>
          </span>
        </div>
      </div>
      <InstagramFeed />
    </section>
  );
}

function Teach({ page = false }) {
  return (
    <section id="anlatiyorum" className="series">
      <div className="wrap section">
        <div className="section__head">
          <FadeContent>
            {!page && <span className="mono muted">ANLATIYORUM</span>}
            <h2>Eğitici içerikler</h2>
            <p className="muted">Yapay zekâyı ve kullandığım araçları adım adım anlatıyorum.</p>
            {!page && <More to="/anlatiyorum" />}
          </FadeContent>
          <div className="series__ball">
            <SiriOrb src={asset('/audio/anlatiyorum-ses.mp3')} label="Sesi oynat" />
          </div>
        </div>
        <FadeContent as="ul" className="lessons" delay={120} offsetY={24}>
          {SERIES.map(item => (
            <li key={item.title}>
              <a href="#anlatiyorum" className="lesson">
                <span className="lesson__title">{item.title}</span>
                <span className="lesson__sub">{item.cover}</span>
                <span className="lesson__meta">{item.platform.replace(' + ', ' · ')}</span>
                <span className="lesson__arrow" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </FadeContent>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div id="ilham" className="footer__shelf">
        <div className="footer__carousel">
          <FlexCarousel items={INSPIRATION} autoplay interval={4} captureWheel={false} gap={16} radius={18} />
        </div>
      </div>
      <div className="wrap footer__row">
        <div className="footer__brand">
          <img src={asset('/brand/hamaratlabs-logo-main.svg')} alt="hamaratlabs" />
          <p>Üretiyorum. Paylaşıyorum. Anlatıyorum.</p>
        </div>
        <nav aria-label="Alt menü" className="footer__nav">
          <div>
            <span className="mono muted-dark">LAB</span>
            <Link to="/uretiyorum">Üretiyorum</Link>
            <Link to="/paylasiyorum">Paylaşıyorum</Link>
            <Link to="/anlatiyorum">Anlatıyorum</Link>
          </div>
          <div>
            <span className="mono muted-dark">TAKİP</span>
            <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={LINKS.contact} target="_blank" rel="noopener noreferrer">
              İletişim
            </a>
          </div>
        </nav>
      </div>
      <div className="wrap footer__bottom">
        <span>© 2026 hamaratlabs</span>
      </div>
    </footer>
  );
}
