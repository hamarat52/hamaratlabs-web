---
title: "Uç noktalar"
product: referans
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: uc-noktalar.html
summary: "API Market Swagger'ında yayımlanan 19 uç noktanın tam listesi, metot ve ürün alanıyla. Bu listede olmayan yol bu dokümanda yoktur."
---
# Uç noktalar

API Market Swagger'ında yayımlanan 19 uç nokta. Bu listede olmayan bir yol bu dokümanda yoktur.

> **Not:** Makine tarafından okunur sürüm AI paketinde: `openapi/kuveytturk-ornek.openapi.yaml` (yalnız bu yollar; şemalar örnek).

## Ödeme

| Uç nokta | Ne yapar | Sayfa |
|---|---|---|
| POST `/v1/vpos/digitalPaymentGetToken` | Ödeme başlatın | [Ayrıntı](odeme.md#vpos-token) |
| POST `/v1/vpos/digitalPaymentQuery` | Ödemeyi sorgulayın | [Ayrıntı](odeme.md#vpos-query) |
| POST `/v1/vpos/sendDocument` | Belge gönderin | [Ayrıntı](odeme.md#vpos-doc) |
| POST `/v1/vpos/digitalPaymentDoRefund` | İade edin | [Ayrıntı](odeme.md#vpos-refund) |

## Finansman

| Uç nokta | Ne yapar | Sayfa |
|---|---|---|
| GET `/v1/loans` | Finansmanları listeleyin | [Ayrıntı](finansman.md#loans) |
| GET `/v1/loans/{projectNumber}/info` | Finansman ayrıntısı | [Ayrıntı](finansman.md#loans-info) |
| GET `/v1/loans/{projectNumber}/installments` | Taksit planı | [Ayrıntı](finansman.md#loans-inst) |

## Hesap verisi

| Uç nokta | Ne yapar | Sayfa |
|---|---|---|
| GET `/v2/accounts/{suffix}` | Hesap detayı | [Ayrıntı](hesap-verisi.md#account) |
| GET `/v2/accounts/{suffix}/transactions` | Hesap hareketleri (v2) | [Ayrıntı](hesap-verisi.md#tx-v2) |
| GET `/v3/accounts/{suffix}/transactions` | Hesap hareketleri (v3) | [Ayrıntı](hesap-verisi.md#tx-v3) |
| POST `/v2/accounts/transactions/receipts` | Dekont | [Ayrıntı](hesap-verisi.md#receipts) |

## Bilgi servisleri

| Uç nokta | Ne yapar | Sayfa |
|---|---|---|
| GET `/v1/fx/rates` | Döviz kurları | [Ayrıntı](bilgi-servisleri.md#fx-rates) |
| GET `/v1/data/fecs` | Döviz cinsleri | [Ayrıntı](bilgi-servisleri.md#data-fecs) |
| GET `/v1/data/branches` | Şubeler | [Ayrıntı](bilgi-servisleri.md#data-branches) |
| GET `/v1/data/banks` | Bankalar | [Ayrıntı](bilgi-servisleri.md#data-banks) |
| GET `/v1/data/banks/{bankId}/branches` | Bir bankanın şubeleri | [Ayrıntı](bilgi-servisleri.md#data-bank-branches) |
| GET `/v1/data/atms` | ATM'ler | [Ayrıntı](bilgi-servisleri.md#data-atms) |
| GET `/v1/data/loans` | Finansman verisi | [Ayrıntı](bilgi-servisleri.md#data-loans) |

## Test

| Uç nokta | Ne yapar | Sayfa |
|---|---|---|
| GET `/v1/data/testcustomers` | Test müşterilerini listeleyin | [Ayrıntı](test-musterileri.md#testcustomers) |
