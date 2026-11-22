#!/usr/bin/env python3
"""Paylaşım kartı doğrulaması (yerel sunucu): her sayfanın og:image etiketleri ve görselin kendisi.

Kullanım: python3 og_dogrula.py http://hamaratlabs-seo.localhost:1355 cikti.txt kontak.jpg
- Sayfa HTML'i yerel sunucudan alınır; og:image mutlak canlı adresi (https://hamaratlabs.com/og/...)
  yerel sunucuya çevrilip indirilir, PNG ve 1200x630 olduğu PIL ile ölçülür.
- Kontak föyü: her sayfanın kartı, altında sayfa yolu (küçük boyut, JPEG).
"""
import io, re, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

LOCAL = sys.argv[1].rstrip('/')
SITE = 'https://hamaratlabs.com'
SAYFALAR = [
    '/okul-projeleri/fibi/', '/okul-projeleri/kuveytturk-api-portal/', '/okul-projeleri/ricambio/',
    '/income-vs-desires/', '/income-vs-desires/blog/',
    '/income-vs-desires/blog/durtusel-alisveristen-kurtulmak',
    '/income-vs-desires/blog/kira-maasin-yuzde-kaci-olmali',
    '/income-vs-desires/blog/saatlik-ucret-nasil-hesaplanir',
    '/income-vs-desires/destek', '/income-vs-desires/gizlilik',
    '/income-vs-desires/en/privacy', '/income-vs-desires/en/support',
    '/income-vs-desires/saatlik-ucret-hesaplama',
]

def get(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'og-dogrula'}), timeout=30)
    return r.status, r.headers.get('content-type', ''), r.read()

def meta(h, key, attr='property'):
    m = re.search(r'<meta\s+%s="%s"\s+content="([^"]*)"' % (attr, re.escape(key)), h)
    return m.group(1) if m else None

satirlar, kartlar, hata = [], [], 0
for yol in SAYFALAR:
    st, _, b = get(LOCAL + yol)
    h = b.decode('utf-8')
    img = meta(h, 'og:image'); w = meta(h, 'og:image:width'); hh = meta(h, 'og:image:height')
    alt = meta(h, 'og:image:alt'); tc = meta(h, 'twitter:card', 'name')
    n_img = len(re.findall(r'property="og:image"', h))
    sorun = []
    if not img or not img.startswith(SITE + '/og/'): sorun.append(f'og:image mutlak /og/ adresi değil: {img}')
    if (w, hh) != ('1200', '630'): sorun.append(f'boyut etiketi {w}x{hh}')
    if not alt: sorun.append('alt yok')
    if tc != 'summary_large_image': sorun.append(f'twitter:card {tc}')
    if n_img != 1: sorun.append(f'og:image sayısı {n_img}')
    ist, ct, ib = get(LOCAL + img[len(SITE):]) if img else (0, '', b'')
    im = Image.open(io.BytesIO(ib)) if ist == 200 else None
    if not im or im.format != 'PNG' or im.size != (1200, 630): sorun.append(f'görsel {ist} {ct} {im.size if im else None}')
    hata += bool(sorun)
    satirlar.append(f"{'OK' if not sorun else '!!'} {yol}\n   og:image {img} ({ist}, {ct}, {im.size if im else '-'}, {len(ib) // 1024} KB)\n   alt: {alt}\n   twitter:card {tc}" + (f"\n   SORUN: {'; '.join(sorun)}" if sorun else ''))
    if im: kartlar.append((yol, im.convert('RGB')))

ozet = f'{len(SAYFALAR)} sayfa, sorunlu {hata}'
open(sys.argv[2], 'w').write('\n'.join(satirlar) + '\n' + ozet + '\n')
print('\n'.join(satirlar)); print(ozet)

# Kontak föyü
TW, TH, COLS, GAP, LAB = 360, 189, 4, 14, 22
rows = (len(kartlar) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TW + (COLS + 1) * GAP, rows * (TH + LAB) + (rows + 1) * GAP), (40, 40, 40))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 12)
except OSError:
    font = ImageFont.load_default()
for i, (yol, im) in enumerate(kartlar):
    x = GAP + (i % COLS) * (TW + GAP); y = GAP + (i // COLS) * (TH + LAB + GAP)
    sheet.paste(im.resize((TW, TH), Image.Resampling.LANCZOS), (x, y))
    d.text((x, y + TH + 5), yol if len(yol) < 52 else '…' + yol[-50:], fill=(225, 225, 225), font=font)
sheet.save(sys.argv[3], quality=80, optimize=True)
print(sys.argv[3], sheet.size)
