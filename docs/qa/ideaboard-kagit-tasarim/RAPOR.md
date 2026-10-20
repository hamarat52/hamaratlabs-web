# IdeaBoard şablonu: kâğıt zemin + künye kartı + ideation notları

Dal: `feature/ideaboard-kagit` (worktree: `/Users/hamaratbey/Desktop/Projeler/hamaratlabs-web-wt-ideaboard`, taban `main` = 31fcafe)
Tarih: 2026-10-20

## 1. Değişiklik özeti

Yusuf'un talimatı: "burdaki arkaplan daha çok kağıt olsun. sticky notlardan birisi duo for X yazan kısım gibi olabilir orda genel bilgiler yazar adı platform hedef kitle falan ama kalan kartlar sticky notlar daha çok küçük fikirler içermeli aynı design thinkingin fikir üretme aşaması gibi."

| Dosya | Değişiklik |
|---|---|
| `src/IdeaBoardPage.css` | Kâğıt zemin (krem ton, lif katmanı, 3 katlanma izi, vinyet), topbar rengi, künye alan listesi, fikir notu, "örnek" notu ve damgası stilleri. Kullanılmayan `.ib-tags`, `.ib-check`, `.ib-tick`, `.ib-note--card`, `.is-empty` (not), `.ib-note__ask`, `.ib-note__text` kuralları kaldırıldı. |
| `src/IdeaBoardPage.jsx` | Dosya başı yorumu; `SAMPLE_IDEAS` havuzu, `factsOf(app)` (künye alanları), yeni `buildNotes(app)` (künye + ideation), `noteLabel` (aria), `NoteContent` (künye `<dl>` + fikir notu). Turuncu "Nerede?" ve beyaz "Netleşenler" notları kaldırıldı. |
| `src/ideaBoardSnapshot.js` | Buruşturma görüntüsü yeni sınıflara uyarlandı: künyedeki kesik çizgili boş satırlar (`drawBlanks`), "örnek" damgası (`drawStamp`). Artık kullanılmayan tik ve "→" çizimleri ile fiş kartı dalı kaldırıldı. |
| `src/data.js` | Yalnız yorum eklendi: isteğe bağlı `audience` alanının açıklaması. **Hiçbir ürüne değer eklenmedi.** Okuma tarafı `IdeaBoardPage.jsx`'teki `factsOf` içinde: `app.audience`. |

## 2. Tasarım kararları ve uygulama ayrıntıları

### 2.1 Kâğıt zemin
- Ton kademeli olarak `#f3eee3` → `#f4ead6` yapıldı; daha sıcak ve krem.
- Mevcut feTurbulence ailesi genişletildi. Tümü data-URI SVG; ağ isteği ya da görsel dosyası eklenmedi.
  - Tane (`--ib-paper-grain`): alfa .12 → .17, yani biraz daha belirgin.
  - Yeni lif katmanı `--ib-paper-fibers`: 263 px karo, kısa ve yumuşak eşikli yatay lifler (`baseFrequency .035 .24`).
    - İlk denemede sert eşik huş ağacı gibi düzenli tireler, ikinci denemede ahşap damarı görünümü üretti. Her ikisi de ekran görüntüsüyle elendi; üçüncü ayar kabul edildi.
  - Benek, kabartma, parlaklık ve hamur katmanları aynı kaldı.
  - Karo boyutları asal sayılardan seçildi (180/263/331/613/877); tekrar göze gelmiyor.
- Katlanma izleri: 3 ince açık sırt + koyu oluk çifti (104°, 7°, 81°), düşük opaklıkta (.07–.11 koyu, .45–.6 açık). Eskiden yalnız bir iz vardı.
- Vinyet: radyal gölge .07 → .11. Ayrıca yan kenarlarda %7'lik hafif koyulaşma var.
- Topbar `rgba(244, 234, 214, .88)` ile yeni zeminle uyumlu; alt çizgi `.16`. `:has` desteği olmayan tarayıcılar için yedek renk de güncellendi.
- Notların kâğıdı opak olduğu için zemin dokusu notun içine geçmiyor. Notun kendi `--ib-noise` dokusu değişmedi.
- Hareket eklenmedi; `prefers-reduced-motion` bloğu değişmedi. ≤560px'te sorun yok (bkz. 05 numaralı görüntü: `docW` 390 = viewport, yatay taşma yok).

### 2.2 Sarı not = "Künye"
- "Fikir aşaması" etiketi, büyük ad (h1) ve AppIcon sticker'ı korundu.
- Altında el yazısı (Caveat) alan listesi var, semantik olarak `<dl>`:
  - Ad: `app.name`
  - Ne?: `app.short`
  - Platform: `app.platform` (`·` ile ayrılmış etiketler)
  - Hedef kitle: `app.audience`
- Değer boşsa (`isPlaceholder`: boş ya da `[` ile başlıyor):
  - Kesik çizgili "doldurulacak" satır gösteriliyor.
  - Görünen ipuçları: "tek cümleyle…", "iOS? web? …", "kim kullanır?". Bunlar `aria-hidden`.
  - Ekran okuyucu için sr-only "henüz yazılmadı" ekleniyor.
- Uydurma değer yok. `audience` alanı şu anda hiçbir üründe olmadığı için dört üründe de "Hedef kitle" boş satır.
- "notları tutup taşıyabilirsin" ipucu kartın en altında, küçük ve soluk.
- Kart `size: 'lg'` olarak kaldı (280 px). Scatter yeni yüksekliği ölçüyor: dört üründe de `overlaps: 0` ve `outside: 0` (bkz. §5).

### 2.3 Kalan notlar = ideation
- Soru formatı ve "Tek cümlede / Ne yapar? / Özellik n" etiketleri kaldırıldı.
- Her not tek, kısa bir el yazısı (Caveat) cümle (`<p class="ib-note__idea">`).
- Yaklaşık yarısında köşede `aria-hidden` bir karalama işareti var (`!`, `→`, `*`, `!!`). Seçim ürün adından tohumlanıyor.
- Sıralama gerçek veriden başlıyor:
  - `app.lead` → mavi, geniş (`wide`) not
  - her `app.points[i]` → küçük not. Renkler pembe/yeşil/mavi/turuncu döngüsünde, başlangıç noktası `seeded(app.name)` ile belirleniyor.
- Fikir notu sayısı 5'e tamamlanıyor. Eksik kalanlar PM onaylı 8 genel tohumdan geliyor; havuz ürün adına tohumlu Fisher-Yates ile karıştırılıyor, böylece her üründe farklı sırada çıkıyor.
- Örnek tohumların ayırt edilmesi:
  - Kâğıt %64 ton (daha soluk).
  - Yazı kurşun kalem tonunda (`#45484d`).
  - Sağ altta döndürülmüş "ÖRNEK" damgası (`aria-hidden`).
  - Ekran okuyucu için sr-only "Örnek fikir:" öneki.
  - aria-label: `Örnek fikir “…” notunu buruştur ve çöpe at`.
- Dosya başı yorumu ve `buildNotes` üstündeki yorum güncellendi. Ürün içeriği yalnız data.js'ten geliyor; sabit yazılı tek metin, ürünlere özgü olmayan `SAMPLE_IDEAS` havuzu.
- Gerçekleşen sonuç (DOM'dan okunan, §5):
  - Duo for X ve Pomodoro Restoran: künye + 5 örnek fikir
  - tiTimer: künye + lead + 3 nokta + 1 örnek
  - Kitabe: künye + lead + 3 nokta + 1 örnek

### 2.4 Kontrast (WCAG AA ≥ 4.5:1)
Hesap: `scratch/contrast.py`. Koşul olarak notun dokusu %8 koyulaştırma ile "en kötü durum" alındı.

| Öğe | En düşük oran |
|---|---|
| Örnek fikir metni `#45484d`, beş renkte | 5.92 (pembe) |
| "ÖRNEK" damgası (ink %82), beş renkte | 6.05 |
| Künye etiketi (`dt`) ve boş satır ipucu (ink %80, sarı) | 6.14 |

İlk sürümde `dt` için opacity .62 ve ipucu için .7 kullanılmıştı; ipucu 4.54:1 ile sınırdaydı. Değerler .8'e çekildi.

## 3. Lint / build

`npm run lint` → **exit 1**. Bu sonuç değişiklikten önce de aynı: `git stash` ile taban kodda da 18 sorun (12 hata, 6 uyarı) çıkıyor.
- Hataların tamamı kapsam dışı dosyalarda: `components/WhenNear.jsx`, `components/rb/*`, `vite.config.js` vb.
- Değiştirilen dosyalar temiz: `npx eslint src/IdeaBoardPage.jsx src/ideaBoardSnapshot.js src/data.js` → exit 0.

```
/Users/hamaratbey/Desktop/Projeler/hamaratlabs-web-wt-ideaboard/vite.config.js
  7:9  error  'process' is not defined  no-undef

✖ 18 problems (12 errors, 6 warnings)
  0 errors and 3 warnings potentially fixable with the `--fix` option.
```

`npm run build` → **exit 0**:
```
dist/assets/IdeaBoardPage-DHKj8As1.css     19.11 kB │ gzip:   4.68 kB
dist/assets/IdeaBoardPage-Cd7Ym6Cb.js     528.18 kB │ gzip: 139.87 kB
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 14.71s
dist/privacy/index.html oluşturuldu.
```
"500 kB'tan büyük parça" uyarısı önceden de vardı (taban: 527.90 kB, Three.js). Bu değişiklikle +0.28 kB oldu.

## 4. Ekran görüntüleri (bu klasörde)

| Dosya | İçerik |
|---|---|
| `00-once-duo-for-x-1440.png` | ÖNCE: main hâli (31fcafe), Duo for X, 1440 |
| `01-sonra-duo-for-x-1440.png` | SONRA: Duo for X, 1440 |
| `02-sonra-kitabe-1440.png` | SONRA: Kitabe, 1440 |
| `03-sonra-pomodoro-restoran-1440.png` | SONRA: Pomodoro Restoran, 1440 |
| `04-sonra-titimer-1440-sablon.png` | SONRA: tiTimer verisiyle şablon, 1440 (bkz. §6.1; üst menü ve sticker görünmüyor) |
| `05-sonra-duo-for-x-390.png` | SONRA: Duo for X, 390 mobil (DSF 2) |
| `07-etkilesim-duo-for-x-1440.png` | Etkileşim ortası: 1 not sürüklendi, 1 not ok tuşuyla taşındı, 1 not Delete ile çöpe atıldı (kutuda buruşuk top var) |
| `08-etkilesim-titimer-sablon-1440.png` | Aynı adımlar, tiTimer şablonu. Buruşuk top uçuş sırasında yakalandı (headless yazılım render'ında uçuş yavaş) |

Araç: Playwright önbelleğindeki `chrome-headless-shell` (CDP :9445, ayrı profil) + browser-harness. Yeni npm paketi kurulmadı; Yusuf'un Chrome'una bağlanılmadı.
Chrome for Testing ve ajan tarayıcısında `Page.captureScreenshot` about:blank'te bile zaman aşımına uğradığı için bu yol seçildi.
Not: Bu ortamda etkileşimden sonra `clip + captureBeyondViewport` ile alınan kareler eski görüntüyü döndürdü (MD5 ilk görüntüyle aynıydı). Bu iki dosya rapordan çıkarıldı. 07 ve 08, iki `requestAnimationFrame` beklenip yalnız görünür alan çekilerek alındı; önce/sonra MD5'leri farklı.

## 5. Etkileşim testi

Betik: `ib_qa.py` (`IB_INTERACT=1`).
- Gerçek CDP girdisi kullanıldı: `Input.dispatchMouseEvent` ve `Input.dispatchKeyEvent`.
- Konsol yakalayıcısı sayfa yüklenmeden kuruldu (`Page.addScriptToEvaluateOnNewDocument`): `window.onerror`, `unhandledrejection` ve `console.error`.

| Adım | Duo for X | tiTimer (şablon) |
|---|---|---|
| Başlangıç not sayısı | 6 | 6 |
| Fareyle sürükle (`idea-1`, +130/+70 px) | merkez (784,337)→(914,404), fark [130, 67] ✔ | (793,307)→(923,374), fark [130, 67] ✔ |
| Klavye: odak + 3×→ + 2×↓ (`idea-2`) | fark [36, 24] (adım 12 px) ✔, odak notta kaldı | fark [36, 24] ✔ |
| ✕ düğmesi (gerçek tık; notu seç → ✕) | 6→5, not DOM'dan düştü ✔; duyuru: "Örnek fikir “haftada bir küçük özet” notu buruşturulup çöpe atıldı…" | 6→5 ✔; "Fikir “Ters sayaç” notu buruşturulup…" |
| Delete tuşu (künye notu) | 5→4 ✔; "Duo for X notu buruşturulup çöpe atıldı…" | 5→4 ✔ |
| Çöpe sürükleme (son not) | 4→3 ✔ | 4→3 ✔ |
| Kutu etiketi | "Çöp kutusu, 3 not. Son atılan notu panoya geri almak için bas." | aynı |
| Kutuya 3 kez bas | 3→4→5→6, ters sırayla geri geldi ✔ ("… notu panoya geri döndü.") | 3→4→5→6 ✔ |
| Son durum | 6 not, anahtarlar `name-0, idea-1…idea-5` | aynı |
| Konsol hataları | `[]` | `[]` |

Ek kontroller:
- Duo for X, Kitabe, Pomodoro ve tiTimer 1440 ile Duo for X 390 yüklemelerinin tamamında konsol hataları `[]`.
- Üst üste binen not çifti 0, panodan taşan not 0. 390 px'te `docW` = 390.
- Buruşturma snapshot'ı yeni içerikle çalışıyor:
  - `snapshotNote` künye (boş satırlar ve sticker) ile örnek notları (damga) hatasız çizdi.
  - Not uçuşu ve kutudaki top doğru renkte görünüyor (07: lime top, 08: pembe kâğıt).

## 6. Bilinen sınırlar

1. **tiTimer sitede bu şablonu kullanmıyor.**
   - `App.jsx`'te `CUSTOM_PAGES.titimer` (TiTimerPage), `STAGE_PAGES.idea`'dan önce geliyor. Bu yüzden `/uretiyorum/titimer` kendi özel sayfasını açıyor.
   - Değişiklik sitede yalnız **Duo for X, Kitabe ve Pomodoro Restoran**'a yansıyor.
   - tiTimer doğrulaması, `/uretiyorum/titimer` üzerinde Vite dev modülleriyle `IdeaBoardPage`'in tiTimer verisiyle ayrı bir köke bağlanmasıyla yapıldı. Repoya dosya eklenmedi; site `#root`'u gizlendi.
   - Bu yüzden 04 ve 08'de üst menü yok ve künyede AppIcon sticker'ı görünmüyor.
   - Sticker'ın neden görünmediği ölçüldü: sticker DOM'da var (66 px), ancak `#bg-titimer`, `#halo-titimer` ve `#sheen-titimer` id'leri sayfada 2'şer kez geçiyor. İlki gizli TiTimerPage'deki AppIcon'a ait. Bu koşum kaynaklı bir durum, şablon hatası değil.
   - Kapsam dışı olduğu için `App.jsx`'e dokunulmadı. tiTimer'ın panoya geçmesi istenirse PM kararı gerekiyor.
2. **Hedef kitle** alanı hiçbir üründe yok; dört üründe de boş satır görünüyor. Doldurmak için `data.js`'e ürün sahibinin `audience: '…'` yazması yeterli (değer uydurulmadı).
3. Künyede "Ad" satırı başlıktaki adı tekrar ediyor (PM listesinde vardı, uygulandı). Gereksiz bulunursa tek satırla kaldırılabilir.
4. Renk döngüsünde lead notu her zaman mavi. Döngü maviye denk gelirse ikinci bir mavi not çıkabiliyor (Kitabe ve tiTimer'daki örnek not, Pomodoro'da iki mavi örnek). Kural PM'in "lead → mavi" kararından geliyor.
5. Lint taban kodda zaten başarısız (§3). Kapsam dışı olduğu için düzeltilmedi.
6. Fikir sayısı sabit 5. `points` 4'ten fazla olursa (lead + 5+ nokta) örnek eklenmez; noktaların hepsi gösterilir.
