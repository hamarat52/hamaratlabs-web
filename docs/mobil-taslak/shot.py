# Tek görüntü: python3 shot.py URL çıktı.png [bekleme-sn] [kaydırma-y] [genişlik]
import json, subprocess, sys, time, urllib.request, os, base64
import websocket
url, out = sys.argv[1], sys.argv[2]
wait = float(sys.argv[3]) if len(sys.argv) > 3 else 5
sy = sys.argv[4] if len(sys.argv) > 4 else '0'
width = int(sys.argv[5]) if len(sys.argv) > 5 else 390
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; port = 9478
prof = '/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/shot-prof'
p = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=844 if phone else 800, deviceScaleFactor=2 if phone else 1, mobile=phone)
    if phone: cdp('Emulation.setTouchEmulationEnabled', enabled=True)
    cdp('Page.navigate', url=url); time.sleep(2)
    for part in sy.split(','):
        if part.startswith('#'):
            cdp('Runtime.evaluate', expression=f"document.querySelector('{part}').scrollIntoView({{behavior:'instant',block:'start'}})")
        else:
            cdp('Runtime.evaluate', expression=f"window.scrollTo({{top:{part},behavior:'instant'}})")
        time.sleep(0.4)
    time.sleep(max(0, wait - 2))
    if len(sys.argv) > 6:
        print(json.dumps(cdp('Runtime.evaluate', expression=sys.argv[6], returnByValue=True, awaitPromise=True).get('result', {}).get('value'), ensure_ascii=False))
    s = cdp('Page.captureScreenshot', format='png')
    open(out, 'wb').write(base64.b64decode(s['data'])); print(out)
finally:
    p.terminate()
