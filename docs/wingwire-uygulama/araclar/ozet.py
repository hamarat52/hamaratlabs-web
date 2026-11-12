# islev.json özetini basar. kullanım: python3 ozet.py <islev.json>
import json, sys
S = json.load(open(sys.argv[1]))
for k, v in S['olcum'].items():
    t = v['tum_sayfa_gezildi']
    print(f"{k:18} ilk {v['ilk_yukleme']['aktarilan_kb']:6} KB {v['ilk_yukleme']['tur_kb']}")
    print(f"{'':18} tüm {t['aktarilan_kb']:6} KB {t['tur_kb']} istek {t['istek']} dış {t['dis_istek']} 4xx/5xx {t['hatali_yanit']} konsol {v['konsol_hata']}")
    if 'olc_ilk' in v:
        o, g = v['olc_ilk'], v['olc_gezildi']
        print(f"{'':18} kelime ilk-ekran {o['ilkEkranKelime']} görünür {o['tumGorunurKelime']} gizli-dahil {o['gizliDahilKelime']} | sw {o['scrollWidth']}/{o['innerWidth']} boy {o['scrollHeight']}"
              f" | dy {o['dyGorunen']} kelime {o['dyKelime']} minYazı {o['dyMinYazi']} | gövde min {g['minGovdeYazi']} | <44 {g['kucukHedef']} | kırık {g['kirikGorsel']} görsel {g['gorsel']}"
              f" | indir {o['indirIlkEkranda']} | em {o['emDash']} mkt {o['marketing']} kablo {o['kabloFis']} | ağ {o['agYukseklik']}")
        if g['kucukYazi']:
            print(f"{'':18} <14px yazılar ({len(g['kucukYazi'])}): {[x for x in g['kucukYazi'] if not x.startswith('13px')][:12]} (+{sum(1 for x in g['kucukYazi'] if x.startswith('13px'))} adet 13px)")
if len(sys.argv) > 2:
    for k in sys.argv[2:]:
        print(k, json.dumps(S['olcum'][k]['tum_sayfa_gezildi']['dosyalar'], ensure_ascii=False, indent=0))
