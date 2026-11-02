// Öğretici / "Nasıl Yaptık" yazıları. Yeni yazı eklemek için:
//   1. src/ogretici/yazilar/<slug>.md dosyasını yaz (düz markdown: #, ###, **kalın**, `kod`, 1. / - listeler).
//      Metin içinde tek başına satır olarak `::figure <ad>` görsel, `::prompt` kopyalanabilir dosya kutusu koyar.
//   2. Aşağıdaki listeye bir girdi ekle (slug = dosya adı). Görseller public/ogretici/<slug>/ altında durur.
// Yol: /ogretici (liste) ve /ogretici/<slug> (yazı). Sitemap bu dosyadaki `slug:` satırlarını okur.
// Not: Bu dosya ana pakete girer; yazı metinleri ve sayfa bileşeni ayrı parça olarak yüklenir (OgreticiPage).

export const POSTS = [
  {
    slug: 'motion-video',
    title: 'Nasıl Yaptık: "Bu Motion Videolar Aslında Video Değil"',
    sub: 'Kod → görünmez tarayıcı → 683 kare → MP4',
    kind: 'NASIL YAPTIK',
    date: 'EKİM 2026',
    cover: '/ogretici/motion-video/v05_kontak.jpg',
    // TODO(Yusuf): Instagram post linki gelince '#' yerine yaz. '#' kaldıkça buton "yakında" olarak çizilir.
    instagram: '#',
    figures: {
      kontak: {
        type: 'image',
        src: '/ogretici/motion-video/v05_kontak.jpg',
        width: 2188,
        height: 1932,
        alt: 'Videonun her saniyesinden bir kare: MOTION yazısı, kod editörü, tarayıcı, kare yakalama, film şeridi ve telefon ekranına dönüşüm.',
        caption: 'Videonun her saniyesinden bir kare (0–27,28 sn).'
      },
      matte: {
        type: 'compare',
        items: [
          { src: '/ogretici/motion-video/ham-cekim-3sn.jpg', width: 720, height: 1280, alt: 'Ham çekim: Yusuf, oda duvarı önünde konuşuyor.', caption: 'Ham çekim · 3,0 sn' },
          { src: '/ogretici/motion-video/arka-plan-temiz-3sn.jpg', width: 720, height: 1280, alt: 'Aynı kare, arka planı temizlenmiş; arkada şeffaflığı gösteren damalı zemin.', caption: 'Arka plan temizlenmiş · 3,0 sn' }
        ],
        caption: 'Aynı an, iki hâl: soldaki ham çekim, sağdaki RVM ile arka planı kaldırılmış katman (damalı zemin = şeffaf).'
      },
      seritler: {
        type: 'strips',
        items: [
          { src: '/ogretici/motion-video/v05_ilk_0.5sn.jpg', width: 2856, height: 384, alt: 'Videonun ilk 13 karesi, kare kare.', caption: 'İlk 13 kare' },
          { src: '/ogretici/motion-video/v05_bitis.jpg', width: 2856, height: 384, alt: 'Videonun son 13 karesi, kare kare.', caption: 'Son 13 kare' }
        ]
      }
    },
    prompt: {
      file: '/ogretici/motion-video/nasil-yaptik-motion-video-agent-prompt.md',
      name: 'nasil-yaptik-motion-video-agent-prompt.md',
      title: 'Kendi agent\'ına sor'
    }
  }
];

export const postBySlug = slug => POSTS.find(p => p.slug === slug);
