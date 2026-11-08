# hamaratlabs.com telefon düzeni: taslak raporu (2026-11-08)

Worktree: `.worktrees/mobil-taslak` · dal `design/mobil-taslak` · taban `origin/main` 0bb5d39
(iş `fix/mobil-temel` 9c776f9 üstünde başladı; PM o sırada 9c776f9 + harita verisi bd158a9 + aktivite 0bb5d39'u main'e aldı,
dal ileri sarıldı, yerel; push yok).

## Nasıl bakılır
Tek derlemede iki yön, adres parametresiyle seçilir (sekme boyunca hatırlanır):
- `?yon=a` Sıkı liste · `?yon=b` Tek sütun büyük kart · `?yon=0` ya da parametresiz: bugünkü düzen.
- Kurallar yalnız `<html data-yon>` varken ve en fazla 620 px genişlikte çalışır (`src/mobil-taslak.css`).
- Yerel önizleme: `npm run build && npx vite preview --host 127.0.0.1 --port 4391`, sonra `http://127.0.0.1:4391/uretiyorum?yon=a`.

## Yönler
Ortak (iki yönde aynı):
- Bölüm boşlukları telefonda 96 → 56 px.
- Sorun 5: telefonda 12 px altı yazı yok (ders etiketleri, araç etiketleri, skills, fikir/geliştirme sayfası etiketleri, kart kimliği 9 → 12 px). Soluk opaklık yerine düz gri.
- Sorun 3 (ip): kart telefonda sağa asılır (`anchorX` 0.5 → 0.63), ip logoya değmez.
- Sorun 7: gelişim haritası telefonda 0.9 ölçek (canlı 0.76), SVG yazıları 13.4 birim = 12.06 px; sağ kenarda solma; en sağdaki tiTimer etiketi için `overflow: visible` + 28 px pay. Masaüstündeki 0.76 ölçek (8.7 px etiket) değişmedi, kapsam dışı.

A "Sıkı liste":
1. İki başlık kalır, ikisi de küçülür (h1 40 px, h2 24 px), süzgeçler tek satır yana kayar.
2. Kartlar App Store listesi gibi satır: solda 64 px ikon (öne çıkanlarda 84 px), sağda aşama, ad, açıklama, alt satır tek satır.
3. TechText satır kutusu 64 → 40 px; iki satır arası ~60 → ~38 px.
4. Ses topu başlığın sağ üstünde, 76 px.
6. Galeri alt solması kalkar, sayaç opaklığı 0.5 → 0.75.

B "Tek sütun büyük kart":
1. Tek büyük başlık: sayfa başlığı kalır (52 px), altındaki bölüm başlığı (h2 + açıklama) yalnız ekran okuyucuya kalır, görünmez.
2. Tek sütun: küçük kartlarda üstte ikon + aşama + ad, açıklama tam genişlik; öne çıkan iki kart büyük ikonlu (logo alanı 200 → 168 px).
3. Karşılama yazısı tuvalde değil, sayfada zaten olan h1 HTML yazı olarak (27 px Geist, dengeli 3 satır). Telefonda TechText animasyonu yok.
4. Ses topu kendi satırında ortada, 96 px.
6. Galeri altyazısı ve sayaç fildişi hap içinde, alt solma kalkar.

Dokunulmayanlar: DodgeField, ürün siteleri (/wingwire, /sesver, /titimer), kar zemini, kart (Lanyard), parıltılı kartlar, metin ve data.js içeriği.

## Ölçümler (390x844 dpr2, CDP mobil öykünme; betik `docs/mobil-taslak/olc.py`)
| Sayfa | Ölçü | Canlı | A | B |
|---|---|---|---|---|
| /uretiyorum | ilk kart y (hedef < 600) | 674 | 344 | 354 |
| / | ilk kart y | 1286 | 1142 | 1192 |
| /anlatiyorum | ilk ders y | 696 | 311 | 357 |
| /oneriyorum | ilk araç y | 430 | 215 | 240 |
| hepsi | scrollWidth | 390 (ilk ölçümde 404; 9c776f9 yayına girince 390) | 390 | 390 |
| / | 12 px altı görünür yazı | 11 | 0 | 0 |
| /uretiyorum | 12 px altı (SVG ölçeği dahil) | 116 | 0 * | 0 * |
| /anlatiyorum | 12 px altı | 5 | 0 | 0 |
| /oneriyorum | 12 px altı | 24 | 0 | 0 |
| /paylasiyorum, /skills, /uretiyorum/kitabe, /uretiyorum/pomodoro-restoran | 12 px altı | 4 / 24 / 8 / 11 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |

\* /uretiyorum sayımı yeni harita verisinden önce yapıldı. Yeni veriyle harita ölçümü: 61 etiket, ölçek 0.9, etiket 12.06 px,
hatta değen 0, birbirine değen 0 (`harita-cakisma.js`; canlıda 8.74 px).
360 ve 430 px'te de scrollWidth = genişlik; 360 px'te ilk kart A 344, B 404. Konsol: tüm koşularda istisna, console.error ve HTTP ≥ 400 sayısı 0.

Galeri altyazısı kontrastı (`kontrast.py`, sayaç "03 / 13"): canlı 2.36:1 · A 7.72:1 · B 18.32:1. Başlık üçünde de ≥ 16:1.

## Masaüstü değişmedi kanıtı
- Yerleşim eşitliği (`yerlesim.py`, her öğenin offset kutusu + yazı boyu, animasyondan bağımsız), 1280 ve 700 px:
  `?yon=a` ve `?yon=b`, parametresiz derlemeyle 4 sayfada 0 farklı öğe (`yerlesim-1280.log`, `yerlesim-700.log`).
  Canlıda 1 öğe eksik: alt menüdeki Öneriyorum bağlantısı (9c776f9, o sırada yayında değildi).
- Piksel farkı 1280 (`karsilastir.py`): /uretiyorum ve /oneriyorum ilk ekran canlıyla %0.00; /anlatiyorum fark yalnız ses topu kutusunda; ana sayfadaki %9.6 fark parametresiz yerel derlemede de var (kar ve kart animasyonu).
- Not: 1280 görüntüleri harita verisi güncellemesinden önce alındı; yerleşim eşitliği de o derlemeyle. Yeni CSS yalnız 620 px altı.

## Görüntüler (hepsi `docs/mobil-taslak/` altında)
Depoda (commit'li):
- `karsilastirma/{anasayfa,uretiyorum,anlatiyorum,oneriyorum}-390-ilk.png` canlı | A | B ilk ekran
- `karsilastirma/*-390-tam.jpg` canlı | A | B tam sayfa
- `karsilastirma/*-1280-ilk.png` canlı | A | B masaüstü
- `ilham/{canli,a,b}-ilham.png` galeri altyazısı · `harita/*.png` gelişim haritası
Yalnız worktree'de (büyük, .gitignore): `a/`, `b/`, `canli/` (dpr2 ilk + tam), `a-1280/`, `b-1280/`, `canli-1280/`, `0-1280/`, `ek/`, `genislik/`.

## Değişen dosyalar
- `src/mobil-taslak.css` (yeni, yalnız taslak kuralları) · `src/mobilTaslak.js` (yeni, `?yon` okuyucu + `usePhone`)
- `src/App.jsx` (CSS importu, telefonda `anchorX`) · `docs/` (rapor, betikler, paftalar)
- Yeni bağımlılık yok.

## Doğrulama
- `npm run build` geçti (son derleme bu CSS ile). `npx eslint src/App.jsx src/mobilTaslak.js`: 0 hata (App.jsx'teki 1 uyarı önceden var).
  Tüm depo `npm run lint` 406 hata veriyor; değişiklikten önce de aynı (vite.config.js `process` vb.), bu işten değil.

## Açık sorular
1. Hangi yön: A (sıkı liste, daha kısa sayfa) mı B (tek sütun, daha ferah, tek başlık) mı? Paket karışabilir (ör. B kartları + A başlıkları).
2. B'de telefonda karşılama TechText yerine düz HTML yazı. TechText animasyonu telefonda kalsın mı?
3. B bölüm başlığını (h2 + açıklama) telefonda görünmez yapıyor; metin sayfada kalıyor ama görünmüyor. Uygun mu?
4. Harita masaüstünde de 0.76 ölçekte (8.7 px etiket). Masaüstü de bu işe girsin mi?
5. Seçimden sonra `?yon` anahtarı ve seçilmeyen yön silinip kurallar App.css'e taşınacak; ayrı bir dal mı, bu dal mı?
