---
title: "Hata kodları"
product: referans
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: hata-kodlari.html
summary: "Örnek hata durumları ve çözümleri: 400, 401, imza hatası, 403, 404, 429 (rate limit {değer}), 5xx; ödeme çağrılarında güvenli yeniden deneme."
---
# Hata kodları (Örnek)

Sık karşılaşılan hata durumları ve ne yapmanız gerektiği. Bu sayfadaki kodlar ve açıklamalar örnektir.

> **Örnek:** Gerçek hata kodu listesi Swagger ve portal dokümanından alınacak. Burada HTTP durum kodları genel anlamlarıyla, Kuveyt Türk'e özgü kodlar `{kod}`, sınır değerleri `{değer}` yer tutucusuyla yazıldı.

## Durumlar

| HTTP | Durum (örnek) | Ne yapmalı |
|---|---|---|
| 400 | İstek gövdesi ya da parametre şemaya uymuyor | Gövdeyi Swagger şemasıyla karşılaştırın. |
| 401 | Token yok, geçersiz ya da süresi dolmuş (token 1 saat geçerli) | Yeni token alın. |
| `{kod}` | İmza doğrulanamadı | İmzalanan metni kontrol edin: [İstek imzalama](istek-imzalama.md) |
| 403 | Uygulamanın kapsamı bu uç noktayı içermiyor | Selected Scope seçimini kontrol edin. |
| 404 | Yol ya da `{suffix}`, `{projectNumber}` bulunamadı | Yolu [Uç noktalar](uc-noktalar.md) listesiyle karşılaştırın. |
| 429 | İstek sınırı aşıldı: `{değer}` istek / `{süre}` | Bekleyip artan aralıklarla yeniden deneyin. |
| 500, 503 | Sunucu tarafı hata | Okuma isteklerini yeniden deneyin; ödeme çağrılarında önce sorgulayın. |

## Güvenli yeniden deneme

- GET istekleri yeniden denenebilir.
- `POST /v1/vpos/digitalPaymentGetToken` ve `POST /v1/vpos/digitalPaymentDoRefund` çağrılarını kör yeniden denemeyin; önce `POST /v1/vpos/digitalPaymentQuery` ile durumu kontrol edin.
- Hata yanıtlarını log'a yazarken kişisel veriyi çıkarın.

Zarfın yapısı: [Yanıt zarfı](yanit-zarfi.md)
