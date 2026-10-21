> Arşiv notu (2026-10-21): `feature/wingwire-yonlendirme` dalı ve worktree'si temizlikte silindi. Dalın kod commit'i `b968291` main'e alınmadı — `src/wingwire/WingWirePage` zaten `feature/wingwire-3-katman` (2c98543) ile kaldırılmıştı. Dalın yedeği: `~/Desktop/Projeler/_worktree-yedek-2026-10-21/feature-wingwire-yonlendirme.bundle`. Aşağıdaki yol/dal referansları tarihseldir.

# wingwire.hamaratlabs.com — bağımsız landing page raporu

Tarih: 2026-10-20 · Hazırlayan: pm-wingwire (uygulama: webdev profili, doğrulama: PM)

## 1. Yeni site — `hamarat52/wingwire-web` (public)
- Yerel: `~/Desktop/Projeler/wingwire-web`, dal `main`
- Site commit'i: `bdbbebc` — pushlandı (bu rapor ayrı bir commit olarak eklendi)
- Stack: Vite + React (hamaratlabs-web ile aynı), `.github/workflows/deploy.yml` (main push → build → deploy-pages)
- Actions çalışması `39483592079`: build ✓, deploy ✓
- Pages: `build_type=workflow`, `cname=wingwire.hamaratlabs.com`, `public/CNAME` mevcut
- Kanıt: GitHub Pages IP'sine (185.199.108.153) Host başlığıyla istek → `<title>WingWire — kendi ajanına Android'den bağlan</title>`, `/favicon.svg` 200

### Tasarım kararları (gerekçe)
- Palet Android uygulamasından (`Theme.kt`, `WingWireLogo.kt`): zemin #0B0F14, vurgu #5A86FF, ikincil #8F8CFF, logo gradyanı #5AD2FF→#1F5CFF; cyan #4CC9F0 yalnız "canlı bağlantı" anlamında. Turuncu tamamen kaldırıldı (`grep -iE "ff8a3d|d4a24e|amber|orange"` boş).
- Wordmark `wing[wire]` uygulamadaki logo ölçüleriyle aynı.
- Hero: CrystalizedBall birebir kopya, renk **#f43f3f (kırmızı) — bilinçli kullanıcı tercihi, değiştirilmedi.**
- Kendi navbar'ı (logo, Neler yapar, Nasıl çalışır, Yakında) ve kendi footer'ı. hamaratlabs.com'a tek dönüş linki footer'da: "hamaratlabs.com'un bir ürünü".
- İçerik yeniden yazılmadı, birebir taşındı: lead, 4 yetenek, telefon mockup'ı ("Ödeme modülü" oturumu + onay döngüsü), "ANDROID telefonun ⇄ AGENT kendi ajanın" akış şeridi.
- Giscus yorumları taşınmadı: hamaratlabs-web reposunun Discussions'ına bağlı, bağımsız sitede karşılığı yok.
- Fontlar self-host (@fontsource): Google Fonts çağrısı yok.

### Doğrulama
- `npm run lint` ✓, `npm run build` ✓
- Ekran görüntüleri (gerçek, `npm run preview`): `ekran-masaustu.png` (1280px), `ekran-mobil.png` (390px). Yatay taşma yok.

## 2. Eski sayfa — `hamaratlabs-web`
- Worktree: `~/Desktop/Projeler/hamaratlabs-web-wt-wingwire-yonlendirme`, dal `feature/wingwire-yonlendirme`
- Commit `b968291` (+ bu raporun kopyası ayrı commit) — **pushlanmadı, merge edilmedi (ana oturuma bırakıldı)**
- `/uretiyorum/wingwire` artık tek kart: mavi ikon, "WingWire artık kendi adresinde", lead, "Artık wingwire.hamaratlabs.com'da → git" butonu, "← uygulamalar". Turuncu ve yorumlar kaldırıldı. Otomatik yönlendirme bilinçli olarak eklenmedi (DNS bağlanmadan kırık sayfaya atmasın).
- `npm run build` ✓. `npm run lint`: main'de zaten var olan 12 hata + 6 uyarı (11 dosya, hiçbiri `src/wingwire` değil); `npx eslint src/wingwire` temiz. Bu değişiklik yeni lint sorunu getirmedi.
- Ekran görüntüsü: `docs/qa/wingwire-bagimsiz-site/yonlendirme-karti.png`

## 3. Bekleyen: DNS (NatroHost — kullanıcı eklemeli)
| Tür | Ad (host) | Değer | TTL |
|---|---|---|---|
| CNAME | `wingwire` | `hamarat52.github.io.` | varsayılan (3600) |

Şu an `dig wingwire.hamaratlabs.com` boş, NS = ns1/ns2.natrohost.com. Kayıt yayılınca:
`gh api -X PUT repos/hamarat52/wingwire-web/pages --field https_enforced=true` (sertifika üretildikten sonra; birkaç dk–1 saat).

## 4. Sıralama önerisi
1. DNS kaydı eklenir → site açılır → HTTPS zorunlu kılınır.
2. Sonra `feature/wingwire-yonlendirme` main'e alınıp pushlanır (yönlendirme kartı canlı adres çalışırken yayına girsin).
