---
title: "İstek imzalama"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: istek-imzalama.html
summary: "Signature başlığı: access token ile sorgu dizesinin (GET) ya da gövdenin (POST) RSA-SHA256 imzası, base64. Node.js, Python, C# ve openssl örnekleri."
---
# İstek imzalama

Her istek `Signature` başlığıyla imzalanır. İmza, access token ile sorgu dizesinin (GET) ya da gövdenin (POST) RSA-SHA256 imzasının base64 halidir.

> **Örnek:** İmza kuralı portal dokümanından alındı; yayından önce canlı dokümanla yeniden doğrulanacak.

## İmzalanan metin

| Metot | İmzalanan metin |
|---|---|
| GET | access token + sorgu dizesi |
| POST | access token + istek gövdesi (gönderilen JSON metni, birebir) |

Algoritma RSA-SHA256, anahtar 2048 bit RSA özel anahtarınız, çıktı base64. Kuveyt Türk İmza Aracı aynı hesabı masaüstünde yapar; kendi kodunuzun çıktısını onunla karşılaştırın.

## Kod örnekleri

**Node.js**

```js
import { createSign } from "node:crypto";

// GET: accessToken + queryString, POST: accessToken + gövde
const signer = createSign("RSA-SHA256");
signer.update(accessToken + queryString);
const signature = signer.sign(privateKey, "base64");
```

**Python**

```python
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

with open("private.pem", "rb") as f:
    key = serialization.load_pem_private_key(f.read(), password=None)

metin = access_token + query_string  # POST: access_token + govde
imza = key.sign(metin.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256())
signature = base64.b64encode(imza).decode()
```

**C#**

```csharp
using System.Security.Cryptography;
using System.Text;

using var rsa = RSA.Create();
rsa.ImportFromPem(File.ReadAllText("private.pem"));
var metin = accessToken + queryString; // POST: accessToken + gövde
var imza = rsa.SignData(Encoding.UTF8.GetBytes(metin), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
var signature = Convert.ToBase64String(imza);
```

**Terminal**

```bash
printf '%s' "$KT_ACCESS_TOKEN$QUERY" \
  | openssl dgst -sha256 -sign private.pem \
  | base64 | tr -d '\n'
```

## Sık yapılan hatalar

- Gövdeyi imzaladıktan sonra yeniden biçimlendirmek (boşluk, alan sırası). İmzaladığınız metni birebir gönderin.
- Farklı karakter kodlaması. UTF-8 kullanın.
- Sorgu dizesinin başındaki `?` işaretini dahil edip etmemek. Kural doğrulanacak.
- Süresi dolmuş token ile imzalamak. Token bir saat geçerlidir.

## Test vektörleri

> **Örnek:** Önerilen: gerçek dokümanda girdi, beklenen ara metin ve beklenen base64 çıktıdan oluşan test vektörleri yayımlanmalı. Bu taslakta gerçek anahtar olmadığı için vektör yok.
