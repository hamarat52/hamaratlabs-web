import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion as Motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import AppIcon from '../AppIcon';
import { Link } from '../nav';
import { asset } from '../base';
import { DEFAULT_LANG, LANGS, LangContext, initialLang, isRtl, loadDict, makeT, saveLang, useI18n } from './i18n';
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

// TtsDemo'daki seçilebilir hazır sesler. Üç kayıt da TTS_TEXT cümlesini okur (public/audio/sesver/demo-*.mp3).
// Etiketler yalnız sesin adı; ölçülmemiş niteleme (derin, tok vb.) eklenmez.
const TTS_VOICES = [
  { id: 'belgesel', name: 'Belgesel Anlatıcı', src: '/audio/sesver/demo-belgesel.mp3' },
  { id: 'heyecanli', name: 'Heyecanlı Sunucu', src: '/audio/sesver/demo-heyecanli.mp3' },
  { id: 'masalci', name: 'Yaşlı Masalcı', src: '/audio/sesver/demo-masalci.mp3' }
];

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

// Ses örneği düğmesi: src verilince <audio> ile oynat/duraklat; src yoksa "yakında" rozetiyle devre dışı.
// label Türkçe kaynak metindir (sözlük anahtarı); seçili arayüz diline burada çevrilir.
export function AudioDemo({ src = null, label = 'Dinle', tone = 'source' }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Bileşen kalkarken (ör. TtsDemo'da ses değişince) çalan kayıt susar.
  useEffect(() => {
    const el = ref.current;
    return () => el?.pause();
  }, []);

  if (!src) {
    return (
      <button type="button" className={`sv-audio sv-audio--${tone}`} disabled aria-disabled="true" title={t('Ses örneği yakında eklenecek')}>
        <span className="sv-audio__icon" aria-hidden="true">▶</span>
        {t(label)}
        <span className="sv-audio__soon">{t('yakında')}</span>
      </button>
    );
  }

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  };

  return (
    <>
      <button type="button" className={`sv-audio sv-audio--${tone}`} onClick={toggle} aria-pressed={playing}>
        <span className="sv-audio__icon" aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
        {t(label)}
      </button>
      <audio ref={ref} src={src} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </>
  );
}

// Sözlükteki sabit HTML'li metni (<strong>, <em>, <a>, <span class>) işler. Kaynak yalnız bu repodaki
// locales/*.json ve Türkçe anahtarlardır; kullanıcı girdisi buraya hiç gelmez.
function Rich({ as = 'p', html, ...rest }) {
  const Tag = as;
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Arayüz dili seçici (masaüstündeki "Arayüz dili" ayarının karşılığı). Seçenek adları her dilin kendi adıdır.
function LangSelect() {
  const { selected, setLang, t } = useI18n();
  return (
    <select className="sv-nav__lang" value={selected} onChange={(e) => setLang(e.target.value)} aria-label={t('Arayüz dili')}>
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} lang={l.code}>
          {l.name}
        </option>
      ))}
    </select>
  );
}

function Nav() {
  const { t } = useI18n();
  return (
    <header className="sv-nav">
      <a href="#ust" className="sv-nav__brand">
        <AppIcon name="SesVer" size={30} />
        <span>SesVer</span>
      </a>
      <nav className="sv-nav__links" aria-label={t('Sayfa bölümleri')}>
        <a href="#nasil">{t('Nasıl çalışır')}</a>
        <a href="#klon">{t('Klonlama')}</a>
        <a href="#yerel">{t('Neden yerel')}</a>
      </nav>
      <LangSelect />
      <a href="#kur" className="sv-nav__cta">{t('Ücretsiz indir')}</a>
    </header>
  );
}

function Hero({ reduce }) {
  const { t } = useI18n();
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
        <p className="sv-eyebrow">{t('Türkçe ses üretimi · ses klonlama · beta')}</p>
        <h1 className="sv-hero__title">
          {t('Yazdığın,')}
          <br />
          <span className="sv-grad">{t('sese dönüşsün.')}</span>
        </h1>
        <p className="sv-hero__lead">
          {t('SesVer metnini kendi bilgisayarında doğal Türkçe sese çevirir. Hazır seslerden seç, tarif ederek yeni bir ses tasarla ya da kendi sesini klonla. Hesap yok, API anahtarı yok, bulut yok.')}
        </p>
        <div className="sv-hero__actions">
          <a className="sv-btn sv-btn--primary" href="#kur">{t('Ücretsiz indir')}</a>
          <a className="sv-btn sv-btn--ghost" href={GITHUB} target="_blank" rel="noopener noreferrer">{t("GitHub'da incele")}</a>
        </div>
        <p className="sv-hero__meta">{t('macOS · Windows · ticari olmayan kullanım için ücretsiz')}</p>
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
  // Boşluk inline-block .sv-word'ün DIŞINDA: içeride kalınca tarayıcı sondaki boşluğu yutuyor
  // ve kelimeler bitişik görünüyordu ("benSesVer").
  return (
    <>
      <span className="sv-word">
        <span className="sv-word__base">{children}</span>
        <Motion.span className="sv-word__on" style={{ opacity }} aria-hidden="true">{children}</Motion.span>
      </span>{' '}
    </>
  );
}

function TtsDemo({ reduce }) {
  const { lang, t } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, SPRING);
  // Kelimeler bölümün %10–%80 aralığında sırayla okunur.
  const read = useTransform(p, [0.1, 0.8], [0, 1]);
  const playhead = useTransform(read, [0, 1], [0, 1]);
  const words = TTS_TEXT.split(' ');
  const full = useTransform(p, [0, 1], [1, 1]);
  const [voiceId, setVoiceId] = useState(TTS_VOICES[0].id);
  const voice = TTS_VOICES.find((v) => v.id === voiceId) ?? TTS_VOICES[0];

  return (
    <section id="nasil" ref={ref} className={`sv-tts ${reduce ? 'is-static' : ''}`}>
      <div className="sv-tts__sticky">
        <p className="sv-eyebrow">{t('Metinden sese')}</p>
        <h2 className="sv-h2">{t("Yaz, Üret'e bas, dinle.")}</h2>
        <div className="sv-card sv-tts__card">
          <div className="sv-tts__bar">
            <div className="sv-tts__voices" role="group" aria-label={t('Ses seç')}>
              {TTS_VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`sv-chip sv-voice ${v.id === voice.id ? 'is-active' : ''}`}
                  aria-pressed={v.id === voice.id}
                  onClick={() => setVoiceId(v.id)}
                >
                  {t(v.name)}
                </button>
              ))}
            </div>
            <span className="sv-chip sv-chip--soft">{t('Kalite')}: {t('Dengeli')}</span>
          </div>
          {/* Kayıtların okuduğu cümle: ses Türkçe olduğu için metin de her dilde Türkçe kalır. */}
          <p className="sv-tts__text" lang="tr" dir="ltr">
            {words.map((w, i) => (
              <Word key={i} progress={reduce ? full : read} index={i} total={words.length}>{w}</Word>
            ))}
          </p>
          {lang !== DEFAULT_LANG && (
            <p className="sv-tts__gloss">
              <q>{t(TTS_TEXT)}</q>
            </p>
          )}
          <div className="sv-tts__wave">
            <Bars heights={TTS_BARS} className="sv-bars--tts" />
            <Motion.span className="sv-tts__playhead" style={{ scaleX: reduce ? 1 : playhead }} aria-hidden="true" />
          </div>
          <div className="sv-tts__foot">
            {/* key: ses değişince düğme yeniden kurulur; çalan kayıt durur, durum sıfırlanır. */}
            <AudioDemo key={voice.id} src={asset(voice.src)} label="Bu cümleyi dinle" />
            <span className="sv-mono">MP3 · 48 kHz</span>
          </div>
        </div>
        <p className="sv-note">{t('Gerçek SesVer çıktısı: üç hazır ses aynı cümleyi okuyor. Dalga ve kelime vurgusu görseldir.')}</p>
        {/* Arayüz dili ≠ ses üretim dili (masaüstündeki "Ses üretim dili ayrıdır" notuyla aynı ilke). */}
        {lang !== DEFAULT_LANG && (
          <Rich className="sv-note sv-note--lang" html={t('<strong>Ses örnekleri şu an Türkçe.</strong> Arayüz dili ses üretim dilini değiştirmez: VoxCPM2 metni yazıldığı dilde okur (Türkçe dahil 30 dil).')} />
        )}
      </div>
    </section>
  );
}

function CloneDemo({ reduce }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, SPRING);
  const t01 = useTransform(p, [0.1, 0.75], [0, 1]);
  // Mor klon dalgası aşağıdan kaynağa doğru yaklaşır; ham hâli söner, benzeşen hâli belirir.
  const cloneY = useTransform(t01, [0, 1], [150, 0]);
  const rawOpacity = useTransform(t01, [0, 0.8], [1, 0]);
  const matchOpacity = useTransform(t01, [0.2, 1], [0, 1]);
  const sim = useTransform(t01, [0, 1], [18, 96]);
  const simNum = useTransform(sim, (v) => Math.round(v));
  // Yüzde işaretinin yeri dile göre değişir (tr "%96", en "96%"); sayı MotionValue olarak kalır.
  const [simPre, simPost = ''] = t('%{n}').split('{n}');

  return (
    <section id="klon" ref={ref} className={`sv-clone ${reduce ? 'is-static' : ''}`}>
      <div className="sv-clone__sticky">
        <p className="sv-eyebrow sv-eyebrow--violet">{t('Ses klonlama')}</p>
        <h2 className="sv-h2">
          {t('Birkaç saniyelik kayıt.')}
          <br />
          <span className="sv-grad sv-grad--violet">{t('Senin sesin, yeni cümleler.')}</span>
        </h2>
        <p className="sv-lead">
          {t('Tek kişinin konuştuğu, müziksiz, temiz 3–15 saniyelik bir kayıt yükle. Kaydın metnini de girersen klon belirgin biçimde benzer; SesVer bunu otomatik yazıya da dökebilir.')}
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
                <strong>{t('Kaynak ses')}</strong>
                <span>{t('Senin kısa bir kaydın')}</span>
              </div>
              <AudioDemo src={asset('/audio/sesver/kaynak-ses.mp3')} label="Dinle" tone="source" />
            </div>
            <div className="sv-clone__sim">
              <span className="sv-mono">{t('benzerlik')}</span>
              <span className="sv-clone__num" dir="ltr">
                {simPre}
                {reduce ? 96 : <Motion.span>{simNum}</Motion.span>}
                {simPost}
              </span>
            </div>
            <div className="sv-clone__item">
              <span className="sv-dot sv-dot--clone" />
              <div>
                <strong>{t('Klon')}</strong>
                <span>{t('Aynı ses, yepyeni bir metin')}</span>
              </div>
              <AudioDemo src={asset('/audio/sesver/klon-demo.mp3')} label="Dinle" tone="clone" />
            </div>
          </div>
        </div>
        <p className="sv-note">{t('Görsel temsilidir; benzerlik değeri bir ölçüm değil, kayda ve donanıma göre değişir.')}</p>
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

// "Neden yerel" sunumu: metinler LOCAL'da kalır; burada yalnız ikon ve vurgu eşlemesi var.
const LOCAL_ICON = { 'Bulut yok': 'cloudOff', 'Hesap ve ücret yok': 'key', 'Güçlü model': 'chip' };
// LOCAL'daki model cümlesinden türetilmiş görsel sayılar (paragraf zaten aynısını söylüyor; ekran okuyucudan gizli).
const MODEL_STATS = [
  { n: '2', u: 'B', l: 'parametre' },
  { n: '30', l: 'dil' },
  { n: '48', u: 'kHz', l: 'çıktı' }
];

// Basit çizgi ikonlar (24×24, stroke = currentColor).
const LOCAL_GLYPHS = {
  cloudOff: ['M7.5 18.5h9.25a4.25 4.25 0 0 0 .6-8.46A6 6 0 0 0 6.1 11a3.75 3.75 0 0 0 1.4 7.5Z', 'M4 4l16 16'],
  key: ['M12.8 11.2 20 4', 'M17.5 6.5l2 2', 'M15 9l1.8 1.8', 'M8 21a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z'],
  chip: ['M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z', 'M9.5 9.5h5v5h-5z', 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3'],
  doc: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z', 'M14 3v5h5', 'M9 13h6M9 17h4'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  cross: ['M7 7l10 10M17 7 7 17'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  box: ['M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9'],
  chevron: ['M6 9l6 6 6-6']
};

function LocalGlyph({ name }) {
  return (
    <svg className="sv-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {LOCAL_GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// "Lisans, açıkça": varsayılan kapalı, tıkla-aç (DevelopmentMap legend deseni: aria-expanded + hidden).
function LocalLicense({ reduce }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Rise reduce={reduce} className={`sv-card sv-license${open ? ' is-open' : ''}`}>
      {/* WAI accordion deseni: başlık > düğme (h3 düğmenin içine konamaz). */}
      <h3 className="sv-license__title">
        <button type="button" className="sv-license__toggle" aria-expanded={open} aria-controls="sv-license-body" onClick={() => setOpen((v) => !v)}>
          <span className="sv-license__icon">
            <LocalGlyph name="doc" />
          </span>
          <span className="sv-license__head">
            <span className="sv-license__name">{t('Lisans, açıkça')}</span>
            <span className="sv-mono sv-license__tag">PolyForm Noncommercial 1.0.0</span>
          </span>
          <span className="sv-license__chev">
            <LocalGlyph name="chevron" />
          </span>
        </button>
      </h3>
      <ul id="sv-license-body" className="sv-license__body" hidden={!open}>
        <li>
          <span className="sv-license__dot sv-license__dot--ok">
            <LocalGlyph name="check" />
          </span>
          <Rich html={t('<strong>SesVer\'in kodu</strong> <span class="sv-mono">PolyForm Noncommercial 1.0.0</span> lisanslıdır. Kişisel kullanım, inceleme, eğitim, araştırma ve değiştirme serbesttir.')} />
        </li>
        <li>
          <span className="sv-license__dot sv-license__dot--no">
            <LocalGlyph name="cross" />
          </span>
          <Rich html={t("<strong>Ticari kullanım ve yeniden satış izinli değildir.</strong> Ticari bir ürüne ya da servise dahil etmek için HamaratLabs'ten ayrıca izin gerekir.")} />
        </li>
        <li>
          <span className="sv-license__dot sv-license__dot--src">
            <LocalGlyph name="eye" />
          </span>
          <p>{t('Kaynak kodu açık ve incelenebilir; ancak bu lisans OSI tanımlı bir “open source” lisansı değildir.')}</p>
        </li>
        <li>
          <span className="sv-license__dot sv-license__dot--dep">
            <LocalGlyph name="box" />
          </span>
          <Rich html={t('<strong>VoxCPM2 modeli</strong> ve OpenBMB/VoxCPM kodu ayrı bir bağımlılıktır ve kendi Apache-2.0 lisansı altındadır.')} />
        </li>
      </ul>
    </Rise>
  );
}

// Dil durumu: seçili kod + yüklenmiş sözlük. Sözlük gelene kadar önceki dil gösterilir (yarım çeviri/yön karışması olmaz).
function useLangState() {
  const [lang, setLangState] = useState(initialLang);
  const [loaded, setLoaded] = useState({ lang: DEFAULT_LANG, dict: null });

  useEffect(() => {
    if (lang === DEFAULT_LANG) return undefined;
    let live = true;
    loadDict(lang).then((dict) => {
      if (live) setLoaded({ lang, dict });
    });
    return () => {
      live = false;
    };
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code);
    saveLang(code);
    // Paylaşılabilir bağlantı: ?lang=<kod> (Türkçe varsayılan, parametresiz). Yol değişmez; yönlendirme etkilenmez.
    const url = new URL(window.location.href);
    if (code === DEFAULT_LANG) url.searchParams.delete('lang');
    else url.searchParams.set('lang', code);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  const shown = lang === DEFAULT_LANG ? DEFAULT_LANG : loaded.lang;
  const dict = shown === DEFAULT_LANG ? null : loaded.dict;
  return useMemo(() => ({ lang: shown, selected: lang, setLang, t: makeT(dict) }), [shown, lang, setLang, dict]);
}

export default function SesVerSite() {
  const reduce = useReducedMotion();
  const i18n = useLangState();
  const { lang, t } = i18n;
  const dir = isRtl(lang) ? 'rtl' : 'ltr';

  // Ana sitenin html arka planı farklı olabilir; bu sayfadayken başlık ve kaydırma taşması krem olsun, çıkınca geri dönsün.
  useEffect(() => {
    const root = document.documentElement;
    const prev = { bg: root.style.background, scheme: root.style.colorScheme };
    root.style.background = BG;
    root.style.colorScheme = 'light';
    return () => {
      root.style.background = prev.bg;
      root.style.colorScheme = prev.scheme;
    };
  }, []);

  // Başlık ve <html lang/dir> seçili arayüz dilini izler; sayfadan çıkınca eski hâline döner.
  useEffect(() => {
    const root = document.documentElement;
    const prev = { title: document.title, lang: root.lang, dir: root.dir };
    document.title = t(TITLE);
    root.lang = lang;
    root.dir = dir;
    return () => {
      document.title = prev.title;
      root.lang = prev.lang;
      root.dir = prev.dir;
    };
  }, [t, lang, dir]);

  return (
    <LangContext.Provider value={i18n}>
    <div className="sv" lang={lang} dir={dir}>
      <Nav />
      <main>
        <Hero reduce={reduce} />

        <section className="sv-features">
          {FEATURES.map((f, i) => (
            <Rise key={f.k} reduce={reduce} delay={i * 0.06} className="sv-card sv-feature">
              <h3>{t(f.k)}</h3>
              <p>{t(f.v)}</p>
            </Rise>
          ))}
        </section>

        <TtsDemo reduce={reduce} />
        <CloneDemo reduce={reduce} />

        <section className="sv-ethics">
          <Rise reduce={reduce} className="sv-ethics__box">
            <p className="sv-eyebrow sv-eyebrow--violet">{t('Rıza önce gelir')}</p>
            <h2 className="sv-h3">{t('Sadece kendi sesini veya açık izin aldığın bir sesi klonla.')}</h2>
            <Rich html={t('Kayıttan kalıcı ses oluştururken izin kutucuğu işaretlenmeden kaydedilemez. Kimliğe bürünme, dolandırıcılık veya yanıltıcı içerik için kullanma. Üretilen içeriği paylaşırken <strong>“AI ile üretildi”</strong> diye açıkça etiketle; uygulama sese otomatik filigran eklemez. Üretilen içerikten ve kullanımdan kullanıcı sorumludur.')} />
          </Rise>
        </section>

        <section id="yerel" className="sv-local">
          <Rise reduce={reduce}>
            <p className="sv-eyebrow">{t('Neden yerel')}</p>
            <h2 className="sv-h2">{t('Sesin, bilgisayarından çıkmaz.')}</h2>
          </Rise>
          <div className="sv-local__grid">
            {LOCAL.map((f, i) => {
              const isModel = f.k === 'Güçlü model';
              return (
                <Rise
                  key={f.k}
                  reduce={reduce}
                  delay={i * 0.08}
                  className={`sv-card sv-local__card${isModel ? ' sv-local__card--model' : ''}`}
                >
                  <span className="sv-local__icon">
                    <LocalGlyph name={LOCAL_ICON[f.k]} />
                  </span>
                  <h3>{t(f.k)}</h3>
                  <p>{t(f.v)}</p>
                  {isModel && (
                    <div className="sv-local__stats" aria-hidden="true">
                      {MODEL_STATS.map((s) => (
                        <div key={s.l} className="sv-local__stat">
                          <span className="sv-local__num" dir="ltr">
                            {s.n}
                            {s.u && <small>{s.u}</small>}
                          </span>
                          <span className="sv-local__label">{t(s.l)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Rise>
              );
            })}
          </div>
          <LocalLicense reduce={reduce} />
        </section>

        <section id="kur" className="sv-cta">
          <Rise reduce={reduce} className="sv-cta__head">
            <h2 className="sv-h2">
              {t('Birkaç tıkla')} <span className="sv-grad">{t('kur.')}</span>
            </h2>
            <p className="sv-lead">{t('İlk çalıştırmada gereken her şey (Python dahil) otomatik iner. En az 20 GB boş alan ve internet gerekir; model yaklaşık 5 GB.')}</p>
          </Rise>
          <div className="sv-cta__grid">
            <Rise reduce={reduce} className="sv-card sv-step">
              <span className="sv-mono">Windows</span>
              <ol>
                <Rich as="li" html={t('{dosya} dosyasını indir.', { dosya: `<a href="${WIN_EXE}">SesVer-Kurulum-Windows.exe</a>` })} />
                <Rich as="li" html={t('Çift tıkla; “Windows bilgisayarınızı korudu” derse <em>Ek bilgi → Yine de çalıştır</em>.')} />
                <Rich as="li" html={t('Lisansı kabul et → <em>İleri → İleri → Kur</em>. Başlat menüsündeki SesVer simgesiyle aç.')} />
              </ol>
            </Rise>
            <Rise reduce={reduce} delay={0.08} className="sv-card sv-step">
              <span className="sv-mono">macOS</span>
              <ol>
                <Rich as="li" html={t("GitHub sayfasında <em>Code → Download ZIP</em>, sonra ZIP'e çift tıkla.")} />
                <Rich as="li" html={t('Klasördeki <span class="sv-mono">MACOS_BASLAT.command</span> dosyasına çift tıkla (uyarı çıkarsa sağ tık → Aç).')} />
                <Rich as="li" html={t('Terminal “Running on local URL” yazınca tarayıcıda <span class="sv-mono">127.0.0.1:7860</span> adresini aç.')} />
              </ol>
            </Rise>
          </div>
          <Rise reduce={reduce} className="sv-cta__actions">
            <a className="sv-btn sv-btn--primary" href={GITHUB} target="_blank" rel="noopener noreferrer">{t("GitHub'dan indir")}</a>
            <span className="sv-note">{t("8 GB RAM'li cihazlarda kullanım önerilmez. Ayrıntılı kurulum ve sorun giderme README'de.")}</span>
          </Rise>
        </section>
      </main>

      <footer className="sv-foot">
        <span>SesVer · © HamaratLabs</span>
        <Link to="/" className="sv-foot__maker">
          <img src={asset('/brand/hamaratlabs-logo-main.svg')} alt="hamaratlabs" width="1328" height="220" />
        </Link>
      </footer>
    </div>
    </LangContext.Provider>
  );
}
