import { createContext, useContext } from 'react';

// /sesver arayüz dili. SesVer masaüstü uygulamasının locales/ düzeniyle aynı ilke:
//  - Anahtar = Türkçe kaynak metin, değer = çeviri (locales/<kod>.json, `_dil` = dilin kendi adı).
//  - Türkçe kaynak dildir: sözlüğü yoktur, anahtarın kendisi gösterilir. Eksik çeviri de Türkçeye düşer.
//  - {ad} yer tutucuları ve HTML etiketleri çeviride aynen korunur (HTML'li metinler yalnız bu repodaki
//    sabit sözlüklerden gelir, kullanıcı girdisi değildir).
//  - Arayüz dili ≠ ses üretim dili: ses örnekleri Türkçedir; sayfa bunu ayrıca belirtir.
// Dil, ?lang=<kod> veya önceki seçimden (localStorage) gelir; URL yolu değişmez (App.jsx yönlendirmesi etkilenmez).

export const DEFAULT_LANG = 'tr';
const STORAGE_KEY = 'sesver.lang';

// Masaüstü uygulamasıyla aynı 11 dil ve aynı görünen adlar (locales/*.json → _dil).
export const LANGS = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '简体中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' }
];

const isLang = (code) => LANGS.some((l) => l.code === code);
export const isRtl = (code) => Boolean(LANGS.find((l) => l.code === code)?.rtl);

// Sözlükler ayrı parçalar hâlinde, yalnız seçilince yüklenir (Türkçe ziyaretçi hiçbirini indirmez).
const LOADERS = import.meta.glob(['./locales/*.json', '!./locales/_kaynak.json'], { import: 'default' });

export function loadDict(code) {
  const load = LOADERS[`./locales/${code}.json`];
  return load ? load() : Promise.resolve({});
}

export function initialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  let saved = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Gizli mod / depolama kapalı: seçim yalnız bu oturumda geçerli olur.
  }
  return [fromUrl, saved].find(isLang) ?? DEFAULT_LANG;
}

export function saveLang(code) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Depolama yoksa sessizce geç.
  }
}

export function makeT(dict) {
  return (key, vars) => {
    let s = dict?.[key] ?? key;
    if (import.meta.env.DEV && dict && !(key in dict)) console.warn(`[sesver i18n] çeviri eksik: ${key}`);
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  };
}

export const LangContext = createContext({ lang: DEFAULT_LANG, selected: DEFAULT_LANG, setLang: () => {}, t: makeT(null) });

export function useI18n() {
  return useContext(LangContext);
}
