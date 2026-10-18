import { asset } from './base';

// Dış bağlantılar
export const LINKS = {
  site: 'https://hamaratlabs.com',
  instagram: 'https://www.instagram.com/m.yusuf_hamarat/',
  instagramHandle: '@m.yusuf_hamarat',
  contact: 'https://vialess.me/yusuf-hamarat'
};

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
    platform: 'ANDROID'
  }
];

export const APPS = [
  {
    name: 'Income vs Desires',
    stage: 'dev',
    short: 'Fiyatı çalışma saatine çevir',
    lead: 'Gezinirken gördüğün fiyatları, maaşına göre kaç saat çalışman gerektiğine çevirir.',
    points: ['"500 TL" yerine "1,8 saat" yazar', 'Rakama tıklayınca orijinal fiyat geri gelir', 'Saatlik ücretini kendin girersin'],
    platform: 'CHROME · WEB'
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

// Footer'daki kayan şerit: Yusuf'un çektiği fotoğraflar.
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
].map((title, i) => ({ src: asset(`/ilham/${String(i + 1).padStart(2, '0')}.jpg`), alt: title, title }));

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
