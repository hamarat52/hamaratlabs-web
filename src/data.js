import { asset } from './base';

// Dış bağlantılar
export const LINKS = {
  site: 'https://hamaratlabs.com',
  instagram: 'https://www.instagram.com/m.yusuf_hamarat/',
  instagramHandle: '@m.yusuf_hamarat',
  contact: 'https://vialess.me/yusuf-hamarat'
};

// Paylaşıyorum'da gömülen Instagram reels'leri. Yenisini öne çıkarmak için linki buraya ekle.
export const INSTAGRAM_POSTS = [
  'https://www.instagram.com/reel/DefTpcnR46O/',
  'https://www.instagram.com/reel/Dejy2XWtqFx/',
  'https://www.instagram.com/reel/DeksxMdMZ4f/',
  'https://www.instagram.com/reel/Debb4DjR9h5/'
];

export const MENU = [
  { id: 'uretiyorum', label: 'Üretiyorum', hint: 'UYGULAMA MAĞAZASI' },
  { id: 'paylasiyorum', label: 'Paylaşıyorum', hint: 'SOSYAL MEDYA' },
  { id: 'anlatiyorum', label: 'Anlatıyorum', hint: 'EĞİTİCİ İÇERİKLER' }
];

// Aşama etiketleri (kartlar, ürün sayfası, tiTimer sayfası ortak kullanır).
// internal: yalnız iç kullanım için geliştirilen, indirilemeyen ve kaynağı yayımlanmayacak araç.
export const STAGE_LABELS = { beta: 'Açık beta', dev: 'Geliştirmede', idea: 'Fikir', live: 'Yayında', internal: 'İç kullanım' };

// Öne çıkanlar: şu an en önde olan uygulamalar.
export const FEATURED = [
  {
    name: 'SesVer',
    stage: 'beta',
    lead: 'Ücretsiz, yerel ve açık kaynak Türkçe ses üretimi ve klonlama. Yazdığını kendi bilgisayarında sese çevirir.',
    points: ['Hazır Türkçe sesler', 'Tarif ederek yeni ses tasarla', 'Kendi sesini klonla', 'Bilgisayarında çalışır, buluta gönderilmez', 'NVIDIA ve AMD ekran kartıyla hızlanır', 'Arayüz Türkçe dahil 11 dilde', 'Ücretsiz ve açık kaynak'],
    platform: 'macOS · WINDOWS',
    download: 'https://github.com/hamarat52/sesver',
    downloadLabel: "GitHub'dan indir",
    // Ürünün kendi sitesi (/sesver). AppPage bu alan varsa ürünün renginde ek bir CTA gösterir.
    visitUrl: '/sesver',
    visitLabel: 'Ürünü ziyaret et',
    visitAccent: 'linear-gradient(135deg, #ff5c86 0%, #ff8f1f 100%)'
  },
  {
    name: 'WingWire',
    stage: 'dev',
    lead: "Kendi yapay zekâ ajanına Android'den bağlan: sohbet et, onay ver, gerekince ajan seni arasın.",
    points: ['Ajanınla canlı sohbet', 'Oturumlarına telefondan devam et', 'İşlemleri tek dokunuşla onayla', 'Gerekince ajan seni arar'],
    platform: 'ANDROID',
    // Ürünün kendi sitesi (/wingwire). AppPage bu alan varsa ürünün renginde ek bir CTA gösterir.
    visitUrl: '/wingwire',
    visitLabel: 'Ürünü ziyaret et',
    visitAccent: 'linear-gradient(135deg, #5A86FF 0%, #1F5CFF 100%)'
  }
];

// İsteğe bağlı alan: `audience` (hedef kitle, düz metin). Fikir panosundaki künye notu okur;
// yazılmamışsa satır "doldurulacak" olarak boş kalır.
export const APPS = [
  {
    // İç kullanım aracı (özel repo): indirme/ziyaret linki bilerek yok; download/visitUrl eklenmez.
    name: 'WingWire Web',
    stage: 'internal',
    internal: true,
    short: 'Ajan ekibini tarayıcıdan yönet',
    lead: "Hermes ajanlarımı tarayıcıdan yöneten panel: kendi Mac'imde çalışır, yalnız özel ağım (tailnet) üzerinden erişilir.",
    points: ['Ajanlarla sohbet ve gruplar', 'İş ve görev takibi, cron takvimi', 'Tek «Oluştur» ekranından görsel, video ve seslendirmeli video', 'Ses Stüdyosu: seslendirme, diyalog, ses efekti, müzik', 'Telefonu QR kodla eşle (telefon paneli şimdilik yalnız okur)', 'Projeler, paylaşımlar ve sağlık paneli'],
    platform: 'WEB · İÇ KULLANIM'
  },
  {
    name: 'Income vs Desires',
    stage: 'beta',
    short: 'Fiyatı çalışma saatine çevir',
    lead: 'Gezinirken gördüğün fiyatları, maaşına göre kaç saat çalışman gerektiğine çevirir.',
    points: ['"500 TL" yerine "1,8 saat" yazar', 'Rakama tıklayınca orijinal fiyat geri gelir', 'Saatlik ücretini kendin girersin', 'Giderleri TL, dolar, euro veya sterlin olarak gir', 'İstersen fiyatı, giderlerden sonra kalan maaşına göre hesaplar'],
    platform: 'CHROME · SAFARI · WEB',
    // Chrome Web Store taslağı için çekilen gerçek ekranlar (income-vs-desires repo, store-assets/).
    screenshots: [
      { src: asset('/ivd-screens/trendyol.webp'), alt: "Trendyol'da ayakkabı fiyatları gün olarak: 2 gün, 2,6 gün" },
      { src: asset('/ivd-screens/giderler.webp'), alt: 'Giderler sayfası: kira ayın 12 gününü alıyor, halka grafik' },
      { src: asset('/ivd-screens/ayarlar.webp'), alt: 'Eklenti paneli: maaş, para birimi, çalışma düzeni ve gösterim seçenekleri' }
    ],
    download: 'https://github.com/hamarat52/income-vs-desires',
    downloadLabel: "GitHub'dan indir",
    // Ürünün kendi sitesi (GitHub Pages). AppPage bu alan varsa ek bir CTA gösterir.
    visitUrl: 'https://hamarat52.github.io/income-vs-desires/',
    visitLabel: 'Ürünü ziyaret et',
    // Hedef sitenin kendi kimliği: krem zemin + kiremit kırmızısı vurgu (terminal/monospace dil).
    visitAccent: 'linear-gradient(135deg, #C2451F 0%, #962D12 100%)'
  },
  {
    // Durum ve özellikler pm-titimer'dan (2026-11-01): sürüm 0.1.0+1, release yapılandırması hazır, henüz test kanalı yok.
    // "Aynı anda birden çok sayaç" ve ayrı "ters sayaç" iddiaları yanlıştı (README: aynı anda tek sayaç); kaldırıldı.
    name: 'tiTimer',
    stage: 'dev',
    short: 'Odak ve mola sayacı',
    lead: 'Neye ne kadar zaman ayırdığını sakin biçimde gösteren, tamamen telefonunda çalışan odak ve mola sayacı.',
    points: [
      'Kendi başlıklarını aç, süreni onlara göre tut',
      'Tek sayaç, geri sayımlı Pomodoro akışı',
      'Plansız molalar ayrı kaydedilir',
      'Unuttuğun süreyi tarihiyle elle ekle',
      'Günlük rapor ve haftalık başlık dağılımı'
    ],
    platform: 'ANDROID · iOS',
    devStep: 3,
    devNote: 'Geliştirme sürüyor; ilk sürüm (0.1.0) mağaza hazırlığında. Henüz test kanalı açılmadı.',
    // Gerçek uygulama ağacından üretilen mağaza ekranları (titimer repo: store/ortak/ekran, Android 1080x2400).
    screenshots: [
      { src: asset('/titimer-screens/ana-sayfa.webp'), alt: 'tiTimer ana sayfa: Odak alanların halkaları' },
      { src: asset('/titimer-screens/odak-modu.webp'), alt: 'tiTimer Sayaç: Odaklanıyor · Blok 1, 17:37 kaldı' },
      { src: asset('/titimer-screens/raporlar.webp'), alt: 'tiTimer Raporlar: odak süresi, plansız mola, haftalık dağılım' }
    ],
    // Kendi tanıtım sayfası. stageTemplate: mağaza sayfası yine Kitabe gibi geliştirme şablonunda (DevStagePage) kalır.
    visitUrl: '/titimer',
    visitLabel: 'Tanıtım sayfası',
    visitAccent: '#2F6D7C',
    stageTemplate: true
  },
  {
    name: 'Kitabe',
    stage: 'dev',
    short: "İstanbul'u okuyarak gez",
    lead: "İstanbul'daki çeşme, cami ve sebillerin kitabelerini kaynağıyla birlikte okutan, şehri okuyarak gezdiren bir rehber.",
    points: ['1.957 kitabe kaydı', '839 tarihî yapı', "8.900'ü aşkın fotoğraf, internetsiz"],
    platform: 'ANDROID · iOS',
    devStep: 4,
    devNote: "Sürüm 0.1.0 için mağaza paketi hazır: Türkçe ve İngilizce ekran görüntüleri ve açıklamalar tamam. Google Play'e ilk yükleme sırada.",
    // Test sürümünden gerçek ekran görüntüleri (docs/screenshots/ içindeki QA setinden).
    screenshots: [
      { src: asset('/kitabe-screens/home.webp'), alt: 'Kitabe ana sayfa: Günün Eseri ve Öne Çıkanlar' },
      { src: asset('/kitabe-screens/map.webp'), alt: 'Kitabe harita: İstanbul genelinde 228 kitabe kaydı' },
      { src: asset('/kitabe-screens/detail.webp'), alt: 'Kitabe detay sayfası: III. Ahmed Çeşmesi' }
    ]
  },
  {
    name: 'Pomodoro Restoran',
    stage: 'idea',
    short: '[Kısa açıklama]',
    lead: '[Bir cümlelik tanım]',
    platform: '[PLATFORM]'
  },
  {
    name: 'Duo for X',
    stage: 'idea',
    short: '[Kısa açıklama]',
    lead: '[Bir cümlelik tanım]',
    platform: '[PLATFORM]'
  },
  {
    name: 'Düşen Top',
    stage: 'beta',
    short: 'Siyah-beyaz, dikenlerden kaçan nostaljik arcade oyunu',
    lead: 'Tavandaki dikenlerden kaçarken yukarı çıkan platformların arasından geçmeye çalıştığın, nostaljik, tamamen siyah-beyaz bir arcade oyunu.',
    points: ['Sol/sağ ok tuşuyla kontrol', 'Zamanla hızlanan zorluk', 'Tek ekran, tarayıcıda oynanır'],
    platform: 'TARAYICI',
    // Tek sayfalık statik oyun (p5.js, build gerektirmez) — public/'ten doğrudan servis edilir.
    // Tam URL: SPA router'ı atlayıp gerçek dosyayı yeni sekmede açar.
    visitUrl: 'https://hamaratlabs.com/oyunlar/nostaljik-dikenler/index.html',
    visitLabel: 'Oyna',
    visitAccent: 'linear-gradient(135deg, #111111 0%, #555555 100%)'
  }
];

export const LOG = [
  {
    tag: 'KASIM 2026 · WINGWIRE WEB',
    text: 'Görsel, video ve seslendirmeli video artık tek bir Oluştur ekranından üretiliyor; Ses Stüdyosu eklendi. Telefon QR kodla eşlenebiliyor, telefon paneli şimdilik yalnız okuyor.'
  },
  {
    tag: 'EKİM 2026 · KİTABE',
    text: "Mağaza paketi hazır, Google Play'e ilk yükleme sırada. Gizlilik ve destek sayfaları yayında."
  },
  {
    tag: 'EKİM 2026 · SESVER',
    text: 'SesVer 1.1.0 yayında: Windows kurulum dosyası, NVIDIA/AMD ekran kartı hızlandırma ve Türkçe dahil 11 dilde arayüz. Mağaza paketi için 6 tanıtım videosu hazır.'
  },
  {
    tag: 'EKİM 2026 · INCOME VS DESIRES',
    text: 'Giderler artık TL, dolar, euro ya da sterlinle girilebiliyor; kur servisine ulaşılamazsa iki yedek kaynak deneniyor. Chrome Web Store ekranları hazır.'
  },
  {
    tag: 'EKİM 2026 · MARKA',
    text: 'Marka kitabı v1.0 tamamlandı. Logo sürümleri, renkler ve profil ikonu netleşti.'
  },
  {
    tag: 'INCOME VS DESIRES',
    text: "App Store için iPhone ve iPad ekran görüntüleri gerçek Safari'den çekildi; tanıtım videoları hazırlanıyor."
  },
  {
    tag: 'KANALLAR',
    text: 'Instagram hesabı açıldı. YouTube kanalı sırada; haftada bir uzun video planlanıyor.'
  }
];

export const SERIES = [
  { platform: 'YOUTUBE + REELS', cover: 'Kendi agent sunucunu kur.', box: '0 TL', title: "0 TL'ye kendi agent sunucun", when: 'PAZARTESİ · DÖNÜŞÜMLÜ' },
  { platform: 'REELS + YOUTUBE', cover: 'Takvim, todo ve Gmail tek sohbette.', box: 'Telegram', title: "Telegram'dan kişisel asistan", when: 'PAZARTESİ · DÖNÜŞÜMLÜ' },
  { platform: 'REELS + YOUTUBE', cover: 'Bir uygulamayı yapay zekâyla baştan sona yaz.', box: 'Süreç', title: 'Yapay zekâyla uygulama geliştirme', when: 'PAZARTESİ · DÖNÜŞÜMLÜ' },
  { platform: 'REELS', cover: 'Bu hafta öne çıkan araçlar.', box: 'Haftalık', title: 'Haftanın araçları', when: 'HER ÇARŞAMBA' }
];

// Öneriyorum sekmesi: kullandığım, ücretsiz veya açık kaynak ÜÇÜNCÜ TARAF araçlar (kendi ürünlerim değil).
// TASLAK LİSTE: Yusuf'un onayı/düzenlemesi bekleniyor; yayına hazır "kesin" bir liste değildir.
// license: 'Açık kaynak' (kaynak kodu açık lisanslı) | 'Ücretsiz' (ücretsiz ama kapalı kaynak).
export const TOOLS = [
  { name: 'Ollama', category: 'YAPAY ZEKÂ', license: 'Açık kaynak', lead: 'Açık dil modellerini tek komutla kendi bilgisayarında çalıştırır.', url: 'https://ollama.com' },
  { name: 'LM Studio', category: 'YAPAY ZEKÂ', license: 'Ücretsiz', lead: 'Yerel dil modellerini arayüzden indirip sohbet ettiren masaüstü uygulaması.', url: 'https://lmstudio.ai' },
  { name: 'Whisper', category: 'YAPAY ZEKÂ', license: 'Açık kaynak', lead: "OpenAI'ın konuşmayı metne çeviren açık kaynak modeli; Türkçe de destekler.", url: 'https://github.com/openai/whisper' },
  { name: 'Hermes Agent', category: 'YAPAY ZEKÂ', license: 'Açık kaynak', lead: "Nous Research'ün terminalde ve mesajlaşma uygulamalarında çalışan açık kaynak yapay zekâ ajanı.", url: 'https://hermes-agent.nousresearch.com' },
  { name: 'Obsidian', category: 'PRODÜKTİVİTE', license: 'Ücretsiz', lead: 'Notlarını kendi bilgisayarında düz Markdown dosyaları olarak tutan, birbirine bağlayan not uygulaması.', url: 'https://obsidian.md' },
  { name: 'VS Code', category: 'PRODÜKTİVİTE', license: 'Ücretsiz', lead: "Microsoft'un eklentilerle genişleyen ücretsiz kod düzenleyicisi; kaynak kodu MIT lisanslı.", url: 'https://code.visualstudio.com' },
  { name: 'OBS Studio', category: 'İÇERİK ÜRETİMİ', license: 'Açık kaynak', lead: 'Ekran kaydı ve canlı yayın için ücretsiz, açık kaynak yazılım.', url: 'https://obsproject.com' },
  { name: 'Audacity', category: 'İÇERİK ÜRETİMİ', license: 'Açık kaynak', lead: 'Ses kaydı ve düzenleme için ücretsiz, açık kaynak ses editörü.', url: 'https://www.audacityteam.org' }
];

// Footer'daki kayan şerit: Yusuf'un çektiği fotoğraflar.
// src: özgün JPG (yedek). variants: build öncesi üretilen WebP'ler (scripts/optimize-images.mjs);
// FlexCarousel kartın ekrandaki piksel yüksekliğine yetecek en küçüğünü seçer.
const ilham = n => ({
  src: asset(`/ilham/${n}.jpg`),
  variants: [640, 960].map(height => ({ src: asset(`/ilham/opt/${n}-${height}.webp`), height }))
});
export const INSPIRATION = [
  'Ördek',
  'Vapurda',
  'Ay ve sokak lambası',
  'Gece satıcısı',
  'Mozaik lambalar',
  'Kız Kulesi',
  'Taş duvarda lamba',
  'Ben sen yokuz, biz varız.',
  'Taş merdiven',
  'Kedi',
  'Yılbaşı vitrini',
  'Sarman',
  'Kız Kulesi, gece'
].map((title, i) => ({ ...ilham(String(i + 1).padStart(2, '0')), alt: title, title }));

// Okul Projeleri (/okul-projeleri): okul ve ders kapsamında yapılan projeler. Yeni proje = bu listeye bir kayıt.
// links: '/' ile başlayan adres sitedeki statik sayfadır (aynı sekmede tam yükleme), https:// dış adrestir (yeni sekme).
// note: düğmenin altındaki küçük not. image: public/okul-projeleri-screens/ altındaki gerçek ekran görüntüsü.
export const SCHOOL_PROJECTS = [
  {
    name: 'Akçe',
    lead: 'Yapay zekâ asistanlı kişisel finans ve birikim uygulaması (okul projesi, konsept).',
    image: { src: asset('/okul-projeleri-screens/akce-pano-720.webp'), srcSet: `${asset('/okul-projeleri-screens/akce-pano-720.webp')} 720w, ${asset('/okul-projeleri-screens/akce-pano-1200.webp')} 1200w`, width: 1200, height: 750, alt: 'Akçe uygulamasının ana panosu: harcama dağılımı, gelir ve gider, hedefler (örnek verilerle)' },
    links: [
      // Statik tanıtım: public/okul-projeleri/akce/ (Akçe repo'sundaki dist-tanitim kopyası). '/' ile başladığı için düz <a>, aynı sekmede tam yükleme.
      { label: 'Tanıtım', url: '/okul-projeleri/akce/' },
      { label: 'Uygulamayı dene', url: 'https://akce.hamaratlabs.com/giris', note: 'Erişim kodu gerekir' }
    ]
  },
  {
    name: 'RICAMBIO',
    lead: 'Artık üretilmeyen klasik araç plastik parçaları için doğrulanmış 3D dosya kütüphanesi ve baskı servisi (okul projesi, prototip).',
    image: { src: asset('/okul-projeleri-screens/ricambio-720.webp'), srcSet: `${asset('/okul-projeleri-screens/ricambio-720.webp')} 720w, ${asset('/okul-projeleri-screens/ricambio-1200.webp')} 1200w`, width: 1200, height: 750, alt: 'RICAMBIO tanıtım sayfasının açılışı: rozetsiz kırmızı bir hatchback ve "Twenty years on the road" başlığı' },
    links: [
      { label: 'Tanıtım', url: '/okul-projeleri/ricambio/' },
      { label: 'Uygulamayı dene', url: '/okul-projeleri/ricambio/app/', note: 'Demo verisiyle, giriş gerekmez' }
    ]
  }
];

export const slugOf = name =>
  name
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Giscus yorumları: giscus.app'ten alınan kimlikler buraya. Boşken yorum alanı görünmez.
export const GISCUS = {
  repo: 'hamarat52/hamaratlabs-web',
  repoId: 'R_kgDOVO3Xgw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOVO3Xg84DI8cO'
};
