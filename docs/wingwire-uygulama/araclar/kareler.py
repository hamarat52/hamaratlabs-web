# Yalnız React sayfasının etkileşim kareleri (eşitlik karelerinde olmayan hâller).
# kullanım: python3 kareler.py <react-kök> <çıktı-klasörü>
import os, sys, time
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

REACT, OUT = sys.argv[1].rstrip('/'), sys.argv[2]
os.makedirs(OUT, exist_ok=True)


def kaydet(img, ad):
    img.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, ad + '.png'), optimize=True)
    print(ad, flush=True)


def tikla(t, secici):
    r = t.ev(f"(() => {{ const e = document.querySelector('{secici}'); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }})()")
    for tip in ('mousePressed', 'mouseReleased'):
        t.cdp('Input.dispatchMouseEvent', type=tip, x=r[0], y=r[1], button='left', clickCount=1)


t = Tarayici(9484)
try:
    t.cdp('Page.enable')
    for tema in ('acik', 'koyu'):
        # telefon: servis kümesi açık
        t.ekran(390, 844)
        t.medya('dark' if tema == 'koyu' else 'light')
        t.git(REACT + '/wingwire', 3)
        t.ev("scrollTo({top: document.querySelector('.s-kume').getBoundingClientRect().top + scrollY - 420, behavior: 'instant'}); 1")
        time.sleep(0.5)
        tikla(t, '.s-svc')
        time.sleep(1.2)
        kaydet(t.cek(), f'servis-acik-390-{tema}')
    # telefon: Durdur basılı (yalnız simge, Oynat üçgeni)
    t.medya('light')
    t.git(REACT + '/wingwire', 3)
    t.ev("scrollTo({top: document.querySelector('#ag').getBoundingClientRect().top + scrollY, behavior: 'instant'}); 1")
    time.sleep(2)
    tikla(t, '.dur-dg')
    time.sleep(0.8)
    kaydet(t.cek(), 'durduruldu-390-acik')
    # masaüstü: açık temada açılır, tema düğmesiyle koyuya geçer
    t.ekran(1440, 900)
    t.medya('light')
    t.git(REACT + '/wingwire', 4.5)
    kaydet(t.cek(), 'tema-once-1440-acik')
    tikla(t, '.tema-dg')
    time.sleep(0.8)
    kaydet(t.cek(), 'tema-sonra-1440-koyu')
finally:
    t.kapat()
