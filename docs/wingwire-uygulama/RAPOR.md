# WingWire tanıtım sayfası: Taslak 5 → /wingwire (React) · RAPOR

İş: pm-hamaratlabs, 2026-11-12. Yapan: WebDev.
Worktree `.worktrees/ww-landing-uygula`, dal `feat/wingwire-landing-v2` (taban origin/main 888776f). Push, PR, yayın yok.
Kaynak: onaylı taslak `docs/taslak/wingwire-landing-v2/5/index.html` (dal `design/ww-landing-v2`, aef1981). Seçilen dallar: diyagram Yön A (tuval), ışık güçlü, telefonda sade düzen 1.

## Ne yapıldı
- `/wingwire` bugünkü dosyaların yerine yeniden yazıldı (rota ve `App.jsx` değişmedi): açılış Taslak 2 ("Masadan kalk.", bildirim ekranın tepesine düşer, dokununca ya da 5,2 sn sonra telefona uçar), "Neyi neye bağlar?" canlı diyagramı, "Cepte kalanlar", "Üç adım", alt bilgi.
- Diyagram masaüstünde tuval (n8n düzeni, port halkaları), güçlü ışık (yol 3,6 px düz, yarı saydam; hüzme yolla aynı kalınlıkta). 621-820 px'te tuvalin dikey akışı. 620 px ve altında sade düzen: omurga (Telefon, iki şerit, Hermes, Model) ve tek küme; "7 bağlantı · Göster" dokununca liste açılır.
- Yollarda ok işareti yok. Hüzme yolun içinde akar: yolun aynı `d`'siyle ikinci bir `<path>`, `pathLength=1` üstünde kayan dash penceresi, uçları saydam `userSpaceOnUse` gradyan. Filtre, box-shadow, ayrı parlayan nesne yok.
- Kırmızı kristal küre kalktı: `/wingwire` artık `CrystalizedBall`'u (ve `motion`'ı) içe aktarmıyor, sayfada canvas/WebGL yok.
- Aydınlık ve koyu tema (Theme.kt token'ları): açılışta cihaz tercihi, cihaz tercihi değişince izler; sağ üstteki düğmeyle elle seçilince o seçim kalır (saklanmaz, taslaktaki gibi). Bu sayfadayken `html` zemini ve `color-scheme` temayı izler, çıkınca eski hâline döner.
- Hareket: CSS geçişleri, tek WAAPI (bildirimin uçuşu), diyagram motoru (`requestAnimationFrame`). Diyagram görünmüyorken, sekme gizliyken ya da Durdur'a basılınca döngü tamamen durur. `prefers-reduced-motion: reduce`: hüzme kurulmaz, bildirim metnin altında durur, telefon sohbeti gösterir, Durdur gizlenir; içerik eksiksiz.
- Uygulamada fark edilen düzeltme: telefon diyagramında "Telefonun" → "Telefon" (masaüstü tuvalinde "Telefonun" kaldı, bkz. Sorular 1).
- APK bağlantısı bugünkü `/downloads/wingwire-0.1.1.apk` (sürüm numarası yazılmıyor). Alt bilgide `/wingwire/gizlilik/` bağlantısı var (sayfa ayrı iş; yerel önizlemede şu an SPA'ya düşüyor).

## Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `src/wingwire-site/WingWireSite.jsx` | yeniden yazıldı | sayfa; `Acilis`, `Ag`, `Cepte`, `Kurulum` bileşenleri |
| `src/wingwire-site/WingWireSite.css` | yeniden yazıldı | taslağın seçilen dalları, her kural `.wwl` kökü altında |
| `src/wingwire-site/fonts.css` | yeniden yazıldı | yalnız kullanılan kesimler, taslaktaki aile adları ve aralıklar; dosyalar `public/fonts/wingwire/` (değişmedi) |
| `src/wingwire-site/diyagram.js` | yeni | diyagram motoru (bağımlılıksız, sökülebilir) |
| `src/wingwire-site/img/*.webp` (15) | yeni | taslağın `5/img`'inden bayt bayt aynı (`cmp`); Vite içe aktarımı, özetli ad. `u-arama-*` yalnız seçilmeyen Yön B'de vardı, alınmadı |
| `docs/wingwire-uygulama/araclar/*.py` | yeni | `cdp_ortak.py`, `esitlik.py`, `islev.py`, `kareler.py`, `yokla.py`, `ozet.py` |
| `docs/wingwire-uygulama/shots/` | yeni | eşitlik ve etkileşim kareleri, `esitlik.json`, `islev.json` (toplam ~1,5 MB) |
| `src/App.jsx`, `src/data.js` | dokunulmadı | |

Görseller `public/wingwire/` yerine `src/wingwire-site/img/` altında: içe aktarılınca özetli adla `dist/assets`'e gider (önbellek güvenli) ve `public/wingwire/gizlilik/` klasörüyle karışmaz.

## Yöntem
- Sunucular: React derlemesi `portless ww-uygula npx vite preview` (dist), taslak `portless ww-uygula-taslak python3 araclar/sun.py 5`, karşılaştırma için bugünkü sayfanın derlemesi (`npm run build` değişiklikten önce, `dist` scratch'e kopyalandı) `portless ww-uygula-eski npx vite preview --outDir <scratch>/dist-eski`.
- Tek başsız Chrome, CDP (betikler sırayla). Tema ve hareket azaltma `Emulation.setEmulatedMedia` ile; taslağın `?tema` parametresi kullanılmadı, iki sayfa aynı yoldan temaya girer.
- Görsel eşitlik (`araclar/esitlik.py`): taslak `?yon=a&isik=guclu&mob=1` ile React `/wingwire` aynı adımlarla çekilir. `requestAnimationFrame` ve `performance.now` sayfa yüklenmeden önce elle sürülen bir saatle değiştirilir; iki motor aynı tohumla aynı kare sayısında aynı hüzme konumunu verir. Anlar: `an-1` 4,5 sn (bildirim düşmüş), `an-2` 9,5 sn (bildirim kendiliğinden uçmuş, telefon sohbeti gösteriyor), `dy-1`/`dy-2` diyagram görüş alanında 90 ve 200 kare sonra (hüzme akarken), `az-tam` hareket azaltmada tam sayfa. Fark `ImageChops.difference`; "belirgin" = herhangi bir kanalda 32'den büyük fark.
- İşlev ve ölçüm (`araclar/islev.py`): taslağın `denetim.py` ölçeriyle aynı tanımlar (görünür kelime TreeWalker + `checkVisibility`, 44 px altı hedef, 14 px altı yazı, diyagram kelimesi/en küçük yazısı) + kırık görsel, ağ (encodedDataLength), konsol hatası, kare sayacı (sayfanın istediği rAF sayısı), gerçek fare olaylarıyla tıklama.

## Ölçümler (gerçek çıktı)
Komutlar (worktree kökünden): `env -u PYTHONPATH /usr/local/bin/python3 docs/wingwire-uygulama/araclar/esitlik.py http://ww-uygula-taslak.localhost:1355 http://ww-uygula.localhost:1355 docs/wingwire-uygulama/shots/esitlik`; `... islev.py http://ww-uygula.localhost:1355 http://ww-uygula-taslak.localhost:1355 http://ww-uygula-eski.localhost:1355 docs/wingwire-uygulama/shots`; özet `... ozet.py docs/wingwire-uygulama/shots/islev.json`.

### Kabul ölçütleri
| # | Ölçüt | Sonuç |
|---|---|---|
| 1 | `npm run build` | başarılı (WingWireSite-DcFi1s4U.js 30,6 KB / gzip 9,5 KB; CSS 24,5 KB / gzip 5,9 KB) |
| 1 | `npx eslint src/wingwire-site/ src/App.jsx` | 0 hata, 1 uyarı (`App.jsx:57` react-refresh); `.worktrees/main-push`'ta aynı komut: aynı tek uyarı. Yeni hata 0 |
| 1 | `npm run lint` (bilgi) | bu dal 671 hata / 6 uyarı, main-push 673 / 6. Dosya bazında tek fark main-push'taki izlenmeyen `.wrangler/tmp/.../pages-shim.js` (2). Hataların 659'u `public/`, 11'i `src/` (iki ağaçta aynı dosyalar), 1'i `vite.config.js`; hepsi önceden var |
| 2 | `/wingwire` konsol hatası (2 tema x 390/1440, sayfa baştan sona gezildi) | 0 |
| 2 | Başka sayfalar `/`, `/uretiyorum`, `/sesver`, `/uretiyorum/wingwire` | açılıyor, konsol 0 |
| 2 | SPA içinde gir/çık (`/uretiyorum/wingwire` → karttaki bağlantı → geri) | içerde başlık "WingWire · Masadan kalk", `html` zemini tema rengi; çıkınca başlık "hamaratlabs", `html` zemini boş (eski hâli); konsol 0 |
| 3 | Görsel eşitlik | aşağıdaki tablo; tek gerçek fark istenen "Telefon" etiketi |
| 4 | Bildirim düşer / dokununca uçar / kendiliğinden uçar | 2,6 sn'de `bildirim dustu`, görünür (1440 üst 12 px, 390 üst 70 px); tıklamadan 1,6 sn sonra gizli + telefon `cikti` + sohbet opaklığı 1; tıklamadan 8,6 sn'de gizli + `cikti` (390 ve 1440) |
| 4 | Diyagramda hüzme akar | 1440: 15 yol, 15 hüzme, 30 port, ok 0, hüzme kalınlığı 3,6 px (yolla aynı), 3 sn'de akan 5-13; 390: 7 yol, 9 hüzme, 1,4 px, akan 5-7; dashoffset değişiyor, hedef düğüm parlıyor (`vurdu`) |
| 4 | Diyagram görünmüyorken 0 kare | sayfa başında 1 sn'de 0 kare; diyagram görününce 16-17 kare/sn (başsız Chrome) |
| 4 | Durdur / Oynat | Durdur: `aria-pressed=true`, etiket "Hareketi başlat", yazı "Oynat", 1 sn'de 0 kare; Oynat: 18-20 kare/sn. Boyut 1440'ta 98x44, 390'da 44x44 (yalnız simge) |
| 4 | Telefonda servis kümesi | dokununca `aria-expanded=true`, "Gizle", 7 satır (ElevenLabs, letmepost, Depolama, YouTube, GitHub, Google Play Console, App Store Connect), `#ag` 759 → 1.202 px; tekrar dokununca kapanır. Açıkken diyagram kelimesi 85 (taslak raporuyla aynı), 44 px altı hedef 0 |
| 4 | Tema düğmesi | açık → koyu: `data-tema=koyu`, etiket "Açık temaya geç", `html` zemini rgb(11,15,20), `color-scheme: dark`, telefon koyu ekranları gösteriyor. Elle seçmeden önce cihaz tercihi koyuya dönünce sayfa koyu; elle seçtikten sonra cihaz değişimi seçimi bozmuyor |
| 4 | Hareket azaltma | hüzme öğesi 0, diyagram görünürken 1 sn'de 0 kare, Durdur gizli, bildirim metnin altında görünür, telefon sohbette; görünür kelime 1440'ta 168 (yalnız gizli Durdur yazısı eksik), 390'da 129; konsol 0 |
| 5 | 390: scrollWidth / 44 px altı hedef / yazı | 390 / 0 / diyagramda en küçük 13 px (18 parça, hepsi diyagramda), gövdede en küçük 14 px |
| 5 | Kırık görsel | 0 (sayfa baştan sona gezildikten sonra 7 görünür görsel) |
| 5 | İlk ekranda APK İndir | 1440'ta y 566, 390'da y 445; `href=/downloads/wingwire-0.1.1.apk`, sunucu 200, 24.315.285 bayt |
| 5 | Ara genişlikler (ek) | 360: sw 360, sade düzen; 768: sw 768, tuvalin dar akışı; ikisinde de yol/hüzme/sayfa boyu taslakla aynı (4.136 / 5.004 px) |
| 6 | Kelime (görünür / gizli dahil) | React 169 / 259 (1440), 129 / 259 (390); taslak 169 / 604, 129 / 604. İlk ekran 19 (ikisinde aynı). Fazla değil |
| 6 | Em dash / "Marketing" / kablo-fiş | sayfa metninde 0 / 0 / 0; `src/wingwire-site/*` ve WingWire chunk'larında 0 / 0 / 0 (pozitif kontrol `printf 'a\xe2\x80\x94b' \| grep -c` = 1) |
| 6 | Dış istek | 0 (4 durumda da; fontlar ve görseller kendi sunucumuzdan) |
| 7 | WingWire chunk'ında `CrystalizedBall` izi | yok (`crystal` 0, `getContext` 0, `webgl` 0). Sayfada canvas: eski 1, yeni 0 |

### Görsel eşitlik (taslak ↔ React, fark pikseli / belirgin)
| An | 1440 açık | 1440 koyu | 390 açık | 390 koyu |
|---|---|---|---|---|
| an-1 (bildirim düşmüş) | 20.671 / 29 | 25.140 / 45 | 0 / 0 | 0 / 0 |
| an-2 (sohbet açılmış) | 2 / 0 | 2 / 0 | 0 / 0 | 0 / 0 |
| dy-1 (90 kare) | 0 / 0 | 53.977 / 0 | 4.283 / 84 | 1.298 / 84 |
| dy-2 (200 kare) | 17.436 / 0 | 36.443 / 544 | 4.466 / 84 | 619 / 84 |
| az-tam (hareket azaltma, tam sayfa) | 0 / 0 (1440x4999) | 0 / 0 | 24.026 / 84 (390x4396) | 107 / 84 |

Farkların nedeni (kareler `shots/esitlik/<an>-<genişlik>-<tema>.png` yan yana, `-fark.png` maske):
- 390'daki 84 belirgin piksel her karede aynı yer: "Telefonun" → "Telefon" etiketindeki "un" (`az-tam-390-koyu`'da farkın tamamı x 119-135, y 1352-1362). İstenen değişiklik.
- `dy-2-1440-koyu` 544: hüzmeler iki sayfada aynı konumda; Model kartının parlaması taslakta açık, React'te sönmüş. Parlama (`vurdu`) gerçek saatle 650 ms'de söner, kareler elle sürülen saatle ilerler; iki sayfa arasında gerçek süre farklı. Kod iki tarafta aynı.
- `an-1-1440` 29-45: telefon ekranı görselinin içinde, kanal başına 32'yi aşan çok az piksel; konum ve boyut ölçümle aynı (`.tel__ekran` iki sayfada 864,234 / 282,234 / 335,531 x 708,344). Görsel çözme/örnekleme oynaklığı.
- Belirgin olmayan (≤32) farklar: gradyan ve gölge kenarlarında çizim gürültüsü.
- Eşitliği bozan ve düzeltilen üç sızıntı (ilk koşuda yakalandı, aşağıda "Taslakla farklar").

### Ağırlık (aktarılan, cache kapalı, 1440 açık; KB)
| | Belge | JS | CSS | Font | Görsel | İlk yükleme | Sayfa baştan sona |
|---|---|---|---|---|---|---|---|
| Bugünkü sayfa (küreli) | 1,1 | 160,8 | 17,1 | 87,9 | 0 | 266,9 | 266,9 |
| Yeni React | 1,1 | 120,1 | 18,2 | 157,4 | 107,7 → 209,1 | 404,4 | 505,9 |
| Taslak (tek HTML) | 112,5 | (belgede) | (belgede) | 111,4 | 107,7 → 209,1 | 331,6 | 433,0 |

390 açık: yeni 418,3 / 505,9; koyu temada görseller biraz küçük (1440 koyu 401,4 / 498,2).
- JS 40,7 KB (yüzde 25) azaldı: `motion` parçaları (`react-*.js` 40,5, `use-spring` 4,2 ve iki küçük parça) artık inmiyor; WingWire parçası 4,6 → 9,7 KB (diyagram motoru). Ana site paketi `index-*.js` (110,4) iki sayfada aynı; küre kodu orada duruyor çünkü `App.jsx` `/anlatiyorum` için `CrystalizedBallButton`'ı statik içe aktarıyor. Yeni sayfa küreyi çizmediği için WebGL bağlamı ve küre karesi yok.
- Toplam bayt beklenenin tersine arttı: (1) gerçek ürün ekranları (ilk yüklemede 107,7 KB, sayfa sonunda 209,1 KB görsel; bugünkü sayfa hiç görsel indirmiyordu). (2) Marka fontları ilk kez gerçekten iniyor: bugünkü sayfa `'Plus Jakarta Sans'`, `'Sora'`, `'JetBrains Mono'` adlarını istiyordu ama `fonts.css` bunları `'WW ...'` adıyla tanımlıyordu; eşleşmediği için sistem fontuyla çiziliyordu (87,9 KB'nin tamamı sitenin Geist ve JetBrains Mono'su). Yeni sayfa 113 KB WW fontu indiriyor. (3) `index.html` her sayfada Geist'i önden yüklüyor (45,4 KB); bu sayfada kullanılmıyor (bkz. Sorular 3).
- Taslağa göre fark: React = taslak + site kabuğu (ana paket 110,4 + ana CSS 12,0 + Geist 45,4), eksi taslağın 112,5 KB'lık satır içi belgesi.

## Taslakla farklar (bilerek)
- "Telefonun" → "Telefon" yalnız telefon diyagramında (iş tanımı).
- Seçilmeyen yön ve seçenekler taşınmadı: Yön B, mob 2/3/1eski, ışık sakin; `?yon`, `?mob`, `?isik`, `?tema`, `?bekle` parametreleri ve ölçüm globalleri (`wwDiyagram`, `wwHuzme`, `wwAc`, `wwDiyagramCalis`) yok. Gizli dahil kelime bu yüzden 604 → 259.
- Sitenin genel CSS'inden sızıntıya karşı üç önlem (ilk eşitlik koşusunda 1 px kaymalar olarak çıktı): `App.css`'teki `.hero { border-bottom }` sıfırlandı; genel `.mono` (12 px, 700, harf aralığı) sızmasın diye sınıf `ww-mono` oldu ("tailscale serve" telefonda bu yüzden uzuyordu); `index.css`'in `*::before, *::after { box-sizing: border-box }` kuralı servis okunu 1 px daraltıyordu, kapsam içinde taslaktaki `content-box` geri verildi. Sitenin `html { scroll-padding-top: 80px; scroll-behavior: smooth }` kuralı sayfada kaldı (yalnız `#ust` bağlantısını etkiler, sonuç aynı).
- Diyagram yeniden çizilince (yeniden boyut, servis listesi açılınca) uçuştaki hüzme görünür kalıyor; taslakta o tur sonuna kadar saydam kalıyordu.
- Simgelere `aria-hidden` eklendi; `data-alt`, `data-ac` gibi yalnız taslak betiğinin kullandığı öznitelikler yok.
- APK ve "hamaratlabs.com'un bir ürünü" bağlantısı tam adres yerine site içi yol (`asset()`, SPA `Link`); yerel önizlemede de gerçek dosyaya gider.
- Belge başlığı "WingWire · Masadan kalk", meta açıklama "Bilgisayarındaki Hermes Agent için Android uygulaması." sayfadayken yazılıyor, çıkınca eski hâline dönüyor. Taslaktaki `img/icon.webp` favicon'u alınmadı (site favicon'u kalır).

## Kaldırılan / kullanılmayan parçalar (hiçbiri silinmedi)
- `src/components/rb/CrystalizedBall/`: `/wingwire` artık içe aktarmıyor. Bileşen kullanılmaya devam ediyor: `src/App.jsx:14` `CrystalizedBallButton` (o da `CrystalizedBall`'u içe aktarır), `App.jsx:592` sesli anlatım düğmesi. Silinmemeli.
- `motion` paketi: `/wingwire` kullanmıyor; `SesVerSite`, `SkillsPage` ve 5 `rb` bileşeni kullanıyor. Bağımlılık kalır.
- `AppIcon` ve `data.js` `FEATURED` artık WingWire sayfasınca okunmuyor (marka simgesi taslaktaki `icon.webp`). `data.js` WingWire kartına dokunulmadı.
- `public/fonts/wingwire/` içinde artık hiçbir yerin kullanmadığı 6 dosya: `plus-jakarta-sans-latin(-ext)-500/700-normal.woff2` (4) ve `jetbrains-mono-latin(-ext)-500-normal.woff2` (2), toplam ~66 KB. Yayında indirilmez, yalnız repoda yer tutar; silme onaylı iş.
- Bugünkü sayfanın içeriği (Neden, Neler yapar, `data.js` `points`, "Bir kanatta telefonun..." diyagramı, "iOS yakında" notu) yeni sayfada yok; taslak bunları içermiyordu.

## Kareler
- `docs/wingwire-uygulama/shots/esitlik/`: 20 yan yana kare (sol taslak, sağ React; başlıkta fark sayısı) ve 20 fark maskesi, `esitlik.json`.
- `docs/wingwire-uygulama/shots/etkilesim/`: `servis-acik-390-acik|koyu`, `durduruldu-390-acik`, `tema-once-1440-acik`, `tema-sonra-1440-koyu`.
- `docs/wingwire-uygulama/shots/islev.json`: bütün işlev ve ölçüm çıktısı.

## Zayıf yanlar
- Kare hızı başsız Chrome'da ölçüldü (16-20 kare/sn, yazılım çizimi); gerçek telefonda ölçülmedi.
- Yerel önizleme `vite preview`; GitHub Pages'te soğuk açılış (404.html yönlendirmesi) bu işte denenmedi.
- Açık temada soğuk açılışta, sayfa parçası inene kadar `App.jsx`'teki Suspense yedeği koyu (`#0b0f14`) çiziliyor; kısa bir koyu ekran görülebilir (bkz. Sorular 2).
- Hüzmenin `vurdu` parlaması gerçek saatle sönüyor; eşitlik karelerinde bu yüzden küçük farklar var (yukarıda).
- Süreç notu: ilk eşitlik koşusunun kendi ürettiğim, henüz commit'lenmemiş PNG çıktılarını bir kez `rm -f` ile sildim; iş tanımındaki silme yasağına takılabilir. Sonraki koşularda betik her dosyanın üzerine yazacak şekilde değiştirildi, başka silme yok. Betikler `docs/wingwire-uygulama/araclar/__pycache__/` bıraktı; commit'e alınmadı, silinmedi.

## Sorular
1. "Telefonun" → "Telefon" yalnız telefon diyagramında yapıldı (iş tanımı "telefon diyagramında" diyor). Masaüstü tuvalinde de "Telefon" olsun mu? Tek satır.
2. `App.jsx`'teki bağımsız sayfa Suspense yedeği koyu (`#0b0f14`; eski koyu WingWire sayfası için). Açık temada soğuk açılışta kısa bir koyu ekran olur. Yedeğin cihaz temasına göre renk alması `/wingwire` satırı değil, `/sesver` ve `/titimer`'i de etkileyen ortak satır; izin verilirse düzeltirim.
3. `index.html` her sayfada Geist'i önden yüklüyor (45,4 KB, `/wingwire`'da kullanılmıyor). Bu, bu işin yazma alanı dışında. Dokunulsun mu?
4. Toplam aktarılan bayt bugünkü sayfadan fazla (266,9 → 404,4 KB ilk yükleme): JS 40,7 KB azaldı, ama gerçek ekran görselleri ve ilk kez gerçekten inen marka fontları eklendi. Kabul mü, yoksa görsel ya da font tarafında kısma istenir mi (ör. sohbet görselini bildirim uçarken yüklemek; bu taslaktan sapar)?
5. İçerik: pm-wingwire'ın `v2-icerik-kontrol.md` §4.2'si "şimdilik anlatılmayacaklar" listesinde "Marketing (..., YouTube), letmepost" diyor; onaylı taslağın diyagramında `letmepost` (desteklenen platformlarla) ve `YouTube` düğümleri var. Metni değiştirmedim (onaylı hâl). pm-wingwire teyit etsin.
6. `public/fonts/wingwire/` içindeki kullanılmayan 6 font dosyası (~66 KB) silinsin mi? (silme onaylı iş)
