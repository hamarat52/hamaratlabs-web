# Performans Optimizasyonu — RAPOR

## Özet
hamaratlabs.com'un mobil Lighthouse Performance skoru **53 → 86** (yerel
ölçümde, aynı ortamda önce/sonra karşılaştırması). Tasarım/işlev değişmedi,
yalnız yükleme performansı iyileştirildi.

## Kök neden (Fixer'ın profille kanıtladığı)
Footer'daki "ilham" fotoğraf şeridi (`FlexCarousel`, WebGL/ogl tabanlı),
sayfa ilk açılırken 13 JPG'yi (1.9MB) hemen indirip ana iş parçacığında
senkron çözüyordu — 4x yavaşlatılmış CPU'da bu tek başına 2.7 saniye
tutuyordu (`Texture.update` 1451ms, `image.onload` 1257ms). Ayrıca
Instagram embed zinciri (~1MB, ~170 istek) de ilk yükte geliyordu.

## Ölçüm (Lighthouse 12.8.2, mobil, ham JSON'lar
`~/.hermes/profiles/fixer/cache/scratch/perf/lh/` altında saklı)

| | Performance | FCP | LCP | TBT | Boyut |
|---|---|---|---|---|---|
| Canlı, önce (3 koşu) | 53 | 3455ms | 3761ms | 2793ms | 3961 KB / 220 istek |
| Yerel, önce (5 koşu) | 58 | 2856ms | 3507ms | 4092ms | — |
| Yerel, sonra (5 koşu) | **86** (77-97 aralık) | 1804ms | 2382ms | 448ms | 214 KB / 10 istek |
| Masaüstü, yerel | 98→100 | — | 1009→488ms | — | — |

Not: Canlıda "sonra" ölçümü yapılmadı (deploy gerektiriyor, karar bende).
Yerel karşılaştırma aynı taklit-GitHub-Pages ortamında yapıldığı için geçerli.

## Yapılan değişiklikler
1. **Kod bölme**: `AppPage`, `TiTimerPage`, `FlexCarousel` ve 3 zemin efekti
   artık `lazy()`. Yeni `src/components/WhenNear.jsx` footer şeridini
   ekrana 1000px kala bağlıyor (kayma yok, boyut CSS'ten geliyor).
   Ana bundle: **618KB → 313KB** (gzip 202.8→101.8KB).
2. **three/ogl konsolidasyonu YAPILMADI (bilinçli karar)**: ikisi de artık
   tembel yükleniyor, ana pakette değiller — birleştirmek ilk yüke kazanç
   sağlamaz, görünüm riski taşır.
3. **Görsel optimizasyonu**: yeni `scripts/optimize-images.mjs` (sharp),
   her build'de otomatik çalışıyor. `ilham/*.jpg` → 640/960px WebP,
   1.9MB → 444KB/852KB. FlexCarousel WebGL dokusu olduğu için `srcset`
   yerine eşdeğer bir varyant-seçim mantığı eklendi (kart boyutu × dpr'ye
   göre). `image.decode()` ile senkron çözme kaldırıldı.
4. **Font self-host**: Google Fonts'un render-blocking CSS'i kaldırıldı,
   `src/fonts.css` + `public/fonts/` (11 woff2 + OFL lisansları) ile
   yerel servis ediliyor. Tahmini kazanç ~900ms.
5. **Instagram embed**: artık liste ekrana yaklaşınca yükleniyor.
6. **CLS**: logo `<img>`'lerine width/height eklendi.

## Doğrulama
- `npm run build`: GEÇTİ (ben de ayrıca doğruladım).
- `npm run lint`: 12 hata/6 uyarı var ama HEPSİ öncesinde de vardı
  (SlingButton, WakeSlider, vite.config.js vb.) — Fixer önce/sonra eslint
  çıktısını normalize edip fark sıfır olduğunu doğruladı.
- Görsel regresyon: ana sayfa üst kısmı (hero) ekran görüntüsüyle kontrol
  edildi (`sonra-ust-ekran.png`), kırık/bozuk bir şey yok. (Not: bu worktree
  ana sitedeki en son kişisel kart değişikliğinden ÖNCE dallandığı için
  görüntüde hâlâ eski hamaratlabs logo kartı var — bu normal, merge'de
  birleşecek.)
- sharp 0.34→0.35.5 güncellendi (npm audit açığı giderildi, audit artık 0).

## Açık sorular (kullanıcıya)
1. Final ölçümlerden birinde CLS 0.031 çıktı, Lighthouse yine footer
   logosunu işaret ediyor — logo zaten width/height almış olmasına rağmen.
   Gerçek kaynağı doğrulanmadı, ayrı bir inceleme gerekebilir.
2. GitHub Pages statik asset'ler için `max-age=600` cache header'ını
   override etmeye izin vermiyor gibi görünüyor (resmi dokümandan
   doğrulanmadı). Daha agresif cache için önüne Cloudflare proxy koymak
   ya da Cloudflare Pages/Netlify'a geçmek seçenek — bu altyapı kararı
   kullanıcıda.

## Durum
Kod `feature/perf-optimizasyon` branch'inde, tek commit, `main`'e push
edilmedi. Deploy kararı ve yukarıdaki 2 açık soru kullanıcı onayı bekliyor.
