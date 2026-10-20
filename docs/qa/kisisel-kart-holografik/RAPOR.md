# Kişisel kart (Lanyard): kesilmiş fotoğraf ve holografik pul

Branch: `feature/kisisel-kart-holografik`
Worktree: `hamaratlabs-web-wt-holokart`
Tarih: 2026-10-20

## Özet

1. Arka plan kaldırıldı. `public/ilham/02.jpg` (960×1280) kaynağından şeffaf bir kesim üretildi: `public/brand/yusuf-kart-kesilmis.webp`. Boyutu 640×640 RGBA, 39,5 KB. Kesim kartın `.lanyard__body` radial-gradient'i üzerine oturuyor ve `App.jsx` bu dosyayı kullanıyor.
2. Holografik pul katmanı eklendi. `.lanyard__body::before` fotoğrafın arkasında duruyor (z-index -1, `isolation: isolate`). Desen satır içi SVG maskesinden geliyor: 34 px'lik karoda 6 kollu bir pul, köşelerde 4 uçlu parıltılar var. Bu mask iki katmanın görünür alanını belirliyor: gökkuşağı folyo gradyanı ve beyaz ışık bandı. Katman tilt'e bağlı iki yeni CSS değişkeniyle besleniyor.
   - `--ly-foil` (yaklaşık -1…1, uçlarda ±1,7 olabiliyor): `tiltY/38 + angle*1.6`. Folyo ve ışık bandının `background-position` değerini, `filter: hue-rotate()` açısını (×110deg) ve maskenin hafif kaymasını yönetiyor.
   - `--ly-foil-glow` (0…1): `min(1, |tiltY|/26 + |angle|*1.4)`. `opacity` değerini 0,34 ile 0,84 arasında yönetiyor; kart hareket ettikçe parlıyor, durunca sönükleşiyor.
3. Ek düzeltme (mevcut bir hata): kartın meta şeridi (YUSUF HAMARAT / KURUCU · HL 001) önceki hâlde kartın dışına taşıyor ve kırpılıyordu. `.lanyard__face` scrollHeight değeri 302 idi, kart yüksekliği 268. Görsel `width:100%; height:auto` ile 230 px yüksekliğe çıkıyordu. Gövdeye `min-height:0` verildi ve görsel `height:100%; object-fit:contain` ile alta hizalandı. Sonrasında scrollHeight 266 (≤ 268) ve meta şeridi tamamen görünüyor (bkz. 01 ve 02).

## Dokunulan dosyalar

- `src/components/rb/Lanyard/Lanyard.jsx`: +6 satır. Mevcut `--ly-sheen` satırının hemen altına aynı `sheenRef` üzerinde iki `setProperty` çağrısı eklendi. `transform`, fizik, sürükleme ve sallanma koduna dokunulmadı.
- `src/components/rb/Lanyard/Lanyard.css`: foil değişkenleri ve SVG desen (`.lanyard__face`), `::before` katmanı, gövdeye `isolation` ve `min-height`, görsel yerleşimi.
- `src/App.jsx`: `image` → `/brand/yusuf-kart-kesilmis.webp`. `label="YUSUF HAMARAT"`, `serial="KURUCU · HL 001"`, `cardWidth={232}` ve `cardHeight={268}` aynı kaldı.
- `public/brand/yusuf-kart-kesilmis.webp`: yeni dosya. Eski `yusuf-kart.webp` silinmedi.

`reactbits profile-card` bileşeni kopyalanmadı ve kurulmadı; yalnız fikir alındı. Yeni bağımlılık yok.

## Kesim süreci

- Model: rembg `birefnet-portrait`. Kurulum yalnız scratch venv'e yapıldı, repoya bağımlılık eklenmedi.
- Son işleme: yalnız en büyük bağlı bileşen tutuldu. 3 px dilation, ardından alfa eğrisi (lo=0,30, hi=0,90). Renk arındırma için pymatting `estimate_foreground_ml` kullanıldı; deniz/gökyüzü rengi kenarlarda hale bırakmıyor. Kırpma 250,80,970,800 → 640 px.

## Kanıt: şeffaflık

```
$ file public/brand/yusuf-kart-kesilmis.webp
public/brand/yusuf-kart-kesilmis.webp: RIFF (little-endian) data, Web/P image
$ webpinfo …  → VP8X "Alpha: 1", Canvas 640 x 640, "Chunk ALPH … length 14670"
PIL: WEBP RGBA (640, 640) alpha extrema (0, 255), köşeler [0,0,0,0]
     tam şeffaf %45,9 · yarı saydam (kenar) %3,4 · opak %50,7
```

Görsel kontrol (`06-kesim-yakin.jpg`, `07-kesim-acik-zemin.jpg`, açık lime zemin üzerinde): saç telleri korunmuş. Omuz, kulaklık ve gözlük çevresinde mavi/gri hale veya kopuk ada yok.

## Kanıt: tilt'e bağlı (etkileşimli) foil

Playwright (chromium headless) sayfayı 1280×800 ve DPR 2 ile açtı. Kart fareyle sürüklenip bırakıldı, sallanma sırasında kareler alındı. Her karede DOM'dan canlı `transform` ve CSS değişkenleri okundu (`olcum-sonra.json`):

| Kare | transform (özet) | --ly-foil | --ly-foil-glow |
|---|---|---|---|
| atış-00 | rotate(0.768rad) rotateY(20.95deg) | -0.678 | 1.000 |
| atış-03 | rotate(-0.981rad) rotateY(3.81deg) | 1.670 | 1.000 |
| atış-07 | rotate(0.681rad) rotateY(-2.75deg) | -1.161 | 1.000 |
| atış-11 | rotate(-0.100rad) rotateY(5.65deg) | 0.309 | 0.357 |
| durulma | rotate(-0.090rad) rotateY(-1.17deg) | 0.113 | 0.171 |

`04-sonra-egim-serisi.jpg` bu dört kareyi yan yana gösteriyor. Folyonun rengi (hue), ışık bandının konumu ve opaklık kareler arasında gözle görülür biçimde değişiyor. `03-once-egim-serisi.jpg` aynı senaryonun önceki hâli: desen yok, yalnız eski `--ly-sheen` parlaması var.

## Kanıt: fizik ve sürükleme bozulmadı

- JSX diff'i yalnız ekleme içeriyor; `card.style.transform` satırı ve fizik döngüsü bayt bayt aynı.
- Aynı betik önce ve sonra çalıştırıldı. Sürükleme etkili (dx 171,8 px). Kart bırakılınca salınıyor (x aralığı 376 → 596 px), sonra duruluyor (son kare açı -0,09 rad). Önceki çalıştırmada da salınım ve durulma aynı biçimdeydi (`olcum-once.json`).
- `offsetWidth/offsetHeight` = 232 × 268 (masaüstü). Mobilde mevcut ölçekleme 158 × 182 olarak korunuyor.
- Mobil 390×844 smoke (`05-mobil-390.jpg`): kart, foil, kesim ve meta şeridi düzgün; sürükleme dx 158,9 px.

## Build ve lint

- `npm run build`: başarılı (`✓ built in 3.68s`, `dist/privacy/index.html oluşturuldu`). Yalnız önceden de var olan >500 kB chunk uyarısı çıkıyor.
- `npm run lint`: 17 problem (11 hata, 6 uyarı). Bu değişiklikten önce de aynı 17 problem vardı (git stash ile karşılaştırıldı). Hepsi dokunulmayan dosyalarda: `vite.config.js` (`process` no-undef), `AppIcon.jsx`, `nav.jsx`, `CodeSlots`, `SlingButton` ve diğerleri. Değişen JSX dosyalarında hata yok (`npx eslint Lanyard.jsx App.jsx` → 0 hata; App.jsx:51'de önceden var olan bir fast-refresh uyarısı).

## Ekran görüntüleri (bu klasörde)

- `01-once-dinlenme.jpg`: önceki hâl. Boğaz arka planlı fotoğraf; meta şeridi taşıyor.
- `02-sonra-dinlenme.jpg`: sonraki hâl. Kesik fotoğraf, pul deseni, tam meta şeridi.
- `03-once-egim-serisi.jpg` / `04-sonra-egim-serisi.jpg`: 4 farklı eğimde önce/sonra.
- `05-mobil-390.jpg`: 390×844.
- `06-kesim-yakin.jpg`, `07-kesim-acik-zemin.jpg`: kesim kenar kontrolü.
- `olcum-once.json`, `olcum-sonra.json`: kare başına transform ve CSS değişkenleri.

## Notlar ve sınırlar

- Gerçek Figma referansı verilmediği için görsel QA, canlı sitenin mevcut tasarım diliyle (lime marka rengi, mevcut kart) karşılaştırılarak yapıldı.
- `prefers-reduced-motion`: Lanyard'ın mevcut JS davranışı (`reducedMotion()` → `still`) değiştirilmedi. CSS'e ek bir `@media (prefers-reduced-motion: reduce)` kuralı eklendi: foil katmanı sabit konumda, sönük (opaklık 0,34) ve hue-rotate'siz kalıyor.
