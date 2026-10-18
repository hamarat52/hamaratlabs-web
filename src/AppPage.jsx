import AppIcon from './AppIcon';
import { Link } from './nav';
import Comments from './Comments';

const STAGE = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında' };
const isPlaceholder = v => !v || v.startsWith('[');

// Tek bir uygulamanın sayfası: büyük ikon, ad, kısa tanım, indirme ve özellikler.
export default function AppPage({ app }) {
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  const points = (app.points || []).filter(p => !isPlaceholder(p));
  return (
    <article className="apppage">
      <div className="wrap apppage__hero">
        <Link to="/uretiyorum" className="apppage__back">
          ← Uygulamalar
        </Link>
        <div className="apppage__row">
          <AppIcon name={app.name} size={168} />
          <div className="apppage__intro">
            <span className={`card__stage card__stage--${app.stage}`}>{STAGE[app.stage]}</span>
            <h1>{app.name}</h1>
            {!isPlaceholder(app.lead) && <p>{app.lead}</p>}
            <div className="apppage__actions">
              {available ? (
                <a className="apppage__dl" href={app.download} target="_blank" rel="noopener noreferrer">
                  {app.downloadLabel || 'İndir'}
                </a>
              ) : (
                <span className="apppage__dl is-off">Yakında</span>
              )}
              {!isPlaceholder(app.platform) && <span className="apppage__platform">{app.platform}</span>}
            </div>
          </div>
        </div>
      </div>

      {points.length > 0 && (
        <section className="wrap apppage__points" aria-label="Neler yapar">
          <h2>Neler yapar</h2>
          <ul>
            {points.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <Comments term={app.name} />
    </article>
  );
}
