# Hermes bağlantıları diyagramındaki logo yol verisini indirilen resmi dosyalardan değiştirmeden çıkarıp
# src/wingwire-site/hermesLogoVerisi.js'e yazar (elle kopyalama hatası olmasın diye).
# kullanım: python3 hermes_logo_verisi.py <kaynak-klasörü> <çıktı.js>
# Kaynak klasöründe beklenen dosyalar (indirme adresleri RAPOR.md "Hermes bağlantıları" bölümünde):
#   claude.svg, claudecode.svg, googlegemini.svg, modelcontextprotocol.svg  (Simple Icons 16.37.0, CC0-1.0)
#   openai-blossom.svg  (OpenAI marka sayfasındaki Blossom_Light.svg; ikinci dolu yol = tek başına Blossom)
#   ag-favicon.svg      (antigravity.google/favicon.svg; renk katmanlarının maskesi olan tek yol = işaretin silüeti)
import json, re, sys

K, OUT = sys.argv[1].rstrip('/') + '/', sys.argv[2]


def si(ad):
    return re.search(r' d="([^"]*)"', open(K + ad + '.svg').read()).group(1)


bl = re.findall(r'<path d="([^"]*)" fill="black"/>', open(K + 'openai-blossom.svg').read())
ag = re.search(r'<path d="(M89\.6992[^"]*)" fill="#3186FF"/>', open(K + 'ag-favicon.svg').read()).group(1)

# viewBox: Simple Icons 24x24; diğer ikisinde yolun sınır kutusu (Chrome getBBox) kareye tamamlanıp ortalandı
V = {
    'claude': ['0 0 24 24', si('claude')],
    'gemini': ['0 0 24 24', si('googlegemini')],
    'gpt': ['769.694 227.443 267.196 267.196', bl[1]],  # bbox 769.694 228.635 267.196 264.812
    'mcp': ['0 0 24 24', si('modelcontextprotocol')],
    'claudecode': ['0 0 24 24', si('claudecode')],
    'agy': ['13.945 15.152 83.586 83.586', ag],  # bbox 13.945 18.445 83.586 77
}
with open(OUT, 'w') as f:
    f.write('// Üretildi: docs/wingwire-uygulama/araclar/hermes_logo_verisi.py (elle düzenlenmez). Kaynak ve lisanslar RAPOR.md "Hermes bağlantıları".\n')
    f.write('// [viewBox, d]; yollar resmi dosyalardan değiştirilmeden alındı.\n')
    f.write('const L = ' + json.dumps(V, indent=2, ensure_ascii=False) + ';\n\nexport default L;\n')
print(OUT, {k: len(v[1]) for k, v in V.items()})
