# hamaratlabs.com telefon düzeni B + açılış sadeleştirme + sarkan kart: son rapor (2026-11-08)

Worktree `.worktrees/mobil-taslak` · dal `design/mobil-taslak` · önceki iş 41463f8 üstüne. Yerel; push/PR/merge yok.
4318 önizleme sunucusu açık bırakıldı, `dist` son derlemeyle güncel.

## Özet
| Madde | Durum |
|---|---|
| 1. Yön B kalıcı, `?yon` kalktı, A kuralları kalktı | Yapıldı |
| 2. Açılıştan renk ve zemin seçicileri kalktı (kar + yeşil sabit, eski kayıt yok sayılıyor) | Yapıldı |
| 3. Sarkan kart kaydırmada uçmuyor | Yapıldı (ölçümler aşağıda) |
| Kabul 1-6 | Hepsi ölçüldü, geçti. Açılış bırakılışı ve sürükleyip bırakma sırasında kartın ekran kenarını aşması bu işin dışında kaldı, açık soru 1-2 |

## Ne değişti
- `src/mobil.css` (yeni): taslaktaki B kuralları, 620 px altında parametresiz çalışır. Seçiciler `html:root` önekli: taslaktaki
  `html[data-yon]` ile aynı özgüllük (0,1,1), böylece sonradan yüklenen sayfa parçalarının CSS'i bu kuralları ezmez.
- `src/App.jsx`:
  - `mobil-taslak.css` ve `mobilTaslak.js` içe aktarılmıyor; `?yon` ve `sessionStorage hl-yon` artık hiçbir yerde okunmuyor.
  - Açılış: `.grounds`, `.tints`, `GROUNDS`, `TINTS`, `remember/store` (localStorage `hl-ground` / `hl-tint`) ve `GradientASCII`,
    `LetterGlitch` lazy importları kalktı. Zemin doğrudan `PixelSnow` (renk `#7fae12`), kart rengi `#7fae12`.
  - Telefonda (620 px altı) TechText hiç kurulmuyor; h1 HTML yazı olarak görünüyor (B'deki gibi, 27 px). Masaüstünde TechText aynen duruyor.
  - Kart telefonda sağa asılı (`anchorX` 0.63), masaüstünde ortada (0.5). `usePhone` kancası App.jsx içine alındı.
- `src/App.css`: `.grounds` / `.tints` kuralları ve yorumları kalktı.
- `src/components/rb/Lanyard/Lanyard.jsx`: kaydırma itkisi, görünmezken birikme ve boyut değişimi düzeltmesi (aşağıda).
- Paket: `GradientASCII-*.js/css` ve `LetterGlitch-*.js/css` parçaları `dist/assets`'ten düştü; ana `index-*.js` 343 303 → 341 095 bayt.
  Derlenmiş JS/CSS'te `hl-yon`, `hl-ground`, `hl-tint`, `data-yon` geçmiyor (grep 0).
- Silinmedi (dosya silme yasak): `src/mobilTaslak.js`, `src/mobil-taslak.css`, `GradientASCII/`, `LetterGlitch/` bileşen klasörleri.
  Hiçbiri içe aktarılmıyor, pakete girmiyor.

## Sarkan kart: kök neden ve düzeltme
Kök nedenler (kodda doğrulandı, ölçümle görüldü):
1. `onScroll` her scroll olayında kartın hızına doğrudan `dy × 0.18` px/alt adım ekliyordu. Alt adım 1/120 sn, yani 60 px'lik
   tek olay ≈ 1300 px/sn yatay hız. Kare başına üst sınır yoktu; momentumlu kaydırmada her kare yeni itki ekleyip sarkacı pompalıyordu.
2. Kart görünmezken (IntersectionObserver) döngü duruyor ama `pendingKick` birikmeye devam ediyordu; geri dönüşte birikmiş
   itkinin hepsi tek alt adımda uygulanıyordu (ölçümde kare başına 110 px sıçrama).
3. Boyut değişiminde (telefonda adres çubuğu) ip uzunluğu bir anda değişiyordu; Verlet'te ani kısalma hıza dönüşüp kartı savuruyordu.
4. Sönüm hafifti (0.992/alt adım) ve her scroll olayı 7 sn'lik esintiyi yeniden başlatıyordu; kart 6 sn içinde dinlenmiyordu.

Düzeltme (`Lanyard.jsx`, sabitler dosyanın başında açıklamalı):
- İtki yalnız kart görünürken toplanır; görünürlük değişince sıfırlanır. Kare başına bir kez uygulanır, en fazla 0.4 px/alt adım.
- Kaydırma kartı 0.4 px/alt adımdan (≈ 48 px/sn) hızlı itemez; sürükleyip bırakmanın daha hızlı salınımı frenlenmez.
- Kart askı noktasından 8 px'ten uzaktayken dışa doğru itilmez. Bu üçü salınımın enerjisini, dolayısıyla genliğini sınırlar.
- Kaydırmadan sonraki 3 sn kart daha sıkı sönümlenir (0.98/alt adım), sürüklemede bu kapanır. Scroll esintiyi yeniden başlatmaz.
- Boyut değişiminde ip ve askı boyu yeni değere yumuşakça gider (anında değil).
- Sürükleme, sürükleme sınırları, açılış bırakılışı ve esinti kodu değişmedi.

### Eşik önerisi
- Yatay sapma (kart merkezinin dinlenme konumundan): telefonda en çok 24 px, masaüstünde en çok 35 px. Gerekçe: kart genişliğinin
  %15'i (158 px / 232 px). Hafif sallanma görünür kalır ama "uçma" olmaz; 390 px'te kart sağa asılı ve dinlenmede sağ kenara 61 px
  boşluk var, 24 px'lik sapma en az ~37 px pay bırakır.
- Kare başına yatay sıçrama en çok 4 px (60 kare/sn'de 240 px/sn; daha hızlısı göze "sıçrama" olarak gelir).
- Görüş alanı dışı kare 0; kart açılış alanının (`.breath`) kutusu dışına çıkmaz.
- Dinlenme: kaydırma bittikten sonra ±4 px içinde kalıcı olarak 3 sn içinde.

### Ölçüm (betik `docs/mobil-taslak/kart.py`, özetler `docs/mobil-taslak/kart/*-ozet.json`)
Yöntem: başsız Chrome, 390x844 dpr2 mobil öykünme + dokunmatik (masaüstü 1280x800). Her rAF karesinde kartın ve `.breath`'in
kutusu kaydedilir. Açılış bırakılışı sönene kadar beklenir (son 2 sn'de < 1 px oynama), dinlenme konumu oradan alınır.
Evreler: e1 tekerlek 300 aşağı + 300 yukarı; e2 `Input.synthesizeScrollGesture` dokunmatik fırlatma 2500 px aşağı (4000 px/sn,
momentum açık) + yukarı fırlatmalarla başa dönüş; e3 tekerlek 4×300 aşağı + 4×300 yukarı; e4 (yalnız telefon) görünüm yüksekliği
844 → 760 → 844 (adres çubuğu benzeri). Parmak kartın dışından (sol kenara yakın) kaydırır: kartın üstünden başlayan hareket sürüklemedir.
"Önce" = önceki derleme (41463f8): parametresiz (kart ortada) ve `?yon=b` (kart sağda, yeni düzenle aynı).

390 px, en büyük yatay sapma (px) · kare başına en büyük yatay sıçrama (px) · görüş dışı kare · dinlenme (sn):
| Evre | Önce, parametresiz | Önce, ?yon=b | Sonra |
|---|---|---|---|
| e1 tekerlek 300 | 217.8 · 12.4 · 49 · dinlenmedi | 215.4 · 16.0 · 49 · dinlenmedi | 7.7 · 1.3 · 0 · 1.37 |
| e2 fırlatma 2500 | 265.8 · 62.8 · 86 · dinlenmedi | 277.7 · 110.3 · 78 · dinlenmedi | 5.3 · 0.5 · 0 · 0.45 |
| e3 tekerlek 4×300 | 242.7 · 64.6 · 104 · dinlenmedi | 269.9 · 53.7 · 73 · dinlenmedi | 12.6 · 1.4 · 0 · 1.70 |
| e4 yükseklik 844→760→844 | 76.2 · 9.2 · 2 · 6.03 | 62.0 · 8.5 · 12 · dinlenmedi | 3.2 · 0.3 · 0 · 0.65 |
- Sonra, 390: dikey sapma e1-e3'te en çok 0.4 px; e4'te 10.8 px (ip boyu 143 → 129 px yumuşakça kısalıp geri uzar, kare başına 0.3 px).
  Sağ kenara en az boşluk 45.1 px (e3), sol 154.6 px. `.breath` dışı kare 0.
- "Dinlenmedi" = evreden sonraki 6 sn'lik pencerede ±4 px'e kalıcı inmedi.

1280 px:
| Evre | Önce | Sonra |
|---|---|---|
| e1 tekerlek 300 | 242.8 · 38.9 · dinlenmedi | 8.3 · 1.1 · 1.82 |
| e2 fırlatma 2500 | 176.5 · 38.0 · dinlenmedi | 6.8 · 1.5 · 2.27 |
| e3 tekerlek 4×300 | 313.9 · 37.5 · dinlenmedi | 12.5 · 1.5 · 2.15 |
- Masaüstünde kart önce de görüş alanından çıkmıyordu ama `.breath` kutusunun dışına 11 / 29 / 66 kare taşıyordu (üste savrulma); sonra 0.

Not: makine o sırada başka bir ajanın Gradle süreciyle yüklüydü (%340 CPU); başsız Chrome bütün koşularda 15-16.5 kare/sn verdi.
Fizik kare başına en çok 1/30 sn ilerlediği için bu hızda simülasyon gerçek zamanın ~0.5 katı akar: dinlenme süreleri 60 kare/sn'lik
telefonda daha kısa olur. Genlik sınırı kare hızından bağımsızdır (hız ve sapma sınırı). Gerçek telefonda deneme yapılmadı.

### Sürükleme korunuyor (`surukle.py`, `surukle.log`)
Kart 90 px sağa, 40 px aşağı çekildi: 390 ve 1280'de kart parmağı/fareyi izledi (fark 90.0, 39.6), bırakınca sallanıp 10 sn içinde
askının altına döndü. Bırakış salınımı önceki derlemeyle aynı karakterde (390'da ilk salınım −114 / +98 px; önce −111 / +101 px).

## Diğer kabul ölçütleri
1. Telefon düzeni B, parametresiz (`olc.py`, `son-olcum-{360,390,430}.log`), 4 sayfa (/, /uretiyorum, /anlatiyorum, /oneriyorum):
   scrollWidth 360 / 390 / 430 (genişliğe eşit), 12 px altı görünür yazı 0, konsol istisnası, console.error ve HTTP ≥ 400 sayısı 0.
   İlk öğe konumları 390'da taslak B ile aynı: ilk kart / 1192, /uretiyorum 354, ilk ders 357, ilk araç 240.
   Yerleşim eşitliği (`yerlesim2.py`, `yerlesim-son.log`): eski derleme `?yon=b` ↔ yeni parametresiz, 360 / 390 / 430 px, 4 sayfada
   0 farklı öğe. `?yon=a` ↔ parametresiz (yeni derleme, 390): 4 sayfada 0 farklı öğe; `<html data-yon>` yazılmıyor.
2. Açılış (`acilis.py`, `acilis.log`), 390 ve 1280: `.tints` ve `.grounds` DOM'da yok. localStorage `hl-ground=ascii`, `hl-tint=amber`
   yazılıyken yeniden açılışta zemin yine `pixel-snow-container`, kart rengi `#7fae12`; ASCII / Glitch parçası hiç istenmiyor.
   Telefonda TechText yok, h1 görünür (position static, 27 px); masaüstünde TechText var (2 tuval), h1 yalnız ekran okuyucuya.
3. Kart testi: yukarıda. Bütün evrelerde eşik içinde; görüş dışı kare 0; dinlenme en çok 2.27 sn.
4. Masaüstü yerleşim (`yerlesim2.py`, `yerlesim-son.log`): önceki derleme ↔ yeni, 1280 ve 700 px, 4 sayfada 0 farklı öğe
   (kaldırılan `.grounds` / `.tints` iki tarafta da sayım dışı; ikisi de `position: absolute` olduğu için başka öğeyi etkilemiyordu).
   1280'de ilk öğe konumları ve 12 px altı sayıları da önceki ölçümle aynı (`son-olcum-1280.log`).
5. `npm run build` geçti (✓ built, privacy / sitemap / og-image üretildi). `npx eslint src/App.jsx src/components/rb/Lanyard/Lanyard.jsx`:
   0 hata, 1 uyarı (App.jsx:57 react-refresh, önceden var). Tüm depo `npm run lint` 406 hata; önceki raporla aynı, bu işten değil.
   `mobil.css` için depoda CSS linter'ı yok.
6. Önce / sonra paftaları (depoda): `docs/mobil-taslak/son/pafta/`
   - `anasayfa-390-once-sonra.png`, `uretiyorum-390-once-sonra.png` (yan yana), `anasayfa-1280-once-sonra.png` (alt alta).
   Ham görüntüler yalnız worktree'de: `docs/mobil-taslak/son/{once,sonra}-{390,1280}/*-ilk.png`, `*-tam.png` (+ `sonra-360`, `sonra-430`).
   "Önce" telefonda parametresiz önceki derleme (bugünkü canlı düzen).

## Değişen dosyalar
- Kod (commit 1): `src/App.jsx`, `src/App.css`, `src/mobil.css` (yeni), `src/components/rb/Lanyard/Lanyard.jsx`
- Belge (commit 2): bu rapor; `docs/mobil-taslak/` altında `kart.py`, `acilis.py`, `surukle.py`, `yerlesim2.py`, `pafta.py`,
  `kart/*-ozet.json`, `son/*/olcum.json`, `son/pafta/*.png`, `*.log`, `.gitignore`
- Yeni bağımlılık yok. Dokunulmayanlar: DodgeField, ürün siteleri, parıltılı kartlar, kar zemininin kendisi, metinler, data.js.

## Açık sorular
1. Açılış bırakılışı telefonda kartı sağ kenarın dışından başlatıyor: kart sağa asılı (0.63) ve bırakış hep sağdan. 390'da açılışın
   ilk 38 karesinde kart kısmen görüş dışında (önceki derlemede de 28-35 kare; 1280'de 0). Bırakış korunsun dendiği için dokunmadım.
   Telefonda kenarda kalması için bırakış genliğinin ~60 px'e inmesi gerekir (sağdaki boşluk kadar), bu da bırakışı belirgin biçimde küçültür. Küçültelim mi?
2. Sürükleyip bırakınca (kullanıcı eylemi) 390'da kart ilk salınımda sağ kenarı birkaç kare aşabiliyor (+98 px). Önceki davranışla aynı.
   Telefonda bırakış salınımı da sınırlansın mı?
3. İçe aktarılmayan taslak dosyaları (`src/mobilTaslak.js`, `src/mobil-taslak.css`) ve kullanılmayan `GradientASCII/`, `LetterGlitch/`
   bileşen klasörleri silinsin mi? (Bu işte silme yasaktı.)
4. Gelişim haritasının masaüstü ölçeği (0.76, 8.7 px etiket) hâlâ Yusuf'un kararını bekliyor; bu işte dokunulmadı.
