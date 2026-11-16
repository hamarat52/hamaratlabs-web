---
title: "Hızlı başlangıç"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: hizli-baslangic.html
summary: "Hesaptan ilk çağrıya altı adım: hesap, RSA anahtar çifti, uygulama, access token, imza ve GET /v1/fx/rates ile ilk istek."
---
# Hızlı başlangıç

Hesaptan ilk çağrıya, test ortamında altı adım. İlk çağrı döviz kurlarını okur; müşteri verisine dokunmaz.

> **Not:** Formlarla tek tek uğraşmak istemiyorsanız aynı adımları [kurulum sihirbazında](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/kurulum/) ileri ileri yapabilirsiniz (örnek akış).

## Altı adım

### 1. Hesap açın

API Market'e kaydolun ve giriş yapın. Uygulamalarınız ve anahtarlarınız bu hesabın altında durur. [Örnek kayıt akışı](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/hesap/kayit.html)

### 2. Anahtar çifti üretin

2048 bit RSA çifti. Açık anahtarı yüklersiniz; özel anahtar sizde kalır ve her isteği imzalar.

```bash
# 2048 bit RSA
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.crt
```

### 3. Uygulama ekleyin

Uygulamalar → Uygulama ekle. **Selected Scope** alanında ürün kategorisini seçin, yönlendirme adresinizi (Redirection URI) yazın ve açık anahtarı yapıştırın.

### 4. Access token alın

Seçtiğiniz API'nin Postman şablonunu test kimlik sunucusuyla kullanın. Kur ve şube gibi bilgi servisleri client credentials ile çalışır; hesap verisi müşterinin onayını ister (authorization code). Token bir saat geçerlidir.

### 5. İsteği imzalayın

`Signature` başlığı, access token ile sorgu dizesinin (GET) ya da gövdenin (POST) RSA-SHA256 imzasını base64 olarak taşır. Ayrıntı ve dört dilde kod: [İstek imzalama](istek-imzalama.md)

### 6. İlk çağrıyı yapın

`GET /v1/fx/rates` döviz kurlarını döndürür. Her yanıt aynı zarfla gelir: veri `value` içinde, sonuç `success` alanında, mesajlar `results` dizisinde.

`GET /v1/fx/rates`

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

## Sonra

- [Ödeme](odeme.md): Sanal POS uç noktaları (4 uç nokta)
- [Yapay zekâ ile kurulum](yapay-zeka-ile-kurulum.md): Kurulumu bir yapay zekâ aracına yaptırın. (Konsept)
