import { useEffect, useState } from 'react';
import { Link } from '../nav';
import { asset } from '../base';
import { POSTS, postBySlug } from './posts';
import './Ogretici.css';

// Yazı metinleri (src/ogretici/yazilar/<slug>.md) bu parçaya ham metin olarak gömülür.
const BODIES = Object.fromEntries(
  Object.entries(import.meta.glob('./yazilar/*.md', { query: '?raw', import: 'default', eager: true })).map(([p, txt]) => [
    p.replace(/^.*\/([^/]+)\.md$/, '$1'),
    txt
  ])
);

// ---------- Küçük markdown okuyucu: yalnız yazılarda kullanılan biçimler ----------
// **kalın**, `kod`, # başlık, ### ara başlık, 1. / - listeler, --- çizgi, ::figure <ad>, ::prompt
function inline(text, keyBase = 'i') {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function parse(md) {
  const blocks = [];
  let para = null;
  let list = null;
  const flush = () => {
    if (para) blocks.push({ type: 'p', text: para.join(' ') });
    if (list) blocks.push(list);
    para = null;
    list = null;
  };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) flush();
    else if ((m = line.match(/^::figure\s+(\S+)/))) {
      flush();
      blocks.push({ type: 'figure', name: m[1] });
    } else if (line === '::prompt') {
      flush();
      blocks.push({ type: 'prompt' });
    } else if (line === '---') {
      flush();
      blocks.push({ type: 'hr' });
    } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flush();
      blocks.push({ type: `h${m[1].length}`, text: m[2] });
    } else if ((m = line.match(/^(\d+)\.\s+(.*)$/)) || (m = line.match(/^(-)\s+(.*)$/))) {
      const kind = m[1] === '-' ? 'ul' : 'ol';
      if (para) {
        blocks.push({ type: 'p', text: para.join(' ') });
        para = null;
      }
      if (!list || list.type !== kind) {
        if (list) blocks.push(list);
        list = { type: kind, items: [] };
      }
      list.items.push(m[2]);
    } else if (list) list.items[list.items.length - 1] += ` ${line.trim()}`;
    else (para ||= []).push(line.trim());
  }
  flush();
  return blocks;
}

// ---------- Panoya kopyalama (ShareSling ile aynı desen: Clipboard API, olmazsa execCommand) ----------
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => legacyCopy(text)
    );
  }
  return Promise.resolve(legacyCopy(text));
}

// ---------- Parçalar ----------
function Img({ item, eager = false }) {
  return (
    <img
      src={asset(item.src)}
      alt={item.alt}
      width={item.width}
      height={item.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

function Figure({ fig, first }) {
  if (!fig) return null;
  if (fig.type === 'compare')
    return (
      <figure className="ogr__fig ogr__fig--wide">
        <div className="ogr__compare">
          {fig.items.map(it => (
            <div key={it.src} className="ogr__compare-item">
              <Img item={it} />
              <span className="mono muted">{it.caption}</span>
            </div>
          ))}
        </div>
        {fig.caption && <figcaption>{fig.caption}</figcaption>}
      </figure>
    );
  if (fig.type === 'strips')
    return (
      <figure className="ogr__fig ogr__fig--wide">
        {fig.items.map(it => (
          <div key={it.src} className="ogr__strip">
            <span className="mono muted">{it.caption}</span>
            <div className="ogr__strip-scroll" tabIndex={0} aria-label={`${it.caption}, yatay kaydırılabilir`}>
              <Img item={it} />
            </div>
          </div>
        ))}
        {fig.caption && <figcaption>{fig.caption}</figcaption>}
      </figure>
    );
  return (
    <figure className="ogr__fig ogr__fig--wide">
      <a href={asset(fig.src)} target="_blank" rel="noopener noreferrer" className="ogr__zoom" aria-label="Görseli tam boyutta aç">
        <Img item={fig} eager={first} />
      </a>
      {fig.caption && <figcaption>{fig.caption}</figcaption>}
    </figure>
  );
}

function PromptBox({ prompt }) {
  const [text, setText] = useState(null);
  const [state, setState] = useState('idle'); // idle | ok | fail
  useEffect(() => {
    let alive = true;
    fetch(asset(prompt.file))
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then(t => alive && setText(t))
      .catch(() => alive && setText(''));
    return () => {
      alive = false;
    };
  }, [prompt.file]);
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(t);
  }, [state]);

  const onCopy = () => copyText(text || '').then(ok => setState(ok ? 'ok' : 'fail'));
  return (
    <section className="ogr__prompt" aria-label={prompt.title}>
      <div className="ogr__prompt-head">
        <span className="mono">{prompt.name}</span>
        <div className="ogr__prompt-actions">
          <button type="button" className="ogr__btn ogr__btn--lime" onClick={onCopy} disabled={!text} data-state={state}>
            {state === 'ok' ? 'Kopyalandı ✓' : state === 'fail' ? 'Kopyalanamadı' : 'Panoya kopyala'}
          </button>
          <a className="ogr__btn ogr__btn--ghost" href={asset(prompt.file)} download={prompt.name}>
            .md indir ↓
          </a>
        </div>
      </div>
      <pre className="ogr__code" tabIndex={0}>
        <code>{text === null ? 'Yükleniyor…' : text || 'Dosya yüklenemedi. “.md indir” bağlantısını kullan.'}</code>
      </pre>
      <span className="sr-only" aria-live="polite">
        {state === 'ok' ? 'Panoya kopyalandı' : state === 'fail' ? 'Kopyalanamadı' : ''}
      </span>
    </section>
  );
}

function InstagramCta({ href }) {
  const pending = !href || href === '#';
  // TODO(Yusuf): posts.js → instagram alanına gerçek post linki yazılınca buton dış bağlantıya döner.
  return (
    <a
      className={`ogr__btn ogr__btn--ink${pending ? ' is-pending' : ''}`}
      href={pending ? '#' : href}
      {...(pending ? { onClick: e => e.preventDefault(), 'aria-disabled': 'true', title: 'Bağlantı yakında' } : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      Instagram'da izle <span aria-hidden="true">↗</span>
    </a>
  );
}

function Post({ post }) {
  const blocks = parse(BODIES[post.slug] || '');
  const h1 = blocks.find(b => b.type === 'h1');
  const body = blocks.filter(b => b !== h1);
  let firstFig = true;
  useEffect(() => {
    const prev = document.title;
    document.title = `${post.title} · hamaratlabs`;
    return () => {
      document.title = prev;
    };
  }, [post.title]);

  return (
    <article className="ogr">
      <header className="wrap ogr__hero">
        <Link to="/ogretici" className="apppage__back">
          ← Öğretici
        </Link>
        <span className="mono muted">
          {post.kind} · {post.date}
        </span>
        <h1>{h1 ? h1.text : post.title}</h1>
        <div className="ogr__actions">
          <InstagramCta href={post.instagram} />
          {post.prompt && (
            <a className="ogr__btn ogr__btn--line" href="#agent-prompt">
              Agent prompt'u <span aria-hidden="true">↓</span>
            </a>
          )}
        </div>
      </header>
      <div className="wrap ogr__body">
        {body.map((b, i) => {
          const key = `${b.type}-${i}`;
          if (b.type === 'p') return <p key={key}>{inline(b.text, key)}</p>;
          if (b.type === 'h2' || b.type === 'h3') return <h2 key={key}>{inline(b.text, key)}</h2>;
          if (b.type === 'hr') return <hr key={key} />;
          if (b.type === 'ol' || b.type === 'ul') {
            const Tag = b.type;
            return (
              <Tag key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{inline(it, `${key}-${j}`)}</li>
                ))}
              </Tag>
            );
          }
          if (b.type === 'figure') {
            const el = <Figure key={key} fig={post.figures?.[b.name]} first={firstFig} />;
            firstFig = false;
            return el;
          }
          if (b.type === 'prompt' && post.prompt)
            return (
              <div key={key} id="agent-prompt" className="ogr__fig--wide">
                <PromptBox prompt={post.prompt} />
              </div>
            );
          return null;
        })}
      </div>
    </article>
  );
}

function List() {
  return (
    <>
      <section className="pagehead">
        <div className="wrap">
          <Link to="/" className="mono muted pagehead__back">
            ← ANA SAYFA
          </Link>
          <h1>Öğretici</h1>
          <p className="lead">Nasıl yaptığımızı adım adım anlattığımız yazılar.</p>
        </div>
      </section>
      <section className="wrap section ogr__list">
        <ul className="lessons">
          {POSTS.map(p => (
            <li key={p.slug}>
              <Link to={`/ogretici/${p.slug}`} className="lesson">
                <span className="lesson__title">{p.title}</span>
                <span className="lesson__sub">{p.sub}</span>
                <span className="lesson__meta">
                  {p.kind} · {p.date}
                </span>
                <span className="lesson__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// /ogretici → liste, /ogretici/<slug> → yazı. Bilinmeyen slug listeye düşer (kısa not ile).
export default function OgreticiPage({ slug }) {
  if (!slug) return <List />;
  const post = postBySlug(slug);
  if (post) return <Post post={post} />;
  return (
    <>
      <div className="wrap ogr__missing">
        <p className="muted">Bu yazı bulunamadı. Tüm yazılar aşağıda.</p>
      </div>
      <List />
    </>
  );
}
