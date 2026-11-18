# Ortak CDP yardımcısı: tek başsız Chrome açar, tek sekmeyle konuşur. Kullanım: from cdp_ortak import Tarayici
import base64, io, json, subprocess, time, urllib.request
import websocket
from PIL import Image

CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
import os, tempfile
PROF = os.environ.get('CDP_PROF') or os.path.join(os.environ.get('TMPDIR') or tempfile.gettempdir(), 'wwuyg-prof')

# Elle sürülen saat: requestAnimationFrame ve performance.now sayfa yüklenmeden önce değiştirilir; __adim(k, dt) k kare ilerletir.
# Taslak ve React motoru aynı tohumla aynı kare sayısında aynı hüzme konumunu verir (setTimeout, CSS geçişi ve WAAPI gerçek saatte).
SAAT = r"""(() => { let s = 0, n = 0; const q = new Map();
  window.requestAnimationFrame = cb => { q.set(++n, cb); return n; };
  window.cancelAnimationFrame = id => { q.delete(id); };
  performance.now = () => s;
  window.__adim = (k, dt) => { for (let i = 0; i < k; i++) { s += dt; const c = [...q.values()]; q.clear(); c.forEach(f => f(s)); } return s; };
})();"""

# Kare sayacı: gerçek requestAnimationFrame'e dokunmadan, sayfanın istediği kare sayısını sayar.
SAYAC = r"""(() => { const r = window.requestAnimationFrame.bind(window); window.__kare = 0;
  window.requestAnimationFrame = cb => r(t => { window.__kare++; cb(t); });
})();"""


class Tarayici:
    def __init__(self, port=9481):
        self.p = subprocess.Popen([CH, '--headless=new', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
                                   f'--remote-debugging-port={port}', f'--user-data-dir={PROF}', 'about:blank'],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tabs = []
        for _ in range(80):
            try:
                tabs = [t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type'] == 'page']
                if tabs:
                    break
            except Exception:
                pass
            time.sleep(0.25)
        self.ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], timeout=120)
        self.mid = 0
        self.olaylar = []
        self.betikler = []

    def cdp(self, m, **pa):
        self.mid += 1
        self.ws.send(json.dumps({'id': self.mid, 'method': m, 'params': pa}))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == self.mid:
                return r.get('result', r.get('error'))
            if 'method' in r:
                self.olaylar.append(r)

    def pompala(self, sn):
        """sn saniye boyunca olayları toplar (ağ, konsol)."""
        son = time.time() + sn
        self.ws.settimeout(0.2)
        while time.time() < son:
            try:
                r = json.loads(self.ws.recv())
                if 'method' in r:
                    self.olaylar.append(r)
            except Exception:
                pass
        self.ws.settimeout(120)

    def ev(self, e):
        r = self.cdp('Runtime.evaluate', expression=e, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(json.dumps(r['exceptionDetails'])[:400])
        return r['result'].get('value')

    def ekran(self, w, h, mobil=None):
        self.cdp('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=(w < 800) if mobil is None else mobil)

    def medya(self, tema='light', hareket='no-preference'):
        self.cdp('Emulation.setEmulatedMedia', features=[{'name': 'prefers-color-scheme', 'value': tema},
                                                         {'name': 'prefers-reduced-motion', 'value': hareket}])

    def betik(self, src):
        r = self.cdp('Page.addScriptToEvaluateOnNewDocument', source=src)
        self.betikler.append(r['identifier'])

    def betikleri_sil(self):
        for i in self.betikler:
            self.cdp('Page.removeScriptToEvaluateOnNewDocument', identifier=i)
        self.betikler = []

    def git(self, url, bekle=0.0):
        self.olaylar = []
        self.cdp('Page.navigate', url=url)
        self.pompala(bekle)

    def cek(self, tam=False):
        if tam:
            h = self.ev('document.documentElement.scrollHeight')
            w = self.ev('document.documentElement.clientWidth')
            s = self.cdp('Page.captureScreenshot', format='png', captureBeyondViewport=True, clip={'x': 0, 'y': 0, 'width': w, 'height': h, 'scale': 1})
        else:
            s = self.cdp('Page.captureScreenshot', format='png')
        return Image.open(io.BytesIO(base64.b64decode(s['data']))).convert('RGB')

    def kapat(self):
        try:
            self.ws.close()
        finally:
            self.p.terminate()
            self.p.wait(timeout=10)
