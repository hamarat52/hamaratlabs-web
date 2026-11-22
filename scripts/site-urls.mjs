// Sitenin adres listesi: generate-sitemap.mjs ve prerender-routes.mjs ikisi de buradan okur, böylece
// sitemap'teki her SPA rotasının ön-render edilmiş bir HTML'i olur ve canonical ile sitemap aynı biçimde kalır.
//
// Biçim kuralı (Cloudflare Pages ile uyumlu):
//  - React rotaları sondaki eğik çizgi OLMADAN yazılır (/uretiyorum). Ön-render dosyası dist/uretiyorum.html olur;
//    Cloudflare Pages bunu /uretiyorum adresinde doğrudan 200 ile sunar. (dist/uretiyorum/index.html olsaydı
//    /uretiyorum → /uretiyorum/ 308 yönlendirmesi yapardı; /privacy bugün böyle.)
//  - Klasör olarak duran statik alt siteler eğik çizgiyle biter (/okul-projeleri/fibi/).
//  - Income vs Desires'ın düz HTML sayfaları .html'siz yazılır (Cloudflare Pages destek.html → /income-vs-desires/destek).
//
// src/data.js ve src/ogretici/posts.js birbirini uzantısız import ettiği için düz Node ile yüklenemez; Vite'in
// kendi modül yükleyicisiyle (ssrLoadModule) gerçek değerleri okunur. Regex ile ayıklama tırnak biçimine
// takılıyordu (Kitabe'nin çift tırnaklı short alanı yüzünden sitemap'e hiç girmemişti).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');

export async function loadSiteData() {
  const vite = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] }
  });
  try {
    const data = await vite.ssrLoadModule('/src/data.js');
    const { POSTS } = await vite.ssrLoadModule('/src/ogretici/posts.js');
    const seo = await vite.ssrLoadModule('/src/seo/routeMeta.js');
    return { data: { ...data, POSTS }, seo };
  } finally {
    await vite.close();
  }
}

// { spa: React rotaları (ön-render edilir), files: public/ veya CI'dan gelen statik sayfalar }
export function siteUrls({ data, seo }) {
  const products = seo.listedProducts(data).map(a => `/uretiyorum/${data.slugOf(a.name)}`);
  const standalone = [...data.FEATURED, ...data.APPS].map(a => a.visitUrl).filter(u => u && u.startsWith('/'));

  // /skills kataloğu yalnız veri dosyası varsa.
  const skillsPath = path.join(ROOT, 'src', 'data', 'skills.json');
  const hasSkills = existsSync(skillsPath);

  const spa = [
    '/',
    '/uretiyorum',
    '/paylasiyorum',
    '/anlatiyorum',
    '/oneriyorum',
    '/okul-projeleri',
    ...(hasSkills ? ['/skills'] : []),
    ...products,
    ...standalone,
    // /aktivite: her sayfanın footer'ında linkli kod aktivite haritası (veri çalışırken çekilir).
    '/aktivite',
    '/ogretici',
    ...data.POSTS.map(p => `/ogretici/${p.slug}`)
  ];

  const files = [];
  // Okul Projeleri altındaki statik tanıtım sayfaları (public/okul-projeleri/<ad>/index.html).
  const schoolDir = path.join(ROOT, 'public', 'okul-projeleri');
  if (existsSync(schoolDir)) {
    for (const d of readdirSync(schoolDir, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(path.join(schoolDir, d.name, 'index.html'))) files.push(`/okul-projeleri/${d.name}/`);
    }
  }
  // Income vs Desires'ın düz HTML sitesi (public/income-vs-desires/, IVD reposundan kopya).
  const ivdDir = path.join(ROOT, 'public', 'income-vs-desires');
  const ivdPages = (dir, rel = '') =>
    readdirSync(dir, { withFileTypes: true }).flatMap(d =>
      d.isDirectory()
        ? ivdPages(path.join(dir, d.name), `${rel}${d.name}/`)
        : d.name.endsWith('.html')
          ? [`/income-vs-desires/${rel}${d.name.replace(/(^|\/)?index\.html$/, '').replace(/\.html$/, '')}`]
          : []
    );
  if (existsSync(ivdDir)) files.push(...ivdPages(ivdDir).sort());
  // CI'da dist'e başka repolardan kopyalanan Okul Projeleri sayfaları (bkz. .github/workflows/deploy.yml).
  files.push('/okul-projeleri/ricambio/');

  // lastmod: /skills için katalog verisinin oluşturulma tarihi (skills.json → meta.olusturma), diğerleri bugün.
  const lastmod = {};
  if (hasSkills) {
    const m = /"olusturma"\s*:\s*"(\d{4}-\d{2}-\d{2})"/.exec(readFileSync(skillsPath, 'utf8').slice(0, 2000));
    if (m) lastmod['/skills'] = m[1];
  }

  return { spa: [...new Set(spa)], files: [...new Set(files)], lastmod };
}
