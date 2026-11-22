# SEO denemesi 1: hamaratlabs.com

Tarih: 2026-11-20 (inceleme düzeltmeleri 2026-11-21, paylaşım resimleri 2026-11-22) · Dal: `seo/deneme-1` (şu an origin/main `999463f` üzerine yeniden kurulmuş; ilk taban `ee8e2e6`) · Worktree: `.worktrees/seo-deneme-1`
Durum: dalda commit'li, **push / merge / deploy yapılmadı** (Yusuf onayı ve PM'in yayını bekleniyor).

Sürümler: Vite 6.4.4, React 19.3.1, react-dom 19.3.1 (package.json: `vite ^6.3.5`, `react ^19.1.0`). Yerel Node 20.18.0, CI Node 22.

## Commit'ler

Dal sonradan origin/main üzerine yeniden kurulduğu için hash'ler ilk rapordakinden farklı; aşağıdakiler güncel.

| Hash | Ne |
|---|---|
| `ba9d54b` | İş A: rota başına ön-render edilmiş head + içerik, ortak adres listesi, site içi head eşitleme |
| `0d13e8a` | İş B: fibi / kuveytturk canonical, RICAMBIO canonical + h1 (CI betiği), kısa title'lar, KADER description |
| `8bd66de` | `npm run lint` hatasız (yapılandırma + src/components küçük temizlik) |
| `5745080` | İş C: `/income-vs-desires/saatlik-ucret-hesaplama` hesaplayıcı sayfası |
| `1b1e519` | Rapor + `docs/qa/seo-deneme-1/` kanıt dosyaları |
| `044f702` | İnceleme 1: String.replace fonksiyon biçimi |
| `3f78b6b` | İnceleme 2 ve 3: `/uretiyorum/sesver`, `/uretiyorum/wingwire`, `/aktivite` ön-render + sitemap; FEATURED null korunması |
| `eda0d31` | İnceleme 4: geçersiz `/ogretici/<slug>` için noindex + "Sayfa bulunamadı" |
| (bu güncelleme) | Rapor: "Bağımsız inceleme düzeltmeleri" bölümü + kanıtlar |
| (paylaşım resimleri commit'i) | 12 statik sayfa + hesaplayıcıya sayfaya özel og:image kartları, etiketler, RICAMBIO CI betiği, rapor bölümü ve kanıtlar |

## Ne yapıldı

### İş A: SPA rotalarına kendi HTML'i
- `scripts/prerender-routes.mjs` (build zincirinde `prerender-privacy`'den sonra): sitemap'teki 16 React rotası için `dist/<rota>.html` yazar. Her dosyada rotaya özgü `<title>`, description, canonical (kendi adresi), og:title/description/url, og:image (öğretici yazısında kapak görseli, diğerlerinde sitenin `og-image.png`'si) ve `#root` içinde bir `<h1>` + gerçek içerik (lead, özellik listesi, iç linkler).
- Dosya adı `uretiyorum.html` biçiminde (klasör/index.html değil): Cloudflare Pages `/uretiyorum` isteğine doğrudan 200 döner, `/uretiyorum/` adresini `/uretiyorum`'a 308 ile yönlendirir. Böylece canonical, sitemap ve sunulan adres aynı (eğik çizgisiz). Yerelde `wrangler pages dev` ile doğrulandı.
- Metinler uydurulmadı: tek kaynak `src/seo/routeMeta.js`, değerler `data.js` (lead/short/points/devNote), `posts.js`, App.jsx `PAGES` ve sayfa bileşenlerindeki hero metinlerinden. Eklenen yeni metin yalnız iki yerde ve ikisi de mevcut metinden türetildi: Düşen Top için `seoTitle` (short 81 karakterdi) ve motion-video yazısı için `description` (yazının ilk paragrafı).
- Görünüm değişmedi: JS çalışan tarayıcıda ön-render bloğu `[data-js] [data-prerender]{display:none}` ile gizli, React mount olunca üzerine yazılıyor (createRoot, hydrate değil). Ana sayfanın index.html'i 404 yedeği de olduğu için bu, 404'te ana sayfa metninin görünmesini de önlüyor.
- `src/App.jsx` `useHeadSync`: site içi gezinmede title/description/canonical/og güncellenir; bilinmeyen yolda `<meta name="robots" content="noindex">` eklenir, başlık "Sayfa bulunamadı · hamaratlabs" olur.
- `scripts/site-urls.mjs`: sitemap ve ön-render aynı listeden. data.js artık regex yerine Vite `ssrLoadModule` ile okunuyor; eski regex Kitabe'nin çift tırnaklı `short` alanını kaçırdığı için **`/uretiyorum/kitabe` sitemap'e yeni girdi** (28 → 30 URL; diğeri hesaplayıcı).
- SesVer, WingWire, tiTimer, Skills bileşenlerindeki başlık sabitleri routeMeta'dan okunuyor (ön-render ile tarayıcı başlığı ayrışmasın). Bu sırada WingWire ve Skills başlıklarındaki em dash `·` oldu.

### İş B
- `fibi/index.html`, `kuveytturk-api-portal/index.html`: canonical eklendi (Kuveyt Türk'te yalnız `<head>`'e tek satır).
- RICAMBIO landing'i başka repodan CI'da kopyalanıyor; `scripts/seo-ricambio.mjs` kopyadan sonra canonical ve (ham HTML'de yoksa) `<title>` metniyle bir `<h1>` ekliyor. Landing `createRoot` kullandığı için h1 mount'ta değiştiriliyor (bundle'da `hydrateRoot` yok, doğrulandı). İki kez çalışınca ikincide değişiklik yapmıyor.
- Title'lar: IVD ana sayfa 68→64, dürtüsel 82→64, kira 72→60, saatlik ücret 75→65 karakter. KADER description 161→157.

### İş C: hesaplayıcı
- Sayfa: `public/income-vs-desires/saatlik-ucret-hesaplama.html` + `saatlik.js`; biçimlendirme `calc.js`'ten (`window.IVDCalc`: binlik ayraç, TL biçimi, süre kuralı ana sayfadakiyle aynı).
- Formül sayfada açıkça yazılı: aylık saat = haftalık saat × 52 ÷ 12; saatlik = net maaş ÷ aylık saat; yol dahil: haftalık saate (dk ÷ 60 × gün/hafta) eklenir; süre = fiyat ÷ saatlik.
- SEO: title (64), description (157), canonical, og (genel OG görseli), tek h1, FAQPage JSON-LD (3 soru, sayfadaki SSS ile birebir), blog yazısına + ürün sayfasına + ana sayfaya link, blog yazısından bu sayfaya link, sitemap'te. İçerikteki tek sayılar örnek hesap ve blog yazısında zaten olan 225/176; yeni istatistik yok. istenmeyen ajan adı hiçbir çıktıda geçmiyor (dist grep: 0).

## Doğrulama

### lint ve build
- `npm run lint`: çıkış 0, **0 hata, 3 uyarı** (react-refresh "only-export-components", origin/main'de de var). origin/main'de aynı komut **710 hata** veriyordu (çoğu public/ altındaki kopyalanmış oyun/okul derlemeleri).
- `npm run build`: çıkış 0. Çıktı: `prerender-routes: 16 sayfa yazıldı`, `dist/sitemap.xml oluşturuldu (30 url)`.

### saglik.py önce / sonra
Yerel sunucu: `portless hamaratlabs-seo` → `wrangler pages dev dist` (Cloudflare Pages ile aynı yönlendirme kuralları). Önce: origin/main derlemesi aynı yöntemle (`hamaratlabs-seo-once`). Betik uyarlaması: `docs/qa/seo-deneme-1/saglik_yerel.py`, kurallar orijinalle aynı, yalnız istek yerel adrese gider. RICAMBIO CI'da geldiği için her iki tarafa canlı kopyası konup "sonra"da `seo-ricambio.mjs` uygulandı.

| Ölçüt | Önce (canlı) | Önce (yerel, origin/main) | Sonra (yerel, bu dal) |
|---|---|---|---|
| Sitemap URL | 28 | 28 | 30 |
| Sorunsuz sayfa | 0 | 0 | 18 |
| Toplam sorun | 50 | 50 | 12 |
| canonical farklı (= ana sayfa) | 14 | 14 | 0 |
| canonical yok | 3 | 3 | 0 |
| h1 sayısı ≠ 1 | 16 | 16 | 0 |
| title > 65 | 4 | 4 | 0 |
| description > 160 | 1 | 1 | 0 |
| og:image yok | 12 | 12 | 12 |
| Çift title / çift description | 1 / 1 | 1 / 1 | 0 / 0 |
| Kırık iç link | 0 (6 link) | 0 (6 link) | 0 (23 link) |

Kalan 12 sorunun hepsi statik alt sitelerde og:image eksikliği (kapsam dışı bırakıldı, aşağıda soru). Ham çıktılar: `docs/qa/seo-deneme-1/once_canli.txt`, `once_yerel.txt`, `sonra_yerel.txt` (+ json).

### Ham HTML (curl, JS yok)

| Rota | Canlı (bugün) | Yerel (bu dal) |
|---|---|---|
| `/wingwire` | md5 `6741330f…` · `hamaratlabs` · canonical `https://hamaratlabs.com/` · h1 yok | md5 `8cdbe614…` · `WingWire · kendi ajanına Android'den bağlan` · canonical `https://hamaratlabs.com/wingwire` · `<h1>WingWire</h1>` |
| `/uretiyorum/titimer` | md5 `6741330f…` (aynı dosya) · `hamaratlabs` · canonical `/` | md5 `f4b6501a…` · `tiTimer: Odak ve mola sayacı · hamaratlabs` · canonical `https://hamaratlabs.com/uretiyorum/titimer` · `<h1>tiTimer</h1>` |
| `/ogretici/motion-video` | md5 `6741330f…` (aynı dosya) · `hamaratlabs` · canonical `/` | md5 `c9260664…` · `Nasıl Yaptık: "Bu Motion Videolar Aslında Video Değil"` · canonical `https://hamaratlabs.com/ogretici/motion-video` · og:type article, kapak görseli |

Durum kodları (yerel): `/uretiyorum` 200, `/uretiyorum/` 308 → `/uretiyorum`, `/titimer` 200 (public/titimer/ klasörüyle çakışmadı), `/titimer/destek/` 200, bilinmeyen yol 200 + istemcide noindex.

### SPA davranışı ve tasarım
- Gerçek tarayıcıda (browser_exec) gezinme: mağaza → tiTimer ürün → tiTimer sitesi → geri, 404 → ana sayfa, öğretici listesi → yazı, Skills → ana sayfa. Her adımda title/canonical doğru, 404'te noindex var, diğerlerinde yok.
- Eski / yeni derleme ekran karşılaştırması (bağımsız headless Chrome, 6 rota × 1280 ve 390): `scrollHeight` 24 ölçümün hepsinde birebir aynı; PIL farkında belirgin piksel farkı yalnız `/ogretici` ve `/404` alt kısmında, o da footer'daki WebGL fotoğraf şeridinin animasyon karesi (iki görüntüde kartların eğimi farklı; görsel olarak kontrol edildi). Konsol hatası: 0.

### Hesaplayıcı: örnek hesap (elle / sayfa)

| Girdi | Elle | Sayfa |
|---|---|---|
| 50.000 TL, 40 saat/hafta | 40×52÷12 = 173,33 sa; 50.000÷173,33 = 288,46 | ₺288,46 · "ayda ortalama 173 saat" |
| + 2.499 TL ürün | 2.499÷288,46 = 8,663 sa = 8 sa 39,8 dk; 8,663÷8 = 1,08 gün | 8 saat 40 dakika · 1,1 gün |
| 35.000 TL, 45 saat/hafta | 45×52÷12 = 195 sa; 35.000÷195 = 179,49 | ₺179,49 |
| + yol 90 dk × 5 gün | 45+7,5 = 52,5 sa/hafta; 35.000÷227,5 = 153,85 | yol dahil ₺153,85 · haftada 52,5 saat |
| + 12.999 TL ürün | 12.999÷153,85 = 84,49 sa = 84 sa 29,6 dk; 84,49÷10,5 = 8,05 gün | 84 saat 30 dakika · 8 gün |
| Maaş boş | sonuç yok | "·" ve "maaşı ve haftalık saati doldur" |

390 ve 1280'de yatay taşma yok (scrollWidth = clientWidth), h1 sayısı 1, konsol hatası 0, binlik ayraç yazarken çalışıyor ("35.000", "12.999").

Ekran görüntüleri (`docs/qa/seo-deneme-1/`):
- `hesaplayici-390-ilk-ekran.png`, `hesaplayici-390.png` (tam sayfa), `hesaplayici-390-yol-dahil.png`
- `hesaplayici-1280-ilk-ekran.png`, `hesaplayici-1280.png` (tam sayfa)
- Önce/sonra örnekleri: `once-uretiyorum-390.png` / `sonra-uretiyorum-390.png`, `once-404-1280.png` / `sonra-404-1280.png`

## Ana iş dışındaki değişiklikler: neden gerekti
- `.github/workflows/deploy.yml`: RICAMBIO landing'i CI'da başka repodan kopyalandığı için canonical/h1 ancak kopyadan sonra eklenebiliyor; tek satırlık `node scripts/seo-ricambio.mjs` adımı eklendi.
- `eslint.config.js`: "lint temiz" şartı için gerekti; 710 hatanın ~700'ü public/ altındaki başka repolardan kopyalanan derlemelerdeydi (dışarıda bırakıldı), `vite.config.js` Node globali `process`'i tanımıyordu, `as: Tag` gibi büyük harfli bileşen parametreleri yanlışlıkla "kullanılmıyor" sayılıyordu.
- `src/components/rb/*`: kalan gerçek lint hataları (boş `catch {}` blokları, kullanılmayan `err`, JSX'te kullanılan ama kural tarafından görülmeyen `motion` importu, gereksiz eslint-disable yorumları) temizlendi; davranış değişmedi.
- `.gitignore`: yerel `wrangler pages dev` sunucusunun `.wrangler/` klasörü commit'e girmesin diye.

## Yayından sonra kontrol edilecekler (PM için)
- Canlıda `curl -s https://hamaratlabs.com/wingwire | grep -o '<title>[^<]*'` ve canonical; `/uretiyorum/` 308 → `/uretiyorum` (yerel wrangler ile doğrulandı, canlı Cloudflare Pages'te bir kez bakılmalı).
- CI log'unda `seo-ricambio: canonical + og:image + h1 eklendi.` satırı (paylaşım resimlerinden önce `canonical + h1`).
- Search Console'da sitemap'i yeniden gönderme ve 3-4 ürün URL'i için "URL denetimi".

## Bağımsız inceleme düzeltmeleri (2026-11-21)

İnceleme: Gemini 4 Neon, doğrulama: Haberci. Dört bulgunun dördü de uygulandı.

| # | Bulgu | Düzeltme | Commit |
|---|---|---|---|
| 1 | `swap()` ve `#root` / `</head>` eklemelerinde ikinci argüman düz metin; metinde `$&`, `` $` ``, `$'`, `$$` geçerse String.replace bunları desen sayar, HTML bozulur | Hepsi `() => metin` biçimine çevrildi: `prerender-routes.mjs` (swap + 2 ekleme), aynı sorun taşıyan `seo-ricambio.mjs` (2) ve `prerender-privacy.mjs` (#root) | `044f702` |
| 2 | `/uretiyorum/sesver`, `/uretiyorum/wingwire` (kartlardan linkli) ve `/aktivite` (footer'da linkli) ön-render edilmiyor, canlıda ana sayfa head'iyle 200 dönüyor | `listedProducts` artık `short` alanı istemiyor (gerçek içeriği olan bütün ürünler); `/aktivite` için routeMeta + sitemap girdisi. Ön-render 16 → 19 sayfa, sitemap 30 → 33 URL | `3f78b6b` |
| 3 | routeMeta `/sesver` ve `/wingwire` dallarında `data.FEATURED.find(...)` null kontrolü yok | `app?.` korunması; kayıt yoksa bileşendeki hero metniyle devam eder, build kırılmaz | `3f78b6b` |
| 4 | Geçersiz `/ogretici/<slug>`'da notFound false, noindex yok, kendine canonical | App.jsx: geçersiz slug bulunamayan sayfa sayılır (liste görünümü aynı kalır); head'de noindex, başlık "Sayfa bulunamadı · hamaratlabs". Bulunamayan sayfalarda canonical artık kaldırılıyor, geçerli rotaya dönünce yeniden ekleniyor | `eda0d31` |

**Bulgu 1 kanıtı** (`docs/qa/seo-deneme-1/replace_kanit.txt`): aynı şablona `Fiyat $& ve $' ile $$` metni eklenince düz metin biçimi `<div id="root">`'u metnin içine kopyalayıp `$'`'yu silerken fonksiyon biçimi metni aynen taşıyor (`fonksiyon: true | düz metin: false`). Bugünkü metinlerin hiçbirinde `$` yok, yani canlıyı etkileyen bir bozulma yoktu; risk ileride eklenecek fiyat/komut metinleri içindi.

**Canonical kararı (`/uretiyorum/sesver` → kendine, `/sesver`'a değil):** iki sayfanın içeriği aynı değil. Mağaza sayfası (AppPage) data.js'teki kısa tanım, 7 maddelik özellik listesi, indirme düğmesi, beğeni/paylaşım ve yorumlardan oluşan bir ürün kartı. `/sesver` ayrı metinlerle yazılmış (h1 "Yazdığın, sese dönüşsün.", farklı lead), ses örnekleri, kurulum ve 11 dilli bir tanıtım sitesi. data.js'teki lead ve maddeler SesVerSite.jsx'te geçmiyor (grep: 0). WingWire'da da aynı: yeni `/wingwire` "Masadan kalk." sitesi data.js metnini kullanmıyor (grep: 0). Canonical yalnız kopya ya da kopyaya çok yakın sayfalar için doğru; burada `/sesver`'a canonical vermek mağaza sayfasının yorumlarını ve kendi içeriğini dizinden düşürür. Kendine canonical verildi; arama sonucunda karışmasınlar diye başlık ve açıklama da farklı (`SesVer · hamaratlabs` + "Durum: Açık beta." / `SesVer · Yazdığın, kendi bilgisayarında sese dönüşsün`), mağaza sayfası ön-render içeriğinde ürün sitesine link veriyor.

**Doğrulama**
- `npm run lint`: çıkış 0, 0 hata, 3 uyarı (değişmedi). `npm run build`: çıkış 0, `prerender-routes: 19 sayfa yazıldı`, `dist/sitemap.xml oluşturuldu (33 url)`.
- saglik_yerel.py (`docs/qa/seo-deneme-1/sonra2_yerel.txt`): 33 URL, 21 sorunsuz, 12 sorun (hepsi önceden bilinen statik sayfa og:image eksikliği), çift title / description 0, kırık iç link 0. Üç yeni rota `OK`.
- Ham HTML (curl, `docs/qa/seo-deneme-1/ham_html_inceleme.txt`):

| Rota | Canlı | Yerel (bu dal) |
|---|---|---|
| `/uretiyorum/sesver` | 200 · md5 `481f3eec…` (ana sayfa dosyası) · `hamaratlabs` · canonical `/` · h1 yok | 200 · md5 `1b853bd4…` · `SesVer · hamaratlabs` · canonical `https://hamaratlabs.com/uretiyorum/sesver` · `<h1>SesVer</h1>` |
| `/uretiyorum/wingwire` | 200 · md5 `481f3eec…` (aynı) · `hamaratlabs` · canonical `/` | 200 · md5 `85da94f8…` · `WingWire · hamaratlabs` · canonical `https://hamaratlabs.com/uretiyorum/wingwire` · `<h1>WingWire</h1>` |
| `/aktivite` | 200 · md5 `481f3eec…` (aynı) · `hamaratlabs` · canonical `/` | 200 · md5 `0bf77ddb…` · `Aktivite Haritası: yazdığım kodun haritası · hamaratlabs` · canonical `https://hamaratlabs.com/aktivite` · `<h1>Aktivite Haritası</h1>` |

- Tarayıcıda, JS çalışırken (`docs/qa/seo-deneme-1/inceleme_tarayici.json`): `/ogretici/boyle-yazi-yok` başlık "Sayfa bulunamadı · hamaratlabs", robots noindex, canonical yok, liste görünümü aynı. Oradan geçerli yazıya tıklayınca canonical geri geliyor, noindex kalkıyor. `/boyle-yok` aynı davranış. Üç yeni rotada başlık/canonical ön-render ile aynı, ön-render bloğu görünmüyor, konsol hatası 0.

Not: dal, raporun ilk sürümünden sonra origin/main'e yeniden kurulmuş (yeni WingWire sitesi "Masadan kalk" geldi); routeMeta'daki `/wingwire` başlık/açıklaması o sırada yeni siteye göre güncellenmiş. Bu açıklamada ürün gereği bir ajan çerçevesinin adı geçiyor; bu yasak yalnız hesaplayıcı sayfası (İş C) içindi, o sayfada geçmiyor.

## Paylaşım resimleri (2026-11-22)

Haberci'nin canlı sağlık kontrolündeki 12 sayfada `og:image` yoktu; hesaplayıcı sayfası da sitenin genel görselini kullanıyordu. Hepsine sayfaya özel 1200x630 PNG kart ve etiketler eklendi.

**Kartlar** (`public/og/*.png`, 13 dosya, sabit dosya olarak commit'li):

| Sayfa | Kart | Metin kaynağı | Görsel / palet |
|---|---|---|---|
| `/income-vs-desires/` | `income-vs-desires.png` | h1 (iki satır), `<title>`'ın ikinci yarısı, description'ın son cümlesi | IVD "mesai kartı" dili: kağıt zemin + cetvel çizgileri, monospace, mühür kırmızısı; ürün ikonu (yeşil cam terazi, income-vs-desires repo `store/_src/icon/icons.mjs` chrome varyantı) ve `income<span>vs</span>desires` markası |
| `/income-vs-desires/blog/` | `income-vs-desires-blog.png` | h1 + `<title>`, üst etiket menüdeki "Yazılar" | aynı |
| 3 blog yazısı | her biri kendi kartı | h1 + yazının tarih/süre satırı | aynı |
| `/income-vs-desires/saatlik-ucret-hesaplama` | `income-vs-desires-saatlik-ucret-hesaplama.png` (genel `og-image.png` yerine) | `<title>` | aynı |
| destek, gizlilik, en/support, en/privacy | her biri kendi kartı | h1 + meta description + "Son güncelleme" satırı (EN sayfalarda İngilizce) | aynı |
| `/okul-projeleri/fibi/` | `fibi.png` | h1 ("Paranın resmi," / "tek bakışta."), üst etiket "Okul projesi, örnek verilerle çalışır", description'ın ilk cümlesi | sayfanın hero'su: mavi-lacivert degrade, açık yeşil vurgu, Figtree; sayfadaki ikon, pano ve telefon ekran görüntüsü, maskot |
| `/okul-projeleri/kuveytturk-api-portal/` | `kuveytturk-api-portal.png` | h1, üst etiket ("Okul projesi · konsept tasarım · Kasım 2026"), sayfanın notunun ilk iki cümlesi ("Bağımsız bir okul projesidir. Kuveyt Türk ile bağlantısı, onayı ya da iş birliği yoktur.") | sayfanın kendi paleti: krem zemin, koyu yeşil; Geist (tasarımların fontu); iki yönün hero görselleri; tasarımlardaki "Kuveyt Türk · API Market" yazı markası |
| `/okul-projeleri/ricambio/` | `ricambio.png` | yayındaki `<title>` ("RICAMBIO: parts that no longer exist, made again"; sayfa İngilizce) | landing'in kendi paleti (gri-mavi kağıt, siyah, petrol mavisi), Archivo Black + JetBrains Mono, favicon'daki logo, okul projeleri vitrinindeki landing ekran görüntüsü |

Kuveyt Türk: sayfada ve tasarımlarda grafik logo yok, yalnız yazı markası var; kartta da o kullanıldı, sayfada olmayan gerçek banka logosu eklenmedi. "Okul projesi" ve "bağımsız, bağlantısı/onayı/iş birliği yok" ibareleri kartta ve `og:image:alt`'ta duruyor.

**Üretim:** `npm run og:kartlar` (`scripts/generate-og-cards.mjs`). Yöntem `generate-og-image.mjs` ile aynı (sharp + SVG). Fark: sharp'ın metin motoru macOS'ta yalnız sistem fontlarını görüyor (font dosyası verilince sessizce Helvetica'ya düşüyor, denendi), bu yüzden yazılar opentype.js (yeni geliştirme bağımlılığı, MIT, bağımlılıksız) ile sayfaların kendi fontlarından SVG yoluna çevriliyor. Fontlar `scripts/og-kartlar/fontlar/` altında: Google Fonts'un OFL değişken TTF'lerinden sabit ağırlık + Latin/Latin Genişletilmiş alt kümesi, adları "OG ..." olarak değiştirilmiş, lisansları yanında (`og_fontlar.py` nasıl üretildiğini yazıyor). Kart metinleri betik çalışırken sayfaların HTML'inden okunuyor (title, h1, .meta, description); RICAMBIO landing'i CI'da başka repodan geldiği için onun başlığı betikte sabit ve kaynağı yorumda. Build zincirine bağlanmadı: CI çıktısı makineye göre değişmesin, kartlar incelenip commit'lensin diye. Çıktı belirlenimci (iki çalıştırmanın md5'leri aynı).

Bulunan iki opentype.js hatası ve çözümü: `getPath` Figtree'de bazı GPOS kerning çiftlerinde ("Pa") ve Geist'te bazı gliflerde ("v") `NaN` koordinat yazıyor, librsvg yolu orada kesiyor (kartlarda başlığın yarısı görünmüyordu). Glifler tek tek, ham komutlarından yerleştiriliyor; kerning `Number.isFinite` ile süzülüyor; yolda `NaN` kalırsa betik hata veriyor. Archivo'nun `ccmp` biçimini desteklemediği için font alt kümelerinde yalnız `kern` ve `liga` tutuldu.

**Etiketler:** her sayfada `og:image` (mutlak `https://hamaratlabs.com/og/<ad>.png`), `og:image:width` 1200, `og:image:height` 630, `og:image:alt` (sayfanın dilinde) ve `twitter:card=summary_large_image` (yoksa eklendi; `index.html` ve hesaplayıcıda zaten vardı).
- IVD sayfaları: `<link rel="stylesheet">` öncesine blok olarak.
- Fibi (`public/okul-projeleri/fibi/index.html`, Next.js dışa aktarımı tek satır) ve Kuveyt Türk: yalnız `</head>` öncesine ekleme, başka hiçbir şey değişmedi (diff: Fibi 1 satır, KT +5 satır).
- RICAMBIO: `scripts/seo-ricambio.mjs` kopyadan sonra `og:image` yoksa ekliyor (CI'da artık `seo-ricambio: canonical + og:image + h1 eklendi.` yazması beklenir).

**Doğrulama**
- `npm run lint`: çıkış 0, 0 hata, 3 uyarı (değişmedi, dokunulmayan `src/` dosyalarında). `npm run build`: çıkış 0, kartlar `dist/og/` altında.
- saglik_yerel.py (`docs/qa/seo-deneme-1/og_sonra_yerel.txt`, `wrangler pages dev` + RICAMBIO'nun canlı kopyası üzerinde `seo-ricambio.mjs`): 33 URL, **33 sorunsuz**, `og:image yok` 0 (önceki turda 12), çift title/description 0, kırık iç link 0.
- `docs/qa/seo-deneme-1/og_dogrula.py` → `og_kart_dogrulama.txt`: 13 sayfanın her birinde tek `og:image`, mutlak `/og/` adresi, boyut etiketleri, alt, twitter:card; görsel yerel sunucudan 200, `image/png`, PIL ile 1200x630. 13 sayfa, sorunlu 0.
- RICAMBIO CI benzetimi (`og_ricambio_ci_benzetim.txt`): canonical ve h1'i çıkarılmış ham landing'de betik `canonical + og:image + h1 eklendi`, ikinci çalıştırmada `değişiklik gerekmedi`.
- Kontak föyü: `docs/qa/seo-deneme-1/og-kartlar.jpg` (13 kart, altlarında sayfa yolu). Kartlar ayrıca tam boyutta gözle kontrol edildi (Türkçe karakterler, taşma, çakışma).
- Kart boyutları: IVD 47-60 KB, Fibi 281 KB, Kuveyt Türk 240 KB, RICAMBIO 273 KB.

**Yayından sonra (PM / Haberci):**
- `curl -sI https://hamaratlabs.com/og/fibi.png` 200 + `content-type: image/png`; saglik.py canlıda `og:image yok` 0.
- Bir iki sayfayı paylaşım önizleme aracında (ör. LinkedIn Post Inspector, opengraph.xyz) açıp kartın geldiğini görmek; platformlar eski önbelleği bir süre tutabilir.
- Fibi tanıtımı akce/Fibi reposundan dışa aktarılıp kopyalanıyor; bir sonraki kopyada `</head>` öncesindeki 5 etiket kaybolur. Kalıcı çözüm Fibi reposunun `metadata`'sına eklemek (bu işin kapsamı dışında, o repoya dokunulmadı).

## Açık sorular / kapsam dışı bırakılanlar
1. ~~**og:image yok (12 sayfa):** IVD sayfaları, fibi, kuveytturk, ricambio. Ürüne özel görsel yoktu, bu turda eklenmedi (hesaplayıcıda sitenin genel görseli kullanıldı). IVD için ayrı bir OG görseli üretilsin mi?~~ Yapıldı, bkz. "Paylaşım resimleri".
2. ~~`/uretiyorum/sesver` ve `/uretiyorum/wingwire` sitemap'te yok~~ Evet kabul edildi, eklendi (yukarıdaki "Bağımsız inceleme düzeltmeleri" bölümü).
3. **`/uretiyorum/kitabe` sitemap'e yeni girdi** (eski regex hatası düzeltilince). Kitabe "Geliştirmede"; indekslenmesi istenmiyorsa söyle.
4. **Yumuşak 404:** bilinmeyen yollar hâlâ HTTP 200 (Cloudflare SPA kipi); yalnız istemcide noindex ekleniyor. Gerçek 404 için `404.html` gerekir ama deploy.yml notuna göre o zaman derin rotalar soğuk açılışta 404 olur. Bu turda dokunulmadı.
5. **`/privacy`** canonical `/privacy` ama sunucu `/privacy/`'ye 308 yapıyor (önceden de böyle, sitemap'te değil). Aynı `privacy.html` yöntemine taşınsın mı?
6. Ön-render içeriği JS'li tarayıcıda gizli; Google JS çalıştırdığı için asıl indekslenecek içerik React'in çizdiği sayfa, ham HTML'deki blok ilk tarama ve önizleme botları için. Bu ayrım bilinçli (tasarım hiç değişmesin diye).
