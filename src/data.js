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

// Öne çıkanlar: şu an en önde olan uygulamalar.
export const FEATURED = [
  {
    name: 'SesVer',
    stage: 'beta',
    lead: 'Ücretsiz, yerel ve açık kaynak Türkçe ses üretimi ve klonlama. Yazdığını kendi bilgisayarında sese çevirir.',
    points: ['Hazır Türkçe sesler', 'Tarif ederek yeni ses tasarla', 'Kendi sesini klonla', 'Bilgisayarında çalışır, buluta gönderilmez', 'Ücretsiz ve açık kaynak'],
    platform: 'macOS · WINDOWS',
    download: 'https://github.com/hamarat52/sesver',
    downloadLabel: "GitHub'dan indir"
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
    name: 'Income vs Desires',
    stage: 'beta',
    short: 'Fiyatı çalışma saatine çevir',
    lead: 'Gezinirken gördüğün fiyatları, maaşına göre kaç saat çalışman gerektiğine çevirir.',
    points: ['"500 TL" yerine "1,8 saat" yazar', 'Rakama tıklayınca orijinal fiyat geri gelir', 'Saatlik ücretini kendin girersin'],
    platform: 'CHROME · WEB',
    download: 'https://github.com/hamarat52/income-vs-desires',
    downloadLabel: "GitHub'dan indir",
    // Ürünün kendi sitesi (GitHub Pages). AppPage bu alan varsa ek bir CTA gösterir.
    visitUrl: 'https://hamarat52.github.io/income-vs-desires/',
    visitLabel: 'Ürünü ziyaret et',
    visitAccent: 'linear-gradient(135deg, #34D399 0%, #059669 100%)'
  },
  {
    name: 'tiTimer',
    stage: 'idea',
    short: 'Çoklu sayaç ve çalışma raporu',
    lead: 'Çoklu sayaç, ters sayaç ve çalışma raporlarını bir araya getiren sade bir odak uygulaması.',
    points: ['Aynı anda birden çok sayaç', 'Ters sayaç', 'Çalışma raporları'],
    platform: 'iOS · ANDROID'
  },
  {
    name: 'Kitabe',
    stage: 'idea',
    short: "İstanbul'u okuyarak gez",
    lead: 'Kitabeleri, mekânları ve tarihi metinleri bir araya getirip şehri okuyarak gezdiren bir rehber.',
    points: ['Kitabeler', 'Mekânlar', 'Tarihi metinler'],
    platform: 'ANDROID · iOS'
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
  }
];

export const LOG = [
  {
    tag: 'EKİM 2026 · MARKA',
    text: 'Marka kitabı v1.0 tamamlandı. Logo sürümleri, renkler ve profil ikonu netleşti.'
  },
  {
    tag: 'INCOME VS DESIRES',
    text: 'Eklentinin kodu çalışıyor, iki test dosyası da geçiyor. Mağazaya yüklemek için görseller ve alan adı eksik.'
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
