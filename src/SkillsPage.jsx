// /skills: herkese açık araç kataloğu (Haberci kataloğu → src/data/skills.json, 541 kayıt).
// Ayrı parça (lazy) olarak yüklenir; JSON yalnız bu sayfanın chunk'ına girer, ana sayfayı büyütmez.
// WebGL/Canvas yok: düz DOM. 541 kartın hepsi baştan çizilmez, "Daha fazla göster" ile sayfalanır.
// Veri olduğu gibi gösterilir: boş alan boş kalır, metin üretilmez. Etiketler yalnız slug → okunur ad.
import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  ArrowDown01Icon,
  FilterHorizontalIcon,
  Github01Icon,
  InstagramIcon,
  Link01Icon,
  Linkedin01Icon,
  NewTwitterIcon,
  Search01Icon,
  StarIcon,
  YoutubeIcon
} from '@hugeicons/core-free-icons';
import { Link } from './nav';
import DATA from './data/skills.json';
import './SkillsPage.css';

const TITLE = 'Skills & Araçlar — HamaratLabs';
const DESCRIPTION =
  'HamaratLabs araç kataloğu: yapay zekâ uygulamaları, modeller, kütüphaneler, CLI ve skill’ler. Kategori, lisans, fiyat, GitHub yıldızları ve deneme sonuçlarıyla.';
const PAGE_URL = 'https://hamaratlabs.com/skills';
const PAGE = 24;

const KATEGORI = {
  'gorsel-tasarim': 'Görsel tasarım',
  'ses-tts': 'Ses / TTS',
  'sosyal-medya': 'Sosyal medya',
  'video-motion': 'Video / motion',
  gelistirme: 'Geliştirme',
  'ajan-otomasyon': 'Ajan / otomasyon',
  'arastirma-veri': 'Araştırma / veri',
  verimlilik: 'Verimlilik',
  guvenlik: 'Güvenlik',
  diger: 'Diğer'
};
const TUR = {
  uygulama: 'Uygulama',
  'web-servis': 'Web servis',
  model: 'Model',
  kutuphane: 'Kütüphane',
  api: 'API',
  cli: 'CLI',
  skill: 'Skill',
  mcp: 'MCP',
  'claude-code-plugin': 'Claude Code eklentisi',
  'hermes-plugin': 'Hermes eklentisi',
  diger: 'Diğer'
};
const DURUM = {
  kullaniyoruz: 'Kullanıyoruz',
  denendi: 'Denendi',
  degerlendirildi: 'Değerlendirildi',
  belirsiz: 'Belirsiz',
  reddedildi: 'Reddedildi'
};
const label = (map, v) => map[v] || v;

const SORTS = [
  ['yildiz', 'Yıldız'],
  ['son_push', 'Son güncelleme'],
  ['ilk_gorulme', 'İlk görülme'],
  ['ad', 'Ad']
];

// Türkçe duyarsız arama: "ı/İ" ve aksanlar sadeleşir ("gorsel" → "Görsel").
const norm = s =>
  String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// 'YYYY-MM-DD' → UTC gün; saat dilimi kaymasın diye Date'in yerel ayrıştırmasına bırakılmaz.
const dayOf = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
};
const DAY_FMT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtDay = s => (dayOf(s) == null ? s : DAY_FMT.format(dayOf(s)));
const NUM = new Intl.NumberFormat('tr-TR');

// Ölçüm tarihine göre (bugüne göre değil): yıldız ve son push aynı ölçümde alındı.
const ageText = gh => {
  const a = dayOf(gh.son_push);
  const b = dayOf(gh.olcum_tarihi);
  if (a == null || b == null) return null;
  const n = Math.round((b - a) / 86400000);
  return n <= 0 ? 'son güncelleme ölçüm gününde' : `son güncelleme ${NUM.format(n)} gün önce`;
};

const SOURCE_KINDS = [
  { test: (tip, host) => tip === 'instagram' || /(^|\.)instagram\.com$/.test(host), name: 'Instagram', icon: InstagramIcon },
  { test: (tip, host) => tip === 'x' || tip === 'twitter' || /(^|\.)(x|twitter)\.com$/.test(host), name: 'X', icon: NewTwitterIcon },
  { test: (tip, host) => tip === 'linkedin' || /(^|\.)linkedin\.com$|^lnkd\.in$/.test(host), name: 'LinkedIn', icon: Linkedin01Icon },
  { test: (tip, host) => tip === 'youtube' || /(^|\.)(youtube\.com|youtu\.be)$/.test(host), name: 'YouTube', icon: YoutubeIcon },
  { test: (tip, host) => tip === 'github' || /(^|\.)github\.com$/.test(host), name: 'GitHub', icon: Github01Icon }
];
const hostOf = url => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};
const sourceKind = s => {
  const host = hostOf(s.url);
  return SOURCE_KINDS.find(k => k.test(s.tip, host)) || { name: host || 'Bağlantı', icon: Link01Icon };
};
// Aynı URL'nin tekrarlanan kayıtlarını tek bağlantıda birleştir (paylaşanı olan kayıt öncelikli).
const uniqueSources = list => {
  const byUrl = new Map();
  for (const s of list || []) {
    if (!s?.url) continue;
    const prev = byUrl.get(s.url);
    if (!prev || (!prev.paylasan && s.paylasan)) byUrl.set(s.url, s);
  }
  return [...byUrl.values()];
};

const ITEMS = DATA.araclar.map((a, i) => ({
  ...a,
  _id: i,
  _q: norm([a.ad, a.ozet, a.tur, label(TUR, a.tur), a.kategori, label(KATEGORI, a.kategori), a.lisans].join(' '))
}));
const TOTAL = ITEMS.length;
const countBy = key => {
  const c = new Map();
  for (const a of ITEMS) if (a[key]) c.set(a[key], (c.get(a[key]) || 0) + 1);
  return [...c.entries()].sort((x, y) => y[1] - x[1]).map(([v]) => v);
};
const KATEGORI_KEYS = countBy('kategori');
const TUR_KEYS = countBy('tur');
const DURUM_KEYS = [...Object.keys(DURUM).filter(k => ITEMS.some(a => a.durum === k)), ...countBy('durum').filter(k => !DURUM[k])];

const EMPTY = { q: '', kategori: 'all', tur: 'all', durum: 'all', deneme: false, github: false };

// `skip`: o grubun kendi seçimi hariç tutulur → her çipteki sayı "bunu seçersem kaç kalır".
const matches = (a, f, q, skip) =>
  (skip === 'kategori' || f.kategori === 'all' || a.kategori === f.kategori) &&
  (skip === 'tur' || f.tur === 'all' || a.tur === f.tur) &&
  (skip === 'durum' || f.durum === 'all' || a.durum === f.durum) &&
  (skip === 'deneme' || !f.deneme || !!a.deneme) &&
  (skip === 'github' || !f.github || !!a.github) &&
  (!q || q.split(/\s+/).every(w => a._q.includes(w)));

const desc = (x, y) => (x == null ? (y == null ? 0 : 1) : y == null ? -1 : x < y ? 1 : x > y ? -1 : 0);
const byName = (x, y) => x.ad.localeCompare(y.ad, 'tr', { sensitivity: 'base' });
const SORTERS = {
  yildiz: (x, y) => desc(x.github?.yildiz ?? null, y.github?.yildiz ?? null) || byName(x, y),
  son_push: (x, y) => desc(x.github?.son_push ?? null, y.github?.son_push ?? null) || byName(x, y),
  ilk_gorulme: (x, y) => desc(x.ilk_gorulme ?? null, y.ilk_gorulme ?? null) || byName(x, y),
  ad: byName
};

function useDocumentMeta() {
  useEffect(() => {
    const head = document.head;
    const set = [
      [head.querySelector('meta[name="description"]'), 'content', DESCRIPTION],
      [head.querySelector('meta[property="og:description"]'), 'content', DESCRIPTION],
      [head.querySelector('meta[property="og:title"]'), 'content', TITLE],
      [head.querySelector('meta[property="og:url"]'), 'content', PAGE_URL],
      [head.querySelector('link[rel="canonical"]'), 'href', PAGE_URL]
    ].filter(([el]) => el);
    const prev = { title: document.title, attrs: set.map(([el, attr]) => el.getAttribute(attr)) };
    document.title = TITLE;
    set.forEach(([el, attr, v]) => el.setAttribute(attr, v));
    return () => {
      document.title = prev.title;
      set.forEach(([el, attr], i) => el.setAttribute(attr, prev.attrs[i]));
    };
  }, []);
}

export default function SkillsPage() {
  useDocumentMeta();
  const panelId = useId();
  const [f, setF] = useState(EMPTY);
  const [sort, setSort] = useState('yildiz');
  // Filtre paneli mobilde varsayılan KAPALI (asıl içerik, kartlar, ilk ekranda kalsın); geniş ekranda açık.
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 900px)').matches);
  const q = norm(useDeferredValue(f.q)).trim();

  const filtered = useMemo(() => ITEMS.filter(a => matches(a, f, q)).sort(SORTERS[sort]), [f, q, sort]);
  const facet = (key, value) => ITEMS.filter(a => matches(a, f, q, key) && (value === true ? !!a[key] : a[key] === value)).length;
  const facetAll = key => ITEMS.filter(a => matches(a, f, q, key)).length;

  // Filtre/sıralama değişince sayfalama başa döner (efekt yerine imza karşılaştırması).
  const sig = JSON.stringify([f.kategori, f.tur, f.durum, f.deneme, f.github, q, sort]);
  const [pager, setPager] = useState({ sig, n: PAGE });
  const limit = pager.sig === sig ? pager.n : PAGE;
  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;

  const active = ['kategori', 'tur', 'durum'].filter(k => f[k] !== 'all').length + (f.deneme ? 1 : 0) + (f.github ? 1 : 0);
  const update = patch => setF(prev => ({ ...prev, ...patch }));

  return (
    <div className="skills">
      <section className="pagehead">
        <div className="wrap">
          <Link to="/" className="mono muted pagehead__back">
            ← ANA SAYFA
          </Link>
          <h1>Skills &amp; Araçlar</h1>
          <p className="lead">Keşfettiğim, değerlendirdiğim ve kullandığım araçların kataloğu.</p>
          <p className="mono muted skills__meta">
            <span data-testid="skills-total">{NUM.format(TOTAL)} ARAÇ</span>
            {DATA.meta?.olusturma && <span>Yıldızlar {fmtDay(DATA.meta.olusturma)} itibarıyla</span>}
          </p>
        </div>
      </section>

      <section className="wrap skills__body">
        <div className="skills__bar">
          <label className="skills__search">
            <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">Katalogda ara</span>
            <input type="search" value={f.q} onChange={e => update({ q: e.target.value })} placeholder="Ara: ad, özet, kategori…" autoComplete="off" />
          </label>
          <label className="skills__sort">
            <span className="mono muted">SIRALA</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="chip skills__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(o => !o)}>
            <HugeiconsIcon icon={FilterHorizontalIcon} size={18} strokeWidth={1.8} aria-hidden="true" />
            Filtreler
            {active > 0 && <span className="skills__badge">{active}</span>}
          </button>
        </div>

        <div id={panelId} className="skills__panel" hidden={!open}>
          <Facet title="Durum" name="durum" keys={DURUM_KEYS} map={DURUM} f={f} update={update} facet={facet} facetAll={facetAll} />
          <Facet title="Kategori" name="kategori" keys={KATEGORI_KEYS} map={KATEGORI} f={f} update={update} facet={facet} facetAll={facetAll} />
          <Facet title="Tür" name="tur" keys={TUR_KEYS} map={TUR} f={f} update={update} facet={facet} facetAll={facetAll} />
          <div className="skills__facet">
            <span className="mono muted">KAYIT</span>
            <div className="chips">
              <button type="button" className="chip chip--sm" data-filter="deneme" aria-pressed={f.deneme} onClick={() => update({ deneme: !f.deneme })}>
                Deneme sonucu olanlar <span className="mono">{facet('deneme', true)}</span>
              </button>
              <button type="button" className="chip chip--sm" data-filter="github" aria-pressed={f.github} onClick={() => update({ github: !f.github })}>
                GitHub’da olanlar <span className="mono">{facet('github', true)}</span>
              </button>
            </div>
          </div>
          {(active > 0 || f.q) && (
            <button type="button" className="skills__clear" onClick={() => setF(EMPTY)}>
              Filtreleri temizle
            </button>
          )}
        </div>

        <p className="skills__count mono muted" aria-live="polite" data-testid="skills-count">
          {filtered.length === TOTAL ? `${NUM.format(TOTAL)} ARAÇ` : `${NUM.format(filtered.length)} / ${NUM.format(TOTAL)} ARAÇ`}
        </p>

        {filtered.length === 0 ? (
          <div className="empty">Bu arama ve filtrelerle eşleşen araç yok.</div>
        ) : (
          <ul className="skills__grid">
            {visible.map(a => (
              <li key={a._id}>
                <SkillCard a={a} />
              </li>
            ))}
          </ul>
        )}

        {remaining > 0 && (
          <div className="skills__more">
            <button type="button" className="btn btn--ink btn--sm" onClick={() => setPager({ sig, n: limit + PAGE })}>
              Daha fazla göster ({NUM.format(remaining)} kaldı)
            </button>
            <button type="button" className="btn btn--line btn--sm" data-action="show-all" onClick={() => setPager({ sig, n: filtered.length })}>
              Tümünü göster
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Facet({ title, name, keys, map, f, update, facet, facetAll }) {
  return (
    <div className="skills__facet" role="group" aria-label={title}>
      <span className="mono muted">{title.toLocaleUpperCase('tr')}</span>
      <div className="chips">
        <button type="button" className="chip chip--sm" aria-pressed={f[name] === 'all'} onClick={() => update({ [name]: 'all' })}>
          Tümü <span className="mono">{facetAll(name)}</span>
        </button>
        {keys.map(k => (
          <button
            key={k}
            type="button"
            className="chip chip--sm"
            data-filter={`${name}:${k}`}
            aria-pressed={f[name] === k}
            onClick={() => update({ [name]: f[name] === k ? 'all' : k })}
          >
            {label(map, k)} <span className="mono">{facet(name, k)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const Ext = ({ href, children, ...rest }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
    {children}
  </a>
);

function SkillCard({ a }) {
  const gh = a.github;
  const age = gh ? ageText(gh) : null;
  const sources = uniqueSources(a.kaynaklar);
  const showRepo = a.repo_url && a.repo_url !== a.resmi_url;
  return (
    <article className="skill" data-has-trial={a.deneme ? 'true' : undefined} data-has-github={gh ? 'true' : undefined}>
      <div className="skill__top">
        <span className="skill__kind mono">
          {[a.tur && label(TUR, a.tur), a.kategori && label(KATEGORI, a.kategori)].filter(Boolean).join(' · ')}
        </span>
        <span className="skill__tags">
          {a.dogrulandi === false && <span className="skill__unverified">doğrulanmadı</span>}
          {a.durum && <span className={`skill__status skill__status--${a.durum}`}>{label(DURUM, a.durum)}</span>}
        </span>
      </div>

      <h3 className="skill__name">{a.ad}</h3>
      {a.ozet && <p className="skill__lead">{a.ozet}</p>}

      {(a.lisans || a.fiyat) && (
        <dl className="skill__facts">
          {a.lisans && (
            <div>
              <dt>Lisans</dt>
              <dd>{a.lisans}</dd>
            </div>
          )}
          {a.fiyat && (
            <div>
              <dt>Fiyat</dt>
              <dd>{a.fiyat}</dd>
            </div>
          )}
        </dl>
      )}

      {gh && (
        <div className="skill__gh" title={[gh.son_push && `son push: ${gh.son_push}`, gh.olcum_tarihi && `ölçüm: ${gh.olcum_tarihi}`].filter(Boolean).join(' · ')}>
          {gh.yildiz != null && (
            <span className="skill__stars">
              <HugeiconsIcon icon={StarIcon} size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">GitHub yıldızı: </span>
              {NUM.format(gh.yildiz)}
            </span>
          )}
          {age && <span>{age}</span>}
          {gh.arsiv && (
            <span className="skill__archived">
              <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={2} aria-hidden="true" />
              Arşivlenmiş repo
            </span>
          )}
        </div>
      )}

      {a.deneme && <Trial d={a.deneme} />}

      {(a.resmi_url || showRepo || sources.length > 0) && (
        <div className="skill__foot">
          {(a.resmi_url || showRepo) && (
            <span className="skill__links">
              {a.resmi_url && <Ext href={a.resmi_url}>Resmi site ↗</Ext>}
              {showRepo && <Ext href={a.repo_url}>Repo ↗</Ext>}
            </span>
          )}
          {sources.length > 0 && (
            <span className="skill__sources" aria-label="Kaynaklar">
              {sources.map(s => {
                const k = sourceKind(s);
                const info = [k.name, s.paylasan, s.tarih].filter(Boolean).join(' · ');
                return (
                  <Ext key={s.url} href={s.url} className="skill__source" aria-label={`Kaynak: ${info}`} title={info}>
                    <HugeiconsIcon icon={k.icon} size={17} strokeWidth={1.7} aria-hidden="true" />
                  </Ext>
                );
              })}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function Trial({ d }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reduce = useReducedMotion();
  const rows = [
    ['Input', d.input],
    ['Output', d.output],
    ['Sonuç', d.sonuc]
  ].filter(([, v]) => v);
  return (
    <div className="trial">
      <button type="button" className="trial__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        <span>Deneme: input → output → sonuç</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} className="trial__chev" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <Motion.div
            id={id}
            className="trial__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="trial__inner">
              {d.tarih && <span className="mono muted">{fmtDay(d.tarih)}</span>}
              <dl>
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {d.kanit_dosyasi_mevcut === false && <p className="trial__note">Sonuç kayıtlardan alındı.</p>}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
