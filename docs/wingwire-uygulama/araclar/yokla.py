# Küçük yoklama: iki sayfada aynı JS ifadesini çalıştırıp sonucu yan yana basar.
# kullanım: python3 yokla.py <genişlik> <yükseklik> <tema acik|koyu> <bekle-sn> <js-dosyası> <url> [<url> ...]
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici

w, h, tema, bekle, jsdos = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3], float(sys.argv[4]), sys.argv[5]
js = open(jsdos).read()
t = Tarayici(9482)
try:
    t.cdp('Page.enable')
    t.ekran(w, h)
    t.medya('dark' if tema == 'koyu' else 'light')
    for url in sys.argv[6:]:
        t.git(url, bekle)
        print(url)
        print(json.dumps(t.ev(js), ensure_ascii=False, indent=None))
finally:
    t.kapat()
