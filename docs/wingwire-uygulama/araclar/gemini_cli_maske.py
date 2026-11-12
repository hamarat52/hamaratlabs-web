# Gemini CLI'ın resmi simgesinden (https://geminicli.com/icon.png, 1645x1645 RGBA, renkli) tek renk maske üretir.
# Simge: koyu dolgulu yuvarlak kare, renkli çerçeve ve ">" işareti. Şekil değiştirilmez, yeniden çizilmez:
# yalnız renk atılır; parlak (renkli) pikseller mürekkep, koyu iç dolgu ve dış saydam alan saydam olur.
# Sayfada CSS mask olarak kullanılır, rengi currentColor (öbür logolarla aynı tek renk).
# kullanım: python3 gemini_cli_maske.py <icon.png> <çıktı.png>
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
r, g, b, a = im.split()
# en parlak kanal: iç dolgu (#1F1F2E civarı) <= ~50, çerçeve ve işaret (mavi/mor/kırmızı) >= ~200
mx = Image.merge('RGB', (r, g, b)).convert('RGB')
px = mx.load()
w, h = im.size
alfa = Image.new('L', (w, h))
ap = alfa.load()
aa = a.load()
for y in range(h):
    for x in range(w):
        m = max(px[x, y])
        v = min(1.0, max(0.0, (m - 70) / 90.0))
        ap[x, y] = int(round(v * aa[x, y]))
alfa = alfa.resize((120, 120), Image.LANCZOS)
sonuc = Image.new('RGBA', (120, 120), (0, 0, 0, 0))
sonuc.putalpha(alfa)
sonuc.save(out, optimize=True)
print(out, sonuc.size)
