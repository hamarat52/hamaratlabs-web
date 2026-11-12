# Hermes bağlantıları (model, MCP, CLI) işinin önce/sonra ölçümü ve kareleri.
# kullanım: python3 baglantilar.py <kök-url> <çıktı-klasörü> <önek: once|sonra>
# 1440x900 ve 390x844, iki tema (cihaz tercihi). Masaüstünde tuvalin tamamı; telefonda diyagram kapalı ve küme açık.
# Ölçüm: diyagram yüksekliği, telefonda ilk bakışta görünen düğüm sayısı, diyagramdaki en küçük yazı, scrollWidth, konsol,
# dış istek, em dash, sayfa kelime sayısı; hüzmenin hangi yollarda aktığı (12 sn gerçek saat örneği);
# hareket azaltmada hüzme öğesi sayısı ve düğümlerin eksiksizliği.
import base64, io, json, os, sys, time
from urllib.parse import urlparse
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

KOK, OUT, ON = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
URL = KOK + '/wingwire'
HOST = urlparse(URL).hostname
LOGO_ADLARI = ['Claude', 'GPT', 'Gemini', 'MCP', 'Claude Code', 'Antigravity CLI (agy)', 'Gemini CLI']

OLC = r"""(() => {
  const dy = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent);
  const gor = e => { if (!e.offsetParent) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); };
  // ilk bakış düğümleri: tuvalde .nd, telefonda .sn ve küme düğmesi (liste hariç)
  const dug = [...dy.querySelectorAll('.nd, .sn, .s-svc')].filter(gor).map(e => e.dataset.n || e.className);
  // diyagramdaki görünür yazıların en küçük boyutu
  let enk = 99, enkMetin = '';
  const w = document.createTreeWalker(dy, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (!gor(e)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < enk) { enk = fs; enkMetin = t.textContent.trim().slice(0, 40); } }
  const r = dy.getBoundingClientRect();
  const ax = [...dy.querySelectorAll('[role="img"]')].map(e => e.getAttribute('aria-label'));
  return { diyagram: dy.dataset.dy, dyBoy: Math.round(r.height), dyEn: Math.round(r.width), dugumler: dug, dugumSayisi: dug.length,
    yollar: [...dy.querySelectorAll('.dy__svg .yol')].map(p => p.dataset.k), hbSayisi: dy.querySelectorAll('.hb').length,
    enKucukYazi: enk, enKucukMetin: enkMetin, logolar: ax, scrollWidth: document.documentElement.scrollWidth,
    emDash: (document.body.textContent.match(/\u2014/g) || []).length,
    yasak: (document.body.innerText.match(/Marketing|kablo|fiş/gi) || []).length,
    kelime: document.body.innerText.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)).length };
})()"""

# hüzme örnekleyici: her 100 ms'de opaklığı 1 olan hüzmelerin yol adları (hüzme i, yol i ile aynı sırada; masaüstünde yol başına 1)
ORNEK = r"""(async () => { const dy = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent); const s = new Set();
  for (let i = 0; i < 120; i++) { const yol = [...dy.querySelectorAll('.dy__svg .yol')].map(p => p.dataset.k);
    dy.querySelectorAll('.hb').forEach((h, j) => { if (h.getAttribute('opacity') === '1') s.add(yol[j] || ('?' + j)); });
    await new Promise(r => setTimeout(r, 100)); } return [...s].sort(); })()"""


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


def dis(olaylar):
    return sorted({e['params']['request']['url'] for e in olaylar if e['method'] == 'Network.requestWillBeSent'
                   and not e['params']['request']['url'].startswith('data:') and urlparse(e['params']['request']['url']).hostname != HOST})


def kare(t, ad, olcek):
    """görünür diyagramın tamamı, sayfa koordinatında kırpılarak"""
    k = t.ev("(() => { const d = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent); const r = d.getBoundingClientRect(); return [r.left, r.top + scrollY, r.width, r.height]; })()")
    s = t.cdp('Page.captureScreenshot', format='png', captureBeyondViewport=True, clip={'x': max(0, k[0] - 8), 'y': k[1] - 8, 'width': k[2] + 16, 'height': k[3] + 16, 'scale': olcek})
    im = Image.open(io.BytesIO(base64.b64decode(s['data']))).convert('RGB')
    im.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, ad + '.png'), optimize=True)


def kume_ac(t):
    r = t.ev("(() => { const e = document.querySelector('.s-svc'); e.scrollIntoView({block: 'center', behavior: 'instant'}); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()")
    time.sleep(0.3)
    for tip in ('mousePressed', 'mouseReleased'):
        t.cdp('Input.dispatchMouseEvent', type=tip, x=r[0], y=r[1], button='left', clickCount=1)
    time.sleep(0.8)


t = Tarayici(9489)
sonuc = []
try:
    for d in ('Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable'):
        t.cdp(d)
    t.cdp('Network.setCacheDisabled', cacheDisabled=True)
    for w, h in ((1440, 900), (390, 844)):
        for tema in ('acik', 'koyu'):
            t.cdp('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=w < 800)
            t.medya('dark' if tema == 'koyu' else 'light')
            t.git(URL, 3)
            t.ev("(() => { const d = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent); scrollTo({top: d.getBoundingClientRect().top + scrollY - 40, behavior: 'instant'}); return 1; })()")
            time.sleep(1.0)
            o = t.ev(OLC)
            o.update(ad=f'{ON}-{w}-{tema}', genislik=w, tema=tema)
            o['huzmeYollar'] = t.ev(ORNEK)
            kare(t, f'{ON}-{w}-{tema}', 1 if w > 800 else 2)
            if w < 800:
                kume_ac(t)
                a = t.ev(OLC)
                o['acik'] = {k: a[k] for k in ('dyBoy', 'enKucukYazi', 'enKucukMetin', 'logolar', 'scrollWidth')}
                kare(t, f'{ON}-{w}-{tema}-kume-acik', 2)
            o['konsol_hata'] = konsol(t.olaylar)
            o['dis_istek'] = dis(t.olaylar)
            sonuc.append(o)
            print(json.dumps(o, ensure_ascii=False), flush=True)
    # hareket azaltma: hüzme hiç kurulmaz, düğümler ve logolar eksiksiz
    for w, h in ((1440, 900), (390, 844)):
        t.cdp('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=w < 800)
        t.medya('light', 'reduce')
        t.git(URL, 3)
        t.ev("(() => { const d = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent); scrollTo({top: d.getBoundingClientRect().top + scrollY - 40, behavior: 'instant'}); return 1; })()")
        time.sleep(1.5)
        if w < 800:
            kume_ac(t)
        o = t.ev(OLC)
        o.update(ad=f'{ON}-{w}-azalt', genislik=w, tema='acik', hareket='reduce', konsol_hata=konsol(t.olaylar), dis_istek=dis(t.olaylar))
        kare(t, f'{ON}-{w}-azalt', 1 if w > 800 else 2)
        sonuc.append(o)
        print(json.dumps(o, ensure_ascii=False), flush=True)
    json.dump(sonuc, open(os.path.join(OUT, ON + '.json'), 'w'), ensure_ascii=False, indent=1)
finally:
    t.kapat()
