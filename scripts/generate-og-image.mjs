// Build sonrası: dist/og-image.png (1200x630) üretir — sosyal medya/Google paylaşım
// kartı önizlemesi için. SVG logoyu ivory arka plan üstüne ortalar, altına tagline koyar.
// Marka renkleri src/index.css'teki --ink/--ivory/--line ile birebir.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const W = 1200, H = 630;
const INK = '#101317';
const IVORY = '#fffdf8';
const LIME = '#d0ff63';

const logoSvg = readFileSync(path.join(__dirname, '..', 'public', 'brand', 'hamaratlabs-logo-main.svg'));
const logoBuf = await sharp(logoSvg).resize({ width: 760 }).png().toBuffer();
const logoMeta = await sharp(logoBuf).metadata();

const frame = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${IVORY}"/>
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="${INK}" stroke-width="2" rx="18"/>
  <circle cx="${W - 120}" cy="120" r="34" fill="${LIME}"/>
  <text x="96" y="${H - 96}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${INK}">
    Ürettiğim, anlattığım ve paylaştığım laboratuvar
  </text>
</svg>`;

await sharp(Buffer.from(frame))
  .composite([{ input: logoBuf, left: Math.round((W - logoMeta.width) / 2), top: Math.round((H - logoMeta.height) / 2) - 30 }])
  .png()
  .toFile(path.join(distDir, 'og-image.png'));

console.log('dist/og-image.png oluşturuldu.');
