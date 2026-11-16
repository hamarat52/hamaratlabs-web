---
title: "Yanıt zarfı"
product: referans
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: yanit-zarfi.html
summary: "Her yanıtın ortak zarfı: value (veri), success (sonuç) ve results (mesajlar). Başarılı ve başarısız örnekler, okuma kodu."
---
# Yanıt zarfı

Her yanıt aynı zarfla gelir: veri `value` içinde, sonuç `success` alanında, mesajlar `results` dizisinde.

## Alanlar

| Alan | Tür | Açıklama |
|---|---|---|
| `value` | nesne ya da dizi | Uç noktaya göre değişen veri; şeması Swagger'da (ör. `DataRates`). |
| `success` | boolean | İşlem başarılı mı. |
| `results` | dizi | Mesajlar (uyarı, hata). İç alanları Swagger'da. |

## Örnekler

```json
{
  "value": [ /* DataRatesObject */ ],
  "success": true,
  "results": []
}
```

```json
{
  "value": null,
  "success": false,
  "results": [ /* mesaj nesneleri: alanlar Swagger'da */ ]
}
```

## Yanıtı okuma

**Node.js**

```js
const { value, success, results } = await res.json();
if (!success) {
  // results içindeki mesajları kişisel veri olmadan log'a yazın
  throw new Error("Kuveyt Türk isteği başarısız");
}
```

**Python**

```python
body = r.json()
if not body["success"]:
    # results içindeki mesajları kişisel veri olmadan log'a yazın
    raise RuntimeError("Kuveyt Türk isteği başarısız")
```

HTTP durum kodu ile `success` alanının birlikte nasıl değerlendirileceği doğrulanacak. Hata durumları: [Hata kodları](hata-kodlari.md)
