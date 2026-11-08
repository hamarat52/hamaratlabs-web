# İlham galerisi altyazısının kontrastı: başlık ve sayaç bölgesindeki en koyu piksel ile zemin arasındaki WCAG oranı.
# kullanım: python3 kontrast.py ilham/canli-ilham.png ...   (390x844 dpr2 görüntü; bölgeler CSS pikseli)
import sys
from PIL import Image

def lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

REGIONS = {'baslik': (110, 364, 280, 390), 'sayac': (150, 390, 240, 430)}
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGB')
    out = []
    for name, (x0, y0, x1, y1) in REGIONS.items():
        crop = im.crop((x0 * 2, y0 * 2, x1 * 2, y1 * 2))
        px = list(crop.getdata())
        dark = min(px, key=lum)
        # zemin: bölgedeki en sık renk
        bg = max(set(px), key=px.count)
        out.append(f'{name}: yazı {dark} zemin {bg} oran {ratio(dark, bg):.2f}:1')
    print(f, ' | '.join(out))
