# Kod ile Motion Video Nasıl Yapılır — Kendi Agent'ına Sor

Bu dosyayı kopyalayıp kendi yapay zeka asistanına (Claude, ChatGPT, Codex, Cursor vb.) yapıştır. Hazır bir "AI video üret" modeli kullanmadan, kendi bilgisayarında kod tabanlı bir motion video nasıl yapılır, adım adım anlatacak/yapacaktır.

---

GÖREV: Benim için kod tabanlı (code-driven) bir motion/animasyon videosu üret. Hazır bir video-üretim modeli KULLANMA — bunun yerine şu gerçek teknik hattı uygula:

1. **Sahneyi kod olarak yaz.** HTML + Canvas2D (istersen WebGL/Three.js) ile istediğim animasyonu bir web sayfası olarak oluştur. [Burada ne görmek istediğini kendi cümlelerinle tarif et: renkler, şekiller, metin, zamanlama.]
2. **Bu sayfayı "headless" bir tarayıcıyla render et** (Puppeteer veya Playwright, Node.js). Pencere açmadan, saniyede kaç kare istiyorsam (25-30 fps) o hızda her kareyi ekran görüntüsü olarak kaydet.
3. **Kareleri videoya birleştir** (ffmpeg, `-framerate` + `image2` girişiyle).
4. (İsteğe bağlı) **Kendi görüntümü/sesimi ekle:** Çekimimin arka planını kaldırmak için RVM (Robust Video Matting, açık kaynak) kullan, şeffaf katmanı animasyonla birleştir.
5. **Sesi senkronize et:** Konuşmamı Whisper ile kelime kelime zaman damgasına çıkar, sahne geçişlerini buna hizala.
6. **Kaliteyi kendin kontrol et, "bitti" demekle yetinme:**
   - Videoyu baştan sona yeniden decode et, hata var mı bak.
   - Sesi −14 LUFS'a normalize et, tepe −1 dBTP altında kalsın.
   - Konuşmayı yerel bir ASR (Whisper) ile tekrar yazıya dök, orijinal metinle karşılaştır.
   - Birkaç kareyi kontak sayfası (contact sheet) olarak çıkarıp gözle kontrol et.

SONUÇ: Gerçek, decode edilmiş, doğrulanmış bir MP4 ver — kanıtını (dosya yolu, ölçüm sonuçları) göster.

NOT: Araçların çoğu ücretsiz/açık kaynak (Puppeteer, Playwright, ffmpeg, Whisper, RVM).
