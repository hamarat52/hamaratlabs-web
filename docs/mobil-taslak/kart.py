# Sarkan kart (Lanyard) kaydırma testi. Her karede (rAF) kartın ve açılış alanının (.breath) kutusunu kaydeder.
# Evreler: (1) tekerlek 300 aşağı + 300 yukarı, (2) dokunmatik fırlatma 2500 aşağı + yukarı (momentumlu),
# (3) tekerlek 4x300 aşağı + 4x300 yukarı, (4) yalnız telefonda: görünüm yüksekliği 844 → 760 → 844 (adres çubuğu benzeri).
# kullanım: python3 kart.py <url> <390|1280> <çıktı.json>
import json, subprocess, sys, time, urllib.request, os
import websocket

url, width, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
PHONE = width < 700
W, H0, DPR = (width, 844, 2) if PHONE else (width, 800, 1)
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
port = 9481 if PHONE else 9482
prof = f'/Users/hamaratbey/.hermes/profiles/webdev/cache/scratch/kart-prof-{port}'
POST = 6.0  # her evreden sonra dinlenme penceresi (sn)
GX = int(W * 0.12)  # kaydırma hareketinin x'i: kartın dışında
GPU = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] if os.environ.get('KART_GPU', '1') == '1' else []
proc = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', *GPU, f'--remote-debugging-port={port}', f'--user-data-dir={prof}', 'about:blank'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

SAMPLER = r"""
(() => {
  window.__s = []; window.__m = [];
  const hero = document.querySelector('.breath');
  const card = document.querySelector('.breath__lanyard .lanyard__card');
  const f = t => {
    const c = card.getBoundingClientRect(), h = hero.getBoundingClientRect();
    __s.push([t, scrollY, c.left, c.right, c.top, c.bottom, h.left, h.right, h.top, h.bottom, innerWidth, innerHeight]);
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  window.__mark = n => __m.push([performance.now(), n]);
  return 1;
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
    ev = lambda e: (cdp('Runtime.evaluate', expression=e, returnByValue=True, awaitPromise=True) or {}).get('result', {}).get('value')
    metrics = lambda h: cdp('Emulation.setDeviceMetricsOverride', width=W, height=h, deviceScaleFactor=DPR, mobile=PHONE)
    metrics(H0)
    if PHONE:
        cdp('Emulation.setTouchEmulationEnabled', enabled=True, maxTouchPoints=5)
        cdp('Emulation.setUserAgentOverride', userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    cdp('Page.enable'); cdp('Runtime.enable'); cdp('Network.enable')
    cdp('Page.navigate', url=url); time.sleep(1.5)
    ev(SAMPLER)
    mark = lambda n: ev(f'__mark({json.dumps(n)})')
    # açılış bırakılışı + esinti sönene kadar bekle: son 2 sn'de kart merkezi 1 px'ten az oynamalı (en çok 45 sn)
    STABLE = "(() => { const t = performance.now(); const w = __s.filter(r => r[0] > t - 2000).map(r => (r[2] + r[3]) / 2);" \
             " return w.length > 5 && Math.max(...w) - Math.min(...w) < 1; })()"
    t_wait = time.time()
    time.sleep(8)
    while time.time() - t_wait < 45 and not ev(STABLE):
        time.sleep(0.5)
    wait_rest = round(time.time() - t_wait, 1)
    mark('dinlenme')
    time.sleep(1.0)

    def wheel(dy):
        cdp('Input.dispatchMouseEvent', type='mouseWheel', x=GX, y=H0 // 2, deltaX=0, deltaY=dy)

    mark('e1'); wheel(300); time.sleep(0.8); wheel(-300); time.sleep(0.4); mark('e1-son'); time.sleep(POST)
    mark('e2')
    kind = 'touch' if PHONE else 'mouse'
    # Parmak kartın dışından (sol kenara yakın) kaydırır: kart dokunmatikte sürüklenebilir (touch-action: none),
    # kartın üstünden başlayan hareket kaydırma değil sürüklemedir.
    cdp('Input.synthesizeScrollGesture', x=GX, y=int(H0 * 0.8), yDistance=-2500, speed=4000, gestureSourceType=kind, preventFling=False)
    time.sleep(1.5)
    for _ in range(3):
        if (ev('scrollY') or 0) <= 0: break
        cdp('Input.synthesizeScrollGesture', x=GX, y=int(H0 * 0.2), yDistance=2500, speed=4000, gestureSourceType=kind, preventFling=False)
        time.sleep(1.2)
    mark('e2-son'); time.sleep(POST)
    mark('e3')
    for _ in range(4): wheel(300); time.sleep(0.35)
    time.sleep(0.6)
    for _ in range(4): wheel(-300); time.sleep(0.35)
    ev("window.scrollTo({top:0,behavior:'instant'})"); time.sleep(0.2)
    mark('e3-son'); time.sleep(POST)
    if PHONE:
        mark('e4'); metrics(760); time.sleep(0.6); metrics(H0); time.sleep(0.2); mark('e4-son'); time.sleep(POST)
    mark('bitti')
    data = {'s': ev('__s'), 'm': ev('__m'), 'logs': logs, 'url': url, 'width': W, 'wait_rest': wait_rest}
    json.dump(data, open(out, 'w'))
finally:
    proc.terminate()

# ---------- çözümleme ----------
s, m = data['s'], dict((n, t) for t, n in data['m'])
cx = lambda r: (r[2] + r[3]) / 2
cyr = lambda r: (r[4] + r[5]) / 2 - r[8]  # kart merkezi, açılış alanının üstüne göre
rest = [r for r in s if m['dinlenme'] <= r[0] < m['dinlenme'] + 900]
rx = sum(map(cx, rest)) / len(rest); ry = sum(map(cyr, rest)) / len(rest)
cw = sum(r[3] - r[2] for r in rest) / len(rest)
REST_TOL = 4.0
dts = [b[0] - a[0] for a, b in zip(s, s[1:])]
res = {'url': url, 'width': W, 'dinlenme_x': round(rx, 1), 'kart_kutusu_genislik': round(cw, 1), 'konsol': logs,
       'ortalama_fps': round(1000 / (sum(dts) / len(dts)), 1), 'acilis_dinlenme_bekleme_sn': data['wait_rest'], 'evreler': {}}
intro = [r for r in s if r[0] < m['dinlenme']]
res['acilis_gorus_disi_kare'] = sum(1 for r in intro if r[2] < 0 or r[3] > r[10])
for e in ['e1', 'e2', 'e3', 'e4']:
    if e not in m: continue
    t0, t1 = m[e], m[e + '-son']
    nxt = min(v for k, v in m.items() if v > t1)
    fr = [r for r in s if t0 <= r[0] < nxt]
    vis = [r for r in fr if r[9] > 0]  # açılış alanı görünürken
    dx = [cx(r) - rx for r in vis]; dy = [cyr(r) - ry for r in vis]
    out_view = sum(1 for r in vis if r[2] < 0 or r[3] > r[10])
    out_hero = sum(1 for r in vis if r[2] < r[6] or r[3] > r[7] or r[4] < r[8] - 1 or r[5] > r[9] + 1)
    # dinlenme: kaydırma bittikten (son scrollY değişimi) sonra |dx|,|dy| ≤ 4 px kalıcı olduğu ilk an
    last_scroll = t0
    for a, b in zip(fr, fr[1:]):
        if b[1] != a[1] or b[11] != a[11]: last_scroll = b[0]
    after = [r for r in fr if r[0] >= last_scroll]
    settle = None
    for i, r in enumerate(after):
        if all(abs(cx(q) - rx) <= REST_TOL and abs(cyr(q) - ry) <= REST_TOL for q in after[i:]):
            settle = round((r[0] - last_scroll) / 1000, 2); break
    # kare başına en büyük yatay sıçrama
    jump = max([abs(cx(b) - cx(a)) for a, b in zip(vis, vis[1:]) if b[0] - a[0] < 40] or [0])
    res['evreler'][e] = {
        'kare': len(fr), 'gorunur_kare': len(vis), 'max_scrollY': max(r[1] for r in fr),
        'max_yatay_sapma': round(max(map(abs, dx)) if dx else 0, 1),
        'sapma_sag': round(max(dx) if dx else 0, 1), 'sapma_sol': round(min(dx) if dx else 0, 1),
        'max_dikey_sapma': round(max(map(abs, dy)) if dy else 0, 1),
        'kare_basina_max_yatay_sicrama': round(jump, 1),
        'min_sol_bosluk': round(min(r[2] for r in vis), 1) if vis else None,
        'min_sag_bosluk': round(min(r[10] - r[3] for r in vis), 1) if vis else None,
        'gorus_disi_kare': out_view, 'hero_disi_kare': out_hero,
        'dinlenme_sn': settle,
    }
json.dump(res, open(out.replace('.json', '-ozet.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False))
