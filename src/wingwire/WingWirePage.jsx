import AppIcon from '../AppIcon';
import { Link } from '../nav';
import './WingWirePage.css';

// WingWire kendi sitesine taşındı (wingwire.hamaratlabs.com). Bu sayfa yalnız oraya
// yönlendiren kısa bir kart. Otomatik yönlendirme bilerek yok: kullanıcı butona basar.
// Metin data.js'teki kayıttan gelir.

const SITE = 'https://wingwire.hamaratlabs.com';

export default function WingWirePage({ app }) {
  return (
    <article className="ww">
      <section className="ww__wrap">
        <div className="ww__card">
          <AppIcon name="WingWire" size={64} />
          <h1 className="ww__title">WingWire artık kendi adresinde</h1>
          <p className="ww__lead">{app.lead}</p>
          <a className="ww__cta" href={SITE}>
            Artık wingwire.hamaratlabs.com'da <span className="ww__cta-go">→ git</span>
          </a>
          <Link to="/uretiyorum" className="ww__back">
            ← uygulamalar
          </Link>
        </div>
      </section>
    </article>
  );
}
