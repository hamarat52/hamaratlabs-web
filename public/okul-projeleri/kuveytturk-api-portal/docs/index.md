---
title: "Genel bakış"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: index.html
summary: "Kuveyt Türk API Market dokümanlarına giriş: test ortamında ilk istek, kurulum sihirbazı, dört ürün alanı ve yapay zekâ araçları için tek zip."
---
# Genel bakış

Ödeme, finansman, hesap verisi ve bilgi servislerini uygulamanıza bağlayın. Geliştirme test ortamında başlar; canlı ortam, canlıya geçiş onayıyla açılır.

- [AI paketi (.zip)](ai-paketi.md): Tüm dokümanlar Markdown olarak tek dosyada. Claude Code, Cursor ya da Codex projenize açın.
- [Hızlı başlangıç](hizli-baslangic.md): Hesaptan ilk çağrıya, test ortamında altı adım. (GET /v1/fx/rates)
- [Kurulum sihirbazı](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/kurulum/): Uygulama, test anahtarı ve ilk istek, ileri ileri. (Örnek akış)

## Ürünler

Swagger'da uç noktası yayımlanan dört alan bu dokümanda ayrıntılı anlatılır. Toplam 19 uç nokta; listenin tamamı [Uç noktalar](uc-noktalar.md) sayfasında.

- [Ödeme](odeme.md): Sanal POS ile ödeme başlatma, sorgulama, belge gönderme ve iade. (4 uç nokta)
- [Finansman](finansman.md): Finansman projeleri, ayrıntı ve taksit planı. (3 uç nokta)
- [Hesap verisi](hesap-verisi.md): Müşterinin izniyle hesap detayı, hareketler ve dekont. (4 uç nokta)
- [Bilgi servisleri](bilgi-servisleri.md): Kur, döviz cinsi, şube, banka, ATM ve finansman verisi. (7 uç nokta)

## Nasıl çalışır

### 1. Hesap açın, uygulama oluşturun

Uygulama; kapsam, yönlendirme adresi ve açık anahtarınızı tutar. [Uygulama ve anahtarlar](uygulama-ve-anahtarlar.md)

### 2. Token alın, istekleri imzalayın

Test kimlik sunucusundan token alın; her isteği `Signature` başlığıyla imzalayın. [İstek imzalama](istek-imzalama.md)

### 3. Testler bitince canlıya geçin

Canlıya geçiş talebi onaylanınca aynı kod canlı adreslerle çalışır. [Canlıya geçiş](canliya-gecis.md)

## Yapay zekâ araçlarıyla

Her sayfanın sağ üstündeki **Sayfayı kopyala** menüsü sayfayı Markdown olarak verir ya da Claude ve ChatGPT'de açar. Tüm dokümanlar ise tek zip'te: AGENTS.md ile başlayan, konu konu ayrılmış Markdown dosyaları ve örnek OpenAPI şeması.

[AI paketini indir (.zip)](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/docs/kuveytturk-api-ai-paketi.zip)

## Portaldaki ürün grupları

API Market'te sekiz ürün grubu yer alır: Account Management, Money Transfer, Cash Management, Payment Systems, Financing, Treasury, TCMB Products ve Third Party Provider (TPP). Bu taslakta yalnız uç noktası Swagger'da görünen servisler anlatılır; diğer gruplar için portaldaki dokümanlara bakın.
