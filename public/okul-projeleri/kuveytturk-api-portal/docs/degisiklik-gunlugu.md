---
title: "Değişiklik günlüğü"
product: referans
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: degisiklik-gunlugu.html
summary: "Doküman ve API değişiklikleri (örnek kayıtlar): ilk doküman sürümü, sürüm notu biçimi ve hesap hareketleri v2/v3 notu."
---
# Değişiklik günlüğü (Örnek)

Doküman ve API değişiklikleri. Bu sayfadaki kayıtlar örnektir.

## 16 Kasım 2026

- Doküman sitesi ilk sürüm (taslak): sayfa başına .md, `llms.txt`, AI paketi (.zip).
- Kurulum sihirbazı ve örnek giriş/kayıt akışı eklendi.

## Sürüm notu biçimi

| Tarih | Tür | Değişiklik |
|---|---|---|
| `{tarih}` | Yeni | `{uç nokta}` eklendi. |
| `{tarih}` | Kırıcı | `{alan}` adı değişti; geçiş süresi `{süre}`. |
| `{tarih}` | Kullanımdan kalkıyor | `{uç nokta}` için son tarih `{tarih}`. |

## Hesap hareketleri: v2 ve v3

Swagger'da `GET /v2/accounts/{suffix}/transactions` ve `GET /v3/accounts/{suffix}/transactions` birlikte listeli. Hangisinin önerildiği ve eski sürümün takvimi doğrulanacak.
