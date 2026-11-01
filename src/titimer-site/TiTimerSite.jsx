import { useEffect, useState } from 'react';
import { Link } from '../nav';
import { asset } from '../base';
import { LINKS } from '../data';
import Titi from './Titi';
import './titimer.css';

// tiTimer'ın kendi tanıtım sayfası (/titimer). Ana sitenin topbar/footer'ı olmadan çizilir (App.jsx → STANDALONE_PAGES).
// Görsel dil uygulamanın bugünkü hâlinden alınır (titimer repo: lib/app_theme.dart, lib/design/*):
// kâğıt zemin + suluboya lekeler, Kalam (el yazısı başlık) + Nunito (gövde), teal/mercan, halka sayaçlar, maskot Titi.
// Ekran görüntüleri gerçek uygulama ağacından üretilen mağaza setidir (store/ortak/ekran, 2026-11-01).
// Durum bilgisi pm-titimer'dan: sürüm 0.1.0+1, release yapılandırması hazır, henüz test kanalı yok. Tarih verilmez.

const TITLE = 'tiTimer: Odaklan. Mola ver. Tekrarla.';
const DESC = 'Neye ne kadar zaman ayırdığını sakin biçimde gösteren, tamamen telefonunda çalışan odak ve mola sayacı.';
const shot = name => asset(`/titimer-screens/${name}.webp`);

const pad = n => String(n).padStart(2, '0');
const mmss = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const clock = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function Sparkle({ className = '', color = 'coral' }) {
  return (
    <svg className={`tt-sparkle tt-sparkle--${color} ${className}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 0c.6 5.2 3.6 8.6 10 10-6.4 1.4-9.4 4.8-10 10-.6-5.2-3.6-8.6-10-10C6.4 8.6 9.4 5.2 10 0Z" />
    </svg>
  );
}

function Logo({ className = '' }) {
  return (
    <span className={`tt-logo ${className}`}>
      <Titi className="tt-logo__titi" />
      <span className="tt-logo__word">
        <b>ti</b>Timer
      </span>
    </span>
  );
}

function Phone({ src, alt, eager = false, className = '', children }) {
  return (
    <figure className={`tt-phone ${className}`}>
      <img src={src} alt={alt} width="720" height="1600" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      {children}
    </figure>
  );
}

function StoreButtons() {
  return (
    <div className="tt-stores" role="group" aria-label="Mağazalar">
      <span className="tt-store" aria-disabled="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 2.8v18.4c0 .5.5.8.9.6L20.6 13a1.1 1.1 0 0 0 0-2L4.9 2.2c-.4-.2-.9.1-.9.6Z" />
        </svg>
        <span>
          Google Play
          <small>yakında</small>
        </span>
      </span>
      <span className="tt-store" aria-disabled="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.2 3-2.4 1-1.4 1.4-2.7 1.4-2.8 0 0-2.7-1-2.7-4.3ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" />
        </svg>
        <span>
          App Store
          <small>yakında</small>
        </span>
      </span>
    </div>
  );
}

// Dış halka: günün akışı (3 çalışma + 2 planlı mola), uygulamadaki Pomodoro ekranıyla aynı düzen.
const SEGMENTS = ['work', 'break', 'work', 'break', 'work'];
const GAP = 24;
const SEG = (1000 - GAP * SEGMENTS.length) / SEGMENTS.length;

function OuterRing({ blockProgress }) {
  return (
    <svg className="tt-outer" viewBox="0 0 300 300" aria-hidden="true">
      {SEGMENTS.map((kind, i) => {
        const start = i * (SEG + GAP) + GAP / 2;
        const common = {
          cx: 150,
          cy: 150,
          r: 138,
          fill: 'none',
          pathLength: 1000,
          transform: 'rotate(-90 150 150)',
          strokeDashoffset: -start
        };
        return (
          <g key={i}>
            <circle {...common} className={`tt-outer__seg tt-outer__seg--${kind}`} strokeDasharray={`${SEG} ${1000 - SEG}`} />
            {i === 0 && blockProgress > 0 && (
              <circle {...common} className="tt-outer__fill" strokeDasharray={`${(SEG * blockProgress).toFixed(1)} 1000`} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Sayfada çalışan küçük örnek: uygulamadaki Sayaç ekranının davranışı (Molayı başlat → plansız mola → Devam ettir).
// Hiçbir şey kaydedilmez; yalnız arayüzün nasıl davrandığını gösterir.
const BLOCK = 25 * 60;
const START_LEFT = 17 * 60 + 37; // mağaza görüntüsündeki an: 17:37

function SayacDemo() {
  const [mode, setMode] = useState('running'); // running | break | ready
  const [left, setLeft] = useState(START_LEFT);
  const [breakSec, setBreakSec] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (mode === 'running') setLeft(l => Math.max(0, l - 1));
      if (mode === 'break') setBreakSec(b => b + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  const onBreak = mode === 'break';
  const ready = mode === 'ready';
  const worked = BLOCK - left;
  const progress = onBreak ? Math.min(breakSec / (BLOCK + 600), 1) : ready ? 0 : worked / BLOCK;
  const done = mode === 'running' && left === 0;
  const phase = ready ? 'Hazır' : onBreak ? 'Plansız mola' : done ? 'Molaya başla' : 'Odaklanıyor · Blok 1';
  const end = new Date(now.getTime() + (left + 600) * 1000);
  const mood = onBreak ? 'relax' : mode === 'running' && !done ? 'focus' : 'happy';

  return (
    <div className={`tt-demo tt-demo--${onBreak ? 'break' : mode}`}>
      <div className="tt-demo__head">
        <span className="tt-demo__title">Sayaç</span>
        <span className="tt-demo__cat">Ders çalışma</span>
      </div>
      <p className="tt-demo__time" aria-live="off">
        {onBreak ? mmss(breakSec) : mmss(ready ? BLOCK : left)}
      </p>
      <div className="tt-demo__ring">
        <OuterRing blockProgress={ready ? 0 : worked / BLOCK} />
        <Titi mood={mood} progress={progress} ringColor={onBreak ? '#F17D68' : '#2F6D7C'} className="tt-demo__titi" />
      </div>
      <p className="tt-demo__phase" aria-live="polite">
        {phase}
      </p>
      {!ready && <p className="tt-demo__end">Bitiş: {clock(end)}</p>}
      <div className="tt-demo__actions">
        {ready ? (
          <button
            type="button"
            className="tt-btn tt-btn--fill"
            onClick={() => {
              setLeft(BLOCK);
              setBreakSec(0);
              setMode('running');
            }}
          >
            Başlat
          </button>
        ) : onBreak ? (
          <button type="button" className="tt-btn tt-btn--fill" onClick={() => setMode('running')}>
            Devam ettir
          </button>
        ) : (
          <button type="button" className="tt-btn tt-btn--fill" onClick={() => setMode('break')} disabled={done}>
            Molayı başlat
          </button>
        )}
        {!ready && (
          <button type="button" className="tt-btn tt-btn--line" onClick={() => setMode('ready')}>
            Durdur
          </button>
        )}
      </div>
    </div>
  );
}

// Raporlar ekranı üzerindeki notlar. top: ekran görüntüsü yüksekliğine göre konum (%).
const REPORT_NOTES = [
  { top: 22, side: 'l', title: 'Gün gün geri bak', text: 'Üstteki şeritten istediğin güne geçersin.' },
  { top: 36, side: 'r', title: 'Odak süresi', text: 'O gün başlıklarına toplam ne kadar ayırdığın, varsa hedefinle birlikte.' },
  { top: 51, side: 'l', title: 'Plansız mola', text: 'Ayrı tutulur, odak süresine eklenmez.' },
  { top: 75, side: 'r', title: 'Haftanın dağılımı', text: 'Bu hafta zamanın başlıklar arasında nasıl paylaştı.' }
];

const STEPS = ['Fikir', 'Tasarım', 'Yapım', 'İç deneme', 'Açık beta', 'Yayın'];
const CURRENT_STEP = 3; // data.js → tiTimer.devStep ile aynı

export default function TiTimerSite() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const theme = document.querySelector('meta[name="theme-color"]');
    const prev = { title: document.title, desc: meta?.getAttribute('content'), theme: theme?.getAttribute('content') };
    document.title = TITLE;
    meta?.setAttribute('content', DESC);
    theme?.setAttribute('content', '#F8F7F3');
    return () => {
      document.title = prev.title;
      if (meta && prev.desc != null) meta.setAttribute('content', prev.desc);
      if (theme && prev.theme != null) theme.setAttribute('content', prev.theme);
    };
  }, []);

  return (
    <div className="tt">
      <a className="tt-skip" href="#tt-main">
        İçeriğe geç
      </a>
      <header className="tt-nav">
        <a href="#tt-top" className="tt-nav__home" aria-label="tiTimer, sayfanın başı">
          <Logo />
        </a>
        <nav className="tt-nav__links" aria-label="Sayfa içi">
          <a href="#sayac">Sayaç</a>
          <a href="#raporlar">Raporlar</a>
          <a href="#yerel">Gizlilik</a>
          <a href="#durum">Ne zaman?</a>
        </nav>
        <Link to="/uretiyorum/titimer" className="tt-nav__lab">
          hamaratlabs
        </Link>
      </header>

      <main id="tt-main">
        {/* 1. Giriş */}
        <section className="tt-hero" id="tt-top">
          <i className="tt-blob tt-blob--mist tt-hero__b1" aria-hidden="true" />
          <i className="tt-blob tt-blob--sand tt-hero__b2" aria-hidden="true" />
          <i className="tt-blob tt-blob--blush tt-hero__b3" aria-hidden="true" />
          <div className="tt-wrap tt-hero__grid">
            <div className="tt-hero__copy">
              <p className="tt-status">
                <i aria-hidden="true" />
                Geliştirmede · ilk sürüm mağaza hazırlığında
              </p>
              <h1>
                Odaklan.
                <br />
                <span className="tt-mark">Mola ver.</span>
                <br />
                Tekrarla.
              </h1>
              <p className="tt-hero__lead">
                tiTimer, neye ne kadar zaman ayırdığını sakin biçimde gösteren bir odak sayacı. Hesap yok, internet yok; her şey
                telefonunda kalır.
              </p>
              <StoreButtons />
              <p className="tt-hero__note">Henüz indirilemiyor. Mağazaya çıkınca bağlantılar burada olacak.</p>
            </div>
            <div className="tt-hero__art">
              <Sparkle className="tt-hero__s1" />
              <Sparkle className="tt-hero__s2" color="teal" />
              <Sparkle className="tt-hero__s3" />
              <Phone
                eager
                className="tt-hero__back"
                src={shot('odak-modu')}
                alt="tiTimer Sayaç ekranı: 17:37 kaldı, Odaklanıyor · Blok 1, Bitiş 20:25"
              />
              <Phone
                eager
                className="tt-hero__front"
                src={shot('ana-sayfa')}
                alt="tiTimer ana sayfa: Merhaba!, alıntı kartı ve Odak alanların halkaları (Ders çalışma 4/6, Kitap okuma 1/2)"
              />
              <Titi mood="wink" className="tt-hero__titi" />
            </div>
          </div>
        </section>

        {/* 2. Odak alanları */}
        <section className="tt-areas" aria-labelledby="tt-areas-h">
          <div className="tt-wrap tt-areas__grid">
            <div className="tt-areas__rings" aria-hidden="true">
              {[
                { n: '4', of: '6', p: 0.66, label: 'Ders çalışma', tone: 'teal' },
                { n: '1', of: '2', p: 0.5, label: 'Kitap okuma', tone: 'coral' },
                { n: '2', of: '3', p: 0.66, label: 'İngilizce', tone: 'teal' },
                { n: '+', of: '', p: 0, label: 'Ekle', tone: 'add' }
              ].map(r => (
                <div key={r.label} className={`tt-ring tt-ring--${r.tone}`} style={{ '--p': r.p }}>
                  <svg viewBox="0 0 120 120">
                    <circle className="tt-ring__track" cx="60" cy="60" r="48" />
                    {r.p > 0 && <circle className="tt-ring__fill" cx="60" cy="60" r="48" pathLength="100" />}
                  </svg>
                  <span className="tt-ring__n">
                    {r.n}
                    {r.of && <small>/{r.of}</small>}
                  </span>
                  <span className="tt-ring__label">{r.label}</span>
                </div>
              ))}
            </div>
            <div className="tt-areas__copy">
              <p className="tt-kicker">Odak alanların</p>
              <h2 id="tt-areas-h">Başlıklarını sen açarsın.</h2>
              <p>
                Ders çalışma, kitap okuma, yan proje... Her başlık ana sayfada bir halka olur. Halka o gün kaç Pomodoro yaptığını
                gösterir; hedef koyarsan hedefe göre dolar.
              </p>
              <p className="tt-soft">Seri, rozet ya da sıralama yok. Sadece neye ne kadar zaman verdiğin.</p>
            </div>
          </div>
        </section>

        {/* 3. Sayaç (canlı örnek) */}
        <section className="tt-focus" id="sayac" aria-labelledby="tt-focus-h">
          <i className="tt-blob tt-blob--mist tt-focus__b1" aria-hidden="true" />
          <i className="tt-blob tt-blob--blush tt-focus__b2" aria-hidden="true" />
          <div className="tt-wrap tt-focus__grid">
            <div className="tt-focus__copy">
              <p className="tt-kicker">Sayaç</p>
              <h2 id="tt-focus-h">
                Tek sayaç,
                <br />
                iki halka.
              </h2>
              <p>
                Bir başlık seçip başlatırsın. Titi'nin yüzündeki halka o anki bloğu, dıştaki halka günün akışını gösterir: üç
                çalışma, arada iki planlı mola. Ortada yalnız kalan süre durur.
              </p>
              <p>
                Ara vermen gerekirse <strong>Molayı başlat</strong>. Döndüğünde geçen süre çalışmandan düşmez, ayrı bir plansız mola
                olarak yazılır.
              </p>
              <p className="tt-soft tt-focus__try">Yandaki sayaç bu sayfada çalışıyor. Dokunup dene; hiçbir şey kaydedilmez.</p>
            </div>
            <div className="tt-focus__demo">
              <SayacDemo />
            </div>
          </div>
        </section>

        {/* 4. Raporlar */}
        <section className="tt-reports" id="raporlar" aria-labelledby="tt-reports-h">
          <div className="tt-wrap">
            <div className="tt-reports__head">
              <p className="tt-kicker">Raporlar</p>
              <h2 id="tt-reports-h">Günün sonunda tek bakış.</h2>
            </div>
            <div className="tt-annot">
              <Phone src={shot('raporlar')} alt="tiTimer Raporlar: 1 Kasım, odak süresi 3 sa 15 dk, plansız mola 12 dk, haftanın başlık dağılımı" className="tt-annot__phone">
                {REPORT_NOTES.map((n, i) => (
                  <span key={n.title} className="tt-annot__dot" style={{ top: `${n.top}%` }} aria-hidden="true">
                    {i + 1}
                  </span>
                ))}
              </Phone>
              <ol className="tt-annot__notes">
                {REPORT_NOTES.map((n, i) => (
                  <li key={n.title} className={`tt-annot__note tt-annot__note--${n.side}`} style={{ '--top': `${n.top}%` }}>
                    <em aria-hidden="true">{i + 1}</em>
                    <strong>{n.title}</strong>
                    <span>{n.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 5. Elle süre */}
        <section className="tt-manual" aria-labelledby="tt-manual-h">
          <i className="tt-blob tt-blob--sand tt-manual__b1" aria-hidden="true" />
          <div className="tt-wrap tt-manual__grid">
            <div className="tt-manual__copy">
              <p className="tt-kicker">Manuel süre</p>
              <h2 id="tt-manual-h">Sayacı açmayı unuttun mu?</h2>
              <p>
                Olur. Kütüphanede iki saat okuyup telefonu hiç açmadıysan süreyi sonradan eklersin: başlığı seç, süreyi ayarla, günü
                işaretle. İstersen kısa bir not düş.
              </p>
              <ul className="tt-ticks">
                <li>Başlık seç</li>
                <li>Süreyi artır ya da azalt</li>
                <li>Geçmiş bir günü seç</li>
                <li>Not ekle (isteğe bağlı)</li>
              </ul>
            </div>
            <Phone
              src={shot('manuel-sure')}
              alt="tiTimer Manuel süre penceresi: Kitap okuma, 30 dk, 1 Kasım, not: Kütüphanede okudum"
              className="tt-manual__phone"
            />
          </div>
        </section>

        {/* 6. Söz */}
        <section className="tt-quote" aria-label="Karşılama ekranındaki söz">
          <div className="tt-wrap tt-quote__inner">
            <Sparkle className="tt-quote__s1" color="teal" />
            <Sparkle className="tt-quote__s2" />
            <blockquote lang="en">
              <p>
                "It's <em>not enough</em> to be busy, so are the ants. The question is, what are we <em>busy</em> about?"
              </p>
              <footer>Henry David Thoreau</footer>
            </blockquote>
            <p className="tt-quote__tr">
              Uygulamanın karşılama ekranındaki söz. Meşgul olmak yetmez; asıl soru neyle meşgul olduğumuz.
            </p>
            <Titi mood="happy" className="tt-quote__titi" />
          </div>
        </section>

        {/* 7. Yerel */}
        <section className="tt-local" id="yerel" aria-labelledby="tt-local-h">
          <div className="tt-wrap tt-local__grid">
            <div>
              <p className="tt-kicker">Gizlilik</p>
              <h2 id="tt-local-h">Telefonunda kalır.</h2>
              <p>tiTimer bir sunucuya bağlanmaz. Kayıtların yalnız senin cihazında durur.</p>
              <a className="tt-link" href="/titimer/gizlilik/">
                Gizlilik politikasını oku
              </a>
            </div>
            <ul className="tt-local__list">
              <li>
                <strong>Hesap yok.</strong> Kayıt olmadan, e-posta vermeden kullanırsın.
              </li>
              <li>
                <strong>İnternete bağlanmaz.</strong> Android sürümü internet izni bile istemez; yazı tipleri uygulamanın içinde.
              </li>
              <li>
                <strong>Reklam ve izleme yok.</strong> Analiz aracı, reklam kitaplığı, bildirim izni yok.
              </li>
              <li>
                <strong>Silmek senin elinde.</strong> Ayarlar'daki "Tüm verileri sıfırla" her şeyi kalıcı olarak siler.
              </li>
            </ul>
          </div>
        </section>

        {/* 8. Durum */}
        <section className="tt-when" id="durum" aria-labelledby="tt-when-h">
          <i className="tt-blob tt-blob--mist tt-when__b1" aria-hidden="true" />
          <div className="tt-wrap tt-when__inner">
            <p className="tt-kicker">Ne zaman?</p>
            <h2 id="tt-when-h">Henüz mağazada değil.</h2>
            <p>
              tiTimer geliştirme aşamasında; ilk sürüm (0.1.0) mağaza hazırlığında. Tarih vermiyorum.
            </p>
            <ol className="tt-steps" aria-label={`Aşama ${CURRENT_STEP} / ${STEPS.length}: ${STEPS[CURRENT_STEP - 1]}`}>
              {STEPS.map((s, i) => {
                const state = i + 1 < CURRENT_STEP ? 'done' : i + 1 === CURRENT_STEP ? 'now' : 'next';
                return (
                  <li key={s} className={`is-${state}`} aria-current={state === 'now' ? 'step' : undefined}>
                    <i aria-hidden="true" />
                    {s}
                  </li>
                );
              })}
            </ol>
            <StoreButtons />
            <div className="tt-when__links">
              <a className="tt-link" href={LINKS.contact} target="_blank" rel="noopener noreferrer">
                Erken denemek istersen yaz
              </a>
              <a className="tt-link tt-link--soft" href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
                Gelişmeler Instagram'da: {LINKS.instagramHandle}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="tt-foot">
        <div className="tt-wrap tt-foot__grid">
          <Logo />
          <nav aria-label="Yasal ve destek">
            <a href="/titimer/gizlilik/">Gizlilik</a>
            <a href="/titimer/privacy/">Privacy</a>
            <a href="/titimer/destek/">Destek</a>
            <a href="/titimer/support/">Support</a>
          </nav>
          <p>
            <Link to="/uretiyorum/titimer">hamaratlabs</Link> projesi · Yusuf Hamarat
          </p>
        </div>
      </footer>
    </div>
  );
}
