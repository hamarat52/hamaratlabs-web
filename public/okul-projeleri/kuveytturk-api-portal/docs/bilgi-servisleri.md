---
title: "Bilgi servisleri"
product: bilgi
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: bilgi-servisleri.html
summary: "Herkese açık veriler: döviz kurları (GET /v1/fx/rates), döviz cinsleri, şubeler, bankalar ve şubeleri, ATM'ler, finansman verisi. Client credentials."
---
# Bilgi servisleri

Kur, döviz cinsi, şube, banka, ATM ve finansman verisi gibi herkese açık veriler. Müşteri izni gerekmez; client credentials ile çalışır.

## Döviz kurları

`GET /v1/fx/rates`

Döviz kurlarını döndürür; yanıt modeli `DataRates`. Müşteri verisine dokunmadığı için ilk çağrı olarak önerilir.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/fx/rates" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/fx/rates";

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
    f"{BASE_URL}/v1/fx/rates",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/fx/rates");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": [ /* DataRatesObject */ ],
  "success": true,
  "results": []
}
```

## Döviz cinsleri

`GET /v1/data/fecs`

Döviz cinsi (FEC) listesini döndürür. Açıklama yol adından; alanlar Swagger'da.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/fecs" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/fecs";

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
    f"{BASE_URL}/v1/data/fecs",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/fecs");
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

## Şubeler

`GET /v1/data/branches`

Kuveyt Türk şubelerini listeler.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/branches" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/branches";

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
    f"{BASE_URL}/v1/data/branches",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/branches");
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

## Bankalar

`GET /v1/data/banks`

Banka listesini döndürür. Şube listesi için dönen banka kimliğini kullanın.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/banks" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/banks";

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
    f"{BASE_URL}/v1/data/banks",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/banks");
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

## Bir bankanın şubeleri

`GET /v1/data/banks/{bankId}/branches`

Seçilen bankanın şubelerini listeler.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

| Parametre | Yer | Tür | Açıklama |
|---|---|---|---|
| `bankId` | yol | string | Banka kimliği (`GET /v1/data/banks` yanıtından). |

**cURL**

```bash
curl "{BASE_URL}/v1/data/banks/{bankId}/branches" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/banks/{bankId}/branches".replace("{bankId}", bankId);

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
    f"{BASE_URL}/v1/data/banks/{bankId}/branches",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, $"/v1/data/banks/{bankId}/branches");
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

## ATM'ler

`GET /v1/data/atms`

ATM listesini döndürür.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/atms" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/atms";

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
    f"{BASE_URL}/v1/data/atms",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/atms");
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

## Finansman verisi

`GET /v1/data/loans`

Swagger'daki adıyla data/loans. Dönen içerik Swagger'da; bu taslakta yorumlanmadı.

- Yetki: client credentials (uygulamanızın kendi token'ı)
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl "{BASE_URL}/v1/data/loans" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE"
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/data/loans";

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
    f"{BASE_URL}/v1/data/loans",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Get, "/v1/data/loans");
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
