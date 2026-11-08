# Karşılaştırma: (1) 1280 px görüntülerde canlı ile taslak yönleri arasındaki piksel farkı,
# (2) yan yana pafta görüntüleri (canlı | A | B) 390 ve 1280 için.
# kullanım: python3 karsilastir.py   (docs/mobil-taslak içinde çalıştır)
import os
from PIL import Image, ImageChops, ImageDraw

PAGES = ['anasayfa', 'uretiyorum', 'anlatiyorum', 'oneriyorum']
os.makedirs('karsilastirma', exist_ok=True)

def diff(a_path, b_path):
    a, b = Image.open(a_path).convert('RGB'), Image.open(b_path).convert('RGB')
    h = min(a.height, b.height)
    a, b = a.crop((0, 0, a.width, h)), b.crop((0, 0, b.width, h))
    d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = sum(1 for v in d.getdata() if v)
    return n / (a.width * h) * 100, d.getbbox(), h

print('1280 px piksel farkı (eşik: kanal farkı > 24). bbox = farklı piksellerin kapsadığı dikdörtgen')
for kind in ['ilk', 'tam']:
    for p in PAGES:
        row = [f'{kind:3} {p:12}']
        for y in ['0', 'a', 'b']:
            f = f'{y}-1280/{p}-{kind}.png'
            if not os.path.exists(f):
                row.append(f'{y}: yok'); continue
            pct, box, h = diff(f'canli-1280/{p}-{kind}.png', f)
            row.append(f'{y}: %{pct:.2f} bbox={box}')
        # A ve B'nin yerel yönsüz (0) sürümden farkı: aynı derleme, yalnız ?yon değişir
        for y in ['a', 'b']:
            f, g = f'{y}-1280/{p}-{kind}.png', f'0-1280/{p}-{kind}.png'
            if os.path.exists(f) and os.path.exists(g):
                pct, box, h = diff(g, f)
                row.append(f'{y} vs 0: %{pct:.2f} bbox={box}')
        print(' | '.join(row))

def sheet(paths, labels, out, w):
    ims = [Image.open(p).convert('RGB') for p in paths]
    ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
    H = max(im.height for im in ims) + 36
    s = Image.new('RGB', (len(ims) * (w + 16) - 16, H), (255, 0, 255))
    dr = ImageDraw.Draw(s)
    for i, (im, lab) in enumerate(zip(ims, labels)):
        x = i * (w + 16)
        s.paste(im, (x, 36))
        dr.rectangle((x, 0, x + w, 35), fill=(16, 19, 23))
        dr.text((x + 10, 10), lab, fill=(208, 255, 99))
    s.save(out, quality=82)
    return out

for p in PAGES:
    print(sheet([f'canli/{p}-ilk.png', f'a/{p}-ilk.png', f'b/{p}-ilk.png'], ['CANLI 390', 'YON A 390', 'YON B 390'], f'karsilastirma/{p}-390-ilk.png', 390))
    # Tam sayfa paftası JPEG (depoda yer kaplamasın)
    print(sheet([f'canli/{p}-tam.png', f'a/{p}-tam.png', f'b/{p}-tam.png'], ['CANLI 390 tam sayfa', 'YON A 390 tam sayfa', 'YON B 390 tam sayfa'], f'karsilastirma/{p}-390-tam.jpg', 390))
    if all(os.path.exists(f'{y}-1280/{p}-ilk.png') for y in ['canli', 'a', 'b']):
        print(sheet([f'canli-1280/{p}-ilk.png', f'a-1280/{p}-ilk.png', f'b-1280/{p}-ilk.png'], ['CANLI 1280', 'YON A 1280', 'YON B 1280'], f'karsilastirma/{p}-1280-ilk.png', 640))
