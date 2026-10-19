"""Fikir panosu v2 doğrulaması: izole headless Chrome (port 9555) üzerinde CDP ile
render, ölçüm, fare ve dokunmatik sürükleme, ekran görüntüsü."""
import base64, json, sys, time, urllib.request
from websockets.sync.client import connect

BASE = 'http://localhost:5191/idea-board-test.html'
PROOF = '/Users/hamaratbey/Desktop/Projeler/hamaratlabs-web-wt-fikir/.design-proof/'
RESULTS = {}


class Tab:
    def __init__(self):
        req = urllib.request.Request('http://127.0.0.1:9555/json/new?about:blank', method='PUT')
        info = json.load(urllib.request.urlopen(req))
        self.id = info['id']
        self.ws = connect(info['webSocketDebuggerUrl'], max_size=2**27)
        self.n = 0

    def cdp(self, method, **params):
        self.n += 1
        mid = self.n
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == mid:
                if 'error' in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get('result', {})

    def js(self, expr):
        r = self.cdp('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(r['exceptionDetails'])
        return r['result'].get('value')

    def close(self):
        self.ws.close()
        urllib.request.urlopen(f'http://127.0.0.1:9555/json/close/{self.id}')


def open_board(tab, slug, width, height, mobile):
    tab.cdp('Emulation.setDeviceMetricsOverride', width=width, height=height,
            deviceScaleFactor=2 if mobile else 1, mobile=mobile)
    tab.cdp('Emulation.setTouchEmulationEnabled', enabled=mobile, maxTouchPoints=5 if mobile else 1)
    tab.cdp('Page.enable')
    tab.cdp('Page.navigate', url=f'{BASE}?app={slug}')
    for _ in range(100):
        time.sleep(0.15)
        try:
            ok = tab.js("!!document.querySelector('.ib-board.is-ready') && document.fonts.check('700 40px Caveat')")
        except Exception:
            ok = False
        if ok:
            break
    time.sleep(1.6)  # giriş animasyonu (8 not x 70ms + 550ms)
    return tab.js("document.fonts.check('700 40px Caveat')")


METRICS_JS = r"""
(() => {
  const board = document.querySelector('.ib-board');
  const b = board.getBoundingClientRect();
  const notes = [...document.querySelectorAll('.ib-note')];
  const rects = notes.map(n => n.getBoundingClientRect());
  const out = rects.filter(r => r.left < b.left - 0.5 || r.top < b.top - 0.5 || r.right > b.right + 0.5 || r.bottom > b.bottom + 0.5).length;
  // Dönmüş kâğıtların (gövde) görünür köşeleri de pano içinde mi
  const papers = [...document.querySelectorAll('.ib-note__paper')].map(p => p.getBoundingClientRect());
  const paperOut = papers.filter(r => r.left < b.left || r.top < b.top || r.right > b.right || r.bottom > b.bottom).length;
  let overlaps = 0;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], c = rects[j];
    const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left);
    const iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (ix > 4 && iy > 4) overlaps++;
  }
  // Kâğıt dışında görünen metin: makale içindeki tüm görünür metin düğümlerinden
  // not kâğıdı, geri linki, sr-only ve yorum alanı dışındakiler.
  const art = document.querySelector('.ideaboard');
  const walker = document.createTreeWalker(art, NodeFilter.SHOW_TEXT);
  const outside = [];
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (el.closest('.ib-note__paper, .ideaboard__back, .sr-only, link, .comments')) continue;
    outside.push(t.textContent.trim());
  }
  const bigQ = [...art.querySelectorAll('*')].filter(e => e.childElementCount === 0 && e.textContent.trim() === '?').length;
  return {
    viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    board: { w: Math.round(b.width), h: Math.round(b.height) },
    notes: notes.length, emptyNotes: document.querySelectorAll('.ib-note.is-empty').length,
    notesOutsideBoard: out, rotatedPaperOutsideBoard: paperOut, overlappingPairs: overlaps,
    textOutsidePaper: outside, questionMarkGlyphs: bigQ,
    clusterTitles: document.querySelectorAll('.ib-board h2, .ib-cluster, .ib-cluster__title, .ideaboard__kicker, .ideaboard__hand').length
  };
})()
"""


def note_rect(tab, key):
    return tab.js(f"""(() => {{
      const n = document.querySelector('[data-note="{key}"]');
      const b = document.querySelector('.ib-board').getBoundingClientRect();
      const r = n.getBoundingClientRect();
      return {{ x: Math.round(r.left - b.left), y: Math.round(r.top - b.top), w: Math.round(r.width), h: Math.round(r.height),
               cx: r.left + r.width / 2, cy: r.top + r.height / 2, transform: n.style.transform,
               lifted: n.classList.contains('is-lifted'), z: n.style.zIndex,
               boardW: Math.round(b.width), boardH: Math.round(b.height) }};
    }})()""")


def scroll_to(tab, key):
    tab.js(f"document.querySelector('[data-note=\"{key}\"]').scrollIntoView({{block: 'center', behavior: 'instant'}})")
    time.sleep(0.8)


def hit(tab, x, y):
    return tab.js(f"(() => {{ const e = document.elementFromPoint({x}, {y}); const n = e && e.closest('.ib-note'); return n ? n.dataset.note : null; }})()")


def grab_point(tab, key):
    """Notun üstte kalan (başka not altında olmayan) bir noktasını bul."""
    return tab.js(f"""(() => {{
      const n = document.querySelector('[data-note="{key}"]');
      const r = n.getBoundingClientRect();
      for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8]) for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) {{
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        const e = document.elementFromPoint(x, y);
        if (e && e.closest('.ib-note') === n) return [x, y];
      }}
      return [r.left + r.width / 2, r.top + r.height / 2];
    }})()""")


def toward_center(r, dx, dy):
    """Sınıra çarpmadan ölçmek için hareketi panonun ortasına doğru çevir."""
    return (abs(dx) if r['x'] + r['w'] / 2 < r['boardW'] / 2 else -abs(dx),
            abs(dy) if r['y'] + r['h'] / 2 < r['boardH'] / 2 else -abs(dy))


def mouse_drag(tab, key, dx, dy, steps=14, check_mid=False, inward=False, mid_shot=None):
    scroll_to(tab, key)
    r = note_rect(tab, key)
    if inward:
        dx, dy = toward_center(r, dx, dy)
    x, y = grab_point(tab, key)
    r['hit'] = hit(tab, x, y)
    r['requested'] = {'dx': dx, 'dy': dy}
    tab.cdp('Input.dispatchMouseEvent', type='mouseMoved', x=x, y=y)
    tab.cdp('Input.dispatchMouseEvent', type='mousePressed', x=x, y=y, button='left', buttons=1, clickCount=1)
    mid = None
    for i in range(1, steps + 1):
        tab.cdp('Input.dispatchMouseEvent', type='mouseMoved', x=x + dx * i / steps, y=y + dy * i / steps, button='left', buttons=1)
        time.sleep(0.016)
        if check_mid and i == steps // 2:
            mid = note_rect(tab, key)
            if mid_shot:
                time.sleep(0.25)
                open(mid_shot, 'wb').write(base64.b64decode(tab.cdp('Page.captureScreenshot', format='png')['data']))
    tab.cdp('Input.dispatchMouseEvent', type='mouseReleased', x=x + dx, y=y + dy, button='left', buttons=0, clickCount=1)
    time.sleep(0.5)
    return r, note_rect(tab, key), mid


def touch_drag(tab, key, dx, dy, hold=0.3, steps=14, inward=False):
    scroll_to(tab, key)
    r = note_rect(tab, key)
    if inward:
        dx, dy = toward_center(r, dx, dy)
    x, y = grab_point(tab, key)
    r['hit'] = hit(tab, x, y)
    r['requested'] = {'dx': dx, 'dy': dy}
    sy0 = tab.js('scrollY')
    t0 = time.perf_counter()
    tab.cdp('Input.dispatchTouchEvent', type='touchStart', touchPoints=[{'x': x, 'y': y}])
    time.sleep(hold)
    mid = note_rect(tab, key) if hold >= 0.1 else None
    first_move_ms = None
    for i in range(1, steps + 1):
        tab.cdp('Input.dispatchTouchEvent', type='touchMove', touchPoints=[{'x': x + dx * i / steps, 'y': y + dy * i / steps}])
        if first_move_ms is None:
            first_move_ms = round((time.perf_counter() - t0) * 1000)
        if mid is None:
            mid = note_rect(tab, key)
        time.sleep(0.016)
    tab.cdp('Input.dispatchTouchEvent', type='touchEnd', touchPoints=[])
    time.sleep(0.5)
    return r, note_rect(tab, key), mid, {'scrollBefore': sy0, 'scrollAfter': tab.js('scrollY'), 'firstMoveAfterMs': first_move_ms}


def shot(tab, path, mobile=False):
    tab.js('scrollTo(0,0)')
    h = tab.js("Math.ceil(document.querySelector('.ib-board').getBoundingClientRect().bottom + scrollY + 40)")
    w = tab.js('innerWidth')
    vh = tab.js('innerHeight')
    # Tam sayfa için viewport'u yükselt (genişlik aynı kalır), sonra geri al.
    tab.cdp('Emulation.setDeviceMetricsOverride', width=w, height=max(h, vh), deviceScaleFactor=2 if mobile else 1, mobile=mobile)
    time.sleep(0.4)
    data = tab.cdp('Page.captureScreenshot', format='png',
                   clip={'x': 0, 'y': 0, 'width': w, 'height': h, 'scale': 1})['data']
    tab.cdp('Emulation.setDeviceMetricsOverride', width=w, height=vh, deviceScaleFactor=2 if mobile else 1, mobile=mobile)
    with open(path, 'wb') as f:
        f.write(base64.b64decode(data))
    return path


def summary(before, after):
    return {'hitKey': before.get('hit'), 'requested': before.get('requested'),
            'before': {k: before[k] for k in ('x', 'y')}, 'after': {k: after[k] for k in ('x', 'y')},
            'delta': {'x': after['x'] - before['x'], 'y': after['y'] - before['y']},
            'transformAfter': after['transform']}


def main():
    t = Tab()
    try:
        # 1) Dört ürün, masaüstü ve 375 render + ölçüm + ekran görüntüsü
        for slug, name in [('pomodoro-restoran', 'pomodoro'), ('duo-for-x', 'duo'), ('titimer', 'titimer'), ('kitabe', 'kitabe')]:
            font = open_board(t, slug, 1280, 900, False)
            m = t.js(METRICS_JS); m['caveat'] = font
            RESULTS[f'desktop:{slug}'] = m
            shot(t, f'{PROOF}idea-board-v2-{name}.png')
            font = open_board(t, slug, 375, 812, True)
            m = t.js(METRICS_JS); m['caveat'] = font
            RESULTS[f'mobile375:{slug}'] = m
            shot(t, f'{PROOF}idea-board-v2-{name}-375.png', True)

        # 2) Masaüstü fare sürükleme (tiTimer, gerçek içerik)
        open_board(t, 'titimer', 1280, 900, False)
        b, a, mid = mouse_drag(t, 'text-2', 300, 150, check_mid=True, inward=True, mid_shot=f'{PROOF}idea-board-v2-suruklerken.png')
        RESULTS['mouse:titimer:text-2'] = {**summary(b, a), 'liftedDuringDrag': mid['lifted'], 'liftedAfter': a['lifted']}
        # Sınır: panonun çok dışına at -> sınıra yapışmalı
        b2, a2, _ = mouse_drag(t, 'check-7', 4000, 4000)
        RESULTS['mouse:titimer:check-7:clamp'] = {**summary(b2, a2), 'board': {'w': a2['boardW'], 'h': a2['boardH']},
                                                    'insideBoard': a2['x'] >= 0 and a2['y'] >= 0 and a2['x'] + a2['w'] <= a2['boardW'] and a2['y'] + a2['h'] <= a2['boardH']}
        b3, a3, _ = mouse_drag(t, 'text-3', -500, -900)
        RESULTS['mouse:titimer:text-3:clamp-top-left'] = {**summary(b3, a3), 'insideBoard': a3['x'] >= 0 and a3['y'] >= 0}
        # Tıklama ile sürükleme ayrımı: 3px hareket tıklama sayılmalı, 120px sürükleme tıklamayı yutmalı
        t.js("window.__clicks = 0; document.querySelectorAll('.ib-note').forEach(n => n.addEventListener('click', () => window.__clicks++))")
        bc, ac, _ = mouse_drag(t, 'name-0', 3, 0, steps=2)
        clicks_small = t.js('window.__clicks')
        bd, ad, _ = mouse_drag(t, 'name-0', 240, 160, inward=True)
        clicks_after_drag = t.js('window.__clicks')
        RESULTS['mouse:titimer:click-vs-drag'] = {
            'press3px': {**summary(bc, ac), 'clickFired': clicks_small == 1},
            'drag': {**summary(bd, ad), 'clickSwallowed': clicks_after_drag == clicks_small}}
        RESULTS['desktop:titimer:after-drag'] = t.js(METRICS_JS)
        # Pencere geçici daralıp geri genişleyince taşınan notlar yerinde kalmalı
        pos_js = "Object.fromEntries([...document.querySelectorAll('.ib-note')].map(n => [n.dataset.note, n.style.transform]))"
        p0 = t.js(pos_js)
        t.cdp('Emulation.setDeviceMetricsOverride', width=900, height=900, deviceScaleFactor=1, mobile=False); time.sleep(0.5)
        p_narrow = t.js(pos_js)
        t.cdp('Emulation.setDeviceMetricsOverride', width=1280, height=900, deviceScaleFactor=1, mobile=False); time.sleep(0.5)
        p1 = t.js(pos_js)
        RESULTS['desktop:titimer:resize-1280-900-1280'] = {'samePositionsAfterRestore': p0 == p1,
                                                         'changedWhileNarrow': sum(p0[k] != p_narrow[k] for k in p0),
                                                         'positions': p1}
        shot(t, f'{PROOF}idea-board-v2-surukleme-sonrasi.png')

        # 3) Pomodoro (boş yer tutucular) masaüstü fare
        open_board(t, 'pomodoro-restoran', 1280, 900, False)
        b, a, mid = mouse_drag(t, 'text-1', 200, 160, check_mid=True, inward=True)
        RESULTS['mouse:pomodoro:text-1'] = {**summary(b, a), 'liftedDuringDrag': mid['lifted']}

        # 4) Mobil 375 dokunmatik
        for slug in ['kitabe', 'duo-for-x']:
            open_board(t, slug, 375, 812, True)
            b, a, mid, sc = touch_drag(t, 'text-1', 90, 140, inward=True)
            RESULTS[f'touch375:{slug}:text-1:hold-drag'] = {**summary(b, a), 'liftedDuringHold': mid['lifted'], **sc}
            # Basılı tutmadan hızlı kaydırma: not yerinde kalmalı (sayfa kaydırma niyeti)
            b2, a2, mid2, sc2 = touch_drag(t, 'name-0', 0, -160, hold=0, steps=6)
            RESULTS[f'touch375:{slug}:name-0:quick-swipe'] = {**summary(b2, a2), 'liftedAfterFirstMove': mid2['lifted'], **sc2}
            b3, a3, _, _ = touch_drag(t, 'check-7' if slug == 'kitabe' else 'check-5', 900, 900)
            RESULTS[f'touch375:{slug}:clamp'] = {**summary(b3, a3), 'board': {'w': a3['boardW'], 'h': a3['boardH']},
                                                 'insideBoard': a3['x'] >= 0 and a3['y'] >= 0 and a3['x'] + a3['w'] <= a3['boardW'] and a3['y'] + a3['h'] <= a3['boardH']}
            RESULTS[f'mobile375:{slug}:after-drag'] = t.js(METRICS_JS)
            if slug == 'kitabe':
                shot(t, f'{PROOF}idea-board-v2-surukleme-sonrasi-375.png', True)

        # 5) Liste kartı (büyük ? kaldırıldı mı)
        t.cdp('Emulation.setTouchEmulationEnabled', enabled=False)
        t.cdp('Emulation.setDeviceMetricsOverride', width=1280, height=700, deviceScaleFactor=1, mobile=False)
        t.cdp('Page.navigate', url=f'{BASE}?app=list'); time.sleep(2)
        RESULTS['list'] = t.js("({cards: document.querySelectorAll('.ib-card').length, q: [...document.querySelectorAll('.ib-card *')].filter(e => e.textContent.trim() === '?').length})")
        data = t.cdp('Page.captureScreenshot', format='png')['data']
        open(f'{PROOF}idea-cards-list-v2.png', 'wb').write(base64.b64decode(data))
        RESULTS['consoleErrors'] = t.js('window.__errs || []')
    finally:
        t.close()
    out = '/Users/hamaratbey/.hermes/profiles/imageartist/cache/scratch/ib_results.json'
    json.dump(RESULTS, open(out, 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(RESULTS, ensure_ascii=False, indent=1))


main()
