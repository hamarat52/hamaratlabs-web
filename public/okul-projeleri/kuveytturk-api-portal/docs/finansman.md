---
title: "Finansman"
product: finansman
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: finansman.html
summary: "Sepette taksitli alışveriş finansmanı: GET /v1/loans, finansman ayrıntısı ve taksit planı; portaldaki E-commerce finansman servis adları."
---
# Finansman

Sepette taksitli alışveriş finansmanı: finansman projelerini listeleyin, ayrıntısını ve taksit planını okuyun.

## Portaldaki finansman servisleri

- E-commerce Pre-Approved Monthly Payments
- E-commerce Lendings
- E-commerce Get Lending Information

Bu adlar portalın Financing sayfasından. Bu servislerin uç nokta yolları Swagger'da görünmediği için aşağıda yalnız Swagger'daki loans uç noktaları var. Genel finansman verisi için [`GET /v1/data/loans`](bilgi-servisleri.md#data-loans).

## Finansmanları listeleyin

`GET /v1/loans`

Finansman projelerini listeler. Ayrıntı ve taksit planı için dönen proje numarasını kullanın.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/loans" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/loans";

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
    f"{BASE_URL}/v1/loans",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/loans");
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

## Finansman ayrıntısı

`GET /v1/loans/{projectNumber}/info`

Tek bir finansman projesinin ayrıntısını döndürür.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `projectNumber` | yol | string | Finansman proje numarası (`GET /v1/loans` yanıtından). |

**cURL**

```bash
curl "{BASE_URL}/v1/loans/{projectNumber}/info" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/loans/{projectNumber}/info".replace("{projectNumber}", projectNumber);

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
    f"{BASE_URL}/v1/loans/{projectNumber}/info",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v1/loans/{projectNumber}/info");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": { /* alanlar Swagger'daki yanıt şemasında */ },
  "success": true,
  "results": []
}
```

## Taksit planı

`GET /v1/loans/{projectNumber}/installments`

Finansmanın taksit planını döndürür; yanıt modeli `DataGetLoansInstallmentsObject`.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `projectNumber` | yol | string | Finansman proje numarası (`GET /v1/loans` yanıtından). |

**cURL**

```bash
curl "{BASE_URL}/v1/loans/{projectNumber}/installments" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/loans/{projectNumber}/installments".replace("{projectNumber}", projectNumber);

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
    f"{BASE_URL}/v1/loans/{projectNumber}/installments",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v1/loans/{projectNumber}/installments");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": [ /* DataGetLoansInstallmentsObject */ ],
  "success": true,
  "results": []
}
```
