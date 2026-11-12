# İşlev ve ölçüm denetimi: /wingwire (React), onaylı taslak ve bugünkü (eski) sayfa.
# kullanım: python3 islev.py <react-kök> <taslak-kök> <eski-kök> <çıktı-klasörü>
# Ölçer (OLC) taslağın araclar/denetim.py'sindeki tanımlarla aynı: görünür kelime (TreeWalker + checkVisibility), 44 px altı hedef,
# 14 px altı yazı, diyagram kelimesi ve en küçük diyagram yazısı. Ek: kırık görsel, ağ (aktarılan bayt, dış istek), konsol hatası,
# kare sayacı (requestAnimationFrame çağrısı), etkileşimler (bildirim, Durdur, servis listesi, tema), hareket azaltma.
import json, os, sys, time
from urllib.parse import urlparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp_ortak import Tarayici, SAYAC

REACT, TASLAK, ESKI, OUT = [a.rstrip('/') for a in sys.argv[1:4]] + [sys.argv[4]]
os.makedirs(OUT, exist_ok=True)
SAYFA = {'react': REACT + '/wingwire', 'taslak': TASLAK + '/index.html?yon=a&isik=guclu&mob=1', 'eski': ESKI + '/wingwire'}

OLC = r"""(() => {
  const kelime = s => s.split(/\s+/).filter(t => /[\p{L}\p{N}]/u.test(t)).length;
  const gorunur = el => el && el.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  let ilk = 0, tum = 0, gizliDahil = 0; const ilkMetin = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode, s = t.textContent.trim(); if (!s) continue;
    const el = t.parentElement; if (el.closest('script, style, noscript, template')) continue;
    const n = kelime(s); gizliDahil += n;
    if (!gorunur(el)) continue;
    const r = document.createRange(); r.selectNodeContents(t); const b = r.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    tum += n;
    if (b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth) { ilk += n; ilkMetin.push(s); }
  }
  const kucukHedef = [];
  document.querySelectorAll('a, button, input, summary, [role=button], [tabindex]:not([tabindex="-1"])').forEach(e => {
    if (!gorunur(e)) return; const b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
    if (b.height < 44 || b.width < 44) kucukHedef.push((e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30) || e.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
  });
  let minYazi = 99, minGovde = 99; const kucukYazi = new Set(); const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w2.nextNode()) { const t = w2.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement;
    if (el.closest('script, style, noscript') || !gorunur(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize);
    minYazi = Math.min(minYazi, fs); if (!el.closest('[data-dy]')) minGovde = Math.min(minGovde, fs);
    if (fs < 14) kucukYazi.add(fs + 'px: ' + t.textContent.trim().slice(0, 30)); }
  const indir = [...document.querySelectorAll('a[download]')].filter(a => { const b = a.getBoundingClientRect(); return gorunur(a) && b.top >= 0 && b.bottom <= innerHeight; }).map(a => a.textContent.trim() + ' ' + Math.round(a.getBoundingClientRect().top) + ' ' + a.getAttribute('href'));
  let dyKelime = 0, dyMinYazi = 99; const dy = [...document.querySelectorAll('[data-dy]')].find(e => gorunur(e));
  if (dy) { const w3 = document.createTreeWalker(dy, NodeFilter.SHOW_TEXT); while (w3.nextNode()) { const t = w3.currentNode, s = t.textContent.trim(); if (!s || !gorunur(t.parentElement)) continue;
    dyKelime += kelime(s); dyMinYazi = Math.min(dyMinYazi, parseFloat(getComputedStyle(t.parentElement).fontSize)); } }
  const kirik = [...document.images].filter(i => gorunur(i) && i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'));
  const metin = document.body.textContent;
  return { ilkEkranKelime: ilk, tumGorunurKelime: tum, gizliDahilKelime: gizliDahil, ilkMetin, scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth, innerWidth, kucukHedef, kucukYazi: [...kucukYazi], minYazi, minGovdeYazi: minGovde,
    indirIlkEkranda: indir, tema: (document.querySelector('.wwl') || document.documentElement).dataset.tema,
    dyKelime, dyMinYazi: dy ? dyMinYazi : null, dyGorunen: dy ? dy.dataset.dy : null, kirikGorsel: kirik,
    gorsel: [...document.images].filter(i => gorunur(i)).length,
    emDash: (metin.match(/\u2014/g) || []).length, marketing: (metin.match(/marketing/gi) || []).length, kabloFis: (metin.match(/kablo|fiş|data-fis/gi) || []).length,
    agYukseklik: document.querySelector('#ag') ? Math.round(document.querySelector('#ag').getBoundingClientRect().height) : null };
})()"""

GEZ = ("(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo({top: y, behavior: 'instant'}); await new Promise(r => setTimeout(r, 120)); }"
       " await Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.decode().catch(() => {}))); scrollTo({top: 0, behavior: 'instant'}); return 1; })()")


def ag_ozet(olaylar, host):
    istek, boy, tur, durum = {}, {}, {}, {}
    for o in olaylar:
        m, p = o['method'], o.get('params', {})
        if m == 'Network.requestWillBeSent':
            istek[p['requestId']] = p['request']['url']
            tur[p['requestId']] = p.get('type', '?')
        elif m == 'Network.responseReceived':
            durum[p['requestId']] = p['response']['status']
        elif m == 'Network.loadingFinished':
            boy[p['requestId']] = p.get('encodedDataLength', 0)
    disari = sorted({u for u in istek.values() if not u.startswith('data:') and urlparse(u).hostname not in (host, None)})
    turBayt = {}
    for k, b in boy.items():
        turBayt[tur.get(k, '?')] = turBayt.get(tur.get(k, '?'), 0) + b
    hatali = sorted({istek[k] + ' ' + str(s) for k, s in durum.items() if s >= 400})
    return {'istek': len(istek), 'aktarilan_kb': round(sum(boy.values()) / 1024, 1), 'tur_kb': {k: round(v / 1024, 1) for k, v in sorted(turBayt.items())},
            'dis_istek': disari, 'hatali_yanit': hatali,
            'dosyalar': sorted(f"{tur.get(k, '?')} {round(b / 1024, 1)} {istek.get(k, '')[-70:]}" for k, b in boy.items())}


def konsol(olaylar):
    h = []
    for o in olaylar:
        m, p = o['method'], o.get('params', {})
        if m == 'Runtime.exceptionThrown':
            h.append('istisna: ' + json.dumps(p['exceptionDetails'].get('exception', {}).get('description', p['exceptionDetails'].get('text')))[:200])
        elif m == 'Runtime.consoleAPICalled' and p.get('type') == 'error':
            h.append('console.error: ' + json.dumps([a.get('value', a.get('description')) for a in p.get('args', [])])[:200])
        elif m == 'Log.entryAdded' and p['entry'].get('level') == 'error':
            h.append('log: ' + p['entry'].get('text', '')[:200] + ' ' + p['entry'].get('url', '')[-60:])
    return h


def tikla(t, secici):
    """Gerçek fare olayı: öğenin ortasına tıklar (görüş alanına getirir)."""
    r = t.ev(f"(() => {{ const e = document.querySelector('{secici}'); e.scrollIntoView({{block: 'center', behavior: 'instant'}}); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }})()")
    for tip in ('mousePressed', 'mouseReleased'):
        t.cdp('Input.dispatchMouseEvent', type=tip, x=r[0], y=r[1], button='left', clickCount=1)
    return r


def kare_say(t, sn=1.0):
    a = t.ev('window.__kare')
    time.sleep(sn)
    return t.ev('window.__kare') - a


def ag_gor(t):
    t.ev("scrollTo({top: document.querySelector('#ag').getBoundingClientRect().top + scrollY, behavior: 'instant'}); 1")


def yaz():
    json.dump(S, open(os.path.join(OUT, 'islev.json'), 'w'), ensure_ascii=False, indent=1)


S = {}
t = Tarayici(9483)
try:
    for d in ('Page.enable', 'Network.enable', 'Runtime.enable', 'Log.enable'):
        t.cdp(d)
    t.cdp('Network.setCacheDisabled', cacheDisabled=True)

    # 1) Ölçüm + ağ + konsol: üç sayfa, iki genişlik, iki tema
    S['olcum'] = {}
    for kim in ('react', 'taslak', 'eski'):
        for w, h in ((1440, 900), (390, 844)):
            for tema in ('acik', 'koyu'):
                t.ekran(w, h)
                t.medya('dark' if tema == 'koyu' else 'light')
                t.git(SAYFA[kim], 3.5)
                ilk = ag_ozet(t.olaylar, urlparse(SAYFA[kim]).hostname)
                o = t.ev(OLC) if kim != 'eski' else {}
                t.ev(GEZ)
                t.pompala(1.5)
                tam = ag_ozet(t.olaylar, urlparse(SAYFA[kim]).hostname)
                o2 = t.ev(OLC) if kim != 'eski' else {}
                kayit = {'ilk_yukleme': {k: ilk[k] for k in ('istek', 'aktarilan_kb', 'tur_kb')}, 'tum_sayfa_gezildi': tam, 'konsol_hata': konsol(t.olaylar)}
                if o:
                    kayit['olc_ilk'] = o
                    kayit['olc_gezildi'] = {k: o2[k] for k in ('kirikGorsel', 'gorsel', 'tumGorunurKelime', 'kucukYazi', 'minYazi', 'minGovdeYazi', 'kucukHedef')}
                S['olcum'][f'{kim}-{w}-{tema}'] = kayit
                print(kim, w, tema, 'kb', ilk['aktarilan_kb'], '->', tam['aktarilan_kb'], 'dış', len(tam['dis_istek']), 'hata', len(kayit['konsol_hata']),
                      'kelime', o.get('tumGorunurKelime'), '/', o.get('gizliDahilKelime'), flush=True)

    yaz()
    # 2) Başka sayfalar etkilenmedi mi + SPA içinde gir/çık
    S['baska'] = {}
    t.ekran(1440, 900)
    t.medya('light')
    for yol in ('/', '/uretiyorum', '/sesver', '/uretiyorum/wingwire'):
        t.git(REACT + yol, 3)
        S['baska'][yol] = {'konsol_hata': konsol(t.olaylar), 'baslik': t.ev('document.title'),
                           'h1': t.ev("(document.querySelector('h1') || {}).textContent || null"), 'yukseklik': t.ev('document.documentElement.scrollHeight')}
        print(yol, S['baska'][yol], flush=True)
    onceki = {'baslik': t.ev('document.title'), 'html_bg': t.ev('document.documentElement.style.background')}
    t.olaylar = []
    tikla(t, 'a[href="/wingwire"]')
    t.pompala(2.5)
    icerde = {'yol': t.ev('location.pathname'), 'wwl': t.ev("!!document.querySelector('.wwl')"), 'baslik': t.ev('document.title'), 'html_bg': t.ev('document.documentElement.style.background')}
    t.ev('history.back(); 1')
    t.pompala(2)
    disarda = {'yol': t.ev('location.pathname'), 'wwl': t.ev("!!document.querySelector('.wwl')"), 'baslik': t.ev('document.title'), 'html_bg': t.ev('document.documentElement.style.background')}
    S['spa_gir_cik'] = {'once': onceki, 'icerde': icerde, 'sonra': disarda, 'konsol_hata': konsol(t.olaylar)}
    print('spa', S['spa_gir_cik'], flush=True)

    yaz()
    # 3) Etkileşimler (hareket açık), kare sayacıyla
    t.betik(SAYAC)
    S['etkilesim'] = {}
    for w, h in ((1440, 900), (390, 844)):
        e = {}
        t.ekran(w, h)
        t.medya('light')
        # a) bildirim düşer, dokununca telefona uçar
        t.git(SAYFA['react'], 2.6)
        e['dustu'] = t.ev("(() => { const b = document.querySelector('.bildirim'); const r = b.getBoundingClientRect(); return {sinif: b.className, gorunur: getComputedStyle(b).visibility, ust: Math.round(r.top), alt: Math.round(r.bottom)}; })()")
        tikla(t, '.bildirim')
        time.sleep(1.6)
        e['dokununca'] = t.ev("({bildirimGizli: document.querySelector('.bildirim').hidden, cepCikti: document.querySelector('.cep').classList.contains('cikti'), sohbetOpak: getComputedStyle(document.querySelector('.cep .sohbet.t-acik')).opacity})")
        # b) kendiliğinden (5,2 sn sonra)
        t.git(SAYFA['react'], 8.6)
        e['kendiliginden'] = t.ev("({bildirimGizli: document.querySelector('.bildirim').hidden, cepCikti: document.querySelector('.cep').classList.contains('cikti')})")
        # c) diyagram görünmüyorken kare yok; görününce hüzme akar
        t.ev("scrollTo({top: 0, behavior: 'instant'}); 1")
        time.sleep(0.5)
        e['kare_diyagram_gorunmuyor_1sn'] = kare_say(t)
        ag_gor(t)
        time.sleep(1.2)
        e['kare_diyagram_gorunuyor_1sn'] = kare_say(t)
        dy = 'a' if w > 620 else 'm1'
        orn = []
        for _ in range(6):
            orn.append(t.ev(f"(() => {{ const s = document.querySelector('[data-dy=\"{dy}\"] .dy__svg'); const hb = [...s.querySelectorAll('.hb')]; return {{yol: s.querySelectorAll('.yol').length, hb: hb.length, akan: hb.filter(x => x.getAttribute('opacity') === '1').length, ofset: hb.map(x => x.getAttribute('stroke-dashoffset')).join(','), kalinlik: hb[0] ? hb[0].getAttribute('stroke-width') : null, port: s.querySelectorAll('.port').length, ok: s.querySelectorAll('.ok-u').length}}; }})()"))
            time.sleep(0.5)
        e['huzme_ornek'] = [{k: v for k, v in o.items() if k != 'ofset'} for o in orn]
        e['huzme_ofset_degisti'] = len({o['ofset'] for o in orn}) > 1
        e['vurdu_goruldu'] = t.ev("document.querySelectorAll('.vurdu').length")
        # d) Durdur / Oynat
        tikla(t, '.dur-dg')
        time.sleep(0.3)
        e['durdur'] = {'aria_pressed': t.ev("document.querySelector('.dur-dg').getAttribute('aria-pressed')"), 'aria_label': t.ev("document.querySelector('.dur-dg').getAttribute('aria-label')"),
                       'yazi': t.ev("document.querySelector('[data-dur-yazi]').textContent"), 'kare_1sn': kare_say(t),
                       'boyut': t.ev("(() => { const b = document.querySelector('.dur-dg').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })()")}
        tikla(t, '.dur-dg')
        time.sleep(0.3)
        e['oynat'] = {'aria_pressed': t.ev("document.querySelector('.dur-dg').getAttribute('aria-pressed')"), 'kare_1sn': kare_say(t)}
        # e) telefonda servis kümesi dokununca açılır
        if w <= 620:
            ag_gor(t)
            once = t.ev("({ag: Math.round(document.querySelector('#ag').getBoundingClientRect().height), svcYol: document.querySelector('[data-dy=\"m1\"] [data-k=\"svc\"]').getAttribute('d')})")
            tikla(t, '.s-svc')
            time.sleep(0.6)
            sonra = t.ev("({ag: Math.round(document.querySelector('#ag').getBoundingClientRect().height), svcYol: document.querySelector('[data-dy=\"m1\"] [data-k=\"svc\"]').getAttribute('d'), expanded: document.querySelector('.s-svc').getAttribute('aria-expanded'), yazi: document.querySelector('.s-ac').textContent, liste: [...document.querySelectorAll('#ww-s1-liste > li')].filter(l => l.offsetParent).map(l => l.querySelector('b').textContent), acik: document.querySelector('[data-dy=\"m1\"]').dataset.acik})")
            e['servis_ac'] = {'once': once, 'sonra': sonra, 'olc': t.ev(OLC)}
            e['servis_ac']['olc'] = {k: e['servis_ac']['olc'][k] for k in ('kucukHedef', 'kucukYazi', 'dyMinYazi', 'dyKelime', 'scrollWidth', 'minGovdeYazi')}
            tikla(t, '.s-svc')
            time.sleep(0.4)
            e['servis_kapat'] = t.ev("({expanded: document.querySelector('.s-svc').getAttribute('aria-expanded'), listeGizli: document.querySelector('#ww-s1-liste').hidden})")
        # f) tema düğmesi ve cihaz tercihi
        t.ev("scrollTo({top: 0, behavior: 'instant'}); 1")
        tema_once = t.ev("({tema: document.querySelector('.wwl').dataset.tema, etiket: document.querySelector('.tema-dg').getAttribute('aria-label'), bg: document.documentElement.style.background})")
        t.medya('dark')
        time.sleep(0.4)
        cihaz = t.ev("document.querySelector('.wwl').dataset.tema")
        t.medya('light')
        time.sleep(0.4)
        tikla(t, '.tema-dg')
        time.sleep(0.6)
        tema_sonra = t.ev("({tema: document.querySelector('.wwl').dataset.tema, etiket: document.querySelector('.tema-dg').getAttribute('aria-label'), bg: document.documentElement.style.background, sema: document.documentElement.style.colorScheme, gorunenGorsel: [...document.querySelectorAll('.cep img')].filter(i => i.offsetParent).map(i => i.getAttribute('src').split('/').pop())})")
        t.medya('dark')
        time.sleep(0.4)
        t.medya('light')
        time.sleep(0.4)
        elle_sonra_cihaz = t.ev("document.querySelector('.wwl').dataset.tema")
        e['tema'] = {'once': tema_once, 'cihaz_karanlik_olunca': cihaz, 'dugmeden_sonra': tema_sonra, 'elle_secimden_sonra_cihaz_acik': elle_sonra_cihaz}
        e['konsol_hata'] = konsol(t.olaylar)
        S['etkilesim'][str(w)] = e
        print('etkileşim', w, json.dumps(e, ensure_ascii=False)[:1500], flush=True)

    yaz()
    # 4) Hareket azaltma
    S['az'] = {}
    for w, h in ((1440, 900), (390, 844)):
        t.ekran(w, h)
        t.medya('light', 'reduce')
        t.git(SAYFA['react'], 2.5)
        a = t.ev("({bildirimMetinde: !!document.querySelector('.hero__metin .bildirim'), bildirimGorunur: document.querySelector('.bildirim').checkVisibility({visibilityProperty: true}), cepCikti: document.querySelector('.cep').classList.contains('cikti'), durGizli: getComputedStyle(document.querySelector('.dur-dg')).display === 'none'})")
        ag_gor(t)
        time.sleep(1)
        a['kare_1sn_diyagram_gorunurken'] = kare_say(t)
        a['hb'] = t.ev("document.querySelectorAll('.hb').length")
        a['yol'] = t.ev("[...document.querySelectorAll('.dy__svg')].map(s => s.querySelectorAll('.yol').length)")
        o = t.ev(OLC)
        a['kelime'] = o['tumGorunurKelime']
        a['konsol_hata'] = konsol(t.olaylar)
        S['az'][str(w)] = a
        print('az', w, a, flush=True)
    t.betikleri_sil()
    yaz()
finally:
    t.kapat()
