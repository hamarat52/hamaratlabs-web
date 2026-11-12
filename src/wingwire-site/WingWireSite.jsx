import { useEffect, useRef, useState } from 'react';
import { asset } from '../base';
import { Link } from '../nav';
import { motorKur } from './diyagram';
import PlatformLogolari from './PlatformLogolari';
import './fonts.css';
import './WingWireSite.css';
import icon from './img/icon.webp';
import ajanAcik from './img/u-ajanlar-yeni-acik.webp';
import ajanKoyu from './img/u-ajanlar-yeni-koyu.webp';
import sohbetAcik from './img/u-sohbet-acik.webp';
import sohbetKoyu from './img/u-sohbet-koyu.webp';
import bildirimAcik from './img/u-bildirim-acik.webp';
import bildirimKoyu from './img/u-bildirim-koyu.webp';
import bagliAcik from './img/u-bildirim-bagli-acik.webp';
import bagliKoyu from './img/u-bildirim-bagli-koyu.webp';
import widgetAcik from './img/u-w-baglanti-acik.webp';
import widgetKoyu from './img/u-w-baglanti-koyu.webp';
import onayAcik from './img/u-onay-acik.webp';
import onayKoyu from './img/u-onay-koyu.webp';
import paylasAcik from './img/u-paylas-acik.webp';
import paylasKoyu from './img/u-paylas-koyu.webp';

// WingWire'ın kendi sitesi: hamaratlabs.com/wingwire (paylaşılan topbar/footer yok, App.jsx STANDALONE_PAGES).
// Onaylı taslak: docs/taslak/wingwire-landing-v2/5 (dal design/ww-landing-v2, aef1981); seçilen dallar: açılış Taslak 2
// ("Masadan kalk", bildirim düşer ve telefona uçar), diyagram masaüstünde Yön A (tuval), ışık güçlü, telefonda sade düzen 1.
// Aydınlık ve koyu tema (Theme.kt token'ları): açılışta cihaz tercihi, sağ üstteki düğmeyle elle; seçim saklanmaz.
// Hareket: CSS geçişleri, tek WAAPI (bildirimin uçuşu) ve diyagram motoru (diyagram.js). WebGL/Canvas yok.
// Hareket azaltmada bildirim metnin altında durur, telefon sohbeti gösterir, hüzme kurulmaz; içerik eksiksiz.

// Android APK: public/downloads/'taki dosyayla aynı kalmalı (bkz. o klasördeki README.md). Sürüm şu an güncellenmiyor.
const APK_URL = asset('/downloads/wingwire-0.1.1.apk');
const TITLE = 'WingWire · Masadan kalk';
const DESC = 'Bilgisayarındaki Hermes Agent için Android uygulaması.';
const ZEMIN = { acik: '#F7F5F0', koyu: '#0B0F14' };

const ilkTema = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik');
const hareketAz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nötr, kendi çizilmiş simgeler (üçüncü taraf logosu yok).
function Simgeler() {
  return (
    <svg className="ww-simge" width="0" height="0" aria-hidden="true" focusable="false">
      <symbol id="i-tel" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></symbol>
      <symbol id="i-ag" viewBox="0 0 24 24"><path d="M4.5 9.5a11 11 0 0 1 15 0M7.5 12.8a6.6 6.6 0 0 1 9 0" /><circle cx="12" cy="16.6" r="1.5" /></symbol>
      <symbol id="i-her" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="3" /><path d="M7 10l3 2.5L7 15M12.5 15h4.5" /></symbol>
      <symbol id="i-mod" viewBox="0 0 24 24"><path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z" /></symbol>
      <symbol id="i-web" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M3 9h18M6.2 6.8h.01M8.6 6.8h.01" /></symbol>
      <symbol id="i-kapi" viewBox="0 0 24 24"><path d="M5 20.5V10a7 7 0 0 1 14 0v10.5M3 20.5h18M12 13v3" /></symbol>
      <symbol id="i-ses" viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3" /></symbol>
      <symbol id="i-lmp" viewBox="0 0 24 24"><path d="M21 3.5L10.5 14M21 3.5l-6.5 17-4-6.5-6.5-4z" /></symbol>
      <symbol id="i-film" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M8 3.5v17M16 3.5v17M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" /></symbol>
      <symbol id="i-git" viewBox="0 0 24 24"><circle cx="7" cy="5.5" r="2" /><circle cx="7" cy="18.5" r="2" /><circle cx="17" cy="8" r="2" /><path d="M7 7.5v9M17 10c0 4-5 3.5-9.2 6.8" /></symbol>
      <symbol id="i-mag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></symbol>
      <symbol id="i-disk" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M7 14h.01M10 14h.01M14 10h4" /></symbol>
      <symbol id="i-bulut" viewBox="0 0 24 24"><path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.8 8.7 4.9 4.9 0 0 1 17 18.5z" /></symbol>
      <symbol id="i-kure" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" /></symbol>
    </svg>
  );
}

const Ik = ({ ad }) => (
  <svg className="ik" aria-hidden="true">
    <use href={`#i-${ad}`} />
  </svg>
);

const IndirSimge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </svg>
);

// Şerit etiketleri: motor taşınan türün <span>'ını (ilk üç çocuk) vurgular.
const CipU = ({ style }) => (
  <span className="cip" data-c="u" style={style}>
    <span>mesaj</span> · <span>onay</span> · <span>dosya</span>
  </span>
);
const CipD = ({ style }) => (
  <span className="cip" data-c="d" style={style}>
    <span>bildirim</span> · <span>onay isteği</span> · <span>Beni ara</span> <em>(isteğe bağlı)</em>
  </span>
);

export default function WingWireSite() {
  const [tema, setTema] = useState(ilkTema);
  const [az] = useState(hareketAz);
  const elle = useRef(false);

  // Sayfa başlığı ve açıklaması; çıkınca eski hâline döner.
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const onceki = { title: document.title, desc: meta?.getAttribute('content') };
    document.title = TITLE;
    meta?.setAttribute('content', DESC);
    return () => {
      document.title = onceki.title;
      if (meta && onceki.desc != null) meta.setAttribute('content', onceki.desc);
    };
  }, []);

  // Ana sitenin html zemini açık renkli; bu sayfadayken kaydırma taşması ve form denetimleri temayı izlesin.
  useEffect(() => {
    const root = document.documentElement;
    const onceki = { bg: root.style.background, sema: root.style.colorScheme };
    root.style.background = ZEMIN[tema];
    root.style.colorScheme = tema === 'koyu' ? 'dark' : 'light';
    return () => {
      root.style.background = onceki.bg;
      root.style.colorScheme = onceki.sema;
    };
  }, [tema]);

  // Cihaz tercihi değişirse izle (ziyaretçi düğmeyle elle seçmediyse).
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const degisti = e => {
      if (!elle.current) setTema(e.matches ? 'koyu' : 'acik');
    };
    m.addEventListener('change', degisti);
    return () => m.removeEventListener('change', degisti);
  }, []);

  const temaDegistir = () => {
    elle.current = true;
    setTema(t => (t === 'koyu' ? 'acik' : 'koyu'));
  };

  return (
    <div className={`wwl js${az ? '' : ' js-hareket'}`} data-tema={tema}>
      <Simgeler />
      <header className="ust">
        <div className="kap">
          <a className="marka" href="#ust" aria-label="WingWire, başa dön">
            <img src={icon} width="32" height="32" alt="" />
            <span className="wm" aria-hidden="true">
              <span>wing</span>
              <span className="wm__k">wire</span>
            </span>
          </a>
          <button className="tema-dg" type="button" aria-label={tema === 'koyu' ? 'Açık temaya geç' : 'Koyu temaya geç'} onClick={temaDegistir}>
            <svg className="gunes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
            </svg>
            <svg className="ay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
            </svg>
          </button>
        </div>
      </header>

      <main id="ust">
        <Acilis az={az} />
        <Ag az={az} />
        <Cepte />
        <Kurulum />
      </main>

      <footer className="alt">
        <div className="kap">
          <Link className="uretici" to="/">
            hamaratlabs.com'un bir ürünü
          </Link>
          <nav aria-label="Alt bilgi">
            <a href="https://hermes-agent.nousresearch.com/">Hermes Agent</a>
            <a href={asset('/wingwire/gizlilik/')}>Gizlilik</a>
            <a href="https://vialess.me/yusuf-hamarat">İletişim</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Bildirim({ az, bRef }) {
  return (
    <button ref={bRef} className={`bildirim${az ? ' dustu' : ''}`} type="button" aria-label="Bildirimi aç: Araştırmacı, Rapor hazır">
      <img className="t-acik" src={bildirimAcik} loading="lazy" width="720" height="336" alt="WingWire bildirimi: Araştırmacı, Rapor hazır. Yanıtla ve Okundu." />
      <img className="t-koyu" src={bildirimKoyu} loading="lazy" width="720" height="336" alt="WingWire bildirimi, koyu tema: Araştırmacı, Rapor hazır. Yanıtla ve Okundu." />
    </button>
  );
}

// Vurucu an (Taslak 2): ajanın bildirimi ziyaretçinin ekranının tepesine düşer; dokununca (ya da 5 sn sonra) telefona uçar.
function Acilis({ az }) {
  const bRef = useRef(null);
  const cepRef = useRef(null);
  const ekranRef = useRef(null);

  useEffect(() => {
    if (az) return undefined;
    const b = bRef.current, cep = cepRef.current, ekran = ekranRef.current;
    let durum = 'bekliyor', zaman = 0, gecikme = 0, an = null;
    function dus() {
      if (durum !== 'bekliyor') return;
      // ziyaretçi zaten aşağıdaysa bildirim içeriğin üstüne düşmez; telefon sohbeti gösterir
      if (window.scrollY >= 60) {
        durum = 'acildi';
        cep.classList.add('cikti');
        return;
      }
      durum = 'dustu';
      b.classList.add('dustu');
      zaman = setTimeout(ac, 5200);
    }
    function ac() {
      if (durum !== 'dustu') return;
      durum = 'aciliyor';
      clearTimeout(zaman);
      const a = b.getBoundingClientRect(), h = ekran.getBoundingClientRect();
      const s = h.width / a.width, dx = h.left + h.width / 2 - (a.left + a.width / 2), dy = h.top + (a.height * s) / 2 + h.height * 0.05 - (a.top + a.height / 2);
      b.classList.add('gidiyor');
      an = b.animate(
        [
          { transform: 'translate(-50%, 0)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(${s})`, opacity: 0.9, offset: 0.8 },
          { transform: `translate(calc(-50% + ${dx}px), ${dy - 20}px) scale(${s * 0.9})`, opacity: 0 }
        ],
        { duration: 720, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }
      );
      gecikme = setTimeout(() => cep.classList.add('cikti'), 380);
      an.onfinish = () => {
        b.hidden = true;
        durum = 'acildi';
      };
    }
    function kaydi() {
      if (durum !== 'dustu' || window.scrollY < 60) return;
      durum = 'acildi';
      clearTimeout(zaman);
      b.classList.remove('dustu');
      cep.classList.add('cikti');
    }
    b.addEventListener('click', ac);
    window.addEventListener('scroll', kaydi, { passive: true });
    const ilk = setTimeout(dus, 1500);
    return () => {
      clearTimeout(ilk);
      clearTimeout(zaman);
      clearTimeout(gecikme);
      b.removeEventListener('click', ac);
      window.removeEventListener('scroll', kaydi);
      if (an) an.cancel();
    };
  }, [az]);

  return (
    <>
      <section className="hero">
        <div className="kap">
          <div className="hero__metin">
            <h1>Masadan kalk.</h1>
            <p className="hero__alt">Ajanın bilgisayarında çalışmaya devam eder. Haberi cebine gelir.</p>
            <div className="indir">
              <a className="dg" href={APK_URL} download>
                <IndirSimge />
                APK indir
              </a>
              <span className="meta">Android · 64 bit · deneme sürümü</span>
            </div>
            {az && <Bildirim az bRef={bRef} />}
          </div>
          <div className={`cep${az ? ' cikti' : ''}`} ref={cepRef}>
            <div className="tel">
              <div className="tel__ekran" ref={ekranRef}>
                <img className="liste t-acik" src={ajanAcik} loading="lazy" width="720" height="1520" alt="WingWire Ajanlar ekranı: Araştırmacı'nın yeni mesajı okunmamış." />
                <img className="liste t-koyu" src={ajanKoyu} loading="lazy" width="720" height="1520" alt="WingWire Ajanlar ekranı, koyu tema: Araştırmacı'nın yeni mesajı okunmamış." />
                <img className="sohbet t-acik" src={sohbetAcik} loading="lazy" width="720" height="1520" alt="Araştırmacı ile Kaynak taraması sohbeti: araç kartı ve özet tablo." />
                <img className="sohbet t-koyu" src={sohbetKoyu} loading="lazy" width="720" height="1520" alt="Araştırmacı ile Kaynak taraması sohbeti, koyu tema." />
              </div>
            </div>
          </div>
        </div>
      </section>
      {!az && <Bildirim az={false} bRef={bRef} />}
    </>
  );
}

// İkinci an: canlı bağlantı diyagramı. Masaüstünde tuval, telefonda (<=620 px) sade düzen; ikisi de DOM'da, CSS biri gizler.
// Görünen düzenin motoru kurulur; ekran 620 px eşiğini geçerse öbürünün motoru da kurulur.
function Ag({ az }) {
  const aRef = useRef(null);
  const mRef = useRef(null);
  const motorlar = useRef({});
  const durduRef = useRef(false);
  const [durdu, setDurdu] = useState(false);
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    const tel620 = matchMedia('(max-width: 620px)');
    const m = {};
    motorlar.current = m;
    const al = () => {
      const k = tel620.matches ? 'm1' : 'a';
      if (!m[k]) m[k] = motorKur(k === 'a' ? aRef.current : mRef.current, k, { az, durdu: durduRef.current });
    };
    al();
    tel620.addEventListener('change', al);
    return () => {
      tel620.removeEventListener('change', al);
      Object.values(m).forEach(x => x.sok());
    };
  }, [az]);

  const durDegistir = () => {
    const v = !durduRef.current;
    durduRef.current = v;
    setDurdu(v);
    Object.values(motorlar.current).forEach(x => x.durdur(v));
  };

  return (
    <section className="bolum ag" aria-labelledby="b-ag" id="ag">
      <div className="kap">
        <div className="ag__ust">
          <h2 id="b-ag">Neyi neye bağlar?</h2>
          <button className="dur-dg" type="button" aria-pressed={durdu} aria-label={durdu ? 'Hareketi başlat' : 'Hareketi durdur'} onClick={durDegistir}>
            <svg className="durak" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="2" y="1.5" width="3.6" height="11" rx="1" />
              <rect x="8.4" y="1.5" width="3.6" height="11" rx="1" />
            </svg>
            <svg className="oyna" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.8v10.4L12.2 7z" />
            </svg>
            <span data-dur-yazi="">{durdu ? 'Oynat' : 'Durdur'}</span>
          </button>
        </div>

        {/* Tuval (n8n düzeni): masaüstü ve 621-820 px */}
        <div className="dy dy--a" data-dy="a" data-yon-blok="a" role="group" aria-label="Bağlantı diyagramı" ref={aRef}>
          <svg className="dy__svg" aria-hidden="true" />
          <div className="dy__h" aria-hidden="true" />
          <div className="tv">
            <div className="nd" data-n="tel">
              <Ik ad="tel" />
              <b>Telefon</b>
              <span>WingWire</span>
            </div>
            <div className="zon">
              <span className="zon__ad">
                <Ik ad="ag" />
                Tailscale · özel ağ
              </span>
              <CipU />
              <CipD />
              <div className="nd nd--b" data-n="kapi" data-yer="genis">
                <Ik ad="kapi" />
                <b>Tailscale kapısı</b>
                <span>
                  <span className="ww-mono">tailscale serve</span> · eşleşme
                </span>
              </div>
            </div>
            <div className="nd" data-n="her">
              <Ik ad="her" />
              <b>Hermes Agent</b>
              <span>bilgisayarında</span>
              <span className="etk">
                <i>ajanlar</i>
                <i>cron</i>
                <i>kanban</i>
              </span>
            </div>
            <div className="nd" data-n="mod">
              <Ik ad="mod" />
              <b>Model</b>
              <span>Hermes'in ayarındaki sağlayıcı</span>
            </div>
            <div className="grp">
              <div className="grp__bas">
                <span className="etiket">şimdilik yalnız benim kurulumumda</span>
                <p>İleride herkese açık olacak.</p>
              </div>
              <div className="nd nd--b" data-n="kapi" data-yer="dar">
                <Ik ad="kapi" />
                <b>Tailscale kapısı</b>
                <span>
                  <span className="ww-mono">tailscale serve</span> · eşleşme
                </span>
              </div>
              <div className="nd nd--b" data-n="web">
                <Ik ad="web" />
                <b>WingWire Web</b>
                <span>Mac'te panel</span>
              </div>
              <div className="nd nd--b nd--k" data-n="dep">
                <Ik ad="disk" />
                <b>Depolama</b>
                <span>yerel klasör · harici disk; yeni sürüm eskisini silmez</span>
              </div>
              <div className="nd nd--b nd--k" data-n="ses">
                <Ik ad="ses" />
                <b>ElevenLabs</b>
                <span>Konuş · ses, isteğe bağlı</span>
              </div>
              <div className="nd nd--b nd--k" data-n="lmp">
                <Ik ad="lmp" />
                <b>letmepost</b>
                <span>yerel paylaşım sunucusu</span>
              </div>
              <div className="nd nd--b nd--k" data-n="yt">
                <Ik ad="film" />
                <b>YouTube</b>
              </div>
              <div className="nd nd--b nd--k" data-n="git">
                <Ik ad="git" />
                <b>GitHub</b>
              </div>
              <div className="nd nd--b nd--k" data-n="play">
                <Ik ad="mag" />
                <b>Google Play Console</b>
              </div>
              <div className="nd nd--b nd--k" data-n="appst">
                <Ik ad="mag" />
                <b>App Store Connect</b>
              </div>
              <div className="nd nd--b nd--k" data-n="drive">
                <Ik ad="bulut" />
                <b>Google Drive</b>
                <span>yedek · arşiv</span>
              </div>
              {/* Yusuf (2026-11-12): kutuda yazı yok, yalnız platform logoları; adlar aria-label/title ile */}
              <div className="nd nd--b nd--k nd--pl" data-n="plat">
                <PlatformLogolari />
              </div>
            </div>
          </div>
        </div>

        {/* Telefon sade düzeni (<=620 px): üstte omurga (telefon, iki şerit, Hermes, model), altta tek küme; servisler dokununca */}
        <div className="dy dy--m dy--s dy--s1" data-dy="m1" data-mob-blok="1" data-acik={acik ? '1' : '0'} role="group" aria-label="Bağlantı diyagramı" ref={mRef}>
          <svg className="dy__svg" aria-hidden="true" />
          <div className="dy__h" aria-hidden="true" />
          <div className="s-ust">
            <div className="s-hale" />
            <span className="s-ad">
              <Ik ad="ag" />
              Tailscale · özel ağ
            </span>
            <div className="sn sn--yal" data-n="mod" style={{ right: 4, top: 12, width: 150 }}>
              <b>Model</b>
              <span>Hermes'in ayarındaki sağlayıcı</span>
            </div>
            <CipU style={{ '--x': 50, top: 124 }} />
            <div className="sn" data-n="tel" style={{ left: 4, top: 164, width: 128 }}>
              <Ik ad="tel" />
              <b>Telefon</b>
              <span>WingWire</span>
            </div>
            <div className="sn" data-n="her" style={{ right: 4, top: 164, width: 180 }}>
              <Ik ad="her" />
              <b>Hermes Agent</b>
              <span>bilgisayarında</span>
              <span className="s-etk">ajanlar · cron · kanban</span>
            </div>
            <CipD style={{ '--x': 50, top: 300 }} />
          </div>
          <div className="s-kume">
            <div className="s-sira">
              <div className="sn sn--b sn--yal" data-n="kapi">
                <b>Tailscale kapısı</b>
                <span className="ww-mono">tailscale serve</span>
              </div>
              <div className="sn sn--b sn--yal" data-n="web">
                <b>WingWire Web</b>
                <span>Mac'te panel</span>
              </div>
            </div>
            <button className="s-svc" type="button" data-n="svc" aria-expanded={acik} aria-controls="ww-s1-liste" onClick={() => setAcik(v => !v)}>
              <span className="s-ikler" aria-hidden="true">
                <Ik ad="ses" />
                <Ik ad="lmp" />
                <Ik ad="film" />
                <Ik ad="git" />
                <Ik ad="mag" />
                <Ik ad="mag" />
                <Ik ad="disk" />
              </span>
              <b>7 bağlantı</b>
              <span className="s-ac">{acik ? 'Gizle' : 'Göster'}</span>
            </button>
            <ul className="s-liste" id="ww-s1-liste" hidden={!acik}>
              <li>
                <Ik ad="ses" />
                <b>ElevenLabs</b>
                <span>Konuş · ses, isteğe bağlı</span>
              </li>
              <li>
                <Ik ad="lmp" />
                <b>letmepost</b>
                <span>yerel paylaşım sunucusu</span>
                <PlatformLogolari />
              </li>
              <li>
                <Ik ad="disk" />
                <b>Depolama</b>
                <span>yerel klasör · harici disk; yeni sürüm eskisini silmez</span>
                <span className="s-alt">→ Google Drive · yedek, arşiv</span>
              </li>
              <li className="s-kisa">
                <Ik ad="film" />
                <b>YouTube</b>
              </li>
              <li className="s-kisa">
                <Ik ad="git" />
                <b>GitHub</b>
              </li>
              <li className="s-kisa">
                <Ik ad="mag" />
                <b>Google Play Console</b>
              </li>
              <li className="s-kisa">
                <Ik ad="mag" />
                <b>App Store Connect</b>
              </li>
            </ul>
            <div className="s-alt-bas">
              <span className="etiket">şimdilik yalnız benim kurulumumda</span>
              <p>İleride herkese açık olacak.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cepte() {
  return (
    <section className="bolum" aria-labelledby="b-cep" style={{ paddingTop: 'clamp(48px, 7vw, 96px)' }}>
      <div className="kap">
        <h2 id="b-cep">Cepte kalanlar</h2>
        <div className="yigin">
          <div className="parca">
            <div className="parca__gorsel">
              <img className="genis t-acik" src={bagliAcik} width="720" height="171" loading="lazy" alt="Kalıcı bildirim: WingWire, Hermes'e bağlı, boşta." />
              <img className="genis t-koyu" src={bagliKoyu} width="720" height="171" loading="lazy" alt="Kalıcı bildirim, koyu tema: Hermes'e bağlı, boşta." />
              <img className="w t-acik" src={widgetAcik} width="600" height="238" loading="lazy" alt="Bağlantı widget'ı: Canlı, Mac, gömülü Tailscale, Kes düğmesi." />
              <img className="w t-koyu" src={widgetKoyu} width="600" height="238" loading="lazy" alt="Bağlantı widget'ı, koyu tema." />
            </div>
            <p>Uygulama kapalıyken de bağlı kalır.</p>
          </div>
          <div className="parca">
            <div className="parca__gorsel">
              <img className="ekran t-acik" src={onayAcik} width="720" height="1520" loading="lazy" alt="Kodcu bir komut için onay istiyor: Onayla ve Reddet düğmeleri." />
              <img className="ekran t-koyu" src={onayKoyu} width="720" height="1520" loading="lazy" alt="Onay kartı, koyu tema: Onayla ve Reddet." />
            </div>
            <p>Onayı cebinden ver.</p>
          </div>
          <div className="parca">
            <div className="parca__gorsel">
              <img className="ekran ekran--ust t-acik" src={paylasAcik} width="720" height="1520" loading="lazy" alt="Başka uygulamadan paylaşınca ajan seçme ekranı." />
              <img className="ekran ekran--ust t-koyu" src={paylasKoyu} width="720" height="1520" loading="lazy" alt="Paylaşım ekranı, koyu tema." />
            </div>
            <p>Başka uygulamadan ajanına paylaş.</p>
          </div>
        </div>
        <p className="temsili">Ekranlar uygulamanın örnek veriyle çizilmiş temsili görünümüdür.</p>
      </div>
    </section>
  );
}

function Kurulum() {
  return (
    <section className="bolum" aria-labelledby="b-kur" style={{ paddingTop: 0 }}>
      <div className="kap kurulum">
        <div>
          <h2 id="b-kur">Üç adım</h2>
          <ol>
            <li>APK'yı kur.</li>
            <li>Uygulamadaki kurulum metnini Claude Code ya da Codex'e ver.</li>
            <li>Adres, kullanıcı adı, şifre. Bağlan.</li>
          </ol>
        </div>
        <div>
          <p className="not">
            Hermes Agent senin bilgisayarında çalışır.
            <br />
            Tailscale istersen uygulamanın içinde.
            <br />
            64 bit Android 8.0 ve üstü.
          </p>
          <a className="dg" href={APK_URL} download>
            <IndirSimge />
            APK indir
          </a>
        </div>
      </div>
    </section>
  );
}
