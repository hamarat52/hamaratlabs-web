#!/usr/bin/env python3
"""Haberci'nin saglik.py betiğinin yerel uyarlaması.

Fark yalnız ağ katmanında: sitemap'teki adresler (https://hamaratlabs.com/...) aynen raporlanır ama
istekler yerel sunucuya (argv[3], ör. http://hamaratlabs-seo.localhost:1355) gider; yönlendirme sonucu
adres de canlı biçime geri çevrilir. Kontrol kuralları orijinalle birebir aynıdır.

Kullanım: python3 saglik_yerel.py https://hamaratlabs.com cikti.json http://hamaratlabs-seo.localhost:1355
"""
import re, sys, json, urllib.request, urllib.parse, concurrent.futures as cf
from collections import Counter
SITE = sys.argv[1].rstrip('/')
LOCAL = sys.argv[3].rstrip('/')
UA = {'User-Agent': 'Mozilla/5.0 (HamaratLabs SEO saglik kontrolu)'}
def to_local(u): return LOCAL + u[len(SITE):] if u.startswith(SITE) else u
def to_live(u): return SITE + u[len(LOCAL):] if u.startswith(LOCAL) else u
def get(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(to_local(u), headers=UA), timeout=30)
        return r.status, to_live(r.geturl()), r.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, u, ''
    except Exception as e:
        return 0, u, str(e)
_, _, sm = get(SITE + '/sitemap.xml')
urls = re.findall(r'<loc>(.*?)</loc>', sm)
def tag(h, pat):
    m = re.search(pat, h, re.I | re.S); return m.group(1).strip() if m else ''
def check(u):
    st, final, h = get(u)
    return dict(url=u, status=st, final=final,
        title=tag(h, r'<title[^>]*>(.*?)</title>'),
        desc=tag(h, r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']'),
        canonical=tag(h, r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']'),
        noindex=bool(re.search(r'<meta[^>]+robots[^>]+noindex', h, re.I)),
        h1=len(re.findall(r'<h1[\s>]', h, re.I)),
        lang=tag(h, r'<html[^>]+lang=["\'](.*?)["\']'),
        og=bool(re.search(r'property=["\']og:image', h, re.I)),
        links=sorted(set(urllib.parse.urljoin(u, l).split('#')[0] for l in re.findall(r'href=["\'](/[^"\']*)["\']', h))))
with cf.ThreadPoolExecutor(8) as ex:
    res = list(ex.map(check, urls))
# iç link durumu
alllinks = sorted({l for r in res for l in r['links'] if not re.search(r'\.(css|js|svg|png|jpg|ico|woff2?|xml|json|webmanifest)$', l)})
with cf.ThreadPoolExecutor(8) as ex:
    lst = dict(zip(alllinks, ex.map(lambda l: get(l)[0], alllinks)))
bad_links = {l: s for l, s in lst.items() if s != 200}
tc = Counter(r['title'] for r in res); dc = Counter(r['desc'] for r in res if r['desc'])
out = dict(site=SITE, yerel=LOCAL, sitemap_url_sayisi=len(urls), sayfalar=[{k: v for k, v in r.items() if k != 'links'} for r in res],
           kirik_ic_linkler=bad_links, cift_title=[t for t, n in tc.items() if n > 1], cift_desc=[d for d, n in dc.items() if n > 1],
           ic_link_sayisi=len(alllinks))
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('URL', len(urls), '| iç link', len(alllinks), '| kırık', len(bad_links))
for r in res:
    sorun = []
    if r['status'] != 200: sorun.append(f"durum {r['status']}")
    if r['final'].rstrip('/') != r['url'].rstrip('/'): sorun.append(f"yönlendirme -> {r['final']}")
    if not r['title']: sorun.append('title yok')
    elif len(r['title']) > 65: sorun.append(f"title uzun {len(r['title'])}")
    if not r['desc']: sorun.append('description yok')
    elif len(r['desc']) > 160: sorun.append(f"desc uzun {len(r['desc'])}")
    if not r['canonical']: sorun.append('canonical yok')
    elif r['canonical'].rstrip('/') != r['url'].rstrip('/'): sorun.append(f"canonical farklı {r['canonical']}")
    if r['noindex']: sorun.append('NOINDEX')
    if r['h1'] != 1: sorun.append(f"h1 sayısı {r['h1']}")
    if not r['lang']: sorun.append('lang yok')
    if not r['og']: sorun.append('og:image yok')
    print(('OK ' if not sorun else '!! ') + r['url'].replace(SITE, '') + ('' if not sorun else '  ' + '; '.join(sorun)))
for l, s in bad_links.items(): print('KIRIK', s, l)
print('çift title', out['cift_title']); print('çift desc', out['cift_desc'])
