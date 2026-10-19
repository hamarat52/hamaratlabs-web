import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './IdeaBoardPage.css';
import AppIcon from './AppIcon';
import Comments from './Comments';
import { Link } from './nav';
import { slugOf } from './data';
import { CrumpleFlight, TrashBin } from './IdeaBoardTrash';
import { preloadSticker, snapshotNote } from './ideaBoardSnapshot';
import { noteCrumpleOptions, preparePaper } from './crumplePrep';

/* Fikir aşamasındaki ürünlerin sayfası: design thinking'teki beyin fırtınası panosu.
   Her alan (ad, kısa tanım, tanım, özellikler, platform) ayrı bir yapışkan nota düşer;
   panoda kâğıt dışında hiçbir yazı yok. Notlar serbestçe dağılır ve sürüklenip
   bırakıldığı yerde kalır (fare, dokunmatik ve klavye). Konum yalnız oturum boyunca
   tutulur. Açılar, bant/iğne ve ilk dağılım ürün adından türetilir: her yenilemede
   aynı, her üründe farklı.
   Notlar buruşturulup sol alttaki çöp kutusuna atılabilir (köşedeki ✕, çöpe sürükleme
   ya da Delete). Bu yalnız arayüzdür: veri değişmez, sayfa yenilenince notlar geri gelir;
   kutuya basınca son atılan not panoya döner. */

const HAND_FONT = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap';

const isPlaceholder = v => !v || String(v).trim().startsWith('[');

// Ürün adından tohumlanan küçük, kararlı rastgele sayı üreteci (mulberry32).
function seeded(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ±min..max derece; işaret ve büyüklük rastgele, ama sıfıra yakın değil.
const tilt = (rnd, min, max) => (rnd() < 0.5 ? -1 : 1) * (min + rnd() * (max - min));

// Data.js alanlarından notları üretir. Hiçbir ürün içeriği burada sabit yazılı değil.
function buildNotes(app) {
  const rnd = seeded(app.name);
  const points = (app.points || []).filter(p => !isPlaceholder(p));
  const platforms = isPlaceholder(app.platform) ? [] : app.platform.split('·').map(s => s.trim()).filter(Boolean);

  const raw = [
    { kind: 'name', tone: 'yellow', size: 'lg', stuck: 'tape' },
    { kind: 'text', tone: 'pink', label: 'Tek cümlede', text: app.short, ask: 'tek cümleyle ne?' },
    { kind: 'text', tone: 'blue', size: 'wide', label: 'Ne yapar?', text: app.lead, ask: 'kimin hangi işini görür?' },
    ...(points.length
      ? points.map((p, n) => ({ kind: 'text', tone: 'lime', size: 'sm', label: `Özellik ${n + 1}`, text: p }))
      : [{ kind: 'text', tone: 'lime', label: 'Özellik', text: '', ask: 'ilk özellik?' }]),
    { kind: 'platform', tone: 'orange', label: 'Nerede?', platforms, ask: 'hangi platform?' },
    {
      kind: 'check',
      tone: 'card',
      label: 'Netleşenler',
      stuck: 'pin',
      checklist: [
        ['Tek cümle', !isPlaceholder(app.short)],
        ['Tanım', !isPlaceholder(app.lead)],
        ['Özellikler', points.length > 0],
        ['Platform', platforms.length > 0]
      ]
    }
  ];

  return raw.map((note, i) => ({
    ...note,
    key: `${note.kind}-${i}`,
    stuck: note.stuck || ['tape', 'pin', 'none', 'tape', 'none'][Math.floor(rnd() * 5)],
    style: {
      '--r': `${tilt(rnd, 3, 8).toFixed(1)}deg`,
      '--tape': `${tilt(rnd, 2, 9).toFixed(1)}deg`,
      '--i': i
    }
  }));
}

/* İlk dağılım: notlar raf raf dizilir ama satırdaki boşluk rastgele ağırlıklarla
   paylaştırılır ve her not dikeyde biraz oynar. Sütun ya da bölüm hissi oluşmaz.
   Satırlar dengelenir (son satırda tek başına kalan not olmasın). Ad notu hep ilk
   sırada; geri kalanların sırası üründen ürüne değişir. */
function scatter(notes, sizes, width, pad, seed) {
  const rnd = seeded(`${seed}:${Math.round(width)}`);
  const narrow = width < 560;
  const gapMin = narrow ? 12 : 20;
  const rowGap = narrow ? 30 : 42;
  const jitterY = narrow ? 14 : 40;
  const inner = width - pad * 2;

  const rest = notes.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const order = [notes[0], ...rest];
  const pack = limit => {
    const out = [];
    let row = [];
    let used = 0;
    for (const n of order) {
      const w = sizes[n.key].w;
      if (row.length && used + gapMin + w > limit) {
        out.push(row);
        row = [];
        used = 0;
      }
      used += (row.length ? gapMin : 0) + w;
      row.push(n);
    }
    if (row.length) out.push(row);
    return out;
  };
  // Aynı satır sayısını koruyan en dar sınırla paketle: satır genişlikleri dengelenir.
  let rows = pack(inner);
  const widest = Math.max(...order.map(n => sizes[n.key].w));
  for (let limit = inner - 8; limit >= widest; limit -= 8) {
    const tryRows = pack(limit);
    if (tryRows.length > rows.length) break;
    rows = tryRows;
  }

  const pos = {};
  let top = pad + 8;
  for (const r of rows) {
    const widths = r.map(n => sizes[n.key].w);
    const free = Math.max(0, inner - widths.reduce((a, b) => a + b, 0) - gapMin * (r.length - 1));
    const weights = Array.from({ length: r.length + 1 }, () => 0.35 + rnd());
    const total = weights.reduce((a, b) => a + b, 0);
    let x = pad + (free * weights[0]) / total;
    let rowH = 0;
    r.forEach((n, i) => {
      const dy = Math.round(rnd() * jitterY);
      pos[n.key] = { x: Math.round(x), y: top + dy };
      rowH = Math.max(rowH, sizes[n.key].h + dy);
      x += widths[i] + gapMin + (free * weights[i + 1]) / total;
    });
    top += rowH + rowGap;
  }
  return { pos, height: Math.ceil(top - rowGap + pad + 8) };
}

// Notun panodan taşmaması için kenar payları: kutu açıyla (±8°) döndüğünde köşeler
// ~16px dışarı çıkar; bant üstte, gölge altta biraz taşar.
const EDGE = { x: 18, top: 20, bottom: 20 };
const clampTo = (p, s, board) => ({
  x: Math.round(Math.min(Math.max(p.x, EDGE.x), Math.max(EDGE.x, board.w - s.w - EDGE.x))),
  y: Math.round(Math.min(Math.max(p.y, EDGE.top), Math.max(EDGE.top, board.h - s.h - EDGE.bottom)))
});

const DRAG_THRESHOLD = 5; // px: bunun altındaki hareket tıklama sayılır
const TOUCH_HOLD = 180; // ms: dokunmatikte basılı tutunca kâğıt kalkar, kısa kaydırma sayfayı kaydırır
const KEY_STEP = 12;
const BIN_SLACK = 26; // px: imleç çöp kutusuna bu kadar yaklaşınca not "kutunun üstünde" sayılır
const binRoom = narrow => (narrow ? 58 : 66); // panonun dibinde kutuya ayrılan pay

const noteLabel = (note, app) => (note.kind === 'name' ? app.name : note.label);

// Caveat geç yüklenirse not yükseklikleri değişir; yeniden dağıtmak için sayaç.
function useFontVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    let on = true;
    const bump = () => on && setV(n => n + 1);
    fonts.ready.then(bump);
    fonts.addEventListener?.('loadingdone', bump);
    return () => {
      on = false;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);
  return v;
}

// Elle çizilmiş tik kutusu.
const Tick = ({ on }) => (
  <svg className="ib-tick" viewBox="0 0 24 24" aria-hidden="true">
    <path className="ib-tick__box" d="M4 5.5c5-.8 10-.6 15 .2.6 4.6.5 9.4-.2 13.6-5 .6-10 .5-14.6-.2-.6-4.6-.7-9 .2-13.6Z" />
    {on && <path className="ib-tick__mark" d="M7 12.5l3.6 3.8L21 3.5" />}
  </svg>
);

function Stuck({ kind }) {
  if (kind === 'tape') return <span className="ib-tape" aria-hidden="true" />;
  if (kind === 'pin') return <span className="ib-pin" aria-hidden="true" />;
  return null;
}

function NoteContent({ note, app, empty }) {
  if (note.kind === 'name') {
    return (
      <>
        <span className="ib-note__label">Fikir aşaması</span>
        <h1 className="ib-note__name">{app.name}</h1>
        <span className="ib-note__hint" aria-hidden="true">
          notları tutup taşıyabilirsin
        </span>
        <span className="ib-sticker">
          <AppIcon name={app.name} size={64} />
        </span>
      </>
    );
  }
  return (
    <>
      <span className="ib-note__label">{note.label}</span>
      {empty && (
        <span className="ib-note__ask">
          {note.ask}
          <span className="sr-only"> Henüz yazılmadı.</span>
        </span>
      )}
      {note.kind === 'text' && !empty && <p className="ib-note__text">{note.text}</p>}
      {note.kind === 'platform' && !empty && (
        <ul className="ib-tags">
          {note.platforms.map(p => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {note.kind === 'check' && (
        <ul className="ib-check">
          {note.checklist.map(([label, done]) => (
            <li key={label} className={done ? 'is-done' : undefined}>
              <Tick on={done} />
              <span>{label}</span>
              <span className="sr-only">{done ? ': netleşti' : ': henüz netleşmedi'}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function IdeaBoard({ app }) {
  const [notes] = useState(() => buildNotes(app));
  const boardRef = useRef(null);
  const noteEls = useRef(new Map());
  const [board, setBoard] = useState(null); // { w, h, pos: { key: {x, y} } }
  const [z, setZ] = useState({});
  const [lifted, setLifted] = useState(null);
  const [dropped, setDropped] = useState(null);
  const [trashed, setTrashed] = useState([]); // bu oturumda çöpe atılan notlar (sırayla)
  const [flights, setFlights] = useState([]); // şu an buruşup çöpe uçan notlar
  const [active, setActive] = useState(null); // dokunulan not: buruştur düğmesi görünür
  const [overBin, setOverBin] = useState(null); // çöp kutusunun üstünde sürüklenen not
  const [restored, setRestored] = useState(null);
  const [pulse, setPulse] = useState(0);
  const [announce, setAnnounce] = useState('');
  const zTop = useRef(1);
  const moved = useRef(false); // kullanıcı bir notu taşıdıysa yeniden dağıtma, yalnız sınıra çek
  const drag = useRef(null);
  const binRef = useRef(null);
  const gone = useRef(new Set());
  const trashRef = useRef(null);
  const fontVersion = useFontVersion();

  const measure = useCallback(() => {
    const sizes = {};
    for (const n of notes) {
      const el = noteEls.current.get(n.key);
      sizes[n.key] = { w: el ? el.offsetWidth : 0, h: el ? el.offsetHeight : 0 };
    }
    return sizes;
  }, [notes]);

  /* Yerleşim: ilk boyamadan önce ölç, dağıt; genişlik ya da font değişince tekrar.
     Kullanıcı bir notu taşıdıysa ve dar/geniş düzen değişmediyse konumlar korunur:
     state ham konumu tutar, ekrana o anki pano sınırına çekilmiş hali basılır. Böylece
     pencere geçici daralıp genişlese de notlar kenara yığılıp kalmaz. */
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const run = () => {
      const width = el.clientWidth;
      const narrow = width < 560;
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 24;
      const sizes = measure();
      setBoard(prev => {
        // Çöpteki notların ölçüsü yok (DOM'da değiller): son bilinen ölçü korunur.
        if (prev) for (const k in sizes) if (!sizes[k].w && prev.sizes[k]) sizes[k] = prev.sizes[k];
        if (prev && moved.current && prev.narrow === narrow) return { ...prev, w: width, sizes };
        if (prev && prev.w === width && prev.fv === fontVersion) return prev;
        moved.current = false;
        const { pos, height } = scatter(notes, sizes, width, pad, app.name);
        return { w: width, h: height + binRoom(narrow), pos, sizes, narrow, fv: fontVersion };
      });
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }, [notes, measure, app.name, fontVersion]);

  const shown = key => clampTo(board.pos[key], board.sizes[key], board);

  const raise = key => setZ(prev => ({ ...prev, [key]: ++zTop.current }));

  const moveTo = useCallback((key, x, y) => {
    const el = noteEls.current.get(key);
    const s = { w: el.offsetWidth, h: el.offsetHeight };
    setBoard(prev => ({
      ...prev,
      sizes: { ...prev.sizes, [key]: s },
      pos: { ...prev.pos, [key]: clampTo({ x, y }, s, prev) }
    }));
  }, []);

  // Sürükleme bittikten sonra gelen tek tıklamayı yut: altındaki link/davranış tetiklenmesin.
  const swallowClick = () => {
    const stop = e => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 350);
  };

  // drop: yalnız gerçek bırakışta (mouseup/touchend) true. İptal ve kaldırılmada not çöpe gitmez.
  const finish = useCallback(drop => {
    const d = drag.current;
    if (!d) return;
    clearTimeout(d.timer);
    d.cleanup();
    drag.current = null;
    setOverBin(null);
    if (d.lifted) {
      setLifted(null);
      if (d.live) {
        moved.current = true;
        // Çöpe bırakıldı: geri alınırsa sürüklemeden önceki yerine dönsün.
        if (drop === true && d.over) trashRef.current?.(d.key, { x: d.ox, y: d.oy });
        else setDropped(d.key);
      }
    }
    if (drop === true && !d.live) setActive(d.key); // dokunma/tıklama: buruştur düğmesi görünsün
    return d;
  }, []);

  const isOverBin = (x, y) => {
    const r = binRef.current?.getBoundingClientRect();
    return !!r && x > r.left - BIN_SLACK && x < r.right + BIN_SLACK && y > r.top - BIN_SLACK && y < r.bottom + BIN_SLACK;
  };

  const start = (key, x, y, touch) => {
    if (!board || drag.current) return;
    const p = shown(key);
    const d = { key, sx: x, sy: y, ox: p.x, oy: p.y, live: false, lifted: false, over: false, touch, timer: 0 };
    warm(key, true);
    const lift = () => {
      d.lifted = true;
      setDropped(null);
      setLifted(key);
      raise(key);
    };
    const onMove = (cx, cy, e) => {
      const dx = cx - d.sx;
      const dy = cy - d.sy;
      if (touch && !d.lifted) {
        // Basılı tutmadan kayan parmak sayfayı kaydırıyor: sürüklemeyi bırak.
        if (Math.hypot(dx, dy) > 8) finish();
        return;
      }
      if (e.cancelable) e.preventDefault();
      if (!d.live) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        d.live = true;
        if (!d.lifted) lift();
      }
      moveTo(key, d.ox + dx, d.oy + dy);
      const over = isOverBin(cx, cy);
      if (over !== d.over) {
        d.over = over;
        setOverBin(over ? key : null);
      }
    };
    const mm = e => onMove(e.clientX, e.clientY, e);
    const tm = e => e.touches.length === 1 && onMove(e.touches[0].clientX, e.touches[0].clientY, e);
    const up = () => {
      const done = finish(true);
      if (done && done.live) swallowClick();
    };
    const tend = e => {
      const done = finish(true);
      // Sürükleme olduysa dokunmanın ardından gelen sanal tıklamayı engelle.
      if (done && done.live && e.cancelable) e.preventDefault();
    };
    if (touch) {
      window.addEventListener('touchmove', tm, { passive: false });
      window.addEventListener('touchend', tend, { passive: false });
      window.addEventListener('touchcancel', finish);
      d.timer = setTimeout(() => {
        lift();
        navigator.vibrate?.(8);
      }, TOUCH_HOLD);
    } else {
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', up);
    }
    d.cleanup = () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tend);
      window.removeEventListener('touchcancel', finish);
    };
    drag.current = d;
  };

  useEffect(() => () => finish(), [finish]);

  /* Buruştur ve at: notun görüntüsü alınır, not listeden düşer ve aynı yerde, aynı açıyla
     Three.js kâğıdı belirir; buruşur ve çöpe uçar. Yalnız arayüz durumu, veri değişmez. */
  const trash = (key, origin) => {
    if (gone.current.has(key)) return;
    const li = noteEls.current.get(key);
    const boardEl = boardRef.current;
    if (!li || !boardEl) return;
    const note = notes.find(n => n.key === key);
    let shot = null;
    try {
      shot = snapshotNote(li, boardEl);
    } catch {
      shot = null; // görüntü alınamazsa not yine de kaybolur, kutu sallanır
    }
    gone.current.add(key);
    const hadFocus = li.contains(document.activeElement);
    if (origin) setBoard(prev => ({ ...prev, pos: { ...prev.pos, [key]: origin } }));
    moved.current = true;
    setActive(a => (a === key ? null : a));
    setDropped(dr => (dr === key ? null : dr));
    setTrashed(t => [...t, key]);
    if (shot) setFlights(f => [...f, { ...shot, key }]);
    else setPulse(n => n + 1);
    setAnnounce(`${noteLabel(note, app)} notu buruşturulup çöpe atıldı. Geri almak için çöp kutusuna bas.`);
    if (hadFocus) binRef.current?.focus({ preventScroll: true });
  };
  trashRef.current = trash;

  const landed = useCallback(key => {
    setFlights(f => f.filter(x => x.key !== key));
    setPulse(n => n + 1);
  }, []);

  const binTarget = useCallback(() => {
    const b = boardRef.current.getBoundingClientRect();
    const r = binRef.current.getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height * 0.42 - b.top };
  }, []);

  const flying = new Set(flights.map(f => f.key));
  const inBin = trashed.filter(k => !flying.has(k));

  const restore = () => {
    const key = inBin[inBin.length - 1];
    if (!key) return;
    gone.current.delete(key);
    setTrashed(t => t.filter(k => k !== key));
    setRestored(key);
    raise(key);
    setAnnounce(`${noteLabel(notes.find(n => n.key === key), app)} notu panoya geri döndü.`);
  };

  // Notun dışına dokunulunca buruştur düğmesi gizlenir.
  useEffect(() => {
    if (!active) return;
    const off = e => !e.target.closest?.('.ib-note') && setActive(null);
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [active]);

  // Ad notundaki sticker'ı önceden görüntüye çevir: buruşturma anı eşzamanlı kalsın.
  const ready = !!board;
  useEffect(() => {
    if (ready) preloadSticker(boardRef.current?.querySelector('.ib-sticker svg'));
  }, [ready]);

  /* Buruşma yolları ağır bir fizik hesabı: sayfa sakinleşince Web Worker'da, notların o anki
     kâğıt ölçüleriyle önceden hazırlanır. Kullanıcı bir nota yönelince o not öne alınır. */
  const warm = useCallback((key, urgent) => {
    const paper = noteEls.current.get(key)?.querySelector('.ib-note__paper');
    if (paper && paper.offsetWidth) preparePaper(noteCrumpleOptions(key, paper.offsetWidth, paper.offsetHeight), urgent);
  }, []);
  const boardW = board?.w;
  useEffect(() => {
    if (!ready) return;
    const go = () => notes.forEach(n => warm(n.key, false));
    const idle = window.requestIdleCallback;
    const id = idle ? idle(go, { timeout: 2500 }) : setTimeout(go, 1200);
    return () => (idle ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [ready, boardW, fontVersion, notes, warm]);

  const onKeyDown = (key, e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === e.currentTarget) {
      e.preventDefault();
      trash(key);
      return;
    }
    const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta || !board) return;
    e.preventDefault();
    moved.current = true;
    raise(key);
    const p = shown(key);
    moveTo(key, p.x + delta[0], p.y + delta[1]);
  };

  return (
    <div
      ref={boardRef}
      className={`ib-board${board ? ' is-ready' : ''}${lifted ? ' is-dragging' : ''}`}
      style={board ? { height: board.h } : undefined}
    >
      <p className="sr-only" id="ib-help">
        Notları fareyle sürükleyerek, dokunmatik ekranda basılı tutup kaydırarak ya da klavyede ok tuşlarıyla taşıyabilirsin.
        Bir notu sol alttaki çöp kutusuna sürükleyerek, köşesindeki buruştur düğmesiyle ya da Delete tuşuyla atabilirsin;
        sayfa yenilenince notlar geri gelir.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <ul className="ib-notes">
        {notes.map(note => {
          if (trashed.includes(note.key)) return null;
          const empty =
            (note.kind === 'text' && isPlaceholder(note.text)) || (note.kind === 'platform' && note.platforms.length === 0);
          const p = board ? shown(note.key) : null;
          const cls = [
            'ib-note',
            `ib-note--${note.tone}`,
            note.size && `ib-note--${note.size}`,
            empty && 'is-empty',
            lifted === note.key && 'is-lifted',
            dropped === note.key && 'is-dropped',
            active === note.key && 'is-active',
            overBin === note.key && 'is-over-bin',
            restored === note.key && 'is-restored'
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li
              key={note.key}
              ref={el => {
                if (el) noteEls.current.set(note.key, el);
                else noteEls.current.delete(note.key);
              }}
              className={cls}
              style={{
                ...note.style,
                transform: p ? `translate3d(${p.x}px, ${p.y}px, 0)` : undefined,
                zIndex: z[note.key] || undefined
              }}
              data-note={note.key}
              tabIndex={0}
              aria-roledescription="taşınabilir not"
              aria-describedby="ib-help"
              onMouseDown={e => e.button === 0 && start(note.key, e.clientX, e.clientY, false)}
              onTouchStart={e => e.touches.length === 1 && start(note.key, e.touches[0].clientX, e.touches[0].clientY, true)}
              onKeyDown={e => onKeyDown(note.key, e)}
              onMouseEnter={() => warm(note.key, true)}
              onFocus={() => warm(note.key, true)}
              onDragStart={e => e.preventDefault()}
              onContextMenu={e => lifted === note.key && e.preventDefault()}
              onAnimationEnd={e => {
                if (e.animationName === 'ib-press') setDropped(null);
                if (e.animationName === 'ib-stick' && restored === note.key) setRestored(null);
              }}
            >
              <div className="ib-note__body">
                <Stuck kind={note.stuck} />
                <div className="ib-note__paper">
                  <NoteContent note={note} app={app} empty={empty} />
                </div>
                <button
                  type="button"
                  className="ib-crumple-btn"
                  aria-label={`${noteLabel(note, app)} notunu buruştur ve çöpe at`}
                  title="Buruştur ve at"
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    trash(note.key);
                  }}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.6 5.4c2.9 2.9 5.9 6 8.9 9.1M14.7 5.7c-3.1 2.8-6.1 5.8-9.1 8.9" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {flights.map(item => (
        <CrumpleFlight key={item.key} item={item} getTarget={binTarget} onDone={landed} />
      ))}
      <TrashBin
        binRef={binRef}
        tones={inBin.map(k => notes.find(n => n.key === k).tone)}
        armed={!!lifted}
        hot={!!overBin}
        pulse={pulse}
        canRestore={inBin.length > 0}
        onRestore={restore}
      />
    </div>
  );
}

export default function IdeaBoardPage({ app }) {
  return (
    <article className="ideaboard">
      <link rel="stylesheet" href={HAND_FONT} precedence="default" />
      <div className="wrap ideaboard__head">
        <Link to="/uretiyorum" className="ideaboard__back">
          ← Uygulamalar
        </Link>
      </div>

      <div className="wrap">
        {/* key: başka bir ürüne geçince pano baştan kurulsun */}
        <IdeaBoard key={app.name} app={app} />
      </div>

      <Comments term={app.name} />
    </article>
  );
}

// /uretiyorum listesi için: fikir aşamasındaki ürünün kartı, tek bir yapışkan not olarak.
// AppCard yerine `.cards` ızgarasına doğrudan konabilir. `index` (fikir kartları arasındaki
// sıra) verilirse renkler sırayla döner, yan yana iki kart aynı renge düşmez.
const CARD_TONES = ['yellow', 'pink', 'blue', 'lime', 'orange'];
export function IdeaNoteCard({ app, index }) {
  const rnd = seeded(app.name);
  const style = {
    '--r': `${tilt(rnd, 3, 5).toFixed(1)}deg`,
    '--tape': `${tilt(rnd, 2, 9).toFixed(1)}deg`,
    '--tx': `${Math.round((rnd() - 0.5) * 40)}px`
  };
  const pick = Math.floor(rnd() * CARD_TONES.length);
  const tone = CARD_TONES[(Number.isInteger(index) ? index : pick) % CARD_TONES.length];
  const hasShort = !isPlaceholder(app.short);
  return (
    <Link
      to={`/uretiyorum/${slugOf(app.name)}`}
      className={`ib-card ib-note--${tone}${hasShort ? '' : ' is-empty'}`}
      style={style}
      aria-label={`${app.name} fikir panosu`}
    >
      <link rel="stylesheet" href={HAND_FONT} precedence="default" />
      <span className="ib-tape" aria-hidden="true" />
      <span className="ib-card__paper">
        <span className="ib-note__label">Fikir</span>
        <span className="ib-card__name">{app.name}</span>
        {hasShort && <span className="ib-card__short">{app.short}</span>}
        {!isPlaceholder(app.platform) && <span className="ib-card__foot">{app.platform}</span>}
      </span>
    </Link>
  );
}
