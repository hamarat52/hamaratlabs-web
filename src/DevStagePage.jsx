import AppIcon from './AppIcon';
import { Link } from './nav';
import Comments from './Comments';
import { LINKS } from './data';
import './DevStagePage.css';

// "Geliştirmede" aşamasındaki uygulamaların ortak sayfası.
// Fikir kartının ham, kesik çizgili dili ile yayındaki sayfanın cilalı dili arasında durur:
// ölçü çizgili bir "şantiye" çerçevesi, tahmini adım göstergesi ve ekran görüntüsü yerine konsept çizim.
//
// Kullandığı alanlar (data.js'teki FEATURED/APPS elemanı): name, lead, points, platform, stage.
// İsteğe bağlı alanlar (yoksa varsayılan kullanılır):
//   devStep  : şu anki adımın sırası (1'den başlar), varsayılan 3
//   devSteps : adım adları dizisi, varsayılan DEFAULT_STEPS
//   devNote  : "şu an ne üzerinde çalışılıyor" cümlesi

const DEFAULT_STEPS = ['Fikir', 'Tasarım', 'Yapım', 'İç deneme', 'Açık beta', 'Yayın'];
const isPlaceholder = v => !v || v.startsWith('[');
const pad = n => String(n).padStart(2, '0');

// Platform metnine göre konsept çizimin çerçevesi: telefon ya da tarayıcı penceresi.
const frameOf = platform => (/ANDROID|IOS|IPHONE|MOBİL|MOBIL/i.test(platform || '') ? 'phone' : 'browser');

function Progress({ steps, current }) {
  const pct = Math.round(((current - 1) / (steps.length - 1)) * 100);
  return (
    <div className="devpage__progress">
      <div className="devpage__progress-head">
        <span className="devpage__label">Tahmini adım</span>
        <span className="devpage__count">
          {current}
          <span>/{steps.length}</span>
        </span>
      </div>
      <div
        className="devpage__bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current}
        aria-valuetext={`Adım ${current} / ${steps.length}: ${steps[current - 1]}`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <ol className="devpage__steps" style={{ '--dp-n': steps.length }}>
        {steps.map((s, i) => {
          const state = i + 1 < current ? 'done' : i + 1 === current ? 'now' : 'next';
          return (
            <li key={s} className={`is-${state}`} aria-current={state === 'now' ? 'step' : undefined}>
              <i aria-hidden="true" />
              {s}
            </li>
          );
        })}
      </ol>
      <p className="devpage__hint">Tahmindir, tarih vermiyorum. Adımlar iş ilerledikçe değişebilir.</p>
    </div>
  );
}

// Ekran görüntüsü yerine: uygulamanın planlanan yeteneklerinden üretilmiş tel kafes çizim.
function Sketch({ app, points, frame }) {
  const rows = points.slice(0, 4);
  return (
    <figure className={`devpage__sketch devpage__sketch--${frame}`}>
      <div className="devpage__device" aria-hidden="true">
        {frame === 'phone' ? (
          <span className="devpage__notch" />
        ) : (
          <span className="devpage__chrome">
            <i />
            <i />
            <i />
            <b />
          </span>
        )}
        <div className="devpage__screen">
          <div className="devpage__appbar">
            <AppIcon name={app.name} size={28} />
            <span>{app.name}</span>
          </div>
          {rows.map((p, i) => (
            <div key={p} className={`devpage__block${i === 0 ? ' is-main' : ''}`}>
              <em>{pad(i + 1)}</em>
              <span>{p}</span>
            </div>
          ))}
          <div className="devpage__skeleton">
            <span />
            <span />
          </div>
        </div>
      </div>
      <figcaption>
        <span className="devpage__label">Konsept çizim</span> Gerçek ekran değil; son hâli farklı olabilir.
      </figcaption>
    </figure>
  );
}

export default function DevStagePage({ app }) {
  const points = (app.points || []).filter(p => !isPlaceholder(p));
  const steps = Array.isArray(app.devSteps) && app.devSteps.length > 1 ? app.devSteps : DEFAULT_STEPS;
  const current = Math.min(Math.max(Number(app.devStep) || 3, 1), steps.length);
  const frame = frameOf(app.platform);
  const hasPlatform = !isPlaceholder(app.platform);

  return (
    <article className="devpage">
      <div className="wrap devpage__hero">
        <Link to="/uretiyorum" className="devpage__back">
          ← Uygulamalar
        </Link>

        <div className="devpage__grid">
          <div className="devpage__intro">
            <div className="devpage__plate">
              <span className="devpage__iconframe">
                <AppIcon name={app.name} size={96} />
              </span>
              <span className="devpage__tag">
                <i aria-hidden="true" />
                Geliştirmede
              </span>
            </div>

            <h1>{app.name}</h1>
            {!isPlaceholder(app.lead) && <p className="devpage__lead">{app.lead}</p>}
            {app.devNote && (
              <p className="devpage__note">
                <span className="devpage__label">Şu an</span> {app.devNote}
              </p>
            )}

            <Progress steps={steps} current={current} />

            <div className="devpage__actions">
              <span className="devpage__off">Henüz indirilemez</span>
              <a className="devpage__follow" href={LINKS.contact} target="_blank" rel="noopener noreferrer">
                Erken denemek istersen yaz →
              </a>
            </div>
            {hasPlatform && (
              <p className="devpage__platform">
                <span className="devpage__label">Hedef platform</span> {app.platform}
              </p>
            )}
          </div>

          <Sketch app={app} points={points} frame={frame} />
        </div>
      </div>

      {points.length > 0 && (
        <section className="wrap devpage__plan" aria-labelledby="devpage-plan">
          <div className="devpage__plan-head">
            <h2 id="devpage-plan">Planlanan yetenekler</h2>
            <p>Yapım sürerken bu liste değişebilir; bir madde çıkabilir ya da yenisi eklenebilir.</p>
          </div>
          <ol>
            {points.map((p, i) => (
              <li key={p}>
                <em>{pad(i + 1)}</em>
                <span>{p}</span>
                <small>taslak</small>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="wrap devpage__early" aria-labelledby="devpage-early">
        <div>
          <h2 id="devpage-early">Erken erişim hakkında</h2>
          <p>
            {app.name} henüz deneme sürümüne hazır değil. Hazır olduğunda önce küçük bir grupla denenecek, sonra açık betaya
            geçecek. Gelişmeleri Instagram'da paylaşıyorum.
          </p>
        </div>
        <a className="devpage__follow" href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
          {LINKS.instagramHandle} →
        </a>
      </section>

      <Comments term={app.name} />
    </article>
  );
}
