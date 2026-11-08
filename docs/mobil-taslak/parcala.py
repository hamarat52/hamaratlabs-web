# tam sayfa görüntüleri yan yana parçalara böler: her parça 3 sütun x 1100px (görsel inceleme için)
import sys, glob, os
from PIL import Image
d = sys.argv[1]; CH = 1100
os.makedirs(f'{d}/parca', exist_ok=True)
for f in sorted(glob.glob(f'{d}/*-tam.png')):
    im = Image.open(f); w, h = im.size
    cols = [im.crop((0, y, w, min(y + CH, h))) for y in range(0, h, CH)]
    name = os.path.basename(f)[:-8]
    for i in range(0, len(cols), 3):
        grp = cols[i:i+3]
        sheet = Image.new('RGB', (w * 3 + 40, CH), (255, 0, 255))
        for j, c in enumerate(grp): sheet.paste(c, (j * (w + 20), 0))
        sheet.save(f'{d}/parca/{name}-{i//3+1}.png')
    print(name, h, (len(cols)+2)//3)
