# Telefon taslağı ölçümü: her yolu verilen genişlikte (390x844 dpr2 dokunmatik ya da 1280x800 masaüstü)
# açar, ölçer, ilk ekran + tam sayfa görüntüsü alır. PM'in mobil-denetim/denetim.py betiğinden türetildi.
# kullanım: python3 olc.py <base> <çıktı-klasörü> <yon: a|b|0|canli> <390|1280> yol1 yol2 ...
import json, subprocess, sys, time, urllib.request, base64, os, io
import websocket
from PIL import Image

base, outdir, yon, width, paths = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5:]
os.makedirs(outdir, exist_ok=True)
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
port = 9476 if width < 700 else 9477
prof = os.path.join('/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch', f'olc-prof-{port}')
proc = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PHONE = width < 700
W, H0, DPR = (width, 844, 2) if PHONE else (1280, 800, 1)

AUDIT = r"""
(() => {
  const vw = innerWidth, out = {};
  out.scrollW = document.documentElement.scrollWidth;
  out.height = document.documentElement.scrollHeight;
  const vis = e => { const s = getComputedStyle(e); return s.display!=='none' && s.visibility!=='hidden' && +s.opacity>0.05; };
  const visDeep = e => { for (let p=e; p && p!==document.body; p=p.parentElement){ if(!vis(p)) return false; } return true; };
  // İlk uygulama kartı (mağaza ızgarası) ve bölüm başlıkları
  const card = document.querySelector('.cards .card');
  out.firstCardY = card ? Math.round(card.getBoundingClientRect().top + scrollY) : null;
  const lesson = document.querySelector('.lessons .lesson');
  out.firstLessonY = lesson ? Math.round(lesson.getBoundingClientRect().top + scrollY) : null;
  const tool = document.querySelector('.toolgrid .tool, .toolwall');
  out.firstToolY = tool ? Math.round(tool.getBoundingClientRect().top + scrollY) : null;
  // Kart genişlikleri
  out.cardWidths = [...document.querySelectorAll('.cards .card')].map(c => Math.round(c.getBoundingClientRect().width));
  // 12 px altı görünür yazı: SVG metninde font-size kullanıcı birimidir, ekrandaki ölçeğe (CTM) çarpılır.
  const small = new Map(); let smallCount = 0;
  document.querySelectorAll('body *').forEach(e => {
    if (!vis(e)) return;
    const t = [...e.childNodes].filter(n => n.nodeType===3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!t) return;
    const r = e.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) return;        // sr-only / gizli
    if (!visDeep(e)) return;
    let fs = parseFloat(getComputedStyle(e).fontSize);
    if (e instanceof SVGElement && e.ownerSVGElement) { const m = e.ownerSVGElement.getScreenCTM(); if (m) fs = fs * Math.hypot(m.a, m.b); }
    if (fs > 0 && fs < 11.95) {   // 0 px: bilinçli gizlenmiş etiket (ör. DevStagePage telefonda yalnız nokta)
      smallCount++;
      const cls = (e.getAttribute('class') || e.tagName.toLowerCase()).split(/\s+/)[0];
      const k = fs.toFixed(1) + 'px ' + cls;
      if (!small.has(k)) small.set(k, []);
      small.get(k).push(t.slice(0, 28));
    }
  });
  out.smallCount = smallCount;
  out.smallText = [...small.entries()].map(([k, v]) => k + ' x' + v.length + ': ' + v.slice(0, 2).join(' | '));
  return JSON.stringify(out);
})()
"""

try:
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
        except Exception:
            time.sleep(0.25)
    ws = websocket.create_connection([t for t in tabs if t['type'] == 'page'][0]['webSocketDebuggerUrl'], timeout=120)
    mid = [0]; logs = []
    def cdp(method, **params):
        mid[0] += 1; ws.send(json.dumps({'id': mid[0], 'method': method, 'params': params}))
        while True:
            m = json.loads(ws.recv())
            if m.get('method') == 'Runtime.exceptionThrown':
                logs.append('EXC ' + m['params']['exceptionDetails'].get('exception', {}).get('description', '')[:160])
            if m.get('method') == 'Runtime.consoleAPICalled' and m['params']['type'] == 'error':
                logs.append('ERR ' + ' '.join(str(a.get('value', a.get('description', '')))[:160] for a in m['params']['args']))
            if m.get('method') == 'Network.responseReceived' and m['params']['response']['status'] >= 400:
                logs.append(f"HTTP{m['params']['response']['status']} " + m['params']['response']['url'][-80:])
            if m.get('id') == mid[0]:
                return m.get('result', m.get('error'))
    cdp('Emulation.setDeviceMetricsOverride', width=W, height=H0, deviceScaleFactor=DPR, mobile=PHONE)
    if PHONE:
        cdp('Emulation.setTouchEmulationEnabled', enabled=True)
        cdp('Emulation.setUserAgentOverride', userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    cdp('Page.enable'); cdp('Runtime.enable'); cdp('Network.enable')
    ev = lambda e: (cdp('Runtime.evaluate', expression=e, returnByValue=True, awaitPromise=True) or {}).get('result', {}).get('value')
    report = {}
    for path in paths:
        logs.clear()
        q = '' if yon == 'canli' else f'?yon={yon}'
        cdp('Page.navigate', url=base + path + q); time.sleep(4)
        ev("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
        ev("Promise.race([Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))).then(()=>document.fonts.ready), new Promise(r=>setTimeout(r,6000))]).then(()=>1)")
        time.sleep(0.8)
        name = (path.strip('/').replace('/', '_') or 'anasayfa')
        shot = cdp('Page.captureScreenshot', format='png')
        open(f'{outdir}/{name}-ilk.png', 'wb').write(base64.b64decode(shot['data']))
        # Tam sayfa: kaydırarak birleştir (FadeContent ve lazy bileşenler kaydırınca belirir). Yapışkan bar yalnız ilk karede.
        Hh = min(ev('document.documentElement.scrollHeight') or H0, 12000)
        ev("[...document.querySelectorAll('body *')].filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position)).forEach(e=>e.dataset.pos=1)")
        canvas = Image.new('RGB', (W, Hh), (255, 255, 255)); y = 0; first = True
        while y < Hh:
            ev(f"window.scrollTo({{top:{y},behavior:'instant'}})"); time.sleep(0.7)
            if not first:
                ev("document.querySelectorAll('[data-pos]').forEach(e=>e.style.visibility='hidden')")
            first = False
            sy = ev('scrollY')
            s = cdp('Page.captureScreenshot', format='png')
            im = Image.open(io.BytesIO(base64.b64decode(s['data']))).resize((W, H0))
            canvas.paste(im, (0, int(sy)))
            if sy + H0 >= Hh: break
            y += H0
        Hh2 = ev('document.documentElement.scrollHeight') or Hh
        a = json.loads(ev(AUDIT) or '{}')   # ölçüm, tüm bölümler belirdikten sonra
        ev("document.querySelectorAll('[data-pos]').forEach(e=>e.style.visibility='')")
        ev("window.scrollTo({top:0,behavior:'instant'})")
        canvas.crop((0, 0, W, min(Hh, Hh2))).save(f'{outdir}/{name}-tam.png')
        a['logs'] = list(dict.fromkeys(logs))[:10]
        report[path] = a
        print(f"{path} yon={yon} w={W} sw={a.get('scrollW')} kart1={a.get('firstCardY')} ders1={a.get('firstLessonY')} arac1={a.get('firstToolY')} kucuk={a.get('smallCount')} h={a.get('height')} log={len(a['logs'])}", flush=True)
    json.dump(report, open(f'{outdir}/olcum.json', 'w'), ensure_ascii=False, indent=1)
finally:
    proc.terminate()
