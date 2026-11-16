---
title: "Yapay zekâ ile kurulum"
product: ai
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: yapay-zeka-ile-kurulum.html
summary: "Kuveyt Türk'ü Claude Code, Cursor, Codex ya da ChatGPT ile test ortamında kurma talimatı (konsept). Para hareketinden önce insan onayı."
---
# Yapay zekâ ile kurulum (Konsept)

Kuveyt Türk'ü Claude Code, Cursor, Codex ya da ChatGPT ile test ortamında kurun. Asistan para hareketinden önce size sorar.

> **Konsept:** Bu sayfadaki MCP sunucusu önerilen bir özelliktir; Kuveyt Türk'te bugün yapay zekâ ya da MCP desteği yoktur. Paket adı `{KT_MCP_PAKETI}` yer tutucudur. AI paketi (.zip) ise bu sitede gerçekten indirilebilir.

## İki yol

- [AI paketiyle](ai-paketi.md): Dokümanları projenize açın; ajan AGENTS.md'den başlasın. Sunucu gerekmez. (Bugün indirilebilir)
- [MCP sunucusuyla](mcp-araclari.md): Asistan uç noktaları araç olarak çağırır; izinler baştan belli. (Konsept)

## Kurulum talimatı

Aracınızı seçin, talimatı kopyalayıp yapıştırın.

**1) MCP sunucusunu ekleyin (paket adı konsept)**

```bash
# Claude Code
claude mcp add kt-mcp -e KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}
# Codex
codex mcp add kt-mcp --env KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}
```

Cursor için `.cursor/mcp.json`:

```json
{ "mcpServers": { "kt-mcp": {
    "command": "npx", "args": ["-y", "{KT_MCP_PAKETI}"],
    "env": { "KT_ENV": "sandbox" } } } }
```

**2) Bu talimatı yapıştırın**

```text
Kuveyt Türk API Market test ortamında kurulum yapmama yardım et.

Ortam
- API ağ geçidi: https://prep-gateway.kuveytturk.com.tr
- Kimlik sunucusu: https://prep-identity.kuveytturk.com.tr
- Yalnız test ortamında çalış; canlı anahtar isteme.

Adımlar
1. Test müşterilerini listele: GET /v1/data/testcustomers
2. Bağlantıyı doğrula: GET /v1/fx/rates
3. Test hesabını oku: GET /v2/accounts/{suffix}
   Hareketleri listele: GET /v3/accounts/{suffix}/transactions
4. Ödeme akışını hazırla: POST /v1/vpos/digitalPaymentGetToken
   Sonucu sorgula: POST /v1/vpos/digitalPaymentQuery

Kurallar
- Her isteği Signature başlığıyla imzala (RSA-SHA256). Özel anahtarı dosyaya ya da sohbete yazma.
- İadeden (POST /v1/vpos/digitalPaymentDoRefund) ve her para hareketinden önce dur, onayımı iste.
- T.C. kimlik numarasını ve kart bilgisini loglara yazma.
- Bu kuralları CLAUDE.md dosyasına kaydet.   (Cursor: .cursor/rules, Codex: AGENTS.md)
```

## Asistanın sınırları

| Seviye | Kapsam | Uç noktalar | Varsayılan |
|---|---|---|---|
| Okuma | Kur, şube, test müşterileri, izinli test hesabı | `GET /v1/fx/rates`, `GET /v1/data/testcustomers`, `GET /v3/accounts/{suffix}/transactions` | Açık |
| Test ortamında yazma | Test ödeme token'ı ve sorgusu | `POST /v1/vpos/digitalPaymentGetToken`, `POST /v1/vpos/digitalPaymentQuery` | Siz açarsınız |
| Canlıda insan onayı | İade ve para hareketi | `POST /v1/vpos/digitalPaymentDoRefund` | Her seferinde onayınız |
