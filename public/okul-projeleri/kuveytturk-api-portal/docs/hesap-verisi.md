---
title: "Hesap verisi"
product: hesap
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: hesap-verisi.html
summary: "Müşteri izniyle (authorization code) hesap detayı, hesap hareketleri (v2 ve v3) ve dekont uç noktaları."
---
# Hesap verisi

Müşterinin izniyle hesap detayını, hareketlerini ve dekontlarını okuyun. Erişim yalnız müşterinin kendi girişi ve onayıyla açılır.

## İzin akışı

1. Uygulamanız müşteriyi Kuveyt Türk girişine yönlendirir.
2. Müşteri giriş yapar ve izni onaylar.
3. Müşteri uygulamadaki Redirection URI'ye bir kodla döner.
4. Uygulama kodu access token ile değiştirir (authorization code).
5. Token ile aşağıdaki uç noktaları çağırır.

Test ortamında müşteri yerine [test müşterileri](test-musterileri.md) kullanılır.

## Hesap detayı

`GET /v2/accounts/{suffix}`

Müşterinin izin verdiği hesabın detayını döndürür.

- Yetki: authorization code (müşterinin girişi ve onayı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `suffix` | yol | string | Hesap eki. Test ortamında test müşterisinin hesabı. |

**cURL**

```bash
curl "{BASE_URL}/v2/accounts/{suffix}" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v2/accounts/{suffix}".replace("{suffix}", suffix);

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
    f"{BASE_URL}/v2/accounts/{suffix}",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v2/accounts/{suffix}");
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

## Hesap hareketleri (v2)

`GET /v2/accounts/{suffix}/transactions`

Hesap hareketlerini listeler. Swagger'da v2 ve v3 iki sürüm de listeli.

- Yetki: authorization code (müşterinin girişi ve onayı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `suffix` | yol | string | Hesap eki. Test ortamında test müşterisinin hesabı. |

**cURL**

```bash
curl "{BASE_URL}/v2/accounts/{suffix}/transactions" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v2/accounts/{suffix}/transactions".replace("{suffix}", suffix);

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
    f"{BASE_URL}/v2/accounts/{suffix}/transactions",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v2/accounts/{suffix}/transactions");
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

## Hesap hareketleri (v3)

`GET /v3/accounts/{suffix}/transactions`

Hesap hareketlerini listeler; yanıt modeli `AccountActivities`. Yeni entegrasyonda hangi sürümün önerildiği doğrulanacak.

- Yetki: authorization code (müşterinin girişi ve onayı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `suffix` | yol | string | Hesap eki. Test ortamında test müşterisinin hesabı. |

**cURL**

```bash
curl "{BASE_URL}/v3/accounts/{suffix}/transactions" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v3/accounts/{suffix}/transactions".replace("{suffix}", suffix);

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
    f"{BASE_URL}/v3/accounts/{suffix}/transactions",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v3/accounts/{suffix}/transactions");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": [ /* AccountActivities */ ],
  "success": true,
  "results": []
}
```

## Dekont

`POST /v2/accounts/transactions/receipts`

Hesap hareketlerinin dekontunu döndürür. Gövde alanları Swagger'da.

- Yetki: authorization code (müşterinin girişi ve onayı)
- İstek gövdesi: Swagger'daki istek şeması
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl -X POST "{BASE_URL}/v2/accounts/transactions/receipts" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @istek.json  # gövde şeması Swagger'da
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v2/accounts/transactions/receipts";

const res = await fetch(BASE_URL + path, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Signature: signature, // istek-imzalama.md
    "Content-Type": "application/json",
  },
  body: JSON.stringify(istek), // gövde şeması Swagger'da
});
const { value, success, results } = await res.json();
```

**Python**

```python
import os
import requests

BASE_URL = os.environ["KT_BASE_URL"]  # {BASE_URL}

r = requests.post(
    f"{BASE_URL}/v2/accounts/transactions/receipts",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
    json=istek,  # gövde şeması Swagger'da
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Post, "/v2/accounts/transactions/receipts");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
req.Content = new StringContent(istekJson, Encoding.UTF8, "application/json"); // gövde şeması Swagger'da
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
