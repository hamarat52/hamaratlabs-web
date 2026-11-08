# Yerleşim eşitliği, iki ayrı derleme arasında: her öğenin yerleşim kutusu (offsetLeft/Top/Width/Height) ve yazı boyu.
# yerlesim.py'nin iki adresli hali (önceki derleme ↔ yeni derleme). Kaldırılan öğeler (.grounds, .tints) ve telefonda
# artık kurulmayan TechText kutusu (.breath__tech) iki tarafta da sayım dışı.
# kullanım: python3 yerlesim2.py <ref-url-öneki> <ref-sorgu> <yeni-url-öneki> <yeni-sorgu> <genişlik> yol1 yol2 ...
#   sorgu "-" ise boş (ör. ref "?yon=b", yeni "-").
import json, subprocess, sys, time, urllib.request
import websocket

ref_base, ref_q, new_base, new_q, width, paths = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3].rstrip('/'), sys.argv[4], int(sys.argv[5]), sys.argv[6:]
ref_q = '' if ref_q == '-' else ref_q
new_q = '' if new_q == '-' else new_q
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; port = 9483
prof = '/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/yerlesim2-prof'
p = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
JS = r"""
(() => {
  const skip = e => e.closest('.insta, .flex-carousel, .flex-carousel-fallback, iframe, .lanyard, .crystal-ball, svg, canvas, .grounds, .tints, .breath__tech');
  return JSON.stringify([...document.querySelectorAll('header *, main *, footer *')].filter(e => e instanceof HTMLElement && !skip(e))
    .map(e => [e.tagName, (e.getAttribute('class') || '').split(' ')[0], e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight, getComputedStyle(e).fontSize, getComputedStyle(e).display]));
})()
"""
try:
    for _ in range(60):
        try: tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
        except Exception: time.sleep(0.25)
    ws = websocket.create_connection([t for t in tabs if t['type'] == 'page'][0]['webSocketDebuggerUrl'], timeout=60)
    mid = [0]
    def cdp(m, **pa):
        mid[0] += 1; ws.send(json.dumps({'id': mid[0], 'method': m, 'params': pa}))
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == mid[0]: return r.get('result', r.get('error'))
    phone = width < 700
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=844 if phone else 800, deviceScaleFactor=1, mobile=phone)
    def grab(url):
        cdp('Page.navigate', url=url); time.sleep(4)
        h = cdp('Runtime.evaluate', expression='document.documentElement.scrollHeight', returnByValue=True)['result']['value']
        for y in range(0, h, 700):
            cdp('Runtime.evaluate', expression=f"window.scrollTo({{top:{y},behavior:'instant'}})"); time.sleep(0.25)
        time.sleep(1)
        return json.loads(cdp('Runtime.evaluate', expression=JS, returnByValue=True)['result']['value'])
    for path in paths:
        r = grab(ref_base + path + ref_q)
        o = grab(new_base + path + new_q)
        if len(o) != len(r):
            print(f'{path} w={width}: öğe sayısı farklı (ref {len(r)}, yeni {len(o)})', flush=True); continue
        bad = [(a, b) for a, b in zip(r, o) if a != b]
        print(f'{path} w={width}: ref {len(r)} öğe, {len(bad)} farklı' + (f' ilk: {bad[:3]}' if bad else ''), flush=True)
finally:
    p.terminate()
