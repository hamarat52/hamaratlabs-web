import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import AppIcon from '../AppIcon';
import { asset } from '../base';
import CrystalizedBall from '../components/rb/CrystalizedBall/CrystalizedBall';
import { FEATURED } from '../data';
import { Link } from '../nav';
import './fonts.css';
import './WingWireSite.css';

// Android APK sürümü: public/downloads/'a bırakılan dosyayla senkron tutulmalı (bkz. README.md
// o klasörde). iOS henüz yok; yalnız Android için gerçek indirme linki.
const APK_VERSION = '0.1.1';
const APK_URL = asset(`/downloads/wingwire-${APK_VERSION}.apk`);

// WingWire'ın kendi sitesi: hamaratlabs.com/wingwire (paylaşılan topbar/footer YOK, App.jsx STATIC_PAGES).
// Ürün metni ana sitenin data.js'teki WingWire kaydından okunur (tek kaynak).
// Dil: Android uygulamasıyla aynı — InkNavy zemin, mavi marka aksanı, cyan yalnız "bağlantı canlı".
// Ürünün söylediği Plus Jakarta Sans, sistemin gösterdiği JetBrains Mono, wordmark Sora.
//
// Kurgu (Apple ürün sayfası gibi tek bir kaydırma anlatısı):
//   Hero → Neden → Neler yapar → Nasıl çalışır → İndir
// Kırmızı küre tek bir "sahne" katmanında (sticky) yaşar; konumu/ölçeği bölümlerin kaydırma
// ilerlemesinden türetilir. Değerler React state'e yazılmaz: yalnız MotionValue → transform/opacity.
// Hareket azaltma açıksa (prefers-reduced-motion) sahne kapanır, sayfa düz akışa döner (.is-still).

// Lint (no-unused-vars) JSX üye ifadesini (motion.div) görmüyor; repo deseni: sabit takma ad.
const MotionDiv = motion.div;
const MotionSvg = motion.svg;
const MotionCircle = motion.circle;
const MotionPath = motion.path;
const MotionP = motion.p;
const MotionLi = motion.li;
const MotionHeader = motion.header;

// Kaydırmaya bağlı opaklık: Motion bunu native ScrollTimeline/WAAPI animasyonuna çevirir. Anahtar
// kareler 0 ve 1 ofsetinde değilse WAAPI uçlara örtük kare ekler ve onları alttaki inline değerle
// (ör. opacity:0) doldurur; aralık bitince değer geri söner. Uçları açıkça sabitle.
const span01 = (input, output) => {
  const i = [...input];
  const o = [...output];
  if (i[0] > 0) (i.unshift(0), o.unshift(o[0]));
  if (i[i.length - 1] < 1) (i.push(1), o.push(o[o.length - 1]));
  return [i, o];
};
const useScrollOpacity = (p, input, output) => useTransform(p, ...span01(input, output));

const APP = FEATURED.find(a => a.name === 'WingWire');

const STAGE = { beta: 'açık beta', dev: 'geliştirmede', idea: 'fikir', live: 'yayında' };

// Her özelliğin yanında, sistemin dilinden kısa bir etiket (süs; ürün metni data.js'te).
const TAGS = ['chat.stream', 'session.resume', 'approval.request', 'call.incoming'];

const pad = n => String(n).padStart(2, '0');

const TITLE = 'WingWire — kendi ajanına Android\'den bağlan';
const BG = '#0b0f14';

// Ağır, kontrollü yay: kaydırma girdisini yumuşatır, ani sıçrama yerine süzülür.
const SPRING = { stiffness: 70, damping: 24, mass: 0.9 };
const SOFT = { stiffness: 90, damping: 26, mass: 0.7 };

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), o: lerp(a.o, b.o, t), g: lerp(a.g, b.g, t) });

// Kürenin her bölümdeki durağı. x/y piksel (viewport'tan), s ölçek, o opaklık, g kırmızı ışıma.
function orbStops() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const narrow = w < 720;
  const vw = w / 100;
  const vh = h / 100;
  return narrow
    ? [
        { x: 0, y: 0, s: 1.3, o: 1, g: 0.55 }, // hero: ekranı dolduruyor
        { x: 0, y: -21 * vh, s: 0.55, o: 1, g: 0.3 }, // kenara (dar ekranda yukarı) çekiliyor
        { x: 0, y: 0, s: 0.9, o: 0.12, g: 0.08 }, // özellikler: arkada sönük ışık
        { x: 0, y: 0, s: 0.3, o: 1, g: 0.35 }, // mimari: merkez
        { x: 0, y: -15 * vh, s: 0.85, o: 1, g: 1 } // indir: yeniden büyüyor
      ]
    : [
        { x: 0, y: 0, s: 1, o: 1, g: 0.55 },
        { x: 24 * vw, y: 2 * vh, s: 0.56, o: 1, g: 0.3 },
        { x: 0, y: 0, s: 0.9, o: 0.12, g: 0.08 },
        { x: 0, y: 0, s: 0.3, o: 1, g: 0.35 },
        { x: 0, y: -11 * vh, s: 0.56, o: 1, g: 1 }
      ];
}

// Bölüm ilerlemeleri sırayla birbirine bağlanır; her geçişin bitişi bir sonrakinin başlangıcıdır.
function orbAt([hero, prob, featIn, archIn, ctaIn]) {
  const [s0, s1, s2, s3, s4] = orbStops();
  const f = smooth(clamp01(featIn));
  let o = mix(s0, s1, smooth(clamp01((hero - 0.05) / 0.6)));
  o = mix(o, s2, f);
  o = mix(o, s3, smooth(clamp01(archIn)));
  o = mix(o, s4, smooth(clamp01(ctaIn)));
  // "Şarj": gerekçe bölümünde küre hafifçe büyür, ışıması artar.
  const charge = smooth(clamp01((prob - 0.08) / 0.77)) * (1 - f);
  return { ...o, s: o.s * (1 + 0.06 * charge), g: o.g + 0.55 * charge };
}

export default function WingWireSite() {
  // Ana sitenin html/body'si açık renkli; bu sayfadayken başlık ve kaydırma taşması koyu olsun, çıkınca geri dönsün.
  useEffect(() => {
    const root = document.documentElement;
    const prev = { title: document.title, bg: root.style.background, scheme: root.style.colorScheme };
    document.title = TITLE;
    root.style.background = BG;
    root.style.colorScheme = 'dark';
    return () => {
      document.title = prev.title;
      root.style.background = prev.bg;
      root.style.colorScheme = prev.scheme;
    };
  }, []);

  const still = Boolean(useReducedMotion());

  const heroRef = useRef(null);
  const probRef = useRef(null);
  const featRef = useRef(null);
  const archRef = useRef(null);
  const ctaRef = useRef(null);

  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end end'] });
  const { scrollYProgress: probP } = useScroll({ target: probRef, offset: ['start start', 'end end'] });
  const { scrollYProgress: featIn } = useScroll({ target: featRef, offset: ['start end', 'start start'] });
  const { scrollYProgress: archP } = useScroll({ target: archRef, offset: ['start start', 'end end'] });
  const { scrollYProgress: archIn } = useScroll({ target: archRef, offset: ['start end', 'start start'] });
  const { scrollYProgress: ctaIn } = useScroll({ target: ctaRef, offset: ['start end', 'start start'] });

  return (
    <div className={`wwsite${still ? ' is-still' : ''}`}>
      <Nav />
      <main className="ww">
        <div className="ww__story">
          {!still && <Stage heroP={heroP} probP={probP} featIn={featIn} archIn={archIn} ctaIn={ctaIn} />}
          <Hero secRef={heroRef} p={heroP} still={still} />
          <Problem secRef={probRef} p={probP} still={still} />
          <Features secRef={featRef} still={still} />
          <Architecture secRef={archRef} p={archP} enter={archIn} still={still} />
          <Cta secRef={ctaRef} enter={ctaIn} still={still} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// `wing[wire]` — WingWireLogo.kt ölçüleri (em cinsinden, font boyutuyla ölçeklenir).
function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`.trim()} aria-label="WingWire" role="img">
      <span aria-hidden="true">wing</span>
      <span className="wordmark__box" aria-hidden="true">
        wire
      </span>
    </span>
  );
}

function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav__in">
        <a href="#top" className="nav__brand" aria-label="WingWire — başa dön">
          <AppIcon name="WingWire" size={34} />
          <Wordmark />
        </a>
        <nav className="nav__links" aria-label="Sayfa içi">
          <a href="#neler-yapar">Neler yapar</a>
          <a href="#nasil-calisir">Nasıl çalışır</a>
        </nav>
        <a href="#indir" className="nav__get">
          İndir
        </a>
      </div>
    </header>
  );
}

// Kırmızı küre sahnesi: tüm anlatı boyunca yapışkan, içerik katmanının arkasında.
function Stage({ heroP, probP, featIn, archIn, ctaIn }) {
  const orb = useTransform([heroP, probP, featIn, archIn, ctaIn], orbAt);
  const x = useSpring(useTransform(orb, o => o.x), SPRING);
  const y = useSpring(useTransform(orb, o => o.y), SPRING);
  const scale = useSpring(useTransform(orb, o => o.s), SPRING);
  const opacity = useSpring(useTransform(orb, o => o.o), SPRING);
  const glow = useSpring(useTransform(orb, o => Math.min(1, o.g)), SPRING);

  // Şarj halkası yalnız gerekçe bölümünde görünür ve kaydırmayla dolar.
  const ring = useSpring(useTransform(probP, [0.08, 0.85], [0, 1]), SOFT);
  const ringO = useTransform([probP, featIn], ([p, f]) => clamp01(p * 12) * (1 - clamp01(f * 1.6)));

  return (
    <div className="ww__stage" aria-hidden="true">
      <MotionDiv className="ww__orb" style={{ x, y, scale }}>
        <MotionDiv className="ww__halo" style={{ opacity: glow }} />
        <MotionDiv className="ww__orbbody" style={{ opacity }}>
          <MotionDiv
            className="ww__orbin"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Kırmızı küre kullanıcının bilinçli tercihi — maviye çevirme. */}
            <CrystalizedBall color="#f43f3f" secondaryColor="#fff4f0" inkColor="#160506" facets={42} interactive={false} maxDevicePixelRatio={1.5} />
          </MotionDiv>
        </MotionDiv>
        <MotionSvg className="ww__ring" viewBox="0 0 100 100" style={{ opacity: ringO }}>
          <circle className="ww__ringtrack" cx="50" cy="50" r="48" />
          <MotionCircle className="ww__ringfill" cx="50" cy="50" r="48" style={{ pathLength: ring }} />
        </MotionSvg>
      </MotionDiv>
    </div>
  );
}

function StillBall({ className }) {
  return (
    <div className={className} aria-hidden="true">
      <CrystalizedBall color="#f43f3f" secondaryColor="#fff4f0" inkColor="#160506" facets={42} />
    </div>
  );
}

function Hero({ secRef, p, still }) {
  const opacity = useScrollOpacity(p, [0.28, 0.62], [0, 1]);
  const y = useSpring(useTransform(p, [0.28, 0.7], [48, 0]), SOFT);
  const hint = useScrollOpacity(p, [0, 0.12], [1, 0]);

  return (
    <section className="ww__sec ww__sec--hero" id="top" ref={secRef}>
      <div className="ww__pin ww__pin--hero">
        <div className="ww__grid" aria-hidden="true" />
        <div className="wrap ww__heroin">
          <MotionDiv className="ww__intro" style={still ? undefined : { opacity, y }}>
            <div className="ww__badges">
              <span className={`ww__badge ww__badge--${APP.stage}`}>
                <i aria-hidden="true" />
                {STAGE[APP.stage]}
              </span>
              <span className="ww__badge ww__badge--plain">{APP.platform.toLowerCase()}</span>
            </div>
            <h1 className="ww__h1">{APP.name}</h1>
            <p className="ww__lead">{APP.lead}</p>
          </MotionDiv>
          {still && <StillBall className="ww__sball" />}
        </div>
        {!still && (
          <MotionDiv className="ww__hint" style={{ opacity: hint }} aria-hidden="true">
            <Wordmark />
            <span>kaydır</span>
            <i />
          </MotionDiv>
        )}
      </div>
    </section>
  );
}

const WHY = ['Ajanın masada çalışıyor.', 'Sen masada değilsin.', 'WingWire ikinizi tek bir tele bağlar.'];

function Problem({ secRef, p, still }) {
  return (
    <section className="ww__sec ww__sec--why" ref={secRef} aria-label="Neden WingWire">
      <div className="ww__pin ww__pin--why">
        <div className="wrap ww__whyin">
          <p className="ww__eyebrow">Neden</p>
          {WHY.map((t, i) => (
            <Statement key={t} p={p} i={i} n={WHY.length} still={still}>
              {t}
            </Statement>
          ))}
        </div>
      </div>
    </section>
  );
}

// İfadeler sırayla gelir; yenisi geldiğinde öncekiler geri çekilir, sonuncu parlak kalır.
function Statement({ p, i, n, still, children }) {
  const a = 0.1 + i * 0.26;
  const last = i === n - 1;
  const opacity = useScrollOpacity(p, last ? [a, a + 0.12] : [a, a + 0.12, a + 0.26, a + 0.36], last ? [0, 1] : [0, 1, 1, 0.3]);
  const y = useSpring(useTransform(p, [a, a + 0.16], [40, 0]), SOFT);
  return (
    <MotionP className={`ww__why${last ? ' ww__why--key' : ''}`} style={still ? undefined : { opacity, y }}>
      {children}
    </MotionP>
  );
}

function Features({ secRef, still }) {
  return (
    <section className="ww__sec ww__sec--feat" id="neler-yapar" ref={secRef}>
      <div className="wrap">
        <header className="ww__feathead">
          <p className="ww__eyebrow">
            Neler yapar <span className="ww__count">· {pad(APP.points.length)} yetenek</span>
          </p>
          <h2 className="ww__h2">Ajanın, cebinde.</h2>
        </header>
        <div className="ww__featin">
          <div className="ww__phonecol">
            <Phone />
          </div>
          <ol className="ww__cards">
            {APP.points.map((pt, i) => (
              <FeatureCard key={pt} i={i} still={still}>
                {pt}
              </FeatureCard>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ i, still, children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 0.62'] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.9, 1]), SOFT);
  const opacity = useScrollOpacity(scrollYProgress, [0, 0.85], [0.2, 1]);
  return (
    <MotionLi ref={ref} className="ww__card" style={still ? undefined : { scale, opacity }}>
      <span className="ww__idx">{pad(i + 1)}</span>
      <span className="ww__pt">{children}</span>
      <code className="ww__tag">{TAGS[i] || 'agent.event'}</code>
    </MotionLi>
  );
}

// "wing + wire": küre merkezde, düğümler iki kanat gibi açılır; teller kaydırmayla çizilir.
// Koordinatlar 1000×1000'lik kare haritada; HTML etiketleri aynı oranlarla (yüzde) yerleşir.
const C = 500;
const R0 = 172; // tel, kürenin kenarından başlar
const WING_L = [
  { k: 0, x: 118, y: 268, kick: 'ANDROID', label: 'telefonun', main: true },
  { k: 1, x: 150, y: 506, kick: 'chat.stream', label: 'sohbet' },
  { k: 2, x: 250, y: 728, kick: 'approval.request', label: 'onay' }
];
const WING_R = [
  { k: 0, kick: 'AGENT', label: 'kendi ajanın', main: true },
  { k: 1, kick: 'session.resume', label: 'oturum' },
  { k: 2, kick: 'call.incoming', label: 'arama' }
];
const r1 = n => Math.round(n * 10) / 10;
const NODES = [
  ...WING_L.map(n => ({ ...n, side: 'l' })),
  ...WING_R.map((n, i) => ({ ...n, side: 'r', x: 1000 - WING_L[i].x, y: WING_L[i].y }))
].map(n => {
  const ang = Math.atan2(n.y - C, n.x - C);
  const sx = C + R0 * Math.cos(ang);
  const sy = C + R0 * Math.sin(ang);
  const cx = (sx + n.x) / 2;
  const cy = (sy + n.y) / 2 - 78; // kanat kavisi: teller hafifçe yukarı kıvrılır
  return { ...n, d: `M ${r1(sx)} ${r1(sy)} Q ${r1(cx)} ${r1(cy)} ${n.x} ${n.y}` };
});
const wireRange = k => {
  const start = 0.1 + k * 0.2;
  return [start, start + 0.24];
};

function Architecture({ secRef, p, enter, still }) {
  const headO = useScrollOpacity(enter, [0.55, 1], [0, 1]);
  return (
    <section className="ww__sec ww__sec--arch" id="nasil-calisir" ref={secRef}>
      <div className="ww__pin ww__pin--arch">
        <MotionHeader className="wrap ww__archhead" style={still ? undefined : { opacity: headO }}>
          <p className="ww__eyebrow">Nasıl çalışır</p>
          <h2 className="ww__h3">Bir kanatta telefonun, öbüründe ajanın.</h2>
          <p className="ww__archlead">WingWire aradaki tel: sohbet, onay ve arama aynı hattan geçer.</p>
        </MotionHeader>
        <div className="ww__map">
          <svg className="ww__wires" viewBox="0 0 1000 1000" aria-hidden="true">
            {NODES.map(n => (
              <Wire key={n.kick} n={n} p={p} still={still} />
            ))}
          </svg>
          {NODES.map(n => (
            <WireNode key={n.kick} n={n} p={p} still={still} />
          ))}
          {still && <StillBall className="ww__archball" />}
        </div>
      </div>
    </section>
  );
}

function Wire({ n, p, still }) {
  const [a, b] = wireRange(n.k);
  const pathLength = useSpring(useTransform(p, [a, b], [0, 1]), SOFT);
  const live = useScrollOpacity(p, [b - 0.04, b + 0.02], [0, 1]);
  return (
    <g>
      <MotionPath d={n.d} className={`ww__wire${n.main ? ' ww__wire--main' : ''}`} style={still ? undefined : { pathLength }} />
      <MotionPath d={n.d} pathLength={100} className={`ww__flow ww__flow--${n.side}`} style={still ? undefined : { opacity: live }} />
    </g>
  );
}

function WireNode({ n, p, still }) {
  const [, b] = wireRange(n.k);
  const opacity = useScrollOpacity(p, [b - 0.05, b + 0.02], [0, 1]);
  return (
    <MotionDiv
      className={`ww__wnode ww__wnode--${n.side}${n.main ? ' ww__wnode--main' : ''}`}
      style={{ left: `${n.x / 10}%`, top: `${n.y / 10}%`, ...(still ? null : { opacity }) }}
    >
      <i aria-hidden="true" />
      <span className="ww__wkick">{n.kick}</span>
      <span className="ww__wlabel">{n.label}</span>
    </MotionDiv>
  );
}

function Cta({ secRef, enter, still }) {
  const opacity = useScrollOpacity(enter, [0.55, 1], [0, 1]);
  const y = useSpring(useTransform(enter, [0.5, 1], [40, 0]), SOFT);
  return (
    <section className="ww__sec ww__sec--cta" id="indir" ref={secRef}>
      <div className="ww__pin ww__pin--cta">
        <div className="ww__ctaglow" aria-hidden="true" />
        <MotionDiv className="wrap ww__ctain" style={still ? undefined : { opacity, y }}>
          <h2 className="ww__h2">Ajanın artık cebinde.</h2>
          <p className="ww__ctalead">Şimdilik Android'de. APK'yı indir, kendi ajanına bağlan.</p>
          <div className="ww__actions">
            <a className="ww__cta is-live" href={APK_URL} download>
              APK indir · v{APK_VERSION}
            </a>
            <span className="ww__wire-note" aria-hidden="true">
              Android · iOS yakında
            </span>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}

// Telefon önizlemesi: canlı oturum, birkaç araç satırı ve bekleyen bir onay kartı.
// Gerçek ekranlardan esinlenmiş temsili içerik; aria-hidden, okunması gereken bilgi taşımaz.
function Phone() {
  return (
    <div className="ww__phone" aria-hidden="true">
      <div className="ww__screen">
        <div className="ww__bar">
          <span className="ww__sess">Ödeme modülü</span>
          <span className="ww__live">
            <i />
            live
          </span>
        </div>
        <div className="ww__meta">session · 7f3a91c · 18 msg</div>

        <div className="ww__chat">
          <div className="ww__msg ww__msg--user">
            <small>sen</small>
            Testleri çalıştır, geçerse dalı birleştirmek için bana sor.
          </div>
          <div className="ww__tool">
            <b>✓</b> terminal <span>npm test</span>
          </div>
          <div className="ww__tool">
            <b>✓</b> terminal <span>git status</span>
          </div>
          <div className="ww__msg ww__msg--agent">
            <small>ajan</small>
            Testler geçti: <code>42/42</code>. Birleştirme için onayın gerekiyor.
          </div>

          <div className="ww__approve">
            <div className="ww__approve-h">Onay gerekiyor</div>
            <code className="ww__cmd">git merge feature/odeme</code>
            <div className="ww__btns">
              <span className="ww__yes">Onayla</span>
              <span className="ww__no">Reddet</span>
            </div>
            <div className="ww__done">
              <b>✓</b> approval.granted · 0.4s
            </div>
          </div>

          <div className="ww__typing">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <div className="foot__brand">
          <Wordmark className="wordmark--lg" />
          <p className="foot__lead">{APP.lead}</p>
        </div>
        <div className="foot__meta">
          <span>© 2026 WingWire</span>
          <Link to="/" className="foot__maker">
            hamaratlabs.com'un bir ürünü
          </Link>
        </div>
      </div>
    </footer>
  );
}
