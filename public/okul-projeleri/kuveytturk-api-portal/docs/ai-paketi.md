---
title: "AI paketi"
product: ai
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: ai-paketi.html
summary: "Tüm dokümanlar tek zip'te: AGENTS.md, konu konu Markdown, örnek OpenAPI şeması, cURL örnekleri ve sha256'lı manifest. Projeye docs/kuveytturk olarak açılır."
---
# AI paketi

Tüm dokümanlar yapay zekâ araçlarının okuyacağı biçimde tek zip'te: AGENTS.md ile başlayan, konu konu ayrılmış Markdown dosyaları, örnek OpenAPI şeması ve cURL örnekleri.

[AI paketini indir (.zip)](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/docs/kuveytturk-api-ai-paketi.zip)

## Neden tek dev dosya değil

Birçok doküman sitesi tüm içeriği tek bir `llms-full.txt` dosyasında verir. Bu dosya bir yapay zekâ aracına bütün olarak verildiğinde bağlam penceresini doldurur, maliyeti artırır ve ilgisiz ürünler yüzünden yanlış cevap riskini büyütür.

Paket küçük dosyalardan oluşur. Ajan önce AGENTS.md'yi okur, sonra yalnız işine yarayan dosyayı açar. `manifest.json` her dosyanın yaklaşık token sayısını verir; ajan neyi açacağına buna bakarak karar verebilir.

## İçindekiler

```text
kuveytturk-api-ai-paketi/
├── AGENTS.md  # ajan için kök harita ve kurallar; buradan başlayın
├── README.md  # Claude Code, Cursor ya da Codex'e tanıtma
├── manifest.json  # sürüm, tarih, dosya listesi, sha256, yaklaşık token
├── llms.txt  # tüm dosyaların kısa açıklamalı listesi
├── guides/
│   ├── ai-paketi.md
│   ├── canliya-gecis.md
│   ├── genel-bakis.md
│   ├── hizli-baslangic.md
│   ├── istek-imzalama.md
│   ├── kurulum-adimlari.md
│   ├── mcp-araclari.md
│   ├── ortamlar.md
│   ├── test-musterileri.md
│   ├── uygulama-ve-anahtarlar.md
│   └── yapay-zeka-ile-kurulum.md
├── products/
│   ├── bilgi-servisleri.md
│   ├── finansman.md
│   ├── hesap-verisi.md
│   └── odeme.md
├── reference/
│   ├── changelog.md  # örnek değişiklik günlüğü
│   ├── endpoints.md  # 19 uç noktanın tam listesi
│   ├── errors.md  # örnek hata durumları
│   └── yanit-zarfi.md
├── openapi/
│   └── kuveytturk-ornek.openapi.yaml  # yalnız gerçek uç nokta yolları; şemalar örnek
└── examples/
    └── curl.md  # 19 uç nokta için cURL iskeleti
```

## Projeye ekleme

```bash
curl -L https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/docs/kuveytturk-api-ai-paketi.zip -o kt.zip && unzip kt.zip -d docs/kuveytturk
```

Paket proje kökünde `docs/kuveytturk/` klasörüne açılır. `https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/docs` doküman sitesinin yayın adresi için yer tutucudur.

## Claude Code'a şunu yapıştır

```text
docs/kuveytturk/AGENTS.md dosyasını oku ve oradaki kurallarla çalış.
Kuveyt Türk API entegrasyonunu test ortamında kur.
Uç nokta yollarını yalnız docs/kuveytturk/reference/endpoints.md ve
docs/kuveytturk/openapi/kuveytturk-ornek.openapi.yaml dosyalarından al;
listede olmayan bir uç nokta yazma.
Anahtarları ortam değişkeninden oku (KT_BASE_URL, KT_CLIENT_ID, KT_CLIENT_SECRET);
koda, log'a ya da sohbete yazma.
İade dahil her para hareketinden önce dur ve onayımı iste.
```

## Diğer araçlarda

| Araç | Nasıl tanıtılır |
|---|---|
| Claude Code | Proje kökündeki CLAUDE.md'ye `@docs/kuveytturk/AGENTS.md` satırını ekleyin. |
| Cursor | `.cursor/rules` altına bir kural: “Kuveyt Türk işlerinde önce docs/kuveytturk/AGENTS.md dosyasını oku.” |
| Codex | Kökteki AGENTS.md'ye aynı yönlendirmeyi ekleyin. |
| ChatGPT | Zip'i sohbete yükleyin ve AGENTS.md'den başlamasını isteyin. |

## Güncellik ve doğrulama

Her .md dosyası YAML başlığında `api_version` ve `last_updated` taşır. `manifest.json` içindeki sha256 değerleriyle dosyaların değişmediğini doğrulayabilirsiniz.

```bash
shasum -a 256 docs/kuveytturk/guides/hizli-baslangic.md
```

## Tek sayfa yeterliyse

Her sayfanın sağ üstündeki **Sayfayı kopyala** menüsü o sayfayı Markdown olarak kopyalar ya da Claude ve ChatGPT'de açar. Tüm sayfaların listesi [llms.txt](llms.txt) dosyasında.
