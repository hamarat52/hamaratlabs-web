---
title: "Ortamlar: test ve canlı"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: ortamlar.html
summary: "Test ve canlı ortamın kimlik sunucusu ve API ağ geçidi adresleri, {BASE_URL} kullanımı ve iki ortam arasındaki farklar."
---
# Ortamlar: test ve canlı

Geliştirmeyi test ortamında yapın. Canlı adresler, canlıya geçiş talebiniz onaylandıktan sonra kullanılır.

## Adresler

| Ortam | Kimlik sunucusu (token) | API ağ geçidi | Ne zaman |
|---|---|---|---|
| Test | `prep-identity.kuveytturk.com.tr` | `prep-gateway.kuveytturk.com.tr` | Varsayılan |
| Canlı | `identity.kuveytturk.com.tr` | `gateway.kuveytturk.com.tr` | Canlıya geçiş onayından sonra |

Kaynak: API Market “Nasıl başlarım” sayfası. Yayından önce canlı dokümanla yeniden doğrulanmalı.

## {BASE_URL} kullanımı

Kod örneklerinde ağ geçidi adresi `{BASE_URL}` yer tutucusuyla yazılır. Adresi ortam değişkeninde tutun; kodu değiştirmeden ortam değiştirin.

```bash
# Test (varsayılan)
export KT_BASE_URL="https://prep-gateway.kuveytturk.com.tr"

# Canlı: yalnız canlıya geçiş onayından sonra
# export KT_BASE_URL="https://gateway.kuveytturk.com.tr"
```

## Test ve canlı arasındaki farklar

| Konu | Test | Canlı |
|---|---|---|
| Anahtarlar | Test uygulamanızın client ID ve secret'ı | Onaydan sonra verilen canlı anahtarlar |
| Müşteri | Test müşterileri (`GET /v1/data/testcustomers`) | Gerçek müşteri, yalnız izinle |
| Para hareketi | Gerçek para hareketi beklenmez (doğrulanacak) | Gerçek; her adımda insan onayı önerilir |

## Önerilen kural

Ortamı tek bir değişkenle seçin ve varsayılanı test yapın. Yapay zekâ araçlarına yalnız test anahtarı verin.
