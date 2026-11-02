# /skills sayfası — rapor (29 Ekim 2026)

## Dal
- Dal: `feature/skills-sayfasi`, taban `origin/main` @ ca9b6f6 (açıkça verildi)
- Worktree: `~/Desktop/Projeler/hamaratlabs-web/.worktrees/skills-sayfasi`
- Ana checkout'a dokunulmadı. Deploy, merge ve push YAPILMADI; yalnız bu dala commit atıldı.

## Değişen / eklenen dosyalar
- `src/data/skills.json` (yeni): `~/.hermes/profiles/haberci/reports/skills-katalog/yayin/skills.json` dosyasının birebir kopyası (`cmp` ile aynı, 425.064 bayt). Kaynak dosya yalnız okundu.
- `src/SkillsPage.jsx` (yeni): sayfa. Lazy chunk olarak yükleniyor, JSON yalnız bu chunk'ta. WebGL/Canvas yok.
- `src/SkillsPage.css` (yeni): mevcut tasarım dili (ivory zemin, `#f4f1e9` kart, `.chip`, `.btn`, `.pagehead`, mono etiketler, Geist başlık).
- `src/App.jsx`: `STATIC_PAGES` içine `'/skills': lazy(() => import('./SkillsPage'))` eklendi. Nav'a ve footer'a eklenmedi.
- `scripts/generate-sitemap.mjs`: `/skills` eklendi. `lastmod` değeri `src/data/skills.json` içindeki `meta.olusturma`'dan `readFileSync` + regex ile okunuyor (import yok). Dosya yoksa `/skills` sitemap'e eklenmiyor.
- `docs/qa/skills/*.png`: ekran görüntüleri.
- `docs/skills-page-report.md`: bu rapor.

## Sayfa davranışı
- Başlıkta "541 ARAÇ" ve "Yıldızlar 29 Ekim 2026 itibarıyla" yazıyor (tarih `meta.olusturma`'dan geliyor).
- Arama Türkçe karakter duyarsız (ı/İ ve aksanlar sadeleştiriliyor). Aranan alanlar: ad, özet, tür, kategori ve lisans.
- Filtreler (tek seçim çipleri): Durum, Kategori, Tür, ayrıca "Deneme sonucu olanlar" ve "GitHub'da olanlar" anahtarları. Çiplerdeki sayılar, diğer filtreler uygulandıktan sonra kalan kayıtları gösteriyor. "Filtreleri temizle" düğmesi var.
- Filtre paneli mobilde (<900px) varsayılan olarak kapalı, geniş ekranda açık ("Filtreler" düğmesi, `aria-expanded`, `hidden`).
- Sıralama: Yıldız (varsayılan), Son güncelleme (`son_push`), İlk görülme, Ad (tr locale). Değeri boş olan kayıtlar sona gidiyor.
- Sayfalama: ilk açılışta 24 kart. "Daha fazla göster (N kaldı)" ve "Tümünü göster" düğmeleri var. Filtre değişince liste başa dönüyor.
- Her kartta şunlar var:
  - tür · kategori, durum rozeti, `dogrulandi=false` ise "doğrulanmadı" etiketi
  - ad, özet, lisans, fiyat
  - GitHub ⭐ ve "son güncelleme X gün önce". Bu süre bugüne göre değil, `olcum_tarihi − son_push` farkından hesaplanıyor; fark 0 ise "ölçüm gününde" yazıyor.
  - Repo arşivlenmişse "Arşivlenmiş repo" uyarısı
  - Resmi site ve Repo linkleri
  - Kaynak ikonları (hugeicons; Instagram, X, LinkedIn, YouTube, GitHub, diğerleri için genel link ikonu)
- Deneme kaydı olan kartlarda açılır "Deneme: input → output → sonuç" bölümü var (Motion ile yükseklik animasyonu, reduced-motion'a uyuyor). `kanit_dosyasi_mevcut=false` ise "Sonuç kayıtlardan alındı." notu çıkıyor.
- SEO: sayfa açıkken title `Skills & Araçlar — HamaratLabs` oluyor; meta description, og:title, og:description, og:url ve canonical `https://hamaratlabs.com/skills` olarak ayarlanıyor. Sayfadan çıkınca eski değerler geri yükleniyor. noindex YOK.

## Kabul testleri (gerçek sonuçlar)

### 1. Build ve SPA fallback — GEÇTİ
- `npm run build` exit 0. vite, prerender-privacy, sitemap (11 URL, `/skills` lastmod 2026-10-29) ve og-image adımlarının hepsi çalıştı.
- 404 fallback: canlı deploy'da `dist/404.html`'i workflow üretiyor (`cp dist/index.html dist/404.html`). Aynı adım yerelde uygulandı ve `cmp` ile 404.html = index.html olduğu doğrulandı.
- GitHub Pages'e benzeyen sunucu (`npx serve dist`, `-s` olmadan): `/skills` isteği HTTP 404 ile 404.html'i döndürüyor. Tarayıcıda React yükleniyor; title "Skills & Araçlar — HamaratLabs" ve "541 ARAÇ" görüldü.
- `vite preview`: `/skills` 200 dönüyor.

### 2. Render ve filtreler — GEÇTİ (sayılar DOM'dan, `document.querySelectorAll('.skill')` ile)

| Kontrol | DOM | Veri/beklenen |
|---|---|---|
| "Tümünü göster" sonrası kart | 541 | 541 |
| İlk açılış kartı | 24 | 24 (sayfa boyu) |
| Deneme filtresi | 46 (hepsi deneme kayıtlı) | 46 |
| GitHub filtresi | 270 | 270 |
| Durum: kullaniyoruz | 85 | 85 |
| Durum: degerlendirildi | 310 | 310 |
| Durum: belirsiz | 68 | 68 |
| Durum: reddedildi | 44 | 44 |
| Durum: denendi | 34 | 34 |
| "doğrulanmadı" etiketi | 16 | 16 |
| Arşiv uyarısı | 4 | 4 |
| Arama "claude" | 51 | 51 (Python) |
| Arama "TTS" | 69 | 69 (Python) |
| Kategori ses-tts + tür model | 37 | 37 (Python) |
| Kategori gelistirme | 59 | 59 (Python) |
| Deneme açık / "kayıtlardan alındı" notu | 46 / 28 | 46 / 28 (`kanit=false`) |

- Eşleşmeyen aramada boş durum mesajı çıkıyor. "Filtreleri temizle" sonrası tekrar 541 kayıt.
- Sıralama başları Python ile karşılaştırıldı:
  - Yıldız: 308.078 / 251.817 / 222.971
  - Son güncelleme: A2UI, Aseprite, Audacity (2026-10-29)
  - İlk görülme: Animate (cth9191)…
  - Ad: 1FileTool…
- Mobil 390px: `scrollWidth` 390, 541 kart açıkken taşan eleman sayısı 0. Filtre paneli başlangıçta `hidden=true`, ilk kart y=577 (ilk ekranda).
- Masaüstü 1440: panel açık, `scrollWidth` 1440.
- Konsol hatası (error ve console.error): 0.
- Nav ve footer'da /skills linki yok (DOM ile doğrulandı).

### 3. Ekran görüntüleri — ALINDI (`vite preview` + Browser Use/CDP, ayrı oturum)
Klasör: `docs/qa/skills/`
- `mobil-390-liste.png`
- `mobil-390-filtre-acik.png`
- `mobil-390-deneme-acik.png`
- `mobil-390-deneme-kayitlardan.png` (not görünen kart)
- `masaustu-1440-liste.png`
- `masaustu-1440-filtre-acik.png`
- `masaustu-1440-deneme-acik.png`

Not: İlk çekimde sekme `visibilityState=hidden` durumundaydı ve Motion animasyonu yarıda donmuş göründü. Bu kod hatası değil, ortam kaynaklıydı. `Page.bringToFront` ile görünür yapıldıktan sonra yeniden çekildi; yükseklik ve opaklık tam (261px / 1).

### 4. Sızıntı grep'i — KOMUT BOŞ DEĞİL, ama eşleşmeler bu dalın değişikliğinden gelmiyor
`grep -rn "/Users/\|health\|fitness" dist/` iki satır buldu:
- `dist/data/kod-aktivite.json:744` — "dashboard: home — health pills, …" (commit başlığı)
- `dist/data/kod-aktivite.json:888` — "deploy: bind 0.0.0.0 + 120s healthcheck window …" (commit başlığı)

Bu dosya, `origin/main`'de zaten bulunan `public/data/kod-aktivite.json`. Aktivite cron'u tarafından üretiliyor ve değişiklik öncesi temiz build'de de aynı eşleşmeler vardı. Kişisel sağlık/fitness verisi değil, kod commit başlıklarındaki "health/healthcheck" kelimeleri. Cron verisine dokunulmadı (kapsam dışı).

Bu dalın eklediği dosyalarda (`SkillsPage-*.js/css`, `sitemap.xml`) eşleşme 0 (büyük/küçük harf duyarsız da 0). `src/data/skills.json` içinde `/Users/` 0, health 0, fitness 0.

### 5. Deploy/merge/push — YOK
Yalnız `feature/skills-sayfasi` dalına commit atıldı.

### Lint
- Yeni ve değişen dosyalarda (`SkillsPage.jsx`, `App.jsx`, `generate-sitemap.mjs`) 0 hata. App.jsx'teki tek uyarı (`GLYPHS` export, react-refresh) zaten vardı.
- `npm run lint` toplamı değişiklik öncesi ve sonrası aynı: 320 hata. Hepsi `public/oyunlar`, `public/zburada-*`, `src/components/rb`, `vite.config.js` dosyalarında, yani mevcut durumdan geliyor.

## Bundle boyutu etkisi
| Parça | Önce | Sonra |
|---|---|---|
| `index-*.js` (ana sayfa) | 333,49 kB (gzip 109,68) | 333,73 kB (gzip 109,77) → +0,24 kB (yalnız lazy route kaydı) |
| `react-*.js` | 125,46 kB | 125,33 kB |
| Yeni `SkillsPage-*.js` | — | 384,91 kB (gzip 83,53), yalnız /skills açılınca iner; JSON verisi bunun büyük kısmı |
| Yeni `SkillsPage-*.css` | — | 6,07 kB (gzip 1,68) |
| Paylaşılan hugeicons/motion parçaları | — | `NewTwitterIcon-*.js` 2,75 kB, `use-motion-value-*.js` 0,25 kB |

Ana sayfa ilk yükü fiilen değişmedi. /skills için ek indirme yaklaşık 85 kB gzip.

## Belirsiz kalanlar / Yusuf'un kararı gerekenler
1. **HTTP 404 ve SEO.** GitHub Pages'te `/skills`'e soğuk girişte (diğer SPA route'larında olduğu gibi) ilk HTTP durumu 404 dönüyor; içerik JS ile geliyor. Google 404 durum kodlu sayfayı indekslemeyebilir. Bu durumda sitemap'teki `/skills` Search Console'da "Bulunamadı (404)" olarak görünebilir.
   - Kalıcı çözüm: ya `prerender-privacy.mjs` desenindeki gibi `dist/skills/index.html` üretmek, ya da skill'de anlatılan Cloudflare Pages `_redirects` geçişi.
   - Prerender seçeneğinde GitHub Pages `/skills` → `/skills/` 301 yönlendirmesi yapıyor. Router `/skills/` (sondaki slash) yolunu tanımıyor, bu yüzden ayrıca slash normalizasyonu gerekir. Canlıda `/privacy` → `/privacy/` için de aynı durum görülüyor (curl ile doğrulandı). Bu yüzden bu dalda yapılmadı.
2. **Dışarı açılan iç notlar.** Katalogdaki her alan `karar_notu` (540/541 kayıtta dolu, ör. "Kurulmadı/denenmedi", iç araştırma referansları) bundle'a giriyor. Sayfada gösterilmiyor ama JS chunk'ı içinden okunabilir.
   - Deneme metinlerinde iç bağlam var (ör. "Yusuf'un 3:49 dk Türkçe ses kaydı", "OBS video notuna eklendi"); bunlar sayfada görünüyor.
   - Dosya "yayin" klasöründen ve organizer onaylı geldiği için olduğu gibi kopyalandı. İstenirse yayın JSON'undan `karar_notu` çıkarılabilir.
3. **Kategori/tür/durum adları.** Görünen etiketler slug'lardan Türkçe okunur ada çevrildi (ör. `ses-tts` → "Ses / TTS", `kutuphane` → "Kütüphane"). Veri değiştirilmedi; tanımsız bir slug gelirse olduğu gibi gösteriliyor.
4. **Tekrarlı kaynaklar.** Aynı URL'yi taşıyan kaynak kayıtları (veride var; ör. aynı reel iki kez, biri `paylasan` dolu) kartta tek ikonda birleştiriliyor; `paylasan` bilgisi olan kayıt tercih ediliyor.
5. **Veri tutarlılığı (bilgi).** Durum `denendi` 34 kayıt, `deneme` nesnesi ise 46 kayıtta var; deneme sonucu olanların durum dağılımı: 31 denendi, 11 kullanıyoruz, 4 reddedildi. Veri olduğu gibi gösteriliyor.
   - `ilk_gorulme` 433 kayıtta boş, bu yüzden "İlk görülme" sıralamasında bu kayıtlar sonda ve ada göre sıralı.
   - Kaynaklarda X/LinkedIn tipleri çok az (linkedin 2 `lnkd.in`, X yok); ikon desteği hazır.
6. **Filtre durumu URL'ye yazılmıyor.** Filtreli bir görünüm link olarak paylaşılamıyor; istenirse query param senkronu eklenebilir.
7. **Sıfır sayılı çipler.** Seçilebiliyor ve boş liste gösteriyor; istenirse devre dışı bırakılabilir.
8. **Nav.** Görev gereği nav'a eklenmedi; sayfa yalnız doğrudan URL ve sitemap ile erişilebilir.
