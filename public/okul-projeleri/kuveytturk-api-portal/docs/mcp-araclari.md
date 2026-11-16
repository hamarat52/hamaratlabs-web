---
title: "MCP araçları"
product: ai
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: mcp-araclari.html
summary: "Önerilen Kuveyt Türk MCP sunucusunun araçları (konsept): her araç API Market'te var olan bir uç noktaya karşılık gelir; izin seviyeleri."
---
# MCP araçları (Konsept)

Önerilen MCP sunucusunun araçları. Her araç API Market'te bugün var olan bir uç noktaya karşılık gelir.

> **Konsept:** Araç adları ve MCP paketi öneridir (`{KT_MCP_PAKETI}`). Uç noktalar API Market Swagger'ından.

## Kurulum

**Terminal**

```bash
# Claude Code
claude mcp add kt-mcp -e KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}

# Codex
codex mcp add kt-mcp --env KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}
```

**JSON**

```json
// .cursor/mcp.json
{ "mcpServers": { "kt-mcp": {
    "command": "npx", "args": ["-y", "{KT_MCP_PAKETI}"],
    "env": { "KT_ENV": "sandbox" } } } }
```

## Araçlar

| Araç | Ne yapar | Uç nokta | İzin |
|---|---|---|---|
| `kt_get_fx_rates` | Döviz kurları | `GET /v1/fx/rates` | Okuma |
| `kt_list_branches` | Şubeler | `GET /v1/data/branches` | Okuma |
| `kt_get_test_customers` | Test müşterileri | `GET /v1/data/testcustomers` | Okuma |
| `kt_get_account` | Hesap detayı | `GET /v2/accounts/{suffix}` | Okuma |
| `kt_get_transactions` | Hesap hareketleri | `GET /v3/accounts/{suffix}/transactions` | Okuma |
| `kt_get_installments` | Finansman taksit planı | `GET /v1/loans/{projectNumber}/installments` | Okuma |
| `kt_vpos_create_token` | Test ödemesi başlatır | `POST /v1/vpos/digitalPaymentGetToken` | Test yazma |
| `kt_vpos_query_payment` | Ödemeyi sorgular | `POST /v1/vpos/digitalPaymentQuery` | Test yazma |
| `kt_vpos_refund` | İade | `POST /v1/vpos/digitalPaymentDoRefund` | Onayınız |

## Güvenlik ilkeleri

- Varsayılan ortam test; `KT_ENV=sandbox` prep-gateway'e kilitlidir ve canlı anahtar eklenemez.
- İade aracı her çağrıda bir kişinin onayını ister.
- Her araç çağrısı kayda geçer.
- Özel imza anahtarı asistana verilmez; imzayı sunucu atar.
