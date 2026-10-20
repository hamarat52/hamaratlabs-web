// Görsel optimizasyonu (her `npm run build` / `npm run dev` öncesi otomatik çalışır: prebuild/predev).
// public/ilham/*.jpg → public/ilham/opt/<ad>-<yükseklik>.webp (640 ve 960 px yükseklik).
// Kaynak JPG'lere dokunulmaz; onlar yedek (fallback) olarak yayında kalır.
// FlexCarousel, kartın ekranda gerçekten çizileceği piksel yüksekliğine göre en küçük
// yeterli varyantı seçer (bkz. data.js → ilhamVariants, FlexCarousel → pickSource).
// Çıktı git'e girmez (.gitignore); kaynaktan daha yeni ise yeniden üretilmez.
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// data.js → ilhamVariants ile aynı liste olmalı.
const ILHAM_HEIGHTS = [640, 960];
const QUALITY = 80;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'public', 'ilham');
const outDir = path.join(srcDir, 'opt');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  // sharp kurulamazsa build durmasın: site JPG'lere geri düşer (FlexCarousel onerror → src).
  console.warn(`[optimize-images] sharp yüklenemedi, atlanıyor: ${err.message}`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
const sources = readdirSync(srcDir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
let made = 0;
let skipped = 0;
let after = 0;

for (const file of sources) {
  const input = path.join(srcDir, file);
  const inStat = statSync(input);
  const base = file.replace(/\.[^.]+$/, '');
  for (const h of ILHAM_HEIGHTS) {
    const output = path.join(outDir, `${base}-${h}.webp`);
    if (existsSync(output) && statSync(output).mtimeMs >= inStat.mtimeMs) {
      skipped++;
      continue;
    }
    await sharp(input)
      .rotate() // EXIF yönünü uygula (JPG'deki görünümle aynı kalsın)
      .resize({ height: h, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(output);
    after += statSync(output).size;
    made++;
  }
}

console.log(
  `[optimize-images] ${sources.length} kaynak, ${made} varyant üretildi, ${skipped} güncel olduğu için atlandı` +
    (made ? ` (üretilenler: ${(after / 1024).toFixed(0)} KB)` : '')
);
