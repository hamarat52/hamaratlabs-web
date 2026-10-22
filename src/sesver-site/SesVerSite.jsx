import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import AppIcon from '../AppIcon';
import { Link } from '../nav';
import { asset } from '../base';
import './sesver.css';

// SesVer'in kendi sitesi (/sesver). Ana sitenin topbar/footer'ı olmadan tam sayfa çizilir (App.jsx → STANDALONE_PAGES).
// Kimlik WingWire'ın tersi: krem zemin, koyu metin, turuncu vurgu, klon için mor; hareket yaylanan/organik.
//  - Tüm hareket yalnız transform/opacity; scroll değerleri MotionValue olarak kalır, React state'ine yazılmaz.
//  - prefers-reduced-motion: reduce → scroll bağlı hareketler kapanır, CSS dalga animasyonları durur.
//  - Ses örnekleri: VideoGen üretti (22 Ekim), Yusuf dinleyip onayladı. public/audio/sesver/*.mp3.

const TITLE = 'SesVer — Yazdığın, kendi bilgisayarında sese dönüşsün';
const BG = '#fbf6ee';
const GITHUB = 'https://github.com/hamarat52/sesver';
const WIN_EXE = 'https://github.com/hamarat52/sesver/releases/latest/download/SesVer-Kurulum-Windows.exe';

// Yaylanan, organik his: düşük sönüm, hafif taşma.
const SPRING = { stiffness: 120, damping: 18, mass: 0.6 };

// Belirli (deterministik) dalga yükseklikleri: rastgelelik yok, her çizimde aynı şekil.
function barHeights(n, seed) {
  return Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    const env = Math.sin(Math.PI * x) ** 0.8;
    const v = 0.55 + 0.45 * Math.sin(i * 0.9 + seed) * Math.cos(i * 0.37 + seed * 2);
    return Math.max(0.12, env * Math.abs(v));
  });
}

// Pürüzsüz SVG dalga yolu (sinüs toplamı × zarf). wobble > 0 → daha "ham", farklı bir ses.
function wavePath(seed, wobble = 0, w = 1000, h = 200, steps = 220) {
  const mid = h / 2;
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const x = i / steps;
    const env = Math.sin(Math.PI * x) ** 1.4;
    const y =
      Math.sin(x * 38 + seed) * 0.55 +
      Math.sin(x * 91 + seed * 1.7) * 0.3 +
      Math.sin(x * 17 + seed * 0.4) * 0.25 +
      wobble * Math.sin(x * 143 + seed * 3.1);
    d += `${i === 0 ? 'M' : 'L'}${(x * w).toFixed(1)},${(mid - y * env * mid * 0.82).toFixed(1)} `;
  }
  return d.trim();
}

const HERO_BARS = barHeights(64, 1.3);
const TTS_BARS = barHeights(48, 4.2);
const SOURCE_PATH = wavePath(2.1);
const RAW_CLONE_PATH = wavePath(5.7, 0.55);

const TTS_TEXT = 'Merhaba, ben SesVer. Yazdığın her cümleyi kendi bilgisayarında, internete göndermeden Türkçe sese çeviriyorum.';

// Bir ses dalgası çubuğu dizisi. Hareket CSS keyframe ile (transform: scaleY); JS döngüsü yok.
function Bars({ heights, className = '' }) {
  return (
    <div className={`sv-bars ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="sv-bars__bar"
          style={{ '--h': h.toFixed(3), '--d': `${(0.9 + (i % 7) * 0.13).toFixed(2)}s`, '--dl': `${(-(i * 0.071) % 1.3).toFixed(2)}s` }}
        />
      ))}
    </div>
  );
}

// Ses örneği düğmesi. src yokken devre dışıdır; ileride gerçek dosya yolu verilince oynatır.
export function AudioDemo({ src = null, label = 'Dinle', tone = 'source' }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!src) {
    return (
      <button type="button" className={`sv-audio sv-audio--${tone}`} disabled aria-disabled="true" title="Ses örneği yakında eklenecek">
        <span className="sv-audio__icon" aria-hidden="true">▶</span>
        {label}
        <span className="sv-audio__soon">yakında</span>
      </button>
    );
  }

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  return (
    <>
      <button type="button" className={`sv-audio sv-audio--${tone}`} onClick={toggle} aria-pressed={playing}>
        <span className="sv-audio__icon" aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
        {label}
      </button>
      <audio ref={ref} src={src} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </>
  );
}

function Nav() {
  return (
    <header className="sv-nav">
      <a href="#ust" className="sv-nav__brand">
        <AppIcon name="SesVer" size={30} />
        <span>SesVer</span>
      </a>
      <nav className="sv-nav__links" aria-label="Sayfa bölümleri">
        <a href="#nasil">Nasıl çalışır</a>
        <a href="#klon">Klonlama</a>
        <a href="#yerel">Neden yerel</a>
      </nav>
      <a href="#kur" className="sv-nav__cta">Ücretsiz indir</a>
    </header>
  );
}

function Hero({ reduce }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, SPRING);
  const y = useTransform(p, [0, 1], [0, 140]);
  const fade = useTransform(p, [0, 0.7], [1, 0]);
  const waveScale = useTransform(p, [0, 1], [1, 1.6]);
  const waveY = useTransform(p, [0, 1], [0, -60]);

  return (
    <section id="ust" ref={ref} className="sv-hero">
      <Motion.div className="sv-hero__copy" style={reduce ? undefined : { y, opacity: fade }}>
        <p className="sv-eyebrow">Türkçe ses üretimi · ses klonlama · beta</p>
        <h1 className="sv-hero__title">
          Yazdığın,
          <br />
          <span className="sv-grad">sese dönüşsün.</span>
        </h1>
        <p className="sv-hero__lead">
          SesVer metnini kendi bilgisayarında doğal Türkçe sese çevirir. Hazır seslerden seç, tarif ederek yeni bir ses tasarla
          ya da kendi sesini klonla. Hesap yok, API anahtarı yok, bulut yok.
        </p>
        <div className="sv-hero__actions">
          <a className="sv-btn sv-btn--primary" href="#kur">Ücretsiz indir</a>
          <a className="sv-btn sv-btn--ghost" href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub'da incele</a>
        </div>
        <p className="sv-hero__meta">macOS · Windows · ticari olmayan kullanım için ücretsiz</p>
      </Motion.div>
      <Motion.div className="sv-hero__wave" style={reduce ? undefined : { scaleY: waveScale, y: waveY }}>
        <Bars heights={HERO_BARS} className="sv-bars--hero" />
      </Motion.div>
    </section>
  );
}

// Tek kelime: scroll ilerledikçe sırası gelince "okunur" (vurgulu katmanın opaklığı artar).
function Word({ progress, index, total, children }) {
  const start = index / total;
  const end = Math.min(1, start + 1.4 / total);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  return (
    <span className="sv-word">
      <span className="sv-word__base">{children}</span>
      <Motion.span className="sv-word__on" style={{ opacity }} aria-hidden="true">{children}</Motion.span>{' '}
    </span>
  );
}

function TtsDemo({ reduce }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, SPRING);
  // Kelimeler bölümün %10–%80 aralığında sırayla okunur.
  const read = useTransform(p, [0.1, 0.8], [0, 1]);
  const playhead = useTransform(read, [0, 1], [0, 1]);
  const words = TTS_TEXT.split(' ');
  const full = useTransform(p, [0, 1], [1, 1]);

  return (
    <section id="nasil" ref={ref} className={`sv-tts ${reduce ? 'is-static' : ''}`}>
      <div className="sv-tts__sticky">
        <p className="sv-eyebrow">Metinden sese</p>
        <h2 className="sv-h2">Yaz, Üret'e bas, dinle.</h2>
        <div className="sv-card sv-tts__card">
          <div className="sv-tts__bar">
            <span className="sv-chip">Belgesel Anlatıcı</span>
            <span className="sv-chip sv-chip--soft">Kalite: Dengeli</span>
          </div>
          <p className="sv-tts__text">
            {words.map((w, i) => (
              <Word key={i} progress={reduce ? full : read} index={i} total={words.length}>{w}</Word>
            ))}
          </p>
          <div className="sv-tts__wave">
            <Bars heights={TTS_BARS} className="sv-bars--tts" />
            <Motion.span className="sv-tts__playhead" style={{ scaleX: reduce ? 1 : playhead }} aria-hidden="true" />
          </div>
          <div className="sv-tts__foot">
            <AudioDemo src={asset('/audio/sesver/tts-demo.mp3')} label="Bu cümleyi dinle" />
            <span className="sv-mono">WAV · 48 kHz</span>
          </div>
        </div>
        <p className="sv-note">Görsel temsilidir; gerçek ses örnekleri yakında eklenecek.</p>
      </div>
    </section>
  );
}

function CloneDemo({ reduce }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, SPRING);
  const t = useTransform(p, [0.1, 0.75], [0, 1]);
  // Mor klon dalgası aşağıdan kaynağa doğru yaklaşır; ham hâli söner, benzeşen hâli belirir.
  const cloneY = useTransform(t, [0, 1], [150, 0]);
  const rawOpacity = useTransform(t, [0, 0.8], [1, 0]);
  const matchOpacity = useTransform(t, [0.2, 1], [0, 1]);
  const sim = useTransform(t, [0, 1], [18, 96]);
  const simText = useTransform(sim, (v) => `%${Math.round(v)}`);

  return (
    <section id="klon" ref={ref} className={`sv-clone ${reduce ? 'is-static' : ''}`}>
      <div className="sv-clone__sticky">
        <p className="sv-eyebrow sv-eyebrow--violet">Ses klonlama</p>
        <h2 className="sv-h2">
          Birkaç saniyelik kayıt.
          <br />
          <span className="sv-grad sv-grad--violet">Senin sesin, yeni cümleler.</span>
        </h2>
        <p className="sv-lead">
          Tek kişinin konuştuğu, müziksiz, temiz 3–15 saniyelik bir kayıt yükle. Kaydın metnini de girersen klon belirgin
          biçimde benzer; SesVer bunu otomatik yazıya da dökebilir.
        </p>
        <div className="sv-card sv-clone__card">
          <svg className="sv-clone__svg" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="sv-src" x1="0" x2="1">
                <stop offset="0" stopColor="#ff5c86" />
                <stop offset="1" stopColor="#ff8f1f" />
              </linearGradient>
              <linearGradient id="sv-cln" x1="0" x2="1">
                <stop offset="0" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#6d28d9" />
              </linearGradient>
            </defs>
            <path d={SOURCE_PATH} transform="translate(0 40)" fill="none" stroke="url(#sv-src)" strokeWidth="4" strokeLinecap="round" />
            <Motion.g style={reduce ? { y: 0 } : { y: cloneY }}>
              <g transform="translate(0 160)">
                <Motion.path d={RAW_CLONE_PATH} fill="none" stroke="url(#sv-cln)" strokeWidth="3" strokeLinecap="round" style={{ opacity: reduce ? 0 : rawOpacity }} />
                <Motion.path d={SOURCE_PATH} fill="none" stroke="url(#sv-cln)" strokeWidth="4" strokeLinecap="round" style={{ opacity: reduce ? 1 : matchOpacity }} />
              </g>
            </Motion.g>
          </svg>
          <div className="sv-clone__legend">
            <div className="sv-clone__item">
              <span className="sv-dot sv-dot--source" />
              <div>
                <strong>Kaynak ses</strong>
                <span>Senin kısa bir kaydın</span>
              </div>
              <AudioDemo src={asset('/audio/sesver/kaynak-ses.mp3')} label="Dinle" tone="source" />
            </div>
            <div className="sv-clone__sim">
              <span className="sv-mono">benzerlik</span>
              {reduce ? <span className="sv-clone__num">%96</span> : <Motion.span className="sv-clone__num">{simText}</Motion.span>}
            </div>
            <div className="sv-clone__item">
              <span className="sv-dot sv-dot--clone" />
              <div>
                <strong>Klon</strong>
                <span>Aynı ses, yepyeni bir metin</span>
              </div>
              <AudioDemo src={asset('/audio/sesver/klon-demo.mp3')} label="Dinle" tone="clone" />
            </div>
          </div>
        </div>
        <p className="sv-note">Görsel temsilidir; benzerlik değeri bir ölçüm değil, kayda ve donanıma göre değişir.</p>
      </div>
    </section>
  );
}

// Aşağıdan yukarı yaylanarak beliren blok (yalnız transform/opacity).
function Rise({ reduce, delay = 0, className = '', children }) {
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <Motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ type: 'spring', stiffness: 140, damping: 16, delay }}
    >
      {children}
    </Motion.div>
  );
}

const FEATURES = [
  { k: 'Hazır sesler', v: 'Yaşlı Masalcı, Belgesel Anlatıcı, Heyecanlı Sunucu. Tarifle tasarlanmış sentetik seslerdir, gerçek kişi değildir.' },
  { k: 'Tarif ederek tasarla', v: 'Yaş, cinsiyet, ton, doku ve hız seç; 4 aday dinle, beğendiğini Seslerim\'e kaydet.' },
  { k: 'Efektler', v: 'Cızırtı, Lo-fi, Telefon, Telsiz, Oda/yankı, Megafon. Ham ses korunur, efektli kopya ayrı kaydedilir.' },
  { k: 'WAV indir', v: 'Sonucu dinle, tek tıkla WAV olarak indir. Dosyalar ayrıca outputs/ klasöründe durur.' }
];

const LOCAL = [
  { k: 'Bulut yok', v: 'Metnin ve seslerin hiçbir bulut servisine gönderilmez. Kişisel seslerin Git\'e bile girmez.' },
  { k: 'Hesap ve ücret yok', v: 'Hesap, API anahtarı veya ücretli servis gerekmez. İnternet yalnız ilk kurulumda, gerekenleri indirmek için lazım.' },
  { k: 'Güçlü model', v: 'OpenBMB VoxCPM2: 2 milyar parametre, Türkçe dahil 30 dil, 48 kHz çıktı. GPU zorunlu değil; donanımına göre bekleyebilirsin.' }
];

export default function SesVerSite() {
  const reduce = useReducedMotion();

  // Ana sitenin html arka planı farklı olabilir; bu sayfadayken başlık ve kaydırma taşması krem olsun, çıkınca geri dönsün.
  useEffect(() => {
    const root = document.documentElement;
    const prev = { title: document.title, bg: root.style.background, scheme: root.style.colorScheme };
    document.title = TITLE;
    root.style.background = BG;
    root.style.colorScheme = 'light';
    return () => {
      document.title = prev.title;
      root.style.background = prev.bg;
      root.style.colorScheme = prev.scheme;
    };
  }, []);

  return (
    <div className="sv">
      <Nav />
      <main>
        <Hero reduce={reduce} />

        <section className="sv-features">
          {FEATURES.map((f, i) => (
            <Rise key={f.k} reduce={reduce} delay={i * 0.06} className="sv-card sv-feature">
              <h3>{f.k}</h3>
              <p>{f.v}</p>
            </Rise>
          ))}
        </section>

        <TtsDemo reduce={reduce} />
        <CloneDemo reduce={reduce} />

        <section className="sv-ethics">
          <Rise reduce={reduce} className="sv-ethics__box">
            <p className="sv-eyebrow sv-eyebrow--violet">Rıza önce gelir</p>
            <h2 className="sv-h3">Sadece kendi sesini veya açık izin aldığın bir sesi klonla.</h2>
            <p>
              Kayıttan kalıcı ses oluştururken izin kutucuğu işaretlenmeden kaydedilemez. Kimliğe bürünme, dolandırıcılık veya
              yanıltıcı içerik için kullanma. Üretilen içeriği paylaşırken <strong>“AI ile üretildi”</strong> diye açıkça etiketle;
              uygulama sese otomatik filigran eklemez. Üretilen içerikten ve kullanımdan kullanıcı sorumludur.
            </p>
          </Rise>
        </section>

        <section id="yerel" className="sv-local">
          <Rise reduce={reduce}>
            <p className="sv-eyebrow">Neden yerel</p>
            <h2 className="sv-h2">Sesin, bilgisayarından çıkmaz.</h2>
          </Rise>
          <div className="sv-local__grid">
            {LOCAL.map((f, i) => (
              <Rise key={f.k} reduce={reduce} delay={i * 0.08} className="sv-card sv-feature">
                <h3>{f.k}</h3>
                <p>{f.v}</p>
              </Rise>
            ))}
          </div>
          <Rise reduce={reduce} className="sv-card sv-license">
            <h3>Lisans, açıkça</h3>
            <ul>
              <li>
                <strong>SesVer'in kodu</strong> <span className="sv-mono">PolyForm Noncommercial 1.0.0</span> lisanslıdır. Kişisel
                kullanım, inceleme, eğitim, araştırma ve değiştirme serbesttir.
              </li>
              <li>
                <strong>Ticari kullanım ve yeniden satış izinli değildir.</strong> Ticari bir ürüne ya da servise dahil etmek için
                HamaratLabs'ten ayrıca izin gerekir.
              </li>
              <li>
                Kaynak kodu açık ve incelenebilir; ancak bu lisans OSI tanımlı bir “open source” lisansı değildir.
              </li>
              <li>
                <strong>VoxCPM2 modeli</strong> ve OpenBMB/VoxCPM kodu ayrı bir bağımlılıktır ve kendi Apache-2.0 lisansı altındadır.
              </li>
            </ul>
          </Rise>
        </section>

        <section id="kur" className="sv-cta">
          <Rise reduce={reduce} className="sv-cta__head">
            <h2 className="sv-h2">
              Birkaç tıkla <span className="sv-grad">kur.</span>
            </h2>
            <p className="sv-lead">İlk çalıştırmada gereken her şey (Python dahil) otomatik iner. En az 20 GB boş alan ve internet gerekir; model yaklaşık 5 GB.</p>
          </Rise>
          <div className="sv-cta__grid">
            <Rise reduce={reduce} className="sv-card sv-step">
              <span className="sv-mono">Windows</span>
              <ol>
                <li><a href={WIN_EXE}>SesVer-Kurulum-Windows.exe</a> dosyasını indir.</li>
                <li>Çift tıkla; “Windows bilgisayarınızı korudu” derse <em>Ek bilgi → Yine de çalıştır</em>.</li>
                <li>Lisansı kabul et → <em>İleri → İleri → Kur</em>. Başlat menüsündeki SesVer simgesiyle aç.</li>
              </ol>
            </Rise>
            <Rise reduce={reduce} delay={0.08} className="sv-card sv-step">
              <span className="sv-mono">macOS</span>
              <ol>
                <li>GitHub sayfasında <em>Code → Download ZIP</em>, sonra ZIP'e çift tıkla.</li>
                <li>Klasördeki <span className="sv-mono">MACOS_BASLAT.command</span> dosyasına çift tıkla (uyarı çıkarsa sağ tık → Aç).</li>
                <li>Terminal “Running on local URL” yazınca tarayıcıda <span className="sv-mono">127.0.0.1:7860</span> adresini aç.</li>
              </ol>
            </Rise>
          </div>
          <Rise reduce={reduce} className="sv-cta__actions">
            <a className="sv-btn sv-btn--primary" href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub'dan indir</a>
            <span className="sv-note">8 GB RAM'li cihazlarda kullanım önerilmez. Ayrıntılı kurulum ve sorun giderme README'de.</span>
          </Rise>
        </section>
      </main>

      <footer className="sv-foot">
        <span>SesVer · © HamaratLabs</span>
        <Link to="/" className="sv-foot__maker">hamaratlabs</Link>
      </footer>
    </div>
  );
}
