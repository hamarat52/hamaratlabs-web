# Açılış anı (yükleme yedeği) kareleri: bağımsız sayfanın kendi parçası (/assets/<Ad>Site-*.js|css) CDP Fetch ile bekletilir;
# o sırada ekranda yalnız App.jsx'teki Suspense yedeği vardır. Kare alınır, istekler bırakılır, sayfa yüklenince ikinci kare.
# kullanım: python3 yukleme.py <önce-kök> <sonra-kök> <çıktı-klasörü>
# Her sayfa (/wingwire, /sesver, /titimer) x tema (cihaz tercihi açık/koyu) x genişlik (390, 1440) x derleme (önce, sonra).
# Yedek karesinin orta piksel rengi, yüklenmiş sayfanın üst-orta zemin rengi, konsol hatası raporlanır; yüklenmiş hâl önce/sonra
# piksel farkı (sesver ve titimer'de 0 beklenir). '/' yalnız konsol için açılır.
import json, os, sys, time
from PIL import Image, ImageChops, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

ONCE, SONRA, OUT = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/'), sys.argv[3]
os.makedirs(OUT, exist_ok=True)
SAYFALAR = ('/wingwire', '/sesver', '/titimer')


def konsol(olaylar):
    h = []
    for o in olaylar:
        m, p = o['method'], o.get('params', {})
        if m == 'Runtime.exceptionThrown':
            h.append('istisna: ' + str(p['exceptionDetails'].get('exception', {}).get('description', p['exceptionDetails'].get('text')))[:200])
        elif m == 'Runtime.consoleAPICalled' and p.get('type') == 'error':
            h.append('console.error: ' + json.dumps([a.get('value', a.get('description')) for a in p.get('args', [])])[:200])
        elif m == 'Log.entryAdded' and p['entry'].get('level') == 'error':
            h.append('log: ' + p['entry'].get('text', '')[:200])
    return h


def bekleyenler(t, sn):
    """sn saniye boyunca olayları toplar; bekletilen istekleri döner."""
    t.pompala(sn)
    return [o['params'] for o in t.olaylar if o['method'] == 'Fetch.requestPaused']


def hex_(p):
    return '#%02x%02x%02x' % p[:3]


def kaydet(img, ad):
    img.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, ad + '.png'), optimize=True)


t = Tarayici(9485)
sonuc = []
try:
    for d in ('Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable'):
        t.cdp(d)
    t.cdp('Network.setCacheDisabled', cacheDisabled=True)
    for yol in SAYFALAR:
        for tema in ('acik', 'koyu'):
            for w, h in ((390, 844), (1440, 900)):
                t.ekran(w, h)
                t.medya('dark' if tema == 'koyu' else 'light')
                kare = {}
                for kim, kok in (('once', ONCE), ('sonra', SONRA)):
                    t.cdp('Fetch.enable', patterns=[{'urlPattern': '*/assets/*Site-*', 'requestStage': 'Request'}])
                    t.git(kok + yol)
                    bek = bekleyenler(t, 2.0)
                    yedek = t.cek()
                    kut = t.ev("(() => { const r = document.getElementById('root'); const d = r && r.firstElementChild; return d ? {etiket: d.tagName, bg: d.style.background, cocuk: d.childElementCount} : null; })()")
                    for p in bek:
                        t.cdp('Fetch.continueRequest', requestId=p['requestId'])
                    t.cdp('Fetch.disable')
                    t.pompala(3.0)
                    yuklu = t.cek()
                    kare[kim] = (yedek, yuklu)
                    sonuc.append({'yol': yol, 'tema': tema, 'genislik': w, 'derleme': kim, 'bekletilen': [p['request']['url'].split('/')[-1] for p in bek],
                                  'yedek_dom': kut, 'yedek_orta_renk': hex_(yedek.getpixel((w // 2, h // 2))),
                                  'yuklu_zemin_renk': hex_(yuklu.getpixel((w // 2, 4))), 'konsol_hata': konsol(t.olaylar)})
                    print(json.dumps(sonuc[-1], ensure_ascii=False), flush=True)
                ad = f"{yol.strip('/')}-{tema}-{w}"
                f = ImageChops.difference(kare['once'][1], kare['sonra'][1]).convert('L').histogram()
                sonuc[-1]['yuklu_once_sonra_fark'] = sum(f[1:])
                sonuc[-1]['yuklu_once_sonra_belirgin'] = sum(f[33:])
                print(ad, 'yüklü önce/sonra fark', sum(f[1:]), 'belirgin', sum(f[33:]), flush=True)
                # yan yana: önce yedek | sonra yedek | sonra yüklü (küçültülmüş)
                o = 0.5 if w < 800 else 0.25
                parca = [kare['once'][0], kare['sonra'][0], kare['sonra'][1]]
                pw, ph = int(w * o), int(h * o)
                yy = Image.new('RGB', (pw * 3 + 32, ph + 30), (255, 255, 255))
                for i, im in enumerate(parca):
                    yy.paste(im.resize((pw, ph)), (i * (pw + 16), 30))
                d = ImageDraw.Draw(yy)
                for i, s in enumerate(('once: yedek', 'sonra: yedek', 'sonra: yuklendi')):
                    d.text((i * (pw + 16) + 4, 10), f'{s}  {ad}', fill=(0, 0, 0))
                kaydet(yy, ad)
    # ana sayfa: yalnız konsol
    for tema in ('acik', 'koyu'):
        t.ekran(1440, 900)
        t.medya('dark' if tema == 'koyu' else 'light')
        t.git(SONRA + '/', 3)
        sonuc.append({'yol': '/', 'tema': tema, 'derleme': 'sonra', 'konsol_hata': konsol(t.olaylar), 'baslik': t.ev('document.title')})
        print(json.dumps(sonuc[-1], ensure_ascii=False), flush=True)
    json.dump(sonuc, open(os.path.join(OUT, 'yukleme.json'), 'w'), ensure_ascii=False, indent=1)
finally:
    t.kapat()
