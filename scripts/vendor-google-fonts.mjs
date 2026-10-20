// Google Fonts'u kendi sunucumuzdan (self-host) vermek için bir kerelik vendoring aracı.
// Build'de ÇALIŞMAZ; font ailesi/ağırlığı değişirse elle çalıştırılır:
//   node scripts/vendor-google-fonts.mjs
// Google'ın tarayıcıya verdiği CSS'in birebir aynısını (aynı woff2 dosyaları, aynı
// unicode-range alt kümeleri, font-display: swap) public/fonts/ altına indirir ve
// src/fonts.css'i üretir. Böylece görünüm değişmez, yalnız üçüncü taraf bağlantı
// (fonts.googleapis.com CSS + fonts.gstatic.com) ve render'ı bloklayan dış CSS kalkar.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap';
// woff2 + unicode-range'li modern CSS için güncel bir Chrome kimliği gerekir.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'fonts');
mkdirSync(outDir, { recursive: true });

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)];
const seen = new Map();
let out =
  '/* Kendi sunucumuzdan verilen fontlar — scripts/vendor-google-fonts.mjs ile üretildi, elle düzenlemeyin.\n' +
  '   Kaynak: ' + CSS_URL + ' */\n';

for (const [, subset, body] of blocks) {
  const family = body.match(/font-family: '([^']+)'/)[1];
  const url = body.match(/src: url\(([^)]+)\)/)[1];
  const slug = family.toLowerCase().replace(/\s+/g, '-');
  // Google değişken font verir: aynı dosya birden çok ağırlık bloğunda tekrar eder.
  let file = seen.get(url);
  if (!file) {
    file = `${slug}-${subset}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    writeFileSync(path.join(outDir, file), buf);
    seen.set(url, file);
    console.log(`${file}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
  out += `/* ${subset} */\n@font-face {${body.replace(url, `/fonts/${file}`)}}\n`;
}

writeFileSync(path.join(root, 'src', 'fonts.css'), out);
console.log(`src/fonts.css: ${blocks.length} @font-face, ${seen.size} dosya`);
