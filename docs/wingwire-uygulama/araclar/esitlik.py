# Görsel eşitlik: onaylı taslak (Taslak 5, ?yon=a&isik=guclu&mob=1) ile React sayfası (/wingwire) aynı adımlarla çekilir, piksel farkı sayılır.
# kullanım: python3 esitlik.py <taslak-kök-URL> <react-kök-URL> <çıktı-klasörü>
# Her görünüm (1440x900, 390x844) ve tema (cihaz tercihi açık/koyu, CDP ile) için:
#   an-1: yüklemeden 4,5 sn sonra, bildirim düşmüş ve titremesi bitmiş (ilk ekran)
#   an-2: 9,5 sn sonra, bildirim kendiliğinden telefona uçmuş, telefon sohbeti gösteriyor
#   dy-1, dy-2: diyagram görüş alanında, elle sürülen saatle 90 ve 200 kare (1/60 sn) sonra; hüzmeler akarken
#   az-tam: hareket azaltmada tam sayfa (bütün bölümler, durağan diyagram)
# Fark: ImageChops.difference; 'fark_piksel' herhangi bir kanalda 0'dan büyük fark, 'fark_belirgin' 32'den büyük fark.
import json, os, sys, time
from PIL import Image, ImageChops, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici, SAAT

TASLAK, REACT, OUT = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/'), sys.argv[3]
os.makedirs(OUT, exist_ok=True)
URL = {'taslak': TASLAK + '/index.html?yon=a&isik=guclu&mob=1', 'react': REACT + '/wingwire'}
GORSEL_BEKLE = ("(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i => i.offsetParent)"
                ".map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })); return 1; })()")


def fark(a, b):
    if a.size != b.size:
        return {'boyut_taslak': a.size, 'boyut_react': b.size, 'fark_piksel': 'boyut farklı'}
    f = ImageChops.difference(a, b)
    L = f.convert('L')
    h = L.histogram()
    return {'boyut': a.size, 'fark_piksel': sum(h[1:]), 'fark_belirgin': sum(h[33:]), 'fark_kutusu': f.getbbox()}


def yanyana(a, b, ad, olcek, sonuc):
    w, h = int(a.width * olcek), int(a.height * olcek)
    yy = Image.new('RGB', (w * 2 + 24, h + 36), (255, 255, 255))
    yy.paste(a.resize((w, h)), (0, 36))
    yy.paste(b.resize((w, h)), (w + 24, 36))
    d = ImageDraw.Draw(yy)
    d.text((8, 12), f'taslak (Taslak 5)  {ad}', fill=(0, 0, 0))
    d.text((w + 32, 12), f'React /wingwire  fark {sonuc["fark_piksel"]} px, belirgin {sonuc.get("fark_belirgin")}', fill=(0, 0, 0))
    yy.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, ad + '.png'), optimize=True)


t = Tarayici(9481)
sonuclar = []
try:
    t.cdp('Page.enable')
    t.cdp('Network.enable')
    t.cdp('Network.setCacheDisabled', cacheDisabled=True)
    for w, h in ((1440, 900), (390, 844)):
        for tema in ('acik', 'koyu'):
            kare = {}
            # hareketli anlar (elle sürülen saat)
            t.betik(SAAT)
            t.ekran(w, h)
            t.medya('dark' if tema == 'koyu' else 'light', 'no-preference')
            for kim in ('taslak', 'react'):
                t.git(URL[kim])
                bas = time.time()
                t.ev(GORSEL_BEKLE)
                time.sleep(max(0, 4.5 - (time.time() - bas)))
                kare[(kim, 'an-1')] = t.cek()
                time.sleep(max(0, 9.5 - (time.time() - bas)))
                kare[(kim, 'an-2')] = t.cek()
                # scrollIntoView sitenin genel scroll-padding-top: 80px kuralına uyar; iki sayfayı aynı mutlak konuma getirmek için scrollTo
                t.ev("scrollTo({top: document.querySelector('#ag').getBoundingClientRect().top + scrollY, behavior: 'instant'}); 1")
                time.sleep(0.8)
                t.ev('__adim(2, 0)')
                t.ev(GORSEL_BEKLE)
                time.sleep(0.3)
                t.ev('__adim(90, 1000 / 60)')
                time.sleep(0.2)
                kare[(kim, 'dy-1')] = t.cek()
                t.ev('__adim(110, 1000 / 60)')
                time.sleep(0.2)
                kare[(kim, 'dy-2')] = t.cek()
            t.betikleri_sil()
            # hareket azaltma: tam sayfa
            t.medya('dark' if tema == 'koyu' else 'light', 'reduce')
            for kim in ('taslak', 'react'):
                t.git(URL[kim], 2.5)
                t.ev(GORSEL_BEKLE)
                t.ev('scrollTo(0, 0); 1')
                time.sleep(0.6)
                kare[(kim, 'az-tam')] = t.cek(tam=True)
            for an in ('an-1', 'an-2', 'dy-1', 'dy-2', 'az-tam'):
                ad = f'{an}-{w}-{tema}'
                s = fark(kare[('taslak', an)], kare[('react', an)])
                s['ad'] = ad
                sonuclar.append(s)
                print(json.dumps(s, ensure_ascii=False), flush=True)
                olcek = (0.25 if w > 800 else 0.5) if an == 'az-tam' else (0.5 if w > 800 else 1)
                if s['fark_piksel'] != 'boyut farklı':
                    yanyana(kare[('taslak', an)], kare[('react', an)], ad, olcek, s)
                    # maske her çiftte yazılır (fark 0 ise siyah): önceki koşunun dosyası silinmeden güncellenir
                    m = ImageChops.difference(kare[('taslak', an)], kare[('react', an)]).convert('L').point(lambda v: 255 if v else 0)
                    m.convert('1').save(os.path.join(OUT, ad + '-fark.png'), optimize=True)
                else:
                    kare[('taslak', an)].save(os.path.join(OUT, ad + '-taslak.png'))
                    kare[('react', an)].save(os.path.join(OUT, ad + '-react.png'))
    json.dump(sonuclar, open(os.path.join(OUT, 'esitlik.json'), 'w'), ensure_ascii=False, indent=1)
finally:
    t.kapat()
