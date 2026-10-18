// Site bir alt klasörde de (ör. hamarat52.github.io/hamaratlabs-web/) çalışabilsin diye
// tüm yollar buradan geçer. Alan adına geçince BASE boş olur.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const asset = p => `${BASE}${p}`;
export const stripBase = p => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p);
