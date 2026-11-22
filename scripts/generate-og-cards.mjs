// Sayfaya özel paylaşım kartları (og:image, 1200x630 PNG) üretir: public/og/*.png.
// Build'e bağlı değildir; kart metni ya da görseli değişince elle çalıştırılır ve çıktı commit'lenir:
//   npm run og:kartlar
// Yöntem scripts/generate-og-image.mjs ile aynıdır (sharp + SVG). Farkı: yazılar sistem fontuna
// bırakılmaz, opentype.js ile sayfanın kendi fontundan (scripts/og-kartlar/fontlar, OFL) SVG yoluna
// çevrilir; böylece kart her makinede aynı çıkar ve Türkçe karakterler bozulmaz.
// Metinler uydurulmaz: başlık, üst etiket ve açıklama her sayfanın kendi HTML'inden (title, h1,
// .meta, meta description) okunur. RICAMBIO landing'i CI'da başka repodan kopyalandığı için onun
// başlığı yayındaki sayfanın <title>'ından sabit alınmıştır (aşağıda RICAMBIO bölümü).
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const KAYNAK = path.join(__dirname, 'og-kartlar');
const OUT = path.join(PUB, 'og');
const W = 1200, H = 630;

const font = (ad) => {
  const b = readFileSync(path.join(KAYNAK, 'fontlar', ad));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const F = {
  mono5: font('og-jetbrainsmono-500.ttf'),
  mono7: font('og-jetbrainsmono-700.ttf'),
  geist5: font('og-geist-500.ttf'),
  geist7: font('og-geist-700.ttf'),
  fig5: font('og-figtree-500.ttf'),
  fig7: font('og-figtree-700.ttf'),
  fig8: font('og-figtree-800.ttf'),
  arch9: font('og-archivo-900.ttf'),
};

// --- Yazı yardımcıları -------------------------------------------------------------------------
// Kendi dizgimiz: opentype.js'in getPath'i bazı GPOS kerning çiftlerinde (Figtree "Pa") NaN koordinat
// üretiyor ve librsvg yolu o noktada kesiyor. Glifleri tek tek yerleştirip kerning'i elle ekliyoruz.
function dizgi(f, s, size, ls) {
  const gl = f.stringToGlyphs(s);
  const scale = size / f.unitsPerEm;
  const xs = [];
  let x = 0;
  gl.forEach((g, i) => {
    xs.push(x);
    x += g.advanceWidth * scale + ls * size;
    if (i < gl.length - 1) {
      const k = f.getKerningValue(g, gl[i + 1]);
      if (Number.isFinite(k)) x += k * scale;
    }
  });
  return { gl, xs, w: x - ls * size };
}
const genislik = (f, s, size, ls = 0) => dizgi(f, s, size, ls).w;
// Glifin ham (font birimli) komutlarından SVG yolu; Glyph.getPath bazı gliflerde ilk noktayı NaN
// yazıyor (Geist "v"), ham komutlar ise sağlam.
function glifYolu(g, ox, oy, scale) {
  const X = (v) => (ox + v * scale).toFixed(2);
  const Y = (v) => (oy - v * scale).toFixed(2);
  let d = '';
  for (const c of g.path.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Q') d += `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'C') d += `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}
// Tek satır yazıyı SVG <path>'e çevirir. anchor: 'start' | 'end' | 'middle'.
function yazi(f, s, x, y, size, fill, { ls = 0, anchor = 'start', opacity = 1 } = {}) {
  const { gl, xs, w } = dizgi(f, s, size, ls);
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  const d = gl.map((g, i) => glifYolu(g, x0 + xs[i], y, size / f.unitsPerEm)).join('');
  if (/NaN|Infinity/.test(d)) throw new Error(`Geçersiz glif yolu: ${s}`);
  return { svg: `<path d="${d}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`, w };
}
// Kelime kaydırma; açık satır sonları (\n) korunur.
function sar(f, s, size, maxW, ls = 0) {
  const satirlar = [];
  for (const parca of s.split('\n')) {
    let cur = '';
    for (const k of parca.split(/\s+/).filter(Boolean)) {
      const dene = cur ? `${cur} ${k}` : k;
      if (cur && genislik(f, dene, size, ls) > maxW) { satirlar.push(cur); cur = k; } else cur = dene;
    }
    if (cur) satirlar.push(cur);
  }
  return satirlar;
}
// Başlığı verilen kutuya sığan en büyük boyda yerleştirir (maxLines satırı geçmeden).
function sigdir(f, s, { maxW, sizes, maxLines, ls = 0 }) {
  for (const size of sizes) {
    const lines = sar(f, s, size, maxW, ls);
    if (lines.length <= maxLines && lines.every((l) => genislik(f, l, size, ls) <= maxW)) return { size, lines };
  }
  throw new Error(`Başlık sığmadı: ${s}`);
}

// --- Görsel yardımcıları -----------------------------------------------------------------------
// Görseli w×h kutusuna (cover) kırpar, köşelerini yuvarlar. crop: kaynak üzerinde {left, top, width, height}.
async function kutu(file, w, h, r, { crop, position = 'centre' } = {}) {
  let img = sharp(file);
  if (crop) img = img.extract(crop);
  const buf = await img.resize(w, h, { fit: 'cover', position }).png().toBuffer();
  const maske = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);
  return sharp(buf).composite([{ input: maske, blend: 'dest-in' }]).png().toBuffer();
}
async function svgPng(file, w) {
  return sharp(readFileSync(file), { density: 600 }).resize({ width: w }).png().toBuffer();
}
// Alt katman (zemin SVG) + görseller + üst katman (yazılar) → public/og/<ad>.png
async function kart(ad, zemin, gorseller, ust) {
  const png = await sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${zemin}</svg>`))
    .composite([
      ...gorseller,
      { input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${ust}</svg>`), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  const meta = await sharp(png).metadata();
  if (meta.width !== W || meta.height !== H) throw new Error(`${ad}: boyut ${meta.width}x${meta.height}`);
  writeFileSync(path.join(OUT, `${ad}.png`), png);
  console.log(`public/og/${ad}.png  ${(png.length / 1024).toFixed(0)} KB`);
}

// --- Sayfa metinlerini HTML'den oku ------------------------------------------------------------
const temiz = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
function sayfa(rel) {
  const html = readFileSync(path.join(PUB, rel), 'utf8');
  const al = (re) => { const m = re.exec(html); return m ? m[1] : null; };
  const h1Ham = al(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return {
    title: temiz(al(/<title>([\s\S]*?)<\/title>/i) || ''),
    h1: temiz(h1Ham || ''),
    h1Satirlar: (h1Ham || '').split(/<br\s*\/?>/i).map(temiz).filter(Boolean),
    desc: temiz(al(/<meta\s+name="description"\s+content="([^"]*)"/i) || ''),
    meta: temiz(al(/<p class="meta">([\s\S]*?)<\/p>/i) || ''),
    lang: al(/<html[^>]+lang="([^"]+)"/i),
  };
}
const buyuk = (s, lang) => s.toLocaleUpperCase(lang === 'en' ? 'en' : 'tr');

// --- IncomeVsDesires ("mesai kartı" dili: kağıt zemin, cetvel çizgileri, monospace, mühür kırmızısı) --
const IVD = { paper: '#f2efe6', ink: '#17150f', ink2: '#57534a', muted: '#8b857a', rule: '#d9d4c6', ruleSoft: '#e8e3d6', stamp: '#b8371f' };
const ivdSimge = await svgPng(path.join(KAYNAK, 'ivd-simge.svg'), 64);

async function ivdKart(ad, { kicker, baslik, vurgu, alt, adres, sagAlt }) {
  let zemin = `<rect width="${W}" height="${H}" fill="${IVD.paper}"/>`;
  for (let y = 31; y < H; y += 32) zemin += `<rect x="0" y="${y}" width="${W}" height="1" fill="${IVD.ruleSoft}"/>`;
  let ust = '';
  // Marka: ürün simgesi + income<span>vs</span>desires (sayfanın üst barıyla aynı).
  let x = 152;
  for (const [s, c] of [['income', IVD.ink], ['vs', IVD.stamp], ['desires', IVD.ink]]) {
    const t = yazi(F.mono7, s, x, 92, 32, c, { ls: -0.03 });
    ust += t.svg; x += t.w;
  }
  if (kicker) ust += yazi(F.mono5, kicker, W - 72, 90, 19, IVD.muted, { anchor: 'end', ls: 0.04 }).svg;

  // Başlık (h1'in kendi yazı tipi: monospace 600 → JetBrains Mono 700, -0.02em)
  const maxW = W - 144;
  const ls = -0.02;
  const { size, lines } = sigdir(F.mono7, baslik, { maxW, sizes: [76, 72, 68, 64, 60, 56, 52, 48, 44], maxLines: 3, ls });
  const lh = Math.round(size * 1.12);
  const altSatir = alt ? sar(F.geist5, alt, 27, maxW) : [];
  const vurguH = vurgu ? lh : 0;
  const blok = lines.length * lh + vurguH + (altSatir.length ? 24 + altSatir.length * 38 : 0);
  let y = Math.round(150 + (390 - blok) / 2 + size * 0.85);
  let son = y;
  for (const l of lines) { ust += yazi(F.mono7, l, 72, y, size, IVD.ink, { ls }).svg; son = y; y += lh; }
  if (vurgu) {
    // Ürünün imzası: eklentideki süre çipi (mühür kırmızısı, noktalı alt çizgi).
    const t = yazi(F.mono7, vurgu, 72, y, size, IVD.stamp, { ls });
    ust += t.svg;
    for (let dx = 0; dx < t.w; dx += 9) ust += `<rect x="${72 + dx}" y="${y + 12}" width="4" height="3" fill="${IVD.stamp}"/>`;
    son = y;
  }
  if (altSatir.length) {
    y = son + Math.round(size * 0.3) + 50;
    for (const l of altSatir) { ust += yazi(F.geist5, l, 72, y, 27, IVD.ink2).svg; y += 38; }
  }
  // Alt şerit
  ust += `<rect x="72" y="540" width="${W - 144}" height="1" fill="${IVD.rule}"/>`;
  ust += yazi(F.mono5, adres, 72, 584, 20, IVD.muted).svg;
  if (sagAlt) ust += yazi(F.mono5, sagAlt, W - 72, 584, 20, IVD.stamp, { anchor: 'end' }).svg;
  await kart(ad, zemin, [{ input: ivdSimge, left: 72, top: 46 }], ust);
}

const ivdAna = sayfa('income-vs-desires/index.html');
// "Ücretsiz Chrome eklentisi." ana sayfanın meta description'ının son cümlesi.
if (!ivdAna.desc.includes('Ücretsiz Chrome eklentisi')) throw new Error('IVD açıklaması değişmiş, sağ alt yazıyı kontrol et.');
const ivdAdres = 'hamaratlabs.com/income-vs-desires';
const baslikTitle = (p) => p.title.replace(/\s*\|\s*IncomeVsDesires$/, '');

mkdirSync(OUT, { recursive: true });

// Ana sayfa: h1 iki satır ("500 TL değil." / "1 saat 46 dakika."), alt yazı <title>'ın ikinci yarısı.
{
  const [ilk, ikinci] = ivdAna.h1Satirlar;
  const altYazi = ivdAna.title.split(': ')[1];
  await ivdKart('income-vs-desires', {
    baslik: ilk, vurgu: ikinci,
    alt: altYazi.charAt(0).toLocaleUpperCase('tr') + altYazi.slice(1),
    adres: ivdAdres, sagAlt: 'Ücretsiz Chrome eklentisi',
  });
}
// Blog dizini: üst etiket menüdeki "Yazılar", başlık h1, alt yazı <title>.
{
  const p = sayfa('income-vs-desires/blog/index.html');
  await ivdKart('income-vs-desires-blog', { kicker: 'YAZILAR', baslik: p.h1, alt: baslikTitle(p), adres: `${ivdAdres}/blog` });
}
// Blog yazıları: üst etiket yazının tarih/süre satırı, başlık h1.
for (const slug of ['durtusel-alisveristen-kurtulmak', 'kira-maasin-yuzde-kaci-olmali', 'saatlik-ucret-nasil-hesaplanir']) {
  const p = sayfa(`income-vs-desires/blog/${slug}.html`);
  await ivdKart(`income-vs-desires-${slug}`, { kicker: buyuk(p.meta, 'tr'), baslik: p.h1, adres: `${ivdAdres}/blog` });
}
// Saatlik ücret hesaplayıcı: başlık <title> (h1 + soru), açıklama yok.
{
  const p = sayfa('income-vs-desires/saatlik-ucret-hesaplama.html');
  await ivdKart('income-vs-desires-saatlik-ucret-hesaplama', { baslik: baslikTitle(p), adres: ivdAdres, sagAlt: 'Ücretsiz Chrome eklentisi' });
}
// Destek / gizlilik (TR + EN): başlık h1, alt yazı meta description, üst etiket güncelleme tarihi.
for (const [rel, ad] of [
  ['income-vs-desires/destek.html', 'income-vs-desires-destek'],
  ['income-vs-desires/gizlilik.html', 'income-vs-desires-gizlilik'],
  ['income-vs-desires/en/support.html', 'income-vs-desires-en-support'],
  ['income-vs-desires/en/privacy.html', 'income-vs-desires-en-privacy'],
]) {
  const p = sayfa(rel);
  await ivdKart(ad, { kicker: buyuk(p.meta, p.lang), baslik: p.h1, alt: p.desc, adres: ivdAdres });
}

// --- Fibi (sayfanın hero'su: lacivert-mavi degrade, Figtree, açık yeşil vurgu, maskot) ------------
{
  const p = sayfa('okul-projeleri/fibi/index.html');
  const h1 = /<h1[^>]*>([\s\S]*?)<span>([\s\S]*?)<\/span><\/h1>/i.exec(readFileSync(path.join(PUB, 'okul-projeleri/fibi/index.html'), 'utf8'));
  const [s1, s2] = [temiz(h1[1]), temiz(h1[2])];
  const etiket = temiz(/class="_HeVna_ustEtiket[^"]*">([^<]*)</.exec(readFileSync(path.join(PUB, 'okul-projeleri/fibi/index.html'), 'utf8'))[1]);
  if (`${s1} ${s2}` !== p.h1) throw new Error('Fibi h1 okunamadı');
  const zemin = `
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.55" y2="1"><stop offset="0" stop-color="#0057b8"/><stop offset="0.45" stop-color="#003f86"/><stop offset="1" stop-color="#002f66"/></linearGradient>
      <radialGradient id="r1" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="#a6e247" stop-opacity="0.16"/><stop offset="0.7" stop-color="#a6e247" stop-opacity="0"/></radialGradient>
      <radialGradient id="r2" cx="0" cy="0.6" r="0.5"><stop offset="0" stop-color="#84bd00" stop-opacity="0.09"/><stop offset="0.7" stop-color="#84bd00" stop-opacity="0"/></radialGradient>
      <filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#r1)"/>
    <rect width="${W}" height="${H}" fill="url(#r2)"/>
    <rect x="640" y="150" width="620" height="420" rx="16" fill="#001433" opacity="0.45" filter="url(#b)"/>
    <rect x="900" y="250" width="196" height="410" rx="30" fill="#001433" opacity="0.5" filter="url(#b)"/>
    <rect x="626" y="132" width="640" height="420" rx="14" fill="#ffffff"/>
    <circle cx="648" cy="150" r="5" fill="#dfe2e6"/><circle cx="666" cy="150" r="5" fill="#dfe2e6"/><circle cx="684" cy="150" r="5" fill="#dfe2e6"/>`;
  const G = 'okul-projeleri/fibi/varliklar';
  const pano = await kutu(path.join(PUB, G, 'gorsel/m-pano.2c7lxk89t640j-1200.webp'), 640, 384, 0, { position: 'left top' });
  const tel = await kutu(path.join(PUB, G, 'gorsel/t-asistan-araba.04k_2uez9g61g-828.webp'), 184, 398, 26, { position: 'top' });
  const telCerceve = await sharp(Buffer.from('<svg width="196" height="410"><rect width="196" height="410" rx="32" fill="#0b1220"/></svg>')).png().toBuffer();
  const maskot = await sharp(path.join(PUB, G, 'maskot/fibi-ana@2x.webp')).resize({ height: 168 }).png().toBuffer();
  const simge = await svgPng(path.join(PUB, G, 'simge/icon.svg'), 56);
  let ust = '';
  ust += yazi(F.fig8, 'fibi', 140, 94, 44, '#ffffff', { ls: -0.02 }).svg;
  // Üst etiket (sayfadaki hap biçimi)
  const ew = genislik(F.fig7, etiket, 19, 0.02);
  ust += `<rect x="72" y="150" width="${ew + 36}" height="40" rx="20" fill="none" stroke="#c4ef7a" stroke-opacity="0.45" stroke-width="1.5"/>`;
  ust += yazi(F.fig7, etiket, 90, 177, 19, '#ffffff', { ls: 0.02 }).svg;
  ust += yazi(F.fig8, s1, 72, 300, 80, '#ffffff', { ls: -0.02 }).svg;
  ust += yazi(F.fig8, s2, 72, 392, 80, '#a6e247', { ls: -0.02 }).svg;
  ust += sar(F.fig5, p.desc.split('. ')[0] + '.', 24, 500).map((l, i) => yazi(F.fig5, l, 72, 458 + i * 34, 24, '#ffffff', { opacity: 0.82 }).svg).join('');
  ust += yazi(F.fig5, 'hamaratlabs.com/okul-projeleri/fibi', 72, 584, 20, '#ffffff', { opacity: 0.6 }).svg;
  await kart('fibi', zemin, [
    { input: simge, left: 72, top: 50 },
    { input: pano, left: 626, top: 168 },
    { input: telCerceve, left: 900, top: 236 },
    { input: tel, left: 906, top: 242 },
    { input: maskot, left: 1100, top: 440 },
  ], ust);
}

// --- Kuveyt Türk API Portal (sayfanın kendi paleti: krem zemin, koyu yeşil; Geist) ---------------
{
  const p = sayfa('okul-projeleri/kuveytturk-api-portal/index.html');
  const html = readFileSync(path.join(PUB, 'okul-projeleri/kuveytturk-api-portal/index.html'), 'utf8');
  const ustEtiket = temiz(/<p class="ust">([^<]*)<\/p>/.exec(html)[1]);
  // Sayfanın "bağımsız okul projesi" notunun ilk iki cümlesi kartta da korunur.
  const not = temiz(/<p class="not">([^<]*)<\/p>/.exec(html)[1]).split(/(?<=\.)\s+/).slice(0, 2);
  if (!/^Bağımsız bir okul projesidir\./.test(not[0])) throw new Error('KT notu değişmiş');
  const K = { zemin: '#f4f1ea', yazi: '#1d1d1b', soluk: '#5c5a55', vurgu: '#0b6e4f', kart: '#fffdf8', cizgi: '#e2ddd2', ink: '#0f241d', ink3: '#5d6a63' };
  const zemin = `
    <defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs>
    <rect width="${W}" height="${H}" fill="${K.zemin}"/>
    <rect x="0" y="0" width="${W}" height="8" fill="${K.vurgu}"/>
    <rect x="726" y="72" width="420" height="262" rx="16" fill="#0f241d" opacity="0.14" filter="url(#b)"/>
    <rect x="646" y="262" width="500" height="312" rx="16" fill="#0f241d" opacity="0.18" filter="url(#b)"/>`;
  const KT = 'okul-projeleri/kuveytturk-api-portal';
  const urun = await kutu(path.join(PUB, KT, 'urun-hero.webp'), 420, 262, 14);
  const akiskan = await kutu(path.join(PUB, KT, 'akiskan-hero.webp'), 500, 312, 14);
  let ust = '';
  // Tasarımlardaki wordmark: <b>Kuveyt Türk</b><span>API Market</span>
  const wm = yazi(F.geist7, 'Kuveyt Türk', 72, 92, 30, K.ink, { ls: -0.02 });
  ust += wm.svg;
  ust += `<rect x="${72 + wm.w + 14}" y="68" width="1.5" height="30" fill="${K.ink}" fill-opacity="0.2"/>`;
  ust += yazi(F.geist5, 'API Market', 72 + wm.w + 30, 92, 23, K.ink3).svg;
  ust += yazi(F.geist5, buyuk(ustEtiket, 'tr'), 72, 176, 17, K.vurgu, { ls: 0.06 }).svg;
  const { size, lines } = sigdir(F.geist7, p.h1, { maxW: 520, sizes: [64, 60, 56, 52], maxLines: 3, ls: -0.02 });
  let y = 176 + 22 + size;
  for (const l of lines) { ust += yazi(F.geist7, l, 72, y, size, K.yazi, { ls: -0.02 }).svg; y += Math.round(size * 1.08); }
  // Not kutusu
  const notSatir = sar(F.geist5, not.join(' '), 19, 476);
  const ny = y + 8;
  ust += `<rect x="72" y="${ny}" width="516" height="${notSatir.length * 27 + 26}" rx="10" fill="${K.kart}" stroke="${K.cizgi}" stroke-width="1.5"/>`;
  notSatir.forEach((l, i) => { ust += yazi(F.geist5, l, 92, ny + 34 + i * 27, 19, K.soluk).svg; });
  ust += yazi(F.geist5, 'hamaratlabs.com/okul-projeleri/kuveytturk-api-portal', 72, 584, 19, K.vurgu).svg;
  await kart('kuveytturk-api-portal', zemin, [
    { input: urun, left: 716, top: 56 },
    { input: akiskan, left: 636, top: 246 },
  ], ust);
}

// --- RICAMBIO (landing'in kendi paleti: gri-mavi kağıt, siyah Archivo Black, petrol mavisi nokta) ---
{
  // Yayındaki https://hamaratlabs.com/okul-projeleri/ricambio/ <title>'ı (2026-11-22). Landing başka
  // repodan (hamarat52/ricambio-landing) derlendiği için burada sabit; ref değişirse kontrol et.
  const TITLE = 'RICAMBIO: parts that no longer exist, made again';
  const [marka, slogan] = TITLE.split(': ');
  const R = { paper: '#d1d7de', ink: '#111111', teal: '#2b7a8c', orange: '#e8731e' };
  // Sitenin okul projeleri vitrinindeki landing ekran görüntüsü (hero: araba ve sayfanın kendi başlığı).
  const ekran = await kutu(path.join(PUB, 'okul-projeleri-screens/ricambio-1200.webp'), 560, 350, 12);
  const zemin = `
    <defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter></defs>
    <rect width="${W}" height="${H}" fill="${R.paper}"/>
    <rect x="590" y="150" width="560" height="350" rx="12" fill="#14181d" opacity="0.28" filter="url(#b)"/>`;
  const simge = await svgPng(path.join(KAYNAK, 'ricambio-simge.svg'), 56);
  let ust = '';
  ust += yazi(F.arch9, marka, 140, 92, 36, R.ink, { ls: -0.01 }).svg;
  const metin = slogan.charAt(0).toUpperCase() + slogan.slice(1) + '.';
  const { size, lines } = sigdir(F.arch9, metin, { maxW: 470, sizes: [72, 68, 64, 60, 56], maxLines: 4, ls: -0.03 });
  let y = Math.round(300 - (lines.length * size) / 2 + size * 0.8);
  for (const l of lines) { ust += yazi(F.arch9, l, 72, y, size, R.ink, { ls: -0.03 }).svg; y += Math.round(size * 1.0); }
  ust += `<rect x="580" y="132" width="560" height="350" rx="12" fill="none" stroke="${R.ink}" stroke-opacity="0.25" stroke-width="1.5"/>`;
  ust += `<rect x="72" y="540" width="1056" height="1.5" fill="${R.ink}" fill-opacity="0.18"/>`;
  ust += yazi(F.mono5, 'hamaratlabs.com/okul-projeleri/ricambio', 72, 584, 19, R.ink).svg;
  ust += `<circle cx="1120" cy="578" r="8" fill="${R.teal}"/>`;
  await kart('ricambio', zemin, [
    { input: simge, left: 72, top: 50 },
    { input: ekran, left: 580, top: 132 },
  ], ust);
}
