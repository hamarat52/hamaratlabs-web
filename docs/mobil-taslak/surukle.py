# Sürükleme denetimi: kart dokunmatikle (telefon) ya da fareyle (masaüstü) tutulup 90 px yana, 40 px aşağı çekilir,
# bırakılır. Kart parmağı izlemeli, bırakınca sallanıp askı noktasının altına dönmeli.
# kullanım: python3 surukle.py <url> <genişlik>
import json, subprocess, sys, time, urllib.request
import websocket

url, width = sys.argv[1], int(sys.argv[2])
PHONE = width < 700
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; port = 9485
prof = f'/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/surukle-prof-{width}'
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
    H = 844 if PHONE else 800
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=H, deviceScaleFactor=1, mobile=PHONE)
    if PHONE: cdp('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
    cdp('Page.enable'); cdp('Runtime.enable')
    ev = lambda e: cdp('Runtime.evaluate', expression=e, returnByValue=True)['result'].get('value')
    cdp('Page.navigate', url=url); time.sleep(22)  # açılış bırakılışı söner
    box = lambda: ev("(() => { const r = document.querySelector('.breath__lanyard .lanyard__card').getBoundingClientRect(); return [(r.left + r.right) / 2, (r.top + r.bottom) / 2]; })()")
    x0, y0 = box()
    def press(kind, x, y):
        if PHONE:
            cdp('Input.dispatchTouchEvent', type=kind, touchPoints=[] if kind == 'touchEnd' else [{'x': x, 'y': y}])
        else:
            t = {'touchStart': 'mousePressed', 'touchMove': 'mouseMoved', 'touchEnd': 'mouseReleased'}[kind]
            cdp('Input.dispatchMouseEvent', type=t, x=x, y=y, button='left', buttons=1 if kind != 'touchEnd' else 0, clickCount=1)
    press('touchStart', x0, y0)
    for i in range(1, 19):
        press('touchMove', x0 + 5 * i, y0 + 2.2 * i); time.sleep(0.03)
    time.sleep(0.5)
    xd, yd = box()
    press('touchEnd', x0 + 90, y0 + 40)
    track = []
    for _ in range(40):
        time.sleep(0.25); track.append(round(box()[0] - x0, 1))
    print(json.dumps({'url': url, 'w': width, 'dinlenme': [round(x0, 1), round(y0, 1)],
                      'surukleme_sonu_fark': [round(xd - x0, 1), round(yd - y0, 1)],
                      'birakinca_yatay_fark_0.25sn_aralik': track}, ensure_ascii=False))
finally:
    p.terminate()
