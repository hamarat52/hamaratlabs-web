# WingWire — 3 katmanlı sayfa mimarisi (QA raporu)

Tarih: 2026-10-20 · Dal: `feature/wingwire-3-katman` · Worktree: `hamaratlabs-web-wt-ww3` · Taban: `31fcafe` (main)

## Sonuç

| Yol | Ne çiziliyor | Durum |
|---|---|---|
| `/uretiyorum` | Mağaza (değişmedi). WingWire kartı diğer kartlarla aynı görünüyor. | Tamam |
| `/uretiyorum/wingwire` | Ortak `AppPage` şablonu + mavi gradyanlı "Ürünü ziyaret et →" butonu | Tamam |
| `/wingwire` | WingWire'ın kendi sitesi: kendi navbar'ı, footer'ı, InkNavy/mavi marka, kırmızı CrystalizedBall (#f43f3f) | Tamam |

Ayrı domain/repo kullanılmadı. `wingwire-web` reposu yalnız okundu, hiçbir şey yazılmadı.

## Değişiklikler

- **`src/wingwire-site/WingWireSite.jsx` (yeni):** `wingwire-web/src/App.jsx` birebir taşındı (Nav, Hero, WireLine, Session/Phone, Footer). Bilinçli farklar:
  - Ürün metni `wingwire-web/src/data.js` yerine ana sitenin `data.js`'teki WingWire kaydından okunuyor (tek kaynak; metinler zaten aynı).
  - `WingWireIcon` yerine `AppIcon name="WingWire"` kullanıldı (wingwire-web'deki ikon AppIcon kaydının kopyası).
  - CrystalizedBall ana sitedeki bileşen (`src/components/rb/CrystalizedBall`); dosyalar birebir aynı. Renk `#f43f3f` korunuyor.
  - Footer'daki "hamaratlabs.com'un bir ürünü" linki site içi `Link` oldu.
  - Sayfadayken `document.title` ve `<html>` zemini koyu oluyor; çıkınca eski hâline dönüyor (doğrulandı).
- **`src/wingwire-site/WingWireSite.css` (yeni):** `wingwire-web/src/index.css` kopyası. Bütün seçiciler `.wwsite` altına alındı; `:root/html/body` → `.wwsite`. Sebep: SPA'da CSS sayfadan çıkınca da yüklü kalır, ana sitenin `body`/`.wrap`/`.nav` kurallarına sızmamalı. Ana sitenin genel `h2` ve `.appicon` gölgesi nötrlendi.
- **`src/wingwire-site/fonts.css` + `public/fonts/wingwire/` (yeni, 16 woff2, 212 KB):** Sora 700, Plus Jakarta Sans 400–800, JetBrains Mono 400/500 (latin + latin-ext). `@fontsource` paketi eklenmedi, `package.json` değişmedi. Aile adları `WW ` önekli; ana sitenin `JetBrains Mono` tanımıyla çakışmıyor.
- **`src/App.jsx`:**
  - `CUSTOM_PAGES`'ten `wingwire` çıkarıldı.
  - `STATIC_PAGES`'e `'/wingwire'` (lazy) eklendi.
  - Yeni `STANDALONE_PAGES` kümesi eklendi. Bu yollar ana sitenin Header/Footer'ı olmadan çiziliyor. `/privacy` eskisi gibi Header/Footer'lı kalıyor.
  - Şablon seçimi: `visitUrl` alanı olan ürün, aşaması ne olursa olsun `AppPage` ile açılıyor. WingWire `stage: 'dev'` olduğu için aksi hâlde `DevStagePage`'e düşerdi.
- **`src/AppPage.jsx`:** `VisitCta` eklendi. Yalnız `app.visitUrl` varsa çiziliyor.
  - `visitLabel` varsayılanı "Ürünü ziyaret et".
  - `visitAccent` → CSS custom property `--visit-bg`.
  - Site içi yol (`/…`) SPA içinde açılıyor; tam URL yeni sekmede açılıyor.
- **`src/App.css`:** `.apppage__visit` stili eklendi: hap biçimi, `var(--visit-bg)` zemin, hover'da kalkış ve ok kayması, `prefers-reduced-motion` desteği.
- **`src/data.js`:** WingWire kaydına `visitUrl: '/wingwire'`, `visitLabel: 'Ürünü ziyaret et'` ve `visitAccent: 'linear-gradient(135deg, #5A86FF 0%, #1F5CFF 100%)'` eklendi.
- **Silinenler:** `src/wingwire/WingWirePage.jsx` ve `src/wingwire/WingWirePage.css`. Başka referansları yok (grep ile doğrulandı).

## Doğrulama (gerçek çıktılar)

- **`npm run build`:** başarılı (`✓ built in 15.91s`). `WingWireSite` ayrı bir parça olarak çıkıyor: JS 5.92 kB, CSS 19.23 kB.
- **`npm run lint`:** `✖ 18 problems (12 errors, 6 warnings)`. Değişiklik öncesi temiz main'de (`git stash -u` ile) çıktı **birebir aynı**. Hataların hepsi dokunulmayan dosyalarda (AppIcon, rb/*, nav.jsx, vite.config.js…).
  - Değişen dosyalar tek tek lint edildi: `npx eslint src/App.jsx src/AppPage.jsx src/data.js src/wingwire-site/` → 0 hata, 1 uyarı.
  - O uyarı `App.jsx:54` `export const GLYPHS` için ve önceden de vardı.
- **Tarayıcı testi** (vite preview :4179, DOM ölçümü):
  - `/uretiyorum/wingwire`: `.apppage` var. `.apppage__visit` metni "Ürünü ziyaret et→", `href=/wingwire`, arka plan `linear-gradient(135deg, rgb(90,134,255) 0%, rgb(31,92,255) 100%)`.
  - Butona tıklama → `path=/wingwire`, title "WingWire — kendi ajanına Android'den bağlan".
    - `.wwsite .nav` ve `.wwsite .foot` var; ana sitenin header'ı yok (tek header WingWire'ın).
    - `.ww__ball canvas` var, zemin `rgb(11,15,20)`, font `"WW Plus Jakarta Sans"`, `--accent #5a86ff`.
  - `history.back()` → `/uretiyorum/wingwire`. `.wwsite` kalmadı, title "🐴 hamaratlabs", `<html>` zemini sıfırlandı.
  - Diğer 6 ürünün hiçbirinde `.apppage__visit` yok (sesver, income-vs-desires, titimer, kitabe, pomodoro-restoran, duo-for-x).
  - 390px mobil emülasyon: 3 sayfada da `scrollWidth = 390`, yatay taşma yok.

## Ekran görüntüleri (headless Chrome, 1440 px)

- `a-uretiyorum-magaza.png`: mağaza; WingWire kartı SesVer'in yanında, normal görünüyor.
- `b-uretiyorum-wingwire-apppage.png`: AppPage şablonu + mavi "Ürünü ziyaret et →".
- `c-wingwire-hero.png`: `/wingwire` hero; kendi navbar'ı (wing[wire] wordmark, Neler yapar / Nasıl çalışır / Yakında), kırmızı küre.
- `c2-wingwire-tam.png`: `/wingwire` tam sayfa; hat animasyonu, "Ödeme modülü" telefon mockup'ı, 4 yetenek, kendi footer'ı.
- `d-kontrol-sesver-degismedi.png`: kontrol; SesVer AppPage'i değişmedi, ekstra buton yok.

Not: Headless Chrome 390 px pencerede minimum pencere genişliği yüzünden kesik görüntü verdi. O iki görüntü yanıltıcı olduğu için silindi. Mobil doğrulama yukarıdaki DOM ölçümüyle yapıldı.

## Brief'le farklar / açık noktalar

1. **`data.js` kaydı zaten vardı.** Brief'te "WingWire için kayıt YOK" yazıyordu, ama main'de (`31fcafe`) kayıt mevcuttu: name, `stage: 'dev'`, lead, 4 yetenek, platform. Mağaza kartı bu kayıttan çiziliyordu. Kayıt yeniden yazılmadı; yalnız `visit*` alanları eklendi. Metin, eski sayfadaki (`5cdcaf6`) lead ve 4 yetenekle aynı.
2. **Ekran görüntüsü (screens) eklenmedi.** Eski sayfadaki telefon mockup'ı ve "Ödeme modülü" örneği bir görsel dosyası değil, HTML/CSS çizimiydi. Bu çizim `/wingwire`'a birebir taşındı (`Phone` bileşeni). AppPage'in ekran görüntüsü alanına koyulabilecek gerçek bir uygulama ekran görüntüsü repoda yok; uydurulmadı. Gerçek Android ekran görüntüleri gelince kayda eklenebilir.
3. **`/wingwire`'a doğrudan giriş:** GitHub Pages'te workflow'daki `cp dist/index.html dist/404.html` SPA fallback'i ile çalışır (`/uretiyorum/*` yolları da böyle çalışıyor). `/privacy` gibi ayrı prerender eklenmedi; gerekirse ayrı iş.
4. **AppPage'deki "İndir" (kaçan buton):** İndirilemeyen ürünlerde AppPage'in mevcut DodgeField davranışı bu; değiştirilmedi. Mavi CTA onun altında ayrı satırda duruyor.
