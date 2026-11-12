# Yüklenmiş sayfa karşılaştırması: önce/sonra derleme ve aynı derlemenin iki açılışı (animasyon gürültüsü taban çizgisi).
# kullanım: python3 tekrar.py <önce-kök> <sonra-kök> <çıktı.json> [yol ...]
import json, os, sys, time
from PIL import ImageChops
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

ONCE, SONRA, CIKTI = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/'), sys.argv[3]
YOLLAR = sys.argv[4:] or ['/sesver', '/titimer']


def fark(a, b):
    f = ImageChops.difference(a, b)
    h = f.convert('L').histogram()
    return [sum(h[1:]), sum(h[33:]), f.getbbox()]


t = Tarayici(9486)
sonuc = []
try:
    t.cdp('Page.enable')
    for yol in YOLLAR:
        for w, h in ((390, 844), (1440, 900)):
            for hareket in ('no-preference', 'reduce'):
                t.ekran(w, h)
                t.medya('light', hareket)
                k, metin = {}, {}
                for ad, kok in (('once', ONCE), ('sonra', SONRA), ('sonra2', SONRA)):
                    t.git(kok + yol, 3.5)
                    t.ev("(async () => { await document.fonts.ready; return 1; })()")
                    time.sleep(0.5)
                    k[ad] = t.cek()
                    metin[ad] = t.ev("(document.querySelector('.tt-demo') || {}).innerText || null")
                s = {'yol': yol, 'genislik': w, 'hareket': hareket, 'once_sonra': fark(k['once'], k['sonra']), 'sonra_sonra2': fark(k['sonra'], k['sonra2']), 'tt_demo': metin}
                sonuc.append(s)
                print(json.dumps(s), flush=True)
    json.dump(sonuc, open(CIKTI, 'w'), indent=1)
finally:
    t.kapat()
