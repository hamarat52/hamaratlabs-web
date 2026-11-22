"""Paylaşım kartı fontları: Google Fonts değişken TTF'lerinden sabit ağırlık örnekleri üretir.

Kaynaklar (OFL, github.com/google/fonts, 2026-11-22'de indirildi; lisanslar fontlar/OFL-*.txt):
  ofl/figtree/Figtree[wght].ttf, ofl/archivo/Archivo[wdth,wght].ttf,
  ofl/jetbrainsmono/JetBrainsMono[wght].ttf, ofl/geist/Geist[wght].ttf
Kullanım: python3 og_fontlar.py <indirilen-ttf-klasörü> scripts/og-kartlar/fontlar   (fontTools + brotli gerekir)
Her çıktı tek ağırlık, Latin + Latin Genişletilmiş (Türkçe) alt kümesi; aile adı "OG <Aile> <Ağırlık>"
olarak değiştirildi (OFL: değiştirilmiş sürüm özgün adı taşımaz). Çıktılar repoda; yalnız font
değiştirmek gerekirse yeniden çalıştırılır.
"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
ISLER = [
    ('figtree-Figtree[wght].ttf', {'wght': 800}, 'OG Figtree ExtraBold', 'og-figtree-800.ttf'),
    ('figtree-Figtree[wght].ttf', {'wght': 500}, 'OG Figtree Medium', 'og-figtree-500.ttf'),
    ('archivo-Archivo[wdth,wght].ttf', {'wght': 900, 'wdth': 100}, 'OG Archivo Black', 'og-archivo-900.ttf'),
    ('figtree-Figtree[wght].ttf', {'wght': 700}, 'OG Figtree Bold', 'og-figtree-700.ttf'),
    ('jetbrainsmono-JetBrainsMono[wght].ttf', {'wght': 500}, 'OG JetBrains Mono Medium', 'og-jetbrainsmono-500.ttf'),
    ('jetbrainsmono-JetBrainsMono[wght].ttf', {'wght': 700}, 'OG JetBrains Mono Bold', 'og-jetbrainsmono-700.ttf'),
    ('geist-Geist[wght].ttf', {'wght': 700}, 'OG Geist Bold', 'og-geist-700.ttf'),
    ('geist-Geist[wght].ttf', {'wght': 500}, 'OG Geist Medium', 'og-geist-500.ttf'),
]
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x250)) + list(range(0x2000, 0x2070)) + [0x20BA, 0x2192, 0x2022, 0x00B7]

for kaynak, eksen, aile, cikti in ISLER:
    f = TTFont(os.path.join(SRC, kaynak))
    f = instancer.instantiateVariableFont(f, eksen)
    opts = subset.Options()
    # Yalnız kerning ve standart bağlar: opentype.js ccmp/calt'ın bazı biçimlerini desteklemiyor
    # (Archivo'da "substFormat 2 is not yet supported" hatası).
    opts.layout_features = ['kern', 'liga']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(f)
    name = f['name']
    for rec in list(name.names):
        if rec.nameID in (16, 17, 21, 22, 25):
            name.removeNames(nameID=rec.nameID)
    ps = aile.replace(' ', '')
    for pid, eid, lid in ((3, 1, 0x409), (1, 0, 0)):
        name.setName(aile, 1, pid, eid, lid)
        name.setName('Regular', 2, pid, eid, lid)
        name.setName(aile, 4, pid, eid, lid)
        name.setName(ps, 6, pid, eid, lid)
    if 'STAT' in f:
        del f['STAT']
    f['OS/2'].usWeightClass = 400
    f['OS/2'].fsSelection = (f['OS/2'].fsSelection & ~0b1100001) | 0b1000000
    f['head'].macStyle = 0
    f.save(os.path.join(OUT, cikti))
    print(cikti, os.path.getsize(os.path.join(OUT, cikti)))
