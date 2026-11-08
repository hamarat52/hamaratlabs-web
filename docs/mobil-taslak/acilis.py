# Açılış denetimi: seçiciler DOM'da yok mu, eski kayıtlı seçim (hl-ground=ascii, hl-tint=amber) yok sayılıyor mu,
# ?yon=a bir şey değiştiriyor mu, telefonda h1 görünür ve TechText kurulmamış mı.
# kullanım: python3 acilis.py <base> <genişlik>
import json, subprocess, sys, time, urllib.request
import websocket

base, width = sys.argv[1].rstrip('/'), int(sys.argv[2])
PHONE = width < 700
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; port = 9484
prof = f'/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/acilis-prof-{width}'
p = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PROBE = r"""
(() => {
  const h1 = document.querySelector('.breath__foot h1');
  const cs = h1 && getComputedStyle(h1);
  const bg = document.querySelector('.breath__bg');
  return JSON.stringify({
    tints: !!document.querySelector('.tints'), grounds: !!document.querySelector('.grounds'),
    bgChildren: bg ? [...bg.children].map(c => c.tagName + '.' + (c.getAttribute('class') || '').split(' ')[0]) : null,
    lyColor: getComputedStyle(document.querySelector('.lanyard')).getPropertyValue('--ly-color').trim(),
    dataYon: document.documentElement.dataset.yon || null,
    techText: !!document.querySelector('.breath__tech'),
    techCanvas: document.querySelectorAll('.breath__tech canvas').length,
    h1: h1 ? { position: cs.position, fontSize: cs.fontSize, w: Math.round(h1.getBoundingClientRect().width), h: Math.round(h1.getBoundingClientRect().height) } : null,
    ls: { ground: localStorage.getItem('hl-ground'), tint: localStorage.getItem('hl-tint') },
    sectionPad: getComputedStyle(document.querySelector('.section') || document.body).paddingTop,
  });
})()
"""
try:
    for _ in range(60):
        try: tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
        except Exception: time.sleep(0.25)
    ws = websocket.create_connection([t for t in tabs if t['type'] == 'page'][0]['webSocketDebuggerUrl'], timeout=60)
    mid = [0]; reqs = []; logs = []
    def cdp(m, **pa):
        mid[0] += 1; ws.send(json.dumps({'id': mid[0], 'method': m, 'params': pa}))
        while True:
            r = json.loads(ws.recv())
            if r.get('method') == 'Network.requestWillBeSent': reqs.append(r['params']['request']['url'])
            if r.get('method') == 'Network.responseReceived' and r['params']['response']['status'] >= 400:
                logs.append(f"HTTP{r['params']['response']['status']} {r['params']['response']['url'][-60:]}")
            if r.get('method') == 'Runtime.exceptionThrown': logs.append('EXC')
            if r.get('method') == 'Runtime.consoleAPICalled' and r['params']['type'] == 'error': logs.append('ERR')
            if r.get('id') == mid[0]: return r.get('result', r.get('error'))
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=844 if PHONE else 800, deviceScaleFactor=1, mobile=PHONE)
    if PHONE: cdp('Emulation.setTouchEmulationEnabled', enabled=True)
    cdp('Page.enable'); cdp('Runtime.enable'); cdp('Network.enable')
    ev = lambda e: cdp('Runtime.evaluate', expression=e, returnByValue=True)['result'].get('value')
    def probe(label, url):
        reqs.clear(); logs.clear()
        cdp('Page.navigate', url=url); time.sleep(4)
        r = json.loads(ev(PROBE))
        r['effect_chunks'] = [u.split('/')[-1] for u in reqs if 'ASCII' in u or 'Glitch' in u]
        r['logs'] = logs[:]
        print(f'w={width} {label}: {json.dumps(r, ensure_ascii=False)}', flush=True)
    probe('temiz', base + '/')
    ev("localStorage.setItem('hl-ground','ascii'); localStorage.setItem('hl-tint','amber'); 1")
    probe('hl-ground=ascii hl-tint=amber', base + '/')
    probe('?yon=a', base + '/?yon=a')
    ev("localStorage.clear(); sessionStorage.clear(); 1")
finally:
    p.terminate()
