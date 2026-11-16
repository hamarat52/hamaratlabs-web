---
title: "Uygulama ve anahtarlar"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: uygulama-ve-anahtarlar.html
summary: "Uygulama oluşturma (Selected Scope, Redirection URI, 2048 bit RSA açık anahtar), client ID ve secret, access token akışları ve anahtar saklama kuralları."
---
# Uygulama ve anahtarlar

Her entegrasyon bir uygulamadır. Uygulama; kapsamı, yönlendirme adresini, açık anahtarı ve test ortamı kimlik bilgilerini bir arada tutar.

## Uygulama oluşturma

1. Hesabınızda Uygulamalar → Uygulama ekle.
2. **Selected Scope** alanında ürün kategorisini seçin.
3. Yönlendirme adresinizi (Redirection URI) yazın. Hesap verisi akışında müşteri onaydan sonra buraya döner.
4. 2048 bit RSA açık anahtarınızı yapıştırın.

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.crt
```

## Client ID ve client secret

Uygulama kaydedilince test ortamı için bir client ID ve client secret oluşur. Bu taslaktaki akışta secret yalnız oluşturulduğunda gösterilir; kaybederseniz yenisini üretirsiniz. Dokümanlarda ve örneklerde maskeli yazılır: `kt_sandbox_••••`.

> **Dikkat:** Secret'ı ve özel imza anahtarını kod deposuna, sohbet araçlarına ya da log'a yazmayın. Ortam değişkeni ya da bir gizli anahtar kasası kullanın.

## Access token

| Akış | Ne için | Kim onaylar |
|---|---|---|
| client credentials | Kur, şube gibi bilgi servisleri | Uygulamanız |
| authorization code | Hesap verisi | Müşteri, kendi girişiyle |

Token bir saat geçerlidir. Token adresi burada `{TOKEN_URL}` olarak yazıldı; doğru adres ve parametreler portalın Postman şablonunda.

```bash
# Örnek: standart OAuth 2.0 client credentials isteği.
# Adres ve kapsam adı Postman şablonundan alınır.
curl -X POST "{TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$KT_CLIENT_ID" \
  -d "client_secret=$KT_CLIENT_SECRET" \
  -d "scope={kapsam}"
```

## Anahtarları saklama

- Test ve canlı anahtarları ayrı değişkenlerde tutun.
- Özel imza anahtarını yalnız imzayı atan sunucuda bulundurun.
- Yapay zekâ araçlarına yalnız test anahtarı verin; özel imza anahtarını hiç vermeyin.
