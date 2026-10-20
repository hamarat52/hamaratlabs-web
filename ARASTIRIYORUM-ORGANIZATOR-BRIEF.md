# Organizatör Brief'i — Gizli `/arastiriyorum` Sekmesi

Hazırlayan: Kişisel Asistan (Hermes) · Tarih: 2026-10-19
Veri dosyası: `arastiriyorum-araclar.json` (bu dosyayla aynı dizinde, proje kökünde)

## İstenen

`hamaratlabs-web` içine **arayüzden erişilemeyen** bir `/arastiriyorum` sayfası eklenecek.
Yusuf buraya doğrudan URL yazarak girip araç envanterini gözden geçirecek ve etiketleri
düzeltecek.

## Kritik gereksinim — gizlilik

- **Nav'a eklenmeyecek.** Masaüstü menüsünde de, mobil menüde de görünmeyecek.
- Ana sayfadan, footer'dan veya başka bir sayfadan **link verilmeyecek**.
- Yalnızca `https://hamaratlabs.com/arastiriyorum` adresi elle yazılınca açılacak.
- Sayfaya `<meta name="robots" content="noindex, nofollow">` eklensin; arama motorlarına düşmesin.
- Sitemap varsa bu rota sitemap'e **girmeyecek**.

Not: Bu bir güvenlik önlemi değil, sadece "menüde görünmesin" isteğidir. İçerik yine de
herkese açık olacağından gizli/hassas hiçbir bilgi konulmamalı. JSON'da zaten yok.

## Veri

`arastiriyorum-araclar.json` — 64 araç, 9 kategori.

Her kaydın alanları:

- `ad` — araç adı
- `kategori` — `kategoriler` listesindeki `id` ile eşleşir
- `durum` — `kullanıyorum` · `planlıyorum` · `kullanmıyorum`
- `lisans` — lisans/ücret etiketi
- `url` — resmi site
- `ozet` — tek cümlelik açıklama (Yusuf'un ağzından, birinci tekil şahıs)
- `kanit` — bu kaydın neye dayandığı (`kurulu`, `oturumda_kullanildi`, `arastirildi`, `skill_mevcut`)

Dağılım: kullanıyorum 51 · planlıyorum 10 · kullanmıyorum 3

## Sayfadan beklenenler

1. **Durum filtresi** — üstte üç etiketle süzme (kullanıyorum / planlıyorum / kullanmıyorum),
   ayrıca "hepsi". Yusuf'un hızlıca gözden geçirebilmesi asıl amaç.
2. **Kategori gruplaması** — 64 araç tek yığın hâlinde okunmaz.
3. **Durum rozeti** — her kartta açık renkli bir etiket. Üç durum görsel olarak ayırt edilsin.
4. **Arama kutusu** — isim ve açıklamada arasın.
5. **Dış linkler** `target="_blank" rel="noopener noreferrer"` ile açılsın.
6. **Mobil öncelikli** — Yusuf siteye çoğunlukla telefondan bakıyor.
7. **`kanit` alanı görünür olsun** (küçük, ikincil bir detay olarak). Yusuf bir etiketin
   neye dayandığını görmeden düzeltemez.

## Önemli uyarılar

- **Durum etiketleri asistanın çıkarımıdır, Yusuf'un beyanı değildir.** Sayfada bunu belirten
  kısa bir not olsun: "Etiketler taslaktır, düzeltilecektir." JSON `_meta.onemli_not`
  alanında da yazıyor.
- Repoda `main` üzerinde başka ajanlar çalışıyor. İşe başlamadan `git status` kontrol
  edilmeli, başkasının işi ezilmemeli. Gerekirse ayrı dal.
- **Bu iki dosya bir kez başka bir ajan tarafından yanlışlıkla silindi.** Temizlik/çöp
  toplama yapan adımlar `arastiriyorum-araclar.json` ve bu brief'i kapsam dışı bırakmalı.
- Projede zaten çok benzer bir sayfa var: **`/oneriyorum`** (`src/App.jsx` içinde
  `function Tools()`, verisi `src/data.js` içinde `TOOLS`). Yeni sayfa onun desenini
  izleyebilir ama **ayrı bir sayfa** olmalı — `/oneriyorum` herkese açık ve kısa bir
  tavsiye listesi, `/arastiriyorum` ise gizli ve kapsamlı envanter. İkisi karıştırılmasın.
- Veri `src/data.js` içine gömülebilir ya da JSON import edilebilir; karar geliştiricinin.
  Ama Yusuf'un **tek bir yerden etiket düzeltebilmesi** önemli.
- Push yapılmadan önce Yusuf'a sorulmalı.

## Teslim beklentisi

- Çalışan `/arastiriyorum` rotası
- Nav'da görünmediğinin kanıtı (masaüstü + mobil ekran görüntüsü)
- `noindex` meta etiketinin kanıtı
- Mobil görünüm kanıtı
- Değişen dosyaların listesi
