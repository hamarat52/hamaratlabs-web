// Build sonrası: dist/sitemap.xml ve robots.txt'teki sitemap referansını üretir.
// Adres listesi scripts/site-urls.mjs'ten gelir (ön-render betiği prerender-routes.mjs ile aynı kaynak):
// ürünler src/data.js'ten, öğretici yazıları src/ogretici/posts.js'ten, statik sayfalar public/ altından
// kendiliğinden okunur; yeni ürün ya da sayfa eklendikçe sitemap kendiliğinden büyür.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadSiteData, siteUrls } from './site-urls.mjs';

const distDir = path.join(ROOT, 'dist');
const site = await loadSiteData();
const SITE = site.seo.SITE;
const { spa, files, lastmod } = siteUrls(site);
const urls = [...new Set([...spa, ...files])];
const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${lastmod[u] || today}</lastmod>\n  </url>`).join('\n')}
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
