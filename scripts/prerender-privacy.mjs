// Build sonrası: GitHub Pages'in /privacy için düz HTTP 200 + gerçek içerik
// dönmesini sağlamak amacıyla dist/privacy/index.html üretir.
// SPA mimarisini bozmaz: aynı JS/CSS bundle'ı yüklenir, React mount olunca
// (createRoot().render — hydrate değil) #root içeriğinin üzerine yazar ve
// normal client-side routing devam eder. Statik HTML yalnızca ham HTTP
// isteği yapan doğrulayıcılar (ör. Google OAuth consent ekranı) için.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const PRIVACY_CONTENT = `
    <article class="wrap section privacy">
      <a href="/" class="mono muted pagehead__back">← ANA SAYFA</a>
      <h1>Gizlilik Politikası</h1>
      <p class="lead">hamaratlabs.com altında çalışan kişisel asistan uygulaması için gizlilik politikası.</p>
      <div class="privacy__body">
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
          Verdiğiniz izni istediğiniz zaman Google hesap ayarlarınızdan iptal edebilirsiniz:
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.
          İptal sonrası uygulama Gmail ve Takvim verinize erişemez.
        </p>
        <h2>İletişim</h2>
        <p>
          Bu uygulama <strong>hamaratlabs.com</strong> tarafından işletilir. Sorularınız için
          <a href="https://hamaratlabs.com/#iletisim" target="_blank" rel="noopener noreferrer">hamaratlabs.com üzerinden iletişim</a>
          sayfasını kullanabilirsiniz.
        </p>
        <p class="muted mono privacy__updated">Son güncelleme: Ekim 2026</p>
      </div>
    </article>
`;

let html = readFileSync(indexPath, 'utf8');

// <title> ve description'ı /privacy'ye uygun hale getir.
html = html.replace(/<title>.*?<\/title>/, '<title>Gizlilik Politikası — hamaratlabs</title>');
html = html.replace(
  /<meta name="description" content=".*?" \/>/,
  '<meta name="description" content="hamaratlabs.com kişisel asistan uygulaması için gizlilik politikası." />'
);
html = html.replace(/<link rel="canonical" href=".*?" \/>/, '<link rel="canonical" href="https://hamaratlabs.com/privacy" />');
html = html.replace(/<meta property="og:url" content=".*?" \/>/, '<meta property="og:url" content="https://hamaratlabs.com/privacy" />');

// #root içini prerender edilmiş içerikle doldur (React mount olunca üzerine yazar).
html = html.replace('<div id="root"></div>', `<div id="root">${PRIVACY_CONTENT}</div>`);

const privacyDir = path.join(distDir, 'privacy');
mkdirSync(privacyDir, { recursive: true });
writeFileSync(path.join(privacyDir, 'index.html'), html);

console.log('dist/privacy/index.html oluşturuldu.');
