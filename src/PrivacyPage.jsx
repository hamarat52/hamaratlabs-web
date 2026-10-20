import { LINKS } from './data';
import { Link } from './nav';

// Google OAuth onay ekranı (kişisel asistan projesi) için gerekli statik Gizlilik Politikası sayfası.
// Sade, sitenin genel sayfa başlığı diliyle (bkz. App.jsx PageHead) aynı iskeleti kullanır.
export default function PrivacyPage() {
  return (
    <article className="wrap section privacy">
      <Link to="/" className="mono muted pagehead__back">
        ← ANA SAYFA
      </Link>
      <h1>Gizlilik Politikası</h1>
      <p className="lead">hamaratlabs.com altında çalışan kişisel asistan uygulaması için gizlilik politikası.</p>

      <div className="privacy__body">
        <p>
          Bu sayfa, <strong>hamaratlabs.com</strong> alan adı altında çalışan ve Google hesabıyla kimlik doğrulaması
          yapan kişisel asistan uygulamasının gizlilik politikasını açıklar. Uygulama, yalnızca kendi Google
          hesabınız üzerinde, kendi onayınızla çalışır.
        </p>

        <h2>Hangi veriye, ne amaçla erişiyoruz</h2>
        <p>Uygulama, Google hesabınızdan yalnızca aşağıdaki iki kapsamda ve sadece okuma (read-only) izni ister:</p>
        <ul>
          <li>Gmail — e-postalarınızı yalnızca <strong>okur</strong>.</li>
          <li>Google Takvim — takvim etkinliklerinizi yalnızca <strong>okur</strong>.</li>
        </ul>
        <p>
          Uygulama e-posta gönderme, silme veya düzenleme ve takvim etkinliği oluşturma, değiştirme veya silme gibi
          hiçbir <strong>yazma işlemi yapmaz</strong>. Erişim tamamen okuma amaçlıdır ve yalnızca size kendi
          e-postalarınızın ve takviminizin özetini çıkarmak için kullanılır.
        </p>

        <h2>Verileriniz nasıl kullanılır ve saklanır</h2>
        <ul>
          <li>Okunan veriler yalnızca sizin kendi cihazınızda/ajanınızda özet üretmek için işlenir.</li>
          <li>Veriler üçüncü taraflarla paylaşılmaz, satılmaz veya reklam amacıyla kullanılmaz.</li>
          <li>Veriler kalıcı olarak saklanmaz; özetleme işlemi tamamlandıktan sonra tutulmaz.</li>
        </ul>

        <h2>Erişimi iptal etme</h2>
        <p>
          Verdiğiniz izni istediğiniz zaman Google hesap ayarlarınızdan iptal edebilirsiniz:{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          . İptal sonrası uygulama Gmail ve Takvim verinize erişemez.
        </p>

        <h2>İletişim</h2>
        <p>
          Bu uygulama <strong>hamaratlabs.com</strong> tarafından işletilir. Sorularınız için{' '}
          <a href={LINKS.contact} target="_blank" rel="noopener noreferrer">
            hamaratlabs.com üzerinden iletişim
          </a>{' '}
          sayfasını kullanabilirsiniz.
        </p>

        <p className="muted mono privacy__updated">Son güncelleme: Ekim 2026</p>
      </div>
    </article>
  );
}
