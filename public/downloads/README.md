# WingWire APK — public indirme dosyaları

Bu klasördeki APK'lar hamaratlabs.com/wingwire sayfasındaki "APK indir" butonuna bağlıdır
(`src/wingwire-site/WingWireSite.jsx` -> `APK_VERSION` sabiti dosya adıyla eşleşmeli).

Yeni sürüm yayınlarken:
1. `wingwire-android` reposunda `app/build.gradle.kts` içindeki `versionName`'i artır.
2. `./gradlew :app:assembleDebug` ile `app-universal-debug.apk` üret (tüm ABI'leri kapsar, tek dosya).
3. Üretilen APK'yı `wingwire-<versionName>.apk` adıyla bu klasöre kopyala.
4. `WingWireSite.jsx`'teki `APK_VERSION` sabitini güncelle.
5. Eski sürümün dosyasını burada bırakmak istemiyorsan sil (zorunlu değil).

Not: Bu DEBUG imzalı bir derleme (Play Store/release keystore değil). Android "bilinmeyen
kaynaklardan yükleme" izni ve kurulumda imza uyarısı normal — kullanıcıya bunu belirt.
