import { useEffect } from 'react';
import AppIcon from '../AppIcon';
import CrystalizedBall from '../components/rb/CrystalizedBall/CrystalizedBall';
import { FEATURED } from '../data';
import { Link } from '../nav';
import './fonts.css';
import './WingWireSite.css';

// WingWire'ın kendi sitesi: hamaratlabs.com/wingwire (paylaşılan topbar/footer YOK, App.jsx STATIC_PAGES).
// Kaynak: ~/Desktop/Projeler/wingwire-web/src/App.jsx — birebir taşındı. Farklar:
//  - Ürün metni ayrı data.js yerine ana sitenin data.js'teki WingWire kaydından okunur (tek kaynak).
//  - İkon: wingwire-web'deki WingWireIcon zaten AppIcon'daki WingWire kaydının kopyası; AppIcon kullanıldı.
//  - CrystalizedBall: ana sitedeki aynı bileşen (dosyalar birebir aynı).
//  - Footer'daki hamaratlabs linki site içi Link oldu.
// Dil: Android uygulamasıyla aynı — InkNavy zemin, mavi marka aksanı, cyan yalnız "bağlantı canlı".
// Ürünün söylediği Plus Jakarta Sans, sistemin gösterdiği JetBrains Mono, wordmark Sora.

const APP = FEATURED.find(a => a.name === 'WingWire');

const STAGE = { beta: 'açık beta', dev: 'geliştirmede', idea: 'fikir', live: 'yayında' };

// Her özelliğin yanında, sistemin dilinden kısa bir etiket (süs; ürün metni data.js'te).
const TAGS = ['chat.stream', 'session.resume', 'approval.request', 'call.incoming'];

const pad = n => String(n).padStart(2, '0');

const TITLE = 'WingWire — kendi ajanına Android\'den bağlan';
const BG = '#0b0f14';

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

  return (
    <div className="wwsite">
      <Nav />
      <main className="ww">
        <Hero />
        <WireLine />
        <Session />
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
        <span className="nav__soon" aria-disabled="true">
          Yakında
        </span>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="ww__hero" id="top">
      <div className="ww__glow" aria-hidden="true" />
      <div className="wrap ww__heroin">
        <div className="ww__intro">
          <div className="ww__badges">
            <span className={`ww__badge ww__badge--${APP.stage}`}>
              <i aria-hidden="true" />
              {STAGE[APP.stage]}
            </span>
            <span className="ww__badge ww__badge--plain">{APP.platform.toLowerCase()}</span>
          </div>
          <h1 className="ww__h1">{APP.name}</h1>
          <p className="ww__lead">{APP.lead}</p>
          <div className="ww__actions">
            <span className="ww__cta is-off" aria-disabled="true">
              Yakında
            </span>
            <span className="ww__wire" aria-hidden="true">
              telefon <b>⇄</b> ajan
            </span>
          </div>
        </div>

        <div className="ww__ball">
          {/* Kırmızı küre kullanıcının bilinçli tercihi — maviye çevirme. */}
          <CrystalizedBall color="#f43f3f" secondaryColor="#fff4f0" inkColor="#160506" facets={42} />
        </div>
      </div>
    </section>
  );
}

// Telefon ile ajan arasındaki canlı hat: paketler iki yönde akar (ileri cyan, geri mavi).
function WireLine() {
  return (
    <section className="ww__line" id="nasil-calisir" aria-label="Nasıl çalışır">
      <div className="wrap ww__linein">
        <div className="ww__node">
          <span className="ww__nodek">ANDROID</span>
          <span className="ww__nodev">telefonun</span>
        </div>
        <div className="ww__cable" aria-hidden="true">
          <i className="ww__pkt" />
          <i className="ww__pkt ww__pkt--b" />
          <i className="ww__pkt ww__pkt--back" />
        </div>
        <div className="ww__node ww__node--r">
          <span className="ww__nodek">AGENT</span>
          <span className="ww__nodev">kendi ajanın</span>
        </div>
      </div>
    </section>
  );
}

function Session() {
  return (
    <section className="ww__session" id="neler-yapar">
      <div className="wrap ww__sessionin">
        <Phone />
        <div className="ww__points">
          <h2>
            <span>Neler yapar</span>
            <span className="ww__count">{pad(APP.points.length)} yetenek</span>
          </h2>
          <ol>
            {APP.points.map((p, i) => (
              <li key={p}>
                <span className="ww__idx">{pad(i + 1)}</span>
                <span className="ww__pt">{p}</span>
                <code className="ww__tag">{TAGS[i] || 'agent.event'}</code>
              </li>
            ))}
          </ol>
        </div>
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
