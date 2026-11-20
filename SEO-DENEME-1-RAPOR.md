# SEO denemesi 1: hamaratlabs.com

Tarih: 2026-11-20 · Dal: `seo/deneme-1` (origin/main `ee8e2e6` tabanlı) · Worktree: `.worktrees/seo-deneme-1`
Durum: dalda commit'li, **push / merge / deploy yapılmadı** (Yusuf onayı ve PM'in yayını bekleniyor).

Sürümler: Vite 6.4.4, React 19.3.1, react-dom 19.3.1 (package.json: `vite ^6.3.5`, `react ^19.1.0`). Yerel Node 20.18.0, CI Node 22.

## Commit'ler

| Hash | Ne |
|---|---|
| `4e08a4e` | İş A: rota başına ön-render edilmiş head + içerik, ortak adres listesi, site içi head eşitleme |
| `6aebd2e` | İş B: fibi / kuveytturk canonical, RICAMBIO canonical + h1 (CI betiği), kısa title'lar, KADER description |
| `e5725ce` | `npm run lint` hatasız (yapılandırma + src/components küçük temizlik) |
| `6174640` | İş C: `/income-vs-desires/saatlik-ucret-hesaplama` hesaplayıcı sayfası |
| (bu rapor) | Rapor + `docs/qa/seo-deneme-1/` kanıt dosyaları |

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
- CI log'unda `seo-ricambio: canonical + h1 eklendi.` satırı.
- Search Console'da sitemap'i yeniden gönderme ve 3-4 ürün URL'i için "URL denetimi".

## Açık sorular / kapsam dışı bırakılanlar
1. **og:image yok (12 sayfa):** IVD sayfaları, fibi, kuveytturk, ricambio. Ürüne özel görsel yoktu, bu turda eklenmedi (hesaplayıcıda sitenin genel görseli kullanıldı). IVD için ayrı bir OG görseli üretilsin mi?
2. **`/uretiyorum/sesver` ve `/uretiyorum/wingwire` sitemap'te yok** (öncesinde de yoktu: FEATURED kayıtlarında `short` alanı yok). Ürünlerin asıl sayfası `/sesver`, `/wingwire` sitemap'te. Mağaza detay sayfaları da eklensin mi?
3. **`/uretiyorum/kitabe` sitemap'e yeni girdi** (eski regex hatası düzeltilince). Kitabe "Geliştirmede"; indekslenmesi istenmiyorsa söyle.
4. **Yumuşak 404:** bilinmeyen yollar hâlâ HTTP 200 (Cloudflare SPA kipi); yalnız istemcide noindex ekleniyor. Gerçek 404 için `404.html` gerekir ama deploy.yml notuna göre o zaman derin rotalar soğuk açılışta 404 olur. Bu turda dokunulmadı.
5. **`/privacy`** canonical `/privacy` ama sunucu `/privacy/`'ye 308 yapıyor (önceden de böyle, sitemap'te değil). Aynı `privacy.html` yöntemine taşınsın mı?
6. Ön-render içeriği JS'li tarayıcıda gizli; Google JS çalıştırdığı için asıl indekslenecek içerik React'in çizdiği sayfa, ham HTML'deki blok ilk tarama ve önizleme botları için. Bu ayrım bilinçli (tasarım hiç değişmesin diye).
