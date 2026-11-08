# Önce | sonra paftası: iki ilk ekran görüntüsünü yan yana (masaüstünde alt alta) birleştirir, üstüne etiket yazar.
# kullanım: python3 pafta.py <önce.png> <sonra.png> <çıktı.png> [yan|alt]
import sys
from PIL import Image, ImageDraw, ImageFont

a, b, out = Image.open(sys.argv[1]).convert('RGB'), Image.open(sys.argv[2]).convert('RGB'), sys.argv[3]
mode = sys.argv[4] if len(sys.argv) > 4 else 'yan'
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 28)
except OSError:
    font = ImageFont.load_default()
H = 48; gap = 24
if mode == 'yan':
    W = a.width + b.width + gap; Ht = max(a.height, b.height) + H
    im = Image.new('RGB', (W, Ht), (255, 255, 255))
    im.paste(a, (0, H)); im.paste(b, (a.width + gap, H))
    d = ImageDraw.Draw(im)
    d.text((12, 10), 'önce', fill=(16, 19, 23), font=font); d.text((a.width + gap + 12, 10), 'sonra', fill=(16, 19, 23), font=font)
else:
    W = max(a.width, b.width); Ht = a.height + b.height + 2 * H
    im = Image.new('RGB', (W, Ht), (255, 255, 255))
    d = ImageDraw.Draw(im)
    d.text((12, 10), 'önce', fill=(16, 19, 23), font=font); im.paste(a, (0, H))
    d.text((12, a.height + H + 10), 'sonra', fill=(16, 19, 23), font=font); im.paste(b, (0, a.height + 2 * H))
im.save(out, optimize=True)
print(out, im.size)
