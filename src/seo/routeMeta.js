// Rota başına <head> bilgisi ve ön-render içeriği için TEK KAYNAK.
//
// İki yerde kullanılır:
//  1. scripts/prerender-routes.mjs (build sonrası): sitemap'teki her SPA rotası için dist/<rota>.html üretir;
//     içinde o rotanın <title>, description, canonical, og:* etiketleri ve bir <h1> + kısa gerçek içerik olur.
//     Ham HTML'i okuyan tarayıcılar (Google ilk tarama, sosyal ağ önizlemeleri) ana sayfanın kopyasını görmez.
//  2. App.jsx (tarayıcıda): site içi gezinmede başlık, description ve canonical yeni rotaya göre güncellenir.
//
// Bu dosya HİÇBİR ŞEY import etmez (veri parametre olarak gelir), böylece hem Vite paketine hem de düz
// Node betiklerine girer. Metinler uydurulmaz: hepsi data.js, posts.js ya da sayfanın kendi bileşenindeki
// mevcut metinlerden gelir (kaynakları yanlarında yazılı). Kendi başlığını kendisi koyan sayfaların
// (SesVer, WingWire, tiTimer, Skills) başlıkları PAGE_META'dan okunur; bileşenler de aynı sabiti kullanır.

export const SITE = 'https://hamaratlabs.com';
export const DEFAULT_OG_IMAGE = { url: `${SITE}/og-image.png`, width: 1200, height: 630 };
const BRAND = 'hamaratlabs';
const TITLE_MAX = 65;
const DESC_MAX = 160;

// index.html'deki ana sayfa değerleriyle aynı (prerender-routes.mjs farkı build'de uyarır).
export const HOME_META = {
  title: 'hamaratlabs',
  description: "Ürettiğim, anlattığım ve paylaştığım laboratuvar. Yusuf Hamarat'ın uygulamaları, eğitici içerikleri ve paylaşımları."
};

// Kendi başlığını kendi bileşeninde koyan sayfalar. Bileşenler TITLE/DESC sabitlerini buradan alır.
export const PAGE_META = {
  // src/sesver-site/SesVerSite.jsx (t(TITLE) ile arayüz diline çevrilir; anahtar bu Türkçe metindir)
  '/sesver': { title: 'SesVer · Yazdığın, kendi bilgisayarında sese dönüşsün' },
  // src/wingwire-site/WingWireSite.jsx
  '/wingwire': {
    title: 'WingWire · Masadan kalk',
    description: 'Bilgisayarındaki Hermes Agent için Android uygulaması.'
  },
  // src/titimer-site/TiTimerSite.jsx
  '/titimer': {
    title: 'tiTimer: Odaklan. Mola ver. Tekrarla.',
    description: 'Neye ne kadar zaman ayırdığını sakin biçimde gösteren, tamamen telefonunda çalışan odak ve mola sayacı.'
  },
  // src/SkillsPage.jsx
  '/skills': {
    title: 'Skills & Araçlar · HamaratLabs',
    description:
      'HamaratLabs araç kataloğu: yapay zekâ uygulamaları, modeller, kütüphaneler, CLI ve skill’ler. Kategori, lisans, fiyat, GitHub yıldızları ve deneme sonuçlarıyla.'
  }
};

// Sayfa başlıkları (App.jsx → PAGES ile aynı metinler).
const SECTIONS = {
  '/uretiyorum': { title: 'Üretiyorum', lead: 'Uygulamalarımın mağazası.' },
  '/paylasiyorum': { title: 'Paylaşıyorum', lead: 'Sosyal medyada paylaştıklarım.' },
  '/anlatiyorum': { title: 'Anlatıyorum', lead: 'Yapay zekâ ve araçlar üzerine eğitici içerikler.' },
  '/oneriyorum': { title: 'Öneriyorum', lead: 'Kullandığım, ücretsiz veya açık kaynak araçlar.' },
  '/okul-projeleri': { title: 'Okul Projeleri', lead: 'Okul ve ders kapsamında yaptığım projeler.' }
};

const isPlaceholder = v => !v || String(v).startsWith('[');
const noDot = s => s.replace(/[.\s]+$/, '');
const lowerFirst = s => s.charAt(0).toLocaleLowerCase('tr') + s.slice(1);

// "<başlık> · hamaratlabs" 65 karakteri aşıyorsa marka eki düşer.
export function seoTitle(base) {
  const full = `${base} · ${BRAND}`;
  return full.length <= TITLE_MAX ? full : base;
}

// Açıklamayı cümle cümle 160 karaktere sığdırır (cümle ortasından kesmez; tek cümle uzunsa kelimede keser).
export function clipText(text, max = DESC_MAX) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  let out = '';
  for (const s of clean.split(/(?<=[.!?])\s+/)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  if (out) return out;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// "a, b ve c"
const joinTr = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`);

// Sitede gerçek içeriği olan ürünler (fikir aşamasındaki dolgu kartlar ve iç araçlar hariç).
const realProducts = ({ FEATURED, APPS }) => [...FEATURED, ...APPS].filter(a => !isPlaceholder(a.lead) && !a.internal);

// Sitemap'e giren ve ön-render edilen ürün detay sayfaları (/uretiyorum/<slug>): gerçek içeriği olan bütün ürünler.
// Mağaza kartları bu sayfalara link verir. Eskiden `short` alanı şarttı; FEATURED'daki SesVer ve WingWire'da `short`
// olmadığı için sayfaları sitemap'e girmiyor, canlıda ana sayfa <head>'iyle açılıyordu.
export const listedProducts = data => realProducts(data);

// Ürüne verilecek iç bağlantı: kendi detay sayfası sitemap'teyse o, değilse ürünün kendi sitesi.
function productHref(app, data) {
  const slug = data.slugOf(app.name);
  if (listedProducts(data).includes(app)) return `/uretiyorum/${slug}`;
  if (app.visitUrl && app.visitUrl.startsWith('/')) return app.visitUrl;
  return `/uretiyorum/${slug}`;
}

const productLinks = data =>
  realProducts(data).map(a => ({ href: productHref(a, data), label: a.name, text: isPlaceholder(a.short) ? a.lead : a.short }));

function base(path, fields) {
  return {
    path,
    canonical: path === '/' ? `${SITE}/` : `${SITE}${path}`,
    ogImage: DEFAULT_OG_IMAGE,
    manages: [],
    paragraphs: [],
    points: [],
    links: [],
    ...fields
  };
}

function sectionMeta(path, data) {
  const s = SECTIONS[path];
  const titleBase = `${s.title}: ${lowerFirst(noDot(s.lead))}`;
  const common = { title: seoTitle(titleBase), h1: s.title, lead: s.lead, back: { href: '/', label: '← ANA SAYFA' } };
  if (path === '/uretiyorum') {
    const names = realProducts(data).map(a => a.name);
    return base(path, {
      ...common,
      description: clipText(`${s.lead} Geliştirdiğim bütün uygulamalar tek yerde: ${joinTr(names)}.`),
      paragraphs: ['Geliştirdiğim bütün uygulamalar tek yerde.'],
      links: productLinks(data)
    });
  }
  if (path === '/paylasiyorum') {
    return base(path, {
      ...common,
      description: clipText(`${s.lead} Instagram: ${data.LINKS.instagramHandle}. YouTube kanalı yakında.`),
      paragraphs: ["Instagram ve YouTube'da paylaştıklarım. YouTube kanalı yakında."],
      links: [{ href: data.LINKS.instagram, label: 'Instagram', text: data.LINKS.instagramHandle, external: true }]
    });
  }
  if (path === '/anlatiyorum') {
    const series = data.SERIES.map(x => x.title);
    const intro = 'Yapay zekâyı ve kullandığım araçları adım adım anlatıyorum.';
    // Sığdığı kadar seri adı (160 karakter).
    let description = intro;
    for (let k = series.length; k > 0; k--) {
      const d = `${intro} Seriler: ${joinTr(series.slice(0, k))}.`;
      if (d.length <= DESC_MAX) {
        description = d;
        break;
      }
    }
    return base(path, {
      ...common,
      description,
      paragraphs: [intro],
      points: data.SERIES.map(x => `${x.title}: ${x.cover}`),
      links: [
        { href: '/ogretici', label: 'Öğretici', text: 'Nasıl yaptığımızı adım adım anlattığımız yazılar.' },
        ...data.POSTS.map(p => ({ href: `/ogretici/${p.slug}`, label: p.title, text: p.sub }))
      ]
    });
  }
  if (path === '/oneriyorum') {
    const cats = [...new Set(data.TOOLS.map(t => t.category.toLocaleLowerCase('tr')))];
    return base(path, {
      ...common,
      description: clipText(`${s.lead} Kategoriler: ${joinTr(cats)}.`),
      paragraphs: [`Kategoriler: ${joinTr(cats)}.`]
    });
  }
  // /okul-projeleri
  const projects = data.SCHOOL_PROJECTS;
  return base(path, {
    ...common,
    description: clipText(`${noDot(s.lead)}: ${joinTr(projects.map(p => p.name))}.`),
    links: projects.map(p => ({ href: p.links[0]?.url || path, label: p.name, text: p.lead }))
  });
}

function productDescription(app, data) {
  if (isPlaceholder(app.lead)) return clipText(app.short || app.name);
  const withNote = clipText([app.lead, app.devNote].filter(Boolean).join(' '));
  if (withNote !== clipText(app.lead)) return withNote;
  const stage = data.STAGE_LABELS?.[app.stage];
  const withStage = stage ? `${noDot(app.lead)}. Durum: ${stage}.` : '';
  return withStage && withStage.length <= DESC_MAX ? withStage : withNote;
}

function productMeta(app, data) {
  const path = `/uretiyorum/${data.slugOf(app.name)}`;
  const titleBase = app.seoTitle || (isPlaceholder(app.short) ? app.name : `${app.name}: ${app.short}`);
  const links = [];
  if (app.visitUrl) links.push({ href: app.visitUrl, label: app.visitLabel || 'Ürünü ziyaret et', external: !app.visitUrl.startsWith('/') });
  if (app.download) links.push({ href: app.download, label: app.downloadLabel || 'İndir', external: true });
  return base(path, {
    title: seoTitle(titleBase.length <= TITLE_MAX ? titleBase : app.name),
    // Ürünün kendi sitesi aynı lead'i kullanabilir (/titimer); çift açıklama olmasın diye geliştirme notu,
    // sığmazsa aşama etiketi (data.js STAGE_LABELS) eklenir.
    description: productDescription(app, data),
    h1: app.name,
    lead: isPlaceholder(app.lead) ? '' : app.lead,
    paragraphs: app.devNote ? [app.devNote] : [],
    points: (app.points || []).filter(p => !isPlaceholder(p)),
    links,
    back: { href: '/uretiyorum', label: '← Uygulamalar' }
  });
}

/**
 * Bir yolun SEO bilgisi. Bilinmeyen yolda null.
 * data: { FEATURED, APPS, SERIES, TOOLS, SCHOOL_PROJECTS, LINKS, POSTS, slugOf }
 */
export function metaForPath(path, data) {
  if (path === '/') {
    return base('/', {
      ...HOME_META,
      h1: 'Ürettiğim, anlattığım ve paylaştığım laboratuvarıma hoş geldin.',
      lead: HOME_META.description,
      links: [
        ...Object.entries(SECTIONS).map(([href, s]) => ({ href, label: s.title, text: s.lead })),
        ...productLinks(data)
      ]
    });
  }
  if (SECTIONS[path]) return sectionMeta(path, data);

  if (path.startsWith('/uretiyorum/')) {
    const app = [...data.FEATURED, ...data.APPS].find(a => `/uretiyorum/${data.slugOf(a.name)}` === path);
    return app ? productMeta(app, data) : null;
  }

  if (path === '/sesver') {
    // Metinler: SesVerSite.jsx → Hero. data.js kaydı yoksa (ad değişirse) hero metniyle devam edilir.
    const app = data.FEATURED.find(a => a.name === 'SesVer');
    const lead =
      'SesVer metnini kendi bilgisayarında doğal Türkçe sese çevirir. Hazır seslerden seç, tarif ederek yeni bir ses tasarla ya da kendi sesini klonla. Hesap yok, API anahtarı yok, bulut yok.';
    return base(path, {
      title: PAGE_META[path].title,
      description: clipText(app?.lead || lead),
      manages: ['title'],
      h1: 'Yazdığın, sese dönüşsün.',
      lead,
      points: app?.points || [],
      links: app?.download ? [{ href: app.download, label: app.downloadLabel || 'İndir', external: true }] : [],
      theme: { bg: '#fbf6ee', fg: '#231a14' } // sesver.css --sv-bg, --sv-ink
    });
  }
  if (path === '/wingwire') {
    const app = data.FEATURED.find(a => a.name === 'WingWire');
    return base(path, {
      title: PAGE_META[path].title,
      description: PAGE_META[path].description,
      manages: ['title', 'description'],
      // Metinler: WingWireSite.jsx → h1, lead (data.js; kayıt yoksa hero alt yazısı)
      h1: 'Masadan kalk.',
      lead: app?.lead || 'Ajanın bilgisayarında çalışmaya devam eder. Haberi cebine gelir.',
      points: app?.points || [],
      theme: { bg: '#0b0f14', fg: '#f5f1e8' } // WingWireSite.css --bg, --ink
    });
  }
  if (path === '/aktivite') {
    // Metinler: AktiviteHaritasi.jsx → akh__head. Sayfa kendi başlığını koymaz; App.jsx useHeadSync bunu kullanır.
    const lead = 'Yazdığım kodun haritası. Uzaktan yalnızca büyük işler görünür; yakınlaştıkça küçük adımlar da ortaya çıkar.';
    return base(path, {
      title: seoTitle('Aktivite Haritası: yazdığım kodun haritası'),
      description: clipText(lead),
      h1: 'Aktivite Haritası',
      lead,
      back: { href: '/', label: '← ANA SAYFA' }
    });
  }
  if (path === '/titimer') {
    const app = data.APPS.find(a => a.name === 'tiTimer');
    return base(path, {
      title: PAGE_META[path].title,
      description: PAGE_META[path].description,
      manages: ['title', 'description'],
      // Metinler: TiTimerSite.jsx → Hero
      h1: 'Odaklan. Mola ver. Tekrarla.',
      lead: 'tiTimer, neye ne kadar zaman ayırdığını sakin biçimde gösteren bir odak sayacı. Hesap yok, internet yok; her şey telefonunda kalır.',
      paragraphs: ['Henüz indirilemiyor. Mağazaya çıkınca bağlantılar burada olacak.'],
      points: app ? app.points : [],
      theme: { bg: '#f8f7f3', fg: '#1d3a42' } // titimer.css --paper, --ink
    });
  }
  if (path === '/skills') {
    return base(path, {
      title: PAGE_META[path].title,
      description: PAGE_META[path].description,
      manages: ['title', 'description'],
      // Metinler: SkillsPage.jsx → pagehead
      h1: 'Skills & Araçlar',
      lead: 'Keşfettiğim, değerlendirdiğim ve kullandığım araçların kataloğu.',
      back: { href: '/', label: '← ANA SAYFA' }
    });
  }
  if (path === '/ogretici') {
    const lead = 'Nasıl yaptığımızı adım adım anlattığımız yazılar.';
    return base(path, {
      title: seoTitle(`Öğretici: ${lowerFirst(noDot(lead))}`),
      description: clipText(`${lead} ${data.POSTS.map(p => p.title).join(' · ')}`),
      // Metinler: OgreticiPage.jsx → List
      h1: 'Öğretici',
      lead,
      links: data.POSTS.map(p => ({ href: `/ogretici/${p.slug}`, label: p.title, text: p.sub })),
      back: { href: '/', label: '← ANA SAYFA' }
    });
  }
  if (path.startsWith('/ogretici/')) {
    const post = data.POSTS.find(p => `/ogretici/${p.slug}` === path);
    if (!post) return null;
    const cover = post.cover && Object.values(post.figures || {}).find(f => f.src === post.cover);
    return base(path, {
      title: seoTitle(post.title),
      description: clipText(post.description || post.sub),
      manages: ['title'],
      h1: post.title,
      lead: post.description || '',
      paragraphs: [post.sub],
      ogImage: post.cover ? { url: `${SITE}${post.cover}`, width: cover?.width, height: cover?.height } : DEFAULT_OG_IMAGE,
      back: { href: '/ogretici', label: '← Öğretici' }
    });
  }
  if (path === '/privacy') {
    // scripts/prerender-privacy.mjs ile aynı metinler (o sayfa ayrı betikle üretilir; burada yalnız site içi gezinme için).
    return base(path, {
      title: 'Gizlilik Politikası · hamaratlabs',
      description: 'hamaratlabs.com kişisel asistan uygulaması için gizlilik politikası.'
    });
  }
  return null;
}

// Sayfa bulunamadığında (NotFoundPage) tarayıcıda kullanılan başlık.
export const NOT_FOUND_META = { title: `Sayfa bulunamadı · ${BRAND}`, description: 'Aradığın sayfa bulunamadı.' };
