# Masaüstü yerleşim eşitliği: her öğenin yerleşim kutusu (offsetLeft/Top/Width/Height, dönüşümden bağımsız)
# ve yazı boyu, yön parametresiyle ve parametresiz karşılaştırılır. Animasyonlu ekran görüntüsü farkından bağımsız kanıt.
# kullanım: python3 yerlesim.py <base> <genişlik> <referans-yon> <yon1,yon2,...> yol1 yol2 ...
#   yon "canli" ise base yerine https://hamaratlabs.com kullanılır.
import json, subprocess, sys, time, urllib.request
import websocket
base, width, ref, yons, paths = sys.argv[1].rstrip('/'), int(sys.argv[2]), sys.argv[3], sys.argv[4].split(','), sys.argv[5:]
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; port = 9479
prof = '/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/yerlesim-prof'
p = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
JS = r"""
(() => {
  const skip = e => e.closest('.insta, .flex-carousel, .flex-carousel-fallback, iframe, .lanyard, .crystal-ball, svg, canvas');
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
    def grab(yon, path):
        url = ('https://hamaratlabs.com' + path) if yon == 'canli' else (base + path + f'?yon={yon}')
        cdp('Page.navigate', url=url); time.sleep(4)
        h = cdp('Runtime.evaluate', expression='document.documentElement.scrollHeight', returnByValue=True)['result']['value']
        for y in range(0, h, 700):
            cdp('Runtime.evaluate', expression=f"window.scrollTo({{top:{y},behavior:'instant'}})"); time.sleep(0.25)
        time.sleep(1)
        return json.loads(cdp('Runtime.evaluate', expression=JS, returnByValue=True)['result']['value'])
    for path in paths:
        r = grab(ref, path)
        line = [f'{path}: {ref} {len(r)} öğe']
        for y in yons:
            o = grab(y, path)
            if len(o) != len(r):
                line.append(f'{y}: öğe sayısı farklı ({len(o)})'); continue
            bad = [(a, b) for a, b in zip(r, o) if a != b]
            line.append(f'{y}: {len(bad)} farklı' + (f' ilk: {bad[0]}' if bad else ''))
        print(' | '.join(line), flush=True)
finally:
    p.terminate()
