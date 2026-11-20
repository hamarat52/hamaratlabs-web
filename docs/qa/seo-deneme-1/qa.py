"""SEO denemesi görsel QA: eski (origin/main) ve yeni derleme karşılaştırması + hesaplayıcı testi.
Kullanım: python3 qa.py   (sunucular: portless hamaratlabs-seo ve hamaratlabs-seo-once)
"""
import sys, json, os, time
sys.dont_write_bytecode = True
os.environ.setdefault("CDP_PROFILE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "cdp-profil"))
from cdp import Tarayici

OUT = os.environ.get("QA_OUT", "shots")  # cdp.py: headless Chrome CDP yardımcısı (ayrı tutulur)
YENI = "http://hamaratlabs-seo.localhost:1355"
ESKI = "http://hamaratlabs-seo-once.localhost:1355"
os.makedirs(OUT, exist_ok=True)
sonuc = {"karsilastirma": [], "hesap": [], "hatalar": {}}

ROTALAR = [("/uretiyorum", "uretiyorum"), ("/okul-projeleri", "okul"), ("/uretiyorum/titimer", "titimer-urun"),
           ("/oneriyorum", "oneriyorum"), ("/ogretici", "ogretici"), ("/boyle-yok", "404")]

with Tarayici(port=9447) as t:
    for w, h in [(1280, 800), (390, 844)]:
        for etiket, taban in [("once", ESKI), ("sonra", YENI)]:
            s = t.sayfa(w, h)
            for rota, ad in ROTALAR:
                s.git(taban + rota, bekle=2.5)
                yuk = s.js("document.documentElement.scrollHeight")
                h1 = s.js("[...document.querySelectorAll('h1')].map(x=>x.textContent.trim().slice(0,30))")
                gorunur_prer = s.js("!!document.querySelector('[data-prerender]') && getComputedStyle(document.querySelector('[data-prerender]')).display!=='none'")
                s.ekran(f"{OUT}/{etiket}-{ad}-{w}.png")
                sonuc["karsilastirma"].append(dict(surum=etiket, rota=rota, w=w, scrollHeight=yuk, h1=h1, prerender_gorunur=gorunur_prer))
            sonuc["hatalar"][f"{etiket}-{w}"] = s.hatalar[:10]
            s.kapat()

    # Hesaplayıcı
    for w, h in [(390, 844), (1280, 800)]:
        s = t.sayfa(w, h)
        s.git(YENI + "/income-vs-desires/saatlik-ucret-hesaplama", bekle=1)
        oku = "({hourly:hourly.textContent, note:hourlyNote.textContent, commute:commuteRow.hidden?null:hourlyCommute.textContent, price:priceHours.textContent, priceNote:priceNote.textContent, sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, h1:document.querySelectorAll('h1').length})"
        sonuc["hesap"].append(dict(w=w, durum="varsayılan 50.000 TL, 40 saat, 2.499 TL", **s.js(oku)))
        s.ekran(f"{OUT}/hesaplayici-{w}.png", tam=True)
        s.ekran(f"{OUT}/hesaplayici-{w}-ilk-ekran.png")
        # Örnek 2: 35.000 TL, haftada 45 saat, günlük yol 90 dk, 5 gün, fiyat 12.999 TL (kullanıcı gibi yaz)
        s.js("""(() => {
          const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); };
          set('salary', '35000'); set('weeklyHours', '45'); set('commuteMinutes', '90'); set('daysPerWeek', '5'); set('price', '12999');
        })()""")
        time.sleep(0.3)
        sonuc["hesap"].append(dict(w=w, durum="35.000 TL, 45 saat, yol 90 dk x 5 gün, 12.999 TL", **s.js(oku), salaryField=s.js("salary.value"), priceField=s.js("price.value")))
        if w == 390:
            s.ekran(f"{OUT}/hesaplayici-390-yol-dahil.png")
        # Boş/eksik girdi
        s.js("salary.value=''; salary.dispatchEvent(new Event('input',{bubbles:true}))")
        sonuc["hesap"].append(dict(w=w, durum="maaş boş", **s.js(oku)))
        sonuc["hatalar"][f"hesap-{w}"] = s.hatalar[:10]
        s.kapat()

    # Blog yazısından hesaplayıcıya bağlantı
    s = t.sayfa(1280, 800)
    s.git(YENI + "/income-vs-desires/blog/saatlik-ucret-nasil-hesaplanir", bekle=0.5)
    sonuc["blog_link"] = s.js("[...document.querySelectorAll('a')].filter(a=>a.getAttribute('href').includes('saatlik-ucret-hesaplama')).map(a=>a.href)")
    s.kapat()

json.dump(sonuc, open(f"{OUT}/../qa_sonuc.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(sonuc, ensure_ascii=False, indent=1))
