# Nasıl Yaptık: "Bu Motion Videolar Aslında Video Değil"

**Kısa cevap:** Opus 5.5'in bir video üretme modeli yok. Yaptığı şey, size bir **web sitesi kodu** yazmak. O site bir animasyon oynatıyor, biz de o animasyonu kare kare fotoğraflayıp videoya çeviriyoruz.

::figure kontak

**Adım adım gerçek hat:**

1. **Animasyon, kod olarak yazılır.** Claude (Opus 5.5), istenen görseli (bu videoda: "MOTION" yazısı, dönen şekiller, kod editörü, tarayıcı penceresi) düz JavaScript/Canvas koduyla "sahne" olarak yazar — hazır bir video şablonu değil, sıfırdan çizim talimatı.
2. **Görünmez bir tarayıcı bu sayfayı açar.** "Headless Chrome" denen, ekranda görünmeyen bir Chrome kopyası bu kodu bir web sayfası gibi çalıştırır.
3. **Her kare, ayrı ayrı fotoğraflanır.** Bu videoda tam **683 kare** — saniyede 25 kare × 27,32 saniye — tek tek "ekran görüntüsü" olarak kaydedildi.
4. **Gerçek çekim üstüne bindirilir.** Yusuf'un kendi konuştuğu görüntü, arka planı yapay zekâ ile (alfa kanal/"matte" tekniğiyle) temizlenip bu kare dizisinin üstüne yerleştirildi.
5. **Hepsi birleştirilir.** ffmpeg, 683 kareyi + sesi + senkronize altyazıyı tek bir MP4'e kaynaştırır.

::figure matte

**Kalite kontrolü (atlanmadı):**
- Video tamamen baştan sona tekrar "decode" edilip 0 hata olduğu doğrulandı.
- Ses seviyesi ölçüldü (yayın standardı −14 LUFS).
- Konuşmanın metne birebir uyduğu, yerel bir konuşma-tanıma modeliyle (Whisper) ayrıca kontrol edildi — AI'ın kendi raporuna güvenilmedi, bağımsız doğrulandı.
- Her 0,5 saniyede görüntü tek tek kontrol edilip araya yanlış/boş kare girmediği teyit edildi.

::figure seritler

**Sonuç:** Sıfır stok görsel, sıfır "AI video üret" komutu. Baştan sona kod + gerçek insan sesi/görüntüsü + titiz doğrulama.

### Kullanılan skiller ve yöntemler

- **Kod ile sahne tasarımı:** Animasyon, hazır bir video modeliyle değil, düz Canvas2D/JavaScript koduyla "çizildi".
- **Headless tarayıcı ile kare yakalama:** Görünmez bir Chrome kopyası bu kodu bir web sayfası gibi çalıştırıp her kareyi tek tek fotoğrafladı (683 kare, 25 fps).
- **Arka plan temizleme (matte):** Gerçek çekim, yeşil ekran kullanılmadan AI destekli bir "matting" aracıyla (RVM) şeffaf hâle getirilip animasyonun üstüne bindirildi.
- **Kelime zamanlamasına göre kesim:** Konuşma, Whisper ile kelime kelime zaman damgasına çıkarıldı; kesimler cümlenin ortasını bölmeden, doğal duraklara denk getirildi.
- **Ses mastering:** −14 LUFS yayın standardı, tepe seviyesi sınırlı, ani ses sıçramaları (pompalama) engellendi.
- **SFX disiplini:** Ses efektleri önce ücretsiz/telifsiz (CC0) kaynaklardan seçildi, kullanılan her dosyanın lisansı ayrı kaydedildi.
- **Bağımsız doğrulama (en kritik adım):** Video "bitti" denmeden önce baştan sona yeniden açılıp hatasız oynadığı, konuşmanın ayrı bir yapay zekâ ile tekrar yazıya dökülüp orijinal metinle birebir eştiği ve her sahnenin kare kare göründüğü gibi olduğu ayrıca kontrol edildi.

::prompt
