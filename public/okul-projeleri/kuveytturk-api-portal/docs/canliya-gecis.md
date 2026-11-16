---
title: "Canlıya geçiş"
product: genel
api_version: v1 (örnek)
last_updated: 2026-11-16
source_html: canliya-gecis.html
summary: "Canlıya geçiş talebi (Go Live Request Management), göndermeden önce önerilen kontrol listesi ve onaydan sonra yapılacak değişiklikler."
---
# Canlıya geçiş

Testler bitince canlıya geçiş talebi açarsınız. Onaydan sonra aynı kod, canlı kimlik sunucusu ve ağ geçidiyle çalışır.

## Talep

Hesabınızda **Go Live Request Management** ekranından talep oluşturun. Örnek durum görünümü: [Panel](https://hamaratlabs.com/okul-projeleri/kuveytturk-api-portal/hesap/panel.html#canli)

## Göndermeden önce

> **Örnek:** Bu liste önerilen bir kontrol listesidir; portalın resmi canlıya geçiş koşulları değildir.

- Test ortamında her uç nokta için başarılı ve hatalı yanıtı denediniz.
- İmza doğrulama hatası almıyorsunuz.
- İade (`POST /v1/vpos/digitalPaymentDoRefund`) ve her para hareketi bir kişinin onayından geçiyor.
- Log'larda T.C. kimlik numarası, kart bilgisi, token ya da secret yok.
- Ortam tek değişkenle seçiliyor (`KT_BASE_URL`).

## Onaydan sonra

`KT_BASE_URL` değerini canlı ağ geçidine, token adresini canlı kimlik sunucusuna çevirin. Canlı anahtarları test anahtarlarından ayrı saklayın. Adresler: [Ortamlar](ortamlar.md)

## Süre ve koşullar

Onay süresi ve istenen belgeler: `{değer}`. Bu taslakta doğrulanmadığı için yazılmadı.
