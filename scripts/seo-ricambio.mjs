// CI'da (deploy.yml) RICAMBIO kopyalandıktan sonra çalışır: dist/okul-projeleri/ricambio/index.html'e
// canonical ekler ve ham HTML'de <h1> yoksa #root içine sayfanın kendi başlığıyla bir <h1> koyar.
// RICAMBIO landing'i ayrı bir repodan (hamarat52/ricambio-landing, güvenlik kontrollü sabit commit) derlendiği
// için o repoya dokunmadan yayın kopyası burada düzeltilir. React (createRoot) mount olunca #root'un içini
// kendi içeriğiyle değiştirir; <h1> yalnız JS çalıştırmayan tarayıcılar ve ham HTML okuyan araçlar içindir.
// Dosya yoksa (yerel build) sessizce geçer; iki kez çalıştırılırsa ikinci seferde değişiklik yapmaz.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'dist', 'okul-projeleri', 'ricambio', 'index.html');
const CANONICAL = 'https://hamaratlabs.com/okul-projeleri/ricambio/';

if (!existsSync(file)) {
  console.log('seo-ricambio: dist/okul-projeleri/ricambio/index.html yok, atlandı.');
  process.exit(0);
}

let html = readFileSync(file, 'utf8');
const changes = [];

if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
  html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${CANONICAL}" />\n  </head>`);
  changes.push('canonical');
}

if (!/<h1[\s>]/i.test(html)) {
  const title = (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1]?.trim();
  if (!title) throw new Error('seo-ricambio: <title> bulunamadı, <h1> metni çıkarılamadı.');
  if (!html.includes('<div id="root"></div>')) throw new Error('seo-ricambio: boş <div id="root"></div> bulunamadı.');
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><h1 style="font-family:system-ui,sans-serif;font-size:28px;padding:24px;margin:0">${title}</h1></div>`
  );
  changes.push('h1');
}

writeFileSync(file, html);
console.log(`seo-ricambio: ${changes.length ? changes.join(' + ') + ' eklendi' : 'değişiklik gerekmedi'}.`);
