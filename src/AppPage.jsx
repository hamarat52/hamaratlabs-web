import AppIcon from './AppIcon';
import { Link } from './nav';
import Comments from './Comments';
import { slugOf } from './data';
import PulseHeart from './components/rb/PulseHeart/PulseHeart';
import ShareSling from './components/rb/ShareSling/ShareSling';
import DodgeField from './components/rb/DodgeField/DodgeField';

const STAGE = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında' };
const isPlaceholder = v => !v || v.startsWith('[');

// İndirme linki herkese açık bir GitHub reposuysa sahibi/adı oradan çıkar (PulseHeart için).
const githubRepo = url => {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url || '');
  return m ? { owner: m[1], name: m[2] } : null;
};

// Ürün sayfasının kalıcı adresi: sitenin kökü (BASE_URL) + /uretiyorum/<slug>.
const pageUrl = slug => new URL(`uretiyorum/${slug}`, window.location.origin + import.meta.env.BASE_URL).href;

// Tek bir uygulamanın sayfası: büyük ikon, ad, kısa tanım, indirme ve özellikler.
export default function AppPage({ app }) {
  const slug = slugOf(app.name);
  const available = (app.stage === 'live' || app.stage === 'beta') && app.download;
  const points = (app.points || []).filter(p => !isPlaceholder(p));
  const repo = githubRepo(app.download);
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
                // Henüz indirilemeyen ürün: tıklanamayan, kaçan "İndir" butonu.
                <DodgeField
                  label="İndir"
                  dodgeLabel="Henüz değil"
                  height={120}
                  align="start"
                  className="apppage__dodge"
                  ariaLabel={`${app.name} henüz indirilemez`}
                />
              )}
              {!isPlaceholder(app.platform) && <span className="apppage__platform">{app.platform}</span>}
            </div>
          </div>
        </div>

        <div className="apppage__extras">
          <div className="apppage__social">
            {repo && (
              <span className="apppage__social-item">
                <PulseHeart repoOwner={repo.owner} repoName={repo.name} />
              </span>
            )}
            <span className="apppage__social-item apppage__share">
              <ShareSling shareUrl={pageUrl(slug)} shareText={app.name} ariaLabel={`${app.name} sayfasını paylaş`} />
            </span>
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
