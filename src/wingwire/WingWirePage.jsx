import { useEffect } from 'react';
import AppIcon from '../AppIcon';
import { Link } from '../nav';
import Comments from '../Comments';
import './WingWirePage.css';

// WingWire'ın kendi sayfası. Metin data.js'teki kayıttan gelir; burada yalnız sunum var.
// Dil: InkNavy zemin, SignalAmber aksan, LiveCyan yalnız "bağlantı canlı" anlamında.
// Ürünün söylediği Plus Jakarta Sans, sistemin gösterdiği JetBrains Mono.

const STAGE = { beta: 'açık beta', dev: 'geliştirmede', idea: 'fikir', live: 'yayında' };
const isPlaceholder = v => !v || v.startsWith('[');

// Her özelliğin yanında, sistemin dilinden kısa bir etiket (süs; ürün metni data.js'te).
const TAGS = ['chat.stream', 'session.resume', 'approval.request', 'call.incoming'];

const FONT_ID = 'ww-jakarta-font';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';

function useJakarta() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href = FONT_HREF;
    document.head.appendChild(l);
  }, []);
}

export default function WingWirePage({ app }) {
  useJakarta();
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  const points = (app.points || []).filter(p => !isPlaceholder(p));

  return (
    <article className="ww">
      <section className="ww__hero">
        <div className="ww__glow" aria-hidden="true" />
        <div className="wrap ww__heroin">
          <div className="ww__intro">
            <Link to="/uretiyorum" className="ww__back">
              ← uygulamalar
            </Link>
            <div className="ww__badges">
              <span className={`ww__badge ww__badge--${app.stage}`}>
                <i aria-hidden="true" />
                {STAGE[app.stage]}
              </span>
              {!isPlaceholder(app.platform) && <span className="ww__badge ww__badge--plain">{app.platform.toLowerCase()}</span>}
            </div>
            <div className="ww__title">
              <AppIcon name={app.name} size={76} />
              <h1>{app.name}</h1>
            </div>
            {!isPlaceholder(app.lead) && <p className="ww__lead">{app.lead}</p>}
            <div className="ww__actions">
              {available ? (
                <a className="ww__cta" href={app.download} target="_blank" rel="noopener noreferrer">
                  {app.downloadLabel || 'İndir'}
                </a>
              ) : (
                <span className="ww__cta is-off">Yakında</span>
              )}
              <span className="ww__wire" aria-hidden="true">
                telefon <b>⇄</b> ajan
              </span>
            </div>
          </div>

          <Phone />
        </div>
      </section>

      <WireLine />

      {points.length > 0 && (
        <section className="wrap ww__points" aria-label="Neler yapar">
          <h2>
            <span>Neler yapar</span>
            <span className="ww__count">{String(points.length).padStart(2, '0')} yetenek</span>
          </h2>
          <ol>
            {points.map((p, i) => (
              <li key={p}>
                <span className="ww__idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="ww__pt">{p}</span>
                <code className="ww__tag">{TAGS[i] || 'agent.event'}</code>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="ww__comments">
        <Comments term={app.name} />
      </div>
    </article>
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

// Telefon ile ajan arasındaki canlı hat: cyan paketler iki yönde akar.
function WireLine() {
  return (
    <section className="ww__line" aria-label="Bağlantı">
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
