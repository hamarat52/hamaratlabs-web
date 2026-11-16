---
title: "Ödeme"
product: odeme
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: odeme.html
summary: "Sanal POS (vpos) uç noktaları: ödeme başlatma (digitalPaymentGetToken), sorgulama, belge gönderme ve iade. İade öncesi insan onayı."
---
# Ödeme

Sanal POS ile ödeme başlatın, sonucunu sorgulayın, belge gönderin ve iade edin. Dört uç nokta, hepsi POST.

> **Dikkat:** İade ve her para hareketi geri alınamaz sonuç doğurabilir. Yapay zekâ aracıyla çalışıyorsanız bu çağrılardan önce bir kişinin onayını isteyin.

## Akış

1. `digitalPaymentGetToken` ile ödeme başlatılır.
2. Müşteri ödeme adımını tamamlar (yönlendirme ayrıntısı Swagger ve portal dokümanında).
3. `digitalPaymentQuery` ile sonuç sorgulanır.
4. Gerekirse `sendDocument` ile belge gönderilir.
5. İade `digitalPaymentDoRefund` ile, onaydan sonra yapılır.

## Ödeme başlatın

`POST /v1/vpos/digitalPaymentGetToken`

Sanal POS ödemesi için token alır. Ödeme akışının ilk adımıdır; gövde `PostDigitalPaymentGetTokenBody` modelindedir.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- İstek gövdesi: `PostDigitalPaymentGetTokenBody`
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl -X POST "{BASE_URL}/v1/vpos/digitalPaymentGetToken" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @istek.json  # PostDigitalPaymentGetTokenBody
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/vpos/digitalPaymentGetToken";

const res = await fetch(BASE_URL + path, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Signature: signature, // istek-imzalama.md
    "Content-Type": "application/json",
  },
  body: JSON.stringify(istek), // PostDigitalPaymentGetTokenBody
});
const { value, success, results } = await res.json();
```

**Python**

```python
import os
import requests

BASE_URL = os.environ["KT_BASE_URL"]  # {BASE_URL}

r = requests.post(
    f"{BASE_URL}/v1/vpos/digitalPaymentGetToken",
    headers={"Authorization": f"Bearer {access_token}",
             "Signature": signature},
    json=istek,  # PostDigitalPaymentGetTokenBody
)
body = r.json()  # value, success, results
```

**C#**

```csharp
using System.Net.Http.Headers;

var http = new HttpClient { BaseAddress = new Uri(baseUrl) }; // {BASE_URL}
var req = new HttpRequestMessage(HttpMethod.Post, "/v1/vpos/digitalPaymentGetToken");
req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
req.Headers.Add("Signature", signature);
req.Content = new StringContent(istekJson, Encoding.UTF8, "application/json"); // PostDigitalPaymentGetTokenBody
var res = await http.SendAsync(req);
var json = await res.Content.ReadAsStringAsync(); // value, success, results
```

Örnek yanıt (200):

```json
{
  "value": { /* PostDigitalPaymentGetTokenBodyResponse */ },
  "success": true,
  "results": []
}
```

## Ödemeyi sorgulayın

`POST /v1/vpos/digitalPaymentQuery`

Başlatılan ödemenin sonucunu sorgular. Bir ödeme ya da iade çağrısı yanıtsız kaldıysa yeniden denemeden önce bununla durumu kontrol edin.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- İstek gövdesi: Swagger'daki istek şeması
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl -X POST "{BASE_URL}/v1/vpos/digitalPaymentQuery" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @istek.json  # gövde şeması Swagger'da
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/vpos/digitalPaymentQuery";

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
    f"{BASE_URL}/v1/vpos/digitalPaymentQuery",
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
var req = new HttpRequestMessage(HttpMethod.Post, "/v1/vpos/digitalPaymentQuery");
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

## Belge gönderin

`POST /v1/vpos/sendDocument`

Ödemeyle ilgili belge gönderimi (Swagger'daki adıyla sendDocument). Gövde ve yanıt alanları Swagger'da; burada uydurulmadı.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- İstek gövdesi: Swagger'daki istek şeması
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

**cURL**

```bash
curl -X POST "{BASE_URL}/v1/vpos/sendDocument" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @istek.json  # gövde şeması Swagger'da
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/vpos/sendDocument";

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
    f"{BASE_URL}/v1/vpos/sendDocument",
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
var req = new HttpRequestMessage(HttpMethod.Post, "/v1/vpos/sendDocument");
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

## İade edin

`POST /v1/vpos/digitalPaymentDoRefund`

Bir ödemeyi iade eder. Para hareketi doğurur: kodunuzda ve yapay zekâ araçlarında bu çağrıdan önce bir kişinin onayını isteyin.

- Yetki: portaldaki Postman şablonundaki akış (bu taslakta doğrulanmadı)
- İstek gövdesi: Swagger'daki istek şeması
- Yanıt: `value`, `success`, `results` zarfı ([Yanıt zarfı](yanit-zarfi.md))

> **İnsan onayı:** bu çağrıyı otomatik akışta kişi onayı olmadan çalıştırmayın.

**cURL**

```bash
curl -X POST "{BASE_URL}/v1/vpos/digitalPaymentDoRefund" \
  -H "Authorization: Bearer $KT_ACCESS_TOKEN" \
  -H "Signature: $KT_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @istek.json  # gövde şeması Swagger'da
```

**Node.js**

```js
const BASE_URL = process.env.KT_BASE_URL; // {BASE_URL}
const path = "/v1/vpos/digitalPaymentDoRefund";

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
    f"{BASE_URL}/v1/vpos/digitalPaymentDoRefund",
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
var req = new HttpRequestMessage(HttpMethod.Post, "/v1/vpos/digitalPaymentDoRefund");
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
