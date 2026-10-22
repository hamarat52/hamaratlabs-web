// Build sonrası: dist/sitemap.xml ve robots.txt'teki sitemap referansını üretir.
// Google'ın siteyi keşfetmesini hızlandırmak için (domain yeni, sitemap hiç yoktu).
// Ürün listesi src/data.js'ten (FEATURED + APPS) otomatik okunur, elle güncelleme
// gerekmez — yeni ürün eklendikçe sitemap kendiliğinden büyür.
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const SITE = 'https://hamaratlabs.com';

const dataSrc = readFileSync(path.join(__dirname, '..', 'src', 'data.js'), 'utf8');

// data.js'i modül olarak import etmek yerine (ESM uzantısız import'lar Vite dışında
// kırılıyor) ham metinden regex ile ürün adlarını ve visitUrl'lerini çıkar.
const slugOf = name =>
  name.toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const nameRe = /name:\s*'([^']+)'[\s\S]{0,40}?short:\s*'([^']*)'/g;
const allApps = [];
let m;
while ((m = nameRe.exec(dataSrc))) {
  if (m[2] !== '[Kısa açıklama]') allApps.push({ name: m[1] });
}
const visitRe = /visitUrl:\s*'(\/[^']*)'/g;
const standaloneUrls = [];
while ((m = visitRe.exec(dataSrc))) standaloneUrls.push(m[1]);

const today = new Date().toISOString().slice(0, 10);

// Sabit sayfalar + ürün detay sayfaları (/uretiyorum/<slug>, sadece gerçek ürünler
// — 'idea' aşamasındaki placeholder'lar [Kısa açıklama] gibi dolgu metin taşıyorsa atla).
const staticUrls = ['/', '/uretiyorum', '/paylasiyorum', '/anlatiyorum', '/oneriyorum'];
const appUrls = allApps.map(a => `/uretiyorum/${slugOf(a.name)}`);

const urls = [...new Set([...staticUrls, ...appUrls, ...standaloneUrls])];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;

mkdirSync(distDir, { recursive: true });
writeFileSync(path.join(distDir, 'sitemap.xml'), xml);

// robots.txt'e sitemap referansı ekle (yoksa).
const robotsPath = path.join(distDir, 'robots.txt');
if (existsSync(robotsPath)) {
  const current = readFileSync(robotsPath, 'utf8');
  if (!current.includes('Sitemap:')) {
    appendFileSync(robotsPath, `\nSitemap: ${SITE}/sitemap.xml\n`);
  }
}

console.log(`dist/sitemap.xml oluşturuldu (${urls.length} url).`);
