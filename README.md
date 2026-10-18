# hamaratlabs.com

Yusuf Hamarat'ın sitesi: Üretiyorum (uygulamalar), Paylaşıyorum (sosyal medya), Anlatıyorum (eğitici içerikler).

## Çalıştırma

```bash
npm install
npm run dev
```

## Yayın

`main` dalına her push'ta GitHub Actions siteyi derleyip GitHub Pages'e yayınlar (`.github/workflows/deploy.yml`). Alan adı `public/CNAME` dosyasında.

## İçerik

- Uygulamalar, bağlantılar ve yorum ayarları: `src/data.js`
- Uygulama ikonları: `src/AppIcon.jsx`
- Efekt bileşenleri (React Bits): `src/components/rb/`
