# "desteklenen platformlar" logoları: yakın plan kareler ve ölçüm.
# kullanım: python3 logolar.py <react-kök> <çıktı-klasörü>
# 1440 ve 390 x iki tema (cihaz tercihi, CDP). 390'da servis kümesi açılır. Kutunun çevresi 2x yoğunlukta kırpılır.
# Ölçüm: logo sayısı, boyutları, erişilebilir adları (CDP Accessibility), LinkedIn maskesinin boyanıp boyanmadığı (kutu içi piksel),
# konsol hatası, dış istek, scrollWidth, em dash, kutudaki görünür yazı.
import base64, io, json, os, sys, time
from urllib.parse import urlparse
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

REACT, OUT = sys.argv[1].rstrip('/'), sys.argv[2]
os.makedirs(OUT, exist_ok=True)
URL = REACT + '/wingwire'
HOST = urlparse(URL).hostname

OLC = r"""(() => {
  const kut = [...document.querySelectorAll('.pl-logo')].find(e => e.offsetParent);
  const logolar = [...kut.querySelectorAll('.pl-logo__i')].map(e => { const r = e.getBoundingClientRect(); return { ad: e.getAttribute('aria-label'), title: (e.querySelector('title') || {}).textContent || e.getAttribute('title'), w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: Math.round(r.x), y: Math.round(r.y), renk: getComputedStyle(e).color }; });
  const b = kut.getBoundingClientRect(); const satir = new Set(logolar.map(l => l.y)).size;
  const sahibi = kut.closest('[data-n="plat"]') || kut.closest('li');
  const metin = document.body.textContent;
  return { grupAdi: kut.getAttribute('aria-label'), grupRol: kut.getAttribute('role'), logolar, satir, kutuGorunurYazi: sahibi.innerText.trim(), kutu: [b.x, b.y, b.width, b.height].map(Math.round),
    sahibiKutu: (() => { const r = sahibi.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })(),
    scrollWidth: document.documentElement.scrollWidth, emDash: (metin.match(/\u2014/g) || []).length, desteklenenYazi: (metin.match(/desteklenen platformlar/g) || []).length,
    plYolu: !!document.querySelector('[data-dy] .dy__svg [data-k="pl"]') };
})()"""


def konsol(olaylar):
    h = []
    for o in olaylar:
        m, p = o['method'], o.get('params', {})
        if m == 'Runtime.exceptionThrown':
            h.append(str(p['exceptionDetails'].get('exception', {}).get('description', p['exceptionDetails'].get('text')))[:200])
        elif m == 'Runtime.consoleAPICalled' and p.get('type') == 'error':
            h.append(json.dumps([a.get('value', a.get('description')) for a in p.get('args', [])])[:200])
        elif m == 'Log.entryAdded' and p['entry'].get('level') == 'error':
            h.append(p['entry'].get('text', '')[:200])
    return h


t = Tarayici(9487)
sonuc = []
try:
    for d in ('Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable', 'Accessibility.enable'):
        t.cdp(d)
    t.cdp('Network.setCacheDisabled', cacheDisabled=True)
    for w, h in ((1440, 900), (390, 844)):
        for tema in ('acik', 'koyu'):
            t.cdp('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=2, mobile=w < 800)
            t.medya('dark' if tema == 'koyu' else 'light')
            t.git(URL, 3)
            if w < 800:
                r = t.ev("(() => { const e = document.querySelector('.s-svc'); e.scrollIntoView({block: 'center', behavior: 'instant'}); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()")
                time.sleep(0.4)
                for tip in ('mousePressed', 'mouseReleased'):
                    t.cdp('Input.dispatchMouseEvent', type=tip, x=r[0], y=r[1], button='left', clickCount=1)
                time.sleep(1.0)
            # kutuyu ekranın ortasına getir (masaüstünde letmepost da görünsün diye biraz yukarıdan)
            t.ev("(() => { const k = [...document.querySelectorAll('.pl-logo')].find(e => e.offsetParent); const s = k.closest('[data-n=\"plat\"]') || k.closest('li'); scrollTo({top: s.getBoundingClientRect().top + scrollY - innerHeight / 2 + 40, behavior: 'instant'}); return 1; })()")
            time.sleep(1.2)
            o = t.ev(OLC)
            # kırpma: masaüstünde letmepost ile platform kutusu birlikte, telefonda letmepost satırı
            if w > 800:
                kk = t.ev("(() => { const a = document.querySelector('.grp [data-n=\"lmp\"]').getBoundingClientRect(), b = document.querySelector('.grp [data-n=\"plat\"]').getBoundingClientRect(); return [Math.min(a.x, b.x) - 40, a.y - 30, Math.max(a.right, b.right) + 40, b.bottom + 30]; })()")
            else:
                kk = [o['sahibiKutu'][0] - 16, o['sahibiKutu'][1] - 16, o['sahibiKutu'][0] + o['sahibiKutu'][2] + 16, o['sahibiKutu'][1] + o['sahibiKutu'][3] + 16]
            s = t.cdp('Page.captureScreenshot', format='png')
            im = Image.open(io.BytesIO(base64.b64decode(s['data']))).convert('RGB')
            kirp = im.crop(tuple(int(max(0, v) * 2) for v in kk))
            ad = f'logolar-{w}-{tema}'
            kirp.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, ad + '.png'), optimize=True)
            # LinkedIn maskesi boyandı mı: kutusu içinde zeminden farklı piksel oranı
            li = [l for l in o['logolar'] if l['ad'] == 'LinkedIn'][0]
            lk = im.crop((li['x'] * 2, li['y'] * 2, int((li['x'] + li['w']) * 2), int((li['y'] + li['h']) * 2)))
            zem = im.getpixel((max(0, li['x'] * 2 - 6), li['y'] * 2 + 4))
            px = list(lk.getdata())
            o['linkedinBoyaliOran'] = round(sum(1 for p in px if sum(abs(a - b) for a, b in zip(p, zem)) > 60) / len(px), 2)
            # erişilebilirlik ağacında adlar
            ag = t.cdp('Accessibility.getFullAXTree')['nodes']
            o['axImgAdlari'] = sorted({n.get('name', {}).get('value') for n in ag if n.get('role', {}).get('value') == 'image' and n.get('name', {}).get('value') in
                                       ('Bluesky', 'Instagram', 'LinkedIn', 'Facebook', 'Pinterest', 'Threads', 'TikTok', 'X', 'YouTube')})
            o['konsol_hata'] = konsol(t.olaylar)
            o['dis_istek'] = sorted({e['params']['request']['url'] for e in t.olaylar if e['method'] == 'Network.requestWillBeSent'
                                     and not e['params']['request']['url'].startswith('data:') and urlparse(e['params']['request']['url']).hostname != HOST})
            o['ad'] = ad
            sonuc.append(o)
            print(json.dumps({k: v for k, v in o.items() if k != 'logolar'}, ensure_ascii=False), flush=True)
            print('   logolar', [(l['ad'], l['w'], l['h']) for l in o['logolar']], flush=True)
    json.dump(sonuc, open(os.path.join(OUT, 'logolar.json'), 'w'), ensure_ascii=False, indent=1)
finally:
    t.kapat()
