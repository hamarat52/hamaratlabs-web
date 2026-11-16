---
title: "Test müşterileri"
product: test
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: test-musterileri.html
summary: "Test ortamında gerçek müşteri yerine kullanılan test müşterileri: GET /v1/data/testcustomers ile listeleme ve hesap verisi uç noktalarıyla deneme."
---
# Test müşterileri

Test ortamında gerçek müşteri yerine test müşterileriyle çalışırsınız. Listeyi tek bir çağrıyla alın.

> **Örnek:** Dönen alanlar Swagger'daki yanıt şemasında; bu taslakta alan adı uydurulmadı. Örnek değerler `{test_musteri_no}` gibi yer tutucularla yazıldı.

## Test müşterilerini listeleyin

`GET /v1/data/testcustomers`

Test ortamındaki test müşterilerini döndürür. Hesap verisi uç noktalarını bu müşterilerle denersiniz.

- Yetki: test ortamı; bilgi servisleri gibi client credentials (doğrulanacak)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/testcustomers" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/testcustomers";

const res = await fetch(BASE_URL + path, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Signature: signature, // istek-imzalama.md
  },
});
const { value, success, results } = await res.json();
```

**Python**

```python
import os
import requests

BASE_URL = os.environ["KT_BASE_URL"]  # {BASE_URL}

r = requests.get(
    f"{BASE_URL}/v1/data/testcustomers",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/testcustomers");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": [ /* alanlar Swagger'daki yanıt şemasında */ ],
  "success": true,
  "results": []
}
```

## Test müşterisiyle akış

1. Listeyi alın: `GET /v1/data/testcustomers`
2. Bir test müşterisi seçin (`{test_musteri_no}`).
3. Hesap verisi uç noktalarında test hesabının ekini `{suffix}` olarak kullanın: [Hesap verisi](hesap-verisi.md)
4. Authorization code akışında müşteri girişi test müşterisiyle yapılır (ayrıntı portal dokümanında, doğrulanacak).
