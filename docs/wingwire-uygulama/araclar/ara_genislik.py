import base64, io, json, os, sys, time
sys.path.insert(0, '/Users/hamaratbey/Desktop/Projeler/hamaratlabs-web/.worktrees/ww-landing-uygula/docs/wingwire-uygulama/araclar')
from PIL import Image
from cdp_ortak import Tarayici
OUT = sys.argv[1]
t = Tarayici(9490)
try:
    t.cdp('Page.enable')
    for w, tema in ((768, 'koyu'), (360, 'acik')):
        t.ekran(w, 900)
        t.medya('dark' if tema == 'koyu' else 'light')
        t.git('http://ww-uygula.localhost:1355/wingwire', 3)
        if w < 600:
            t.ev("document.querySelector('.s-svc').click()")
            time.sleep(0.8)
        k = t.ev("(() => { const d = [...document.querySelectorAll('[data-dy]')].find(e => e.offsetParent); d.scrollIntoView(); const r = d.getBoundingClientRect(); return [r.left, r.top + scrollY, r.width, r.height, document.documentElement.scrollWidth, d.querySelectorAll('.yol').length]; })()")
        time.sleep(1)
        s = t.cdp('Page.captureScreenshot', format='png', captureBeyondViewport=True, clip={'x': max(0, k[0] - 8), 'y': k[1] - 8, 'width': k[2] + 16, 'height': k[3] + 16, 'scale': 1})
        Image.open(io.BytesIO(base64.b64decode(s['data']))).convert('RGB').convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(OUT, f'ara-{w}-{tema}.png'), optimize=True)
        print(w, tema, 'sw', k[4], 'yol', k[5], 'boy', round(k[3]))
finally:
    t.kapat()
