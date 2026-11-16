---
title: "Kurulum adımları"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: kurulum-adimlari.html
summary: "Kurulum sihirbazının doküman karşılığı: hesap, uygulama, test ortamı anahtarları ve ilk istek. Her adım sihirbazda da yapılabilir."
---
# Kurulum adımları

Kurulum sihirbazının doküman karşılığı: hesap, uygulama, test anahtarları ve ilk istek. Aynı adımları sihirbazda ileri ileri yapabilirsiniz.

> **Örnek:** Sihirbaz örnek bir akıştır: gerçek hesap açılmaz, ağ isteği gönderilmez, girdiğiniz bilgiler yalnız bu tarayıcıda (localStorage) tutulur.

[Sihirbazı aç](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/kurulum/)

## 1. Hesap

Giriş yaptıysanız sihirbaz hesabınızı tanır ve devam eder. Yapmadıysanız iki yol var: [hesap açın](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/hesap/kayit.html) ya da örnek hesapla devam edin. Uygulamalar ve anahtarlar hesabın altında durur.

Ekran (örnek): Giriş yapılmışsa hesap bilgisi gösterilir ve doğrudan devam edilir; yapılmamışsa iki seçenek: önce hesap açmak ya da örnek hesapla devam etmek.

## 2. Uygulama oluşturun

Uygulamaya bir ad ve kısa açıklama verin, kullanım amacını seçin: Ödeme, Finansman, Hesap verisi, Bilgi servisleri. Birden çok seçebilirsiniz; seçim portaldaki **Selected Scope** alanına karşılık gelir ve sonraki adımdaki örnek isteği belirler.

Ekran (örnek): Uygulama adı, açıklama ve kullanım amacı (Ödeme, Finansman, Hesap verisi, Bilgi servisleri; birden çok seçilebilir).

## 3. Test anahtarlarını alın

Test ortamı için client ID ve client secret oluşur. Secret yalnız bu ekranda bir kez gösterilir; güvenli bir yere kaydedin. Sihirbaz ayrıca örnek bir test müşterisi gösterir; gerçek liste `GET /v1/data/testcustomers` ile gelir. Ayrıntı: [Uygulama ve anahtarlar](uygulama-ve-anahtarlar.md), [Test müşterileri](test-musterileri.md)

Ekran (örnek): Client ID ve client secret maskeli gösterilir; göster/gizle ve kopyala düğmeleri vardır. Secret bir daha gösterilmez.

## 4. İlk isteği gönderin

Seçtiğiniz ürüne göre gerçek bir uç nokta ile cURL ve Node.js örneği hazırlanır. Sihirbazdaki gönder düğmesi ağ isteği yapmaz; örnek bir 200 yanıtı gösterir.

Ekran (örnek): Seçilen ürüne göre gerçek bir uç nokta ile cURL ve Node.js örneği; “İsteği gönder (örnek)” sahte bir 200 yanıtı gösterir.

| Ürün | İlk istek | Neden |
|---|---|---|
| Ödeme | `POST /v1/vpos/digitalPaymentGetToken` | Test ödemesi başlatır; para hareketi yok. |
| Finansman | `GET /v1/loans` | Yalnız okur. |
| Hesap verisi | `GET /v2/accounts/{suffix}` | Test müşterisinin hesabını okur. |
| Bilgi servisleri | `GET /v1/fx/rates` | Müşteri verisine dokunmaz. |

## Sihirbaz bitince

- **Kurulum promptunu kopyala:** seçtiğiniz ürünlerin uç noktalarıyla hazırlanmış talimat. [Yapay zekâ ile kurulum](yapay-zeka-ile-kurulum.md)
- **AI paketini indir (.zip):** dokümanların tamamı Markdown olarak. [AI paketi](ai-paketi.md)
- **Panel:** uygulamalarınız, maskeli anahtarlar ve canlıya geçiş durumu. [Örnek panel](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/hesap/panel.html)
