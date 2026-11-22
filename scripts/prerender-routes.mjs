// Build sonrası: sitemap'teki her React (SPA) rotası için ön-render edilmiş HTML üretir.
//
// Neden: Cloudflare Pages SPA kipinde bilinmeyen her yola dist/index.html'i döner. Ham HTML'i okuyan
// tarayıcılar (Google'ın ilk taraması, paylaşım önizlemeleri) bu yüzden /wingwire, /uretiyorum/titimer gibi
// her sayfayı ana sayfanın birebir kopyası (aynı title, description ve canonical = /) olarak görüyordu.
//
// Ne yapar: dist/index.html şablonundan her rota için dist/<rota>.html yazar (ör. dist/uretiyorum/titimer.html).
// İçinde rotaya özgü <title>, meta description, canonical (kendi adresi), og:* etiketleri ve #root içinde bir <h1>
// ile kısa gerçek içerik olur. Metinler src/seo/routeMeta.js'ten gelir (uydurma yok; kaynakları orada yazılı).
// SPA davranışı değişmez: aynı JS/CSS yüklenir, React createRoot().render ile #root'un üzerine yazar
// (hydrate değil), site içi gezinme aynen sürer. /privacy'deki yöntemin genellenmiş hâli.
//
// Dosya adı neden <rota>.html: Cloudflare Pages /uretiyorum isteğine dist/uretiyorum.html'i doğrudan 200 ile
// sunar; dist/uretiyorum/index.html olsaydı /uretiyorum/ adresine 308 yönlendirirdi ve canonical/sitemap
// (eğik çizgisiz) ile çelişirdi.
//
// Ana sayfa (/) içeriği dist/index.html'e yazılır (bu dosya bilinmeyen yolların da SPA yedeğidir; bkz. JS_GUARD).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadSiteData, siteUrls } from './site-urls.mjs';

const distDir = path.join(ROOT, 'dist');
const indexPath = path.join(distDir, 'index.html');

// Öznitelik değerleri çift tırnak içinde: & < > " kaçırılır; kesme işareti (Hamarat'ın) olduğu gibi kalır.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Metin düğümleri: tırnak kaçırmaya gerek yok.
const escText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Tek bir etiketi değiştirir; şablonda tam olarak bir kez bulunmazsa build'i durdurur (sessiz bozulma olmasın).
function swap(html, re, replacement, what) {
  const hits = html.match(new RegExp(re.source, 'g')) || [];
  if (hits.length !== 1) throw new Error(`prerender-routes: şablonda "${what}" ${hits.length} kez bulundu (1 bekleniyordu).`);
  // Fonksiyon biçimi: değiştirilecek metinde $&, $`, $', $$ geçerse String.replace onları desen saymasın.
  return html.replace(re, () => replacement);
}

function applyHead(template, meta) {
  let html = template;
  const t = esc(meta.title);
  const d = esc(meta.description);
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${escText(meta.title)}</title>`, 'title');
  html = swap(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`, 'description');
  html = swap(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(meta.canonical)}" />`, 'canonical');
  html = swap(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`, 'og:title');
  html = swap(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`, 'og:description');
  html = swap(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(meta.canonical)}" />`, 'og:url');
  if (meta.ogType) html = swap(html, /<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${meta.ogType}" />`, 'og:type');
  const img = meta.ogImage;
  html = swap(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(img.url)}" />`, 'og:image');
  html = swap(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${esc(img.url)}" />`, 'twitter:image');
  const size = img.width && img.height;
  html = swap(
    html,
    /<meta property="og:image:width" content="[^"]*" \/>/,
    size ? `<meta property="og:image:width" content="${img.width}" />` : '',
    'og:image:width'
  );
  html = swap(
    html,
    /<meta property="og:image:height" content="[^"]*" \/>/,
    size ? `<meta property="og:image:height" content="${img.height}" />` : '',
    'og:image:height'
  );
  return html;
}

function linkTag(l) {
  const ext = l.external || /^https?:/.test(l.href);
  return `<a href="${esc(l.href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escText(l.label)}</a>`;
}

function renderBody(meta) {
  const th = meta.theme;
  const style = th ? ` style="background:${th.bg};color:${th.fg};--ink:${th.fg};min-height:100vh"` : '';
  const out = [`<div class="prerender" data-prerender${style}>`];
  out.push('<section class="pagehead"><div class="wrap">');
  if (meta.back) out.push(`<a href="${esc(meta.back.href)}" class="mono muted pagehead__back">${escText(meta.back.label)}</a>`);
  out.push(`<h1>${escText(meta.h1)}</h1>`);
  if (meta.lead) out.push(`<p class="lead">${escText(meta.lead)}</p>`);
  out.push('</div></section>');
  const rest = [];
  for (const p of meta.paragraphs) rest.push(`<p>${escText(p)}</p>`);
  if (meta.points.length) rest.push(`<ul>${meta.points.map(p => `<li>${escText(p)}</li>`).join('')}</ul>`);
  if (meta.links.length) {
    rest.push(`<ul>${meta.links.map(l => `<li>${linkTag(l)}${l.text ? `: ${escText(l.text)}` : ''}</li>`).join('')}</ul>`);
  }
  if (rest.length) out.push(`<section class="wrap section privacy__body">${rest.join('')}</section>`);
  out.push('</div>');
  return out.join('');
}

// Görünüm: JS çalışan tarayıcıda ön-render bloğu gizlenir; ekran bugünkü gibi React mount olana kadar boş kalır,
// sonra React kendi tasarımını çizer (ilk karede farklı bir düzen belirip kaybolmaz, kayma olmaz). JS çalıştırmayan
// okuyucular (ham HTML ayrıştıran tarayıcılar, önizleme botları) blok metnini okur. Ana sayfanın dist/index.html'i
// bilinmeyen yolların (404) SPA yedeği olduğu için bu, 404 sayfasında ana sayfa metninin görünmesini de önler.
const JS_GUARD =
  "<script>document.documentElement.setAttribute('data-js','')</script>" +
  '<style>[data-js] [data-prerender]{display:none}</style>';

const template = readFileSync(indexPath, 'utf8');
if (template.includes('data-prerender')) {
  throw new Error('prerender-routes: dist/index.html zaten ön-render edilmiş. Önce `vite build` çalıştır.');
}
if (!template.includes('<div id="root"></div>')) throw new Error('prerender-routes: şablonda boş <div id="root"></div> yok.');

const site = await loadSiteData();
const { seo, data } = site;
const { spa } = siteUrls(site);

// index.html'deki ana sayfa değerleri routeMeta.HOME_META ile aynı mı (dev sunucusu index.html'i kullanır).
const tplTitle = /<title>([\s\S]*?)<\/title>/.exec(template)?.[1];
const tplDesc = /<meta name="description" content="([^"]*)" \/>/.exec(template)?.[1];
if (tplTitle !== seo.HOME_META.title || tplDesc !== seo.HOME_META.description) {
  console.warn('prerender-routes: UYARI index.html title/description ile src/seo/routeMeta.js HOME_META farklı.');
}

const written = [];
for (const route of spa) {
  const meta = seo.metaForPath(route, data);
  if (!meta) throw new Error(`prerender-routes: ${route} için src/seo/routeMeta.js bilgi döndürmedi.`);
  if (meta.title.length > 65) throw new Error(`prerender-routes: ${route} title ${meta.title.length} karakter (en çok 65).`);
  if (meta.description.length > 160) throw new Error(`prerender-routes: ${route} description ${meta.description.length} karakter (en çok 160).`);
  if (route.startsWith('/ogretici/')) meta.ogType = 'article';

  let html = applyHead(template, meta)
    .replace('<div id="root"></div>', () => `<div id="root">${renderBody(meta)}</div>`)
    .replace('</head>', () => `    ${JS_GUARD}\n  </head>`);
  let file;
  if (route === '/') {
    file = indexPath;
  } else {
    file = path.join(distDir, `${route.slice(1)}.html`);
    if (existsSync(file)) throw new Error(`prerender-routes: ${path.relative(ROOT, file)} zaten var (public/ ile çakışma).`);
    mkdirSync(path.dirname(file), { recursive: true });
  }
  writeFileSync(file, html);
  written.push(path.relative(distDir, file));
}

console.log(`prerender-routes: ${written.length} sayfa yazıldı (${written.join(', ')}).`);
