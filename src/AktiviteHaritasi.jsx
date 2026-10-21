// /aktivite: kod aktivitesi, harita gibi.
// Obsidian grafik görünümü estetiği (koyu zemin, organik force-directed düğümler, ince gri bağlar)
// + Google Maps davranışı (uzaktan yalnızca büyük işler; yakınlaştıkça küçük işler açılır).
// Veri: public/data/kod-aktivite.json — cron her gün günceller, bu yüzden build'e gömülmez, çalışırken çekilir.
import { useEffect, useMemo, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force';
import { Link } from './nav';
import { asset } from './base';
import './AktiviteHaritasi.css';

// Zoom basamakları: `at` = sığdırılmış görünüme göre göreli yakınlık, `min` = görünür olmak için gereken puan.
const LEVELS = [
  { at: 1, min: 80 },
  { at: 1.7, min: 60 },
  { at: 2.8, min: 40 },
  { at: 4.2, min: 0 }
];
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 14;
const MAX_LABELS = 40;
const BG = '#0d1014';
const MONO = "'JetBrains Mono', 'Courier New', monospace";

// Renkler: ürünlerin data.js'teki visitAccent renkleri + diğer repolar için ayrışan bir palet.
const REPO_COLORS = {
  'wingwire-android': '#5A86FF',
  'wingwire-ios': '#22D3EE',
  'wingwire-web': '#A78BFA',
  sesver: '#ff5c86',
  'sesver-elevenlabs': '#ff8f1f',
  'sesver-docs': '#FACC15',
  'sesver-logo-wt': '#E879F9',
  'income-vs-desires': '#C2451F',
  'hamaratlabs-web': '#d0ff63',
  'hamaratlabs-logo-lab': '#34D399',
  titimer: '#F2EFE6',
  kitabe: '#B08968'
};
// Cron yeni bir repo eklerse: adından türetilen, her yüklemede aynı kalan bir renk.
const colorOf = repo => {
  if (REPO_COLORS[repo]) return REPO_COLORS[repo];
  let h = 0;
  for (const ch of repo) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${(h * 137.508) % 360}, 72%, 64%)`;
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const radiusOf = score => 1.6 + Math.pow(score / 100, 2.2) * 13;
const levelOf = rel => {
  let lv = 0;
  for (let i = 0; i < LEVELS.length; i++) if (rel >= LEVELS[i].at * 0.999) lv = i;
  return lv;
};
const shorten = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
// Düzen her yüklemede aynı çıksın diye tohumlu rastgelelik.
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const DATE_FMT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const DAY_FMT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });
const fmtDate = t => (Number.isFinite(t) && t > 0 ? DATE_FMT.format(new Date(t)) : '—');
const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n);

function buildGraph(raw) {
  const rows = (Array.isArray(raw) ? raw : []).filter(c => c && typeof c.repo === 'string' && Number.isFinite(Number(c.score)));
  const nodes = rows.map((c, i) => {
    const score = clamp(Number(c.score), 0, 100);
    return {
      i,
      repo: c.repo,
      hash: String(c.hash || ''),
      subject: String(c.subject || '(mesaj yok)'),
      t: Date.parse(c.date) || 0,
      score,
      merge: Boolean(c.is_merge),
      lines: Number.isFinite(Number(c.lines)) ? Number(c.lines) : null,
      r: radiusOf(score),
      color: colorOf(c.repo)
    };
  });

  const byRepo = new Map();
  for (const n of nodes) {
    if (!byRepo.has(n.repo)) byRepo.set(n.repo, []);
    byRepo.get(n.repo).push(n);
  }
  const repos = [...byRepo.entries()]
    .map(([name, list]) => ({ name, color: colorOf(name), nodes: list.sort((a, b) => a.t - b.t) }))
    .sort((a, b) => b.nodes.length - a.nodes.length || a.name.localeCompare(b.name));

  // Repo çapaları: büyük repolar ortada ayçiçeği (phyllotaxis) düzeninde, 1-2 commit'lik
  // "tek seferlik" repolar Obsidian'daki gibi dış halkada.
  const big = repos.filter(r => r.nodes.length > 2);
  const lone = repos.filter(r => r.nodes.length <= 2);
  const step = 40 + 3 * Math.sqrt(nodes.length);
  big.forEach((rp, i) => {
    const a = i * 2.39996;
    const d = Math.sqrt(i) * step;
    rp.ax = Math.cos(a) * d;
    rp.ay = Math.sin(a) * d;
  });
  const outer = (Math.sqrt(Math.max(big.length, 1)) + 1.1) * step;
  lone.forEach((rp, i) => {
    const a = (i / Math.max(lone.length, 1)) * Math.PI * 2 + 0.4;
    rp.ax = Math.cos(a) * outer;
    rp.ay = Math.sin(a) * outer;
  });

  const rand = seeded(nodes.length * 7919 + repos.length);
  const links = [];
  for (const rp of repos) {
    rp.nodes.forEach((n, j) => {
      const a = j * 0.9 + rand() * 0.5;
      const d = 3 * Math.sqrt(j + 1) * 3;
      n.ax = rp.ax;
      n.ay = rp.ay;
      n.x = rp.ax + Math.cos(a) * d;
      n.y = rp.ay + Math.sin(a) * d;
      if (j > 0) links.push({ source: rp.nodes[j - 1], target: n });
    });
  }
  // Her zoom basamağı için ayrı "hat": aynı repoda, o basamakta görünen ART ARDA commit'leri bağlar.
  const levelLinks = LEVELS.map(L => {
    const out = [];
    for (const rp of repos) {
      let prev = null;
      for (const n of rp.nodes) {
        if (n.score < L.min) continue;
        if (prev) out.push([prev, n]);
        prev = n;
      }
    }
    return out;
  });
  const visibleCounts = LEVELS.map(L => nodes.filter(n => n.score >= L.min).length);
  const asc = [...nodes].sort((a, b) => a.score - b.score);
  const desc = [...asc].reverse();
  const times = nodes.map(n => n.t).filter(t => t > 0);
  return {
    nodes,
    repos,
    links,
    levelLinks,
    visibleCounts,
    asc,
    desc,
    from: times.length ? Math.min(...times) : 0,
    to: times.length ? Math.max(...times) : 0,
    seed: rand
  };
}

// Çizim + fizik + etkileşim motoru. React her karede yeniden çizim yapmaz; durum ref'lerde tutulur.
function createEngine(canvas, graph, { reduced, onLevel, onSelect }) {
  const ctx = canvas.getContext('2d');
  const { nodes, links, levelLinks, asc, desc, repos } = graph;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let k = 1;
  let tx = 0;
  let ty = 0;
  let fitK = 1;
  let touched = false; // kullanıcı zoom/pan yaptı mı (yaptıysa otomatik sığdırma durur)
  let raf = 0;
  let anim = null;
  let hovered = null;
  let selected = null;
  let focus = null;
  let lastLevel = -1;
  let running = false;

  const sim = forceSimulation(nodes)
    .randomSource(graph.seed)
    .force('link', forceLink(links).distance(l => 12 + (l.source.r + l.target.r) * 0.6).strength(0.55))
    .force('charge', forceManyBody().strength(n => -16 - n.r * 4).distanceMax(280).theta(0.9))
    .force('collide', forceCollide(n => n.r + 2).iterations(1))
    .force('x', forceX(n => n.ax).strength(0.05))
    .force('y', forceY(n => n.ay).strength(0.05))
    .stop();

  if (reduced) {
    // Hareket azaltma tercihi: düzen bir kerede hesaplanır, animasyon yok.
    const ticks = Math.ceil(Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay()));
    sim.tick(ticks);
  } else {
    sim.tick(60);
    running = true;
  }

  const bounds = () => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const n of nodes) {
      x0 = Math.min(x0, n.x - n.r);
      y0 = Math.min(y0, n.y - n.r);
      x1 = Math.max(x1, n.x + n.r);
      y1 = Math.max(y1, n.y + n.r);
    }
    return nodes.length ? { x0, y0, x1, y1 } : { x0: -1, y0: -1, x1: 1, y1: 1 };
  };
  const fitTransform = () => {
    const b = bounds();
    const pad = Math.min(w, h) < 500 ? 28 : 64;
    const kk = Math.max(0.05, Math.min((w - pad * 2) / (b.x1 - b.x0 || 1), (h - pad * 2) / (b.y1 - b.y0 || 1)));
    return { k: kk, tx: w / 2 - ((b.x0 + b.x1) / 2) * kk, ty: h / 2 - ((b.y0 + b.y1) / 2) * kk };
  };
  const fit = (animate = false) => {
    const f = fitTransform();
    fitK = f.k;
    if (animate) animTo(f.k, f.tx, f.ty);
    else {
      k = f.k;
      tx = f.tx;
      ty = f.ty;
      draw();
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (!touched) fit();
    else {
      fitK = fitTransform().k;
      draw();
    }
  };

  const setTransform = (nk, ntx, nty) => {
    k = nk;
    tx = ntx;
    ty = nty;
    request();
  };
  const zoomAt = (px, py, factor, animate = false) => {
    const nk = clamp(k * factor, fitK * ZOOM_MIN, fitK * ZOOM_MAX);
    const wx = (px - tx) / k;
    const wy = (py - ty) / k;
    touched = true;
    if (animate) animTo(nk, px - wx * nk, py - wy * nk);
    else setTransform(nk, px - wx * nk, py - wy * nk);
  };
  const animTo = (nk, ntx, nty) => {
    if (reduced) return setTransform(nk, ntx, nty);
    anim = { k0: k, tx0: tx, ty0: ty, k1: nk, tx1: ntx, ty1: nty, start: performance.now(), dur: 380 };
    request();
  };
  const centerOn = (n, nk) => {
    touched = true;
    animTo(nk, w / 2 - n.x * nk, h / 2 - n.y * nk);
  };

  function request() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    if (anim) {
      const p = clamp((now - anim.start) / anim.dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      // Ölçek logaritmik, kaydırma doğrusal değil: ekran merkezindeki dünya noktası sabit hızda kaysın.
      k = anim.k0 * Math.pow(anim.k1 / anim.k0, e);
      const cx0 = (w / 2 - anim.tx0) / anim.k0;
      const cy0 = (h / 2 - anim.ty0) / anim.k0;
      const cx1 = (w / 2 - anim.tx1) / anim.k1;
      const cy1 = (h / 2 - anim.ty1) / anim.k1;
      tx = w / 2 - (cx0 + (cx1 - cx0) * e) * k;
      ty = h / 2 - (cy0 + (cy1 - cy0) * e) * k;
      if (p >= 1) anim = null;
    }
    if (running) {
      sim.tick();
      if (sim.alpha() < sim.alphaMin()) running = false;
      if (!touched) {
        const f = fitTransform();
        fitK = f.k;
        k = f.k;
        tx = f.tx;
        ty = f.ty;
      }
    }
    draw();
    if (anim || running) request();
  }

  function draw() {
    if (!w || !h) return;
    const rel = k / fitK;
    const lv = levelOf(rel);
    const min = LEVELS[lv].min;
    if (lv !== lastLevel) {
      lastLevel = lv;
      onLevel(lv);
    }
    const sf = Math.pow(k, 0.6);
    const pad = 40 / k;
    const vx0 = -tx / k - pad;
    const vy0 = -ty / k - pad;
    const vx1 = (w - tx) / k + pad;
    const vy1 = (h - ty) / k + pad;
    const inView = n => n.x >= vx0 && n.x <= vx1 && n.y >= vy0 && n.y <= vy1;
    const segInView = (a, b) =>
      Math.max(a.x, b.x) >= vx0 && Math.min(a.x, b.x) <= vx1 && Math.max(a.y, b.y) >= vy0 && Math.min(a.y, b.y) <= vy1;
    const sx = n => n.x * k + tx;
    const sy = n => n.y * k + ty;
    const dim = n => focus && n.repo !== focus;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';

    // 1) Tüm commit zincirinin silik izi: gizli küçük işlerin de bir "yol ağı" olduğunu hissettirir.
    if (lv < LEVELS.length - 1 && links.length < 6000) {
      ctx.strokeStyle = 'rgba(150,158,170,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const l of links) {
        if (!segInView(l.source, l.target)) continue;
        ctx.moveTo(sx(l.source), sy(l.source));
        ctx.lineTo(sx(l.target), sy(l.target));
      }
      ctx.stroke();
    }

    // 2) Bu basamağın hattı: görünen ardışık commit'ler arası ince gri çizgi (seçili repo kendi renginde).
    const lvLinks = levelLinks[lv];
    ctx.lineWidth = 1;
    ctx.strokeStyle = focus ? 'rgba(150,158,170,0.10)' : 'rgba(150,158,170,0.36)';
    ctx.beginPath();
    for (const [a, b] of lvLinks) {
      if (focus && a.repo === focus) continue;
      if (!segInView(a, b)) continue;
      ctx.moveTo(sx(a), sy(a));
      ctx.lineTo(sx(b), sy(b));
    }
    ctx.stroke();
    if (focus) {
      ctx.strokeStyle = colorOf(focus);
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const [a, b] of lvLinks) {
        if (a.repo !== focus || !segInView(a, b)) continue;
        ctx.moveTo(sx(a), sy(a));
        ctx.lineTo(sx(b), sy(b));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 3) Eşiğin altında kalanlar: soluk minik noktalar (tıklanmaz).
    for (const n of asc) {
      if (n.score >= min) break;
      if (!inView(n)) continue;
      ctx.globalAlpha = dim(n) ? 0.08 : 0.3;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(sx(n), sy(n), Math.max(1, n.r * sf * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4) Görünen düğümler: küçükten büyüğe, büyükler üstte.
    for (const n of asc) {
      if (n.score < min || !inView(n)) continue;
      const r = n.r * sf;
      ctx.globalAlpha = dim(n) ? 0.15 : 1;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(sx(n), sy(n), r, 0, Math.PI * 2);
      ctx.fill();
      if (n.merge) {
        ctx.strokeStyle = 'rgba(242,239,230,0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx(n), sy(n), r + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (const [n, color, width] of [
      [hovered, 'rgba(242,239,230,0.55)', 1.5],
      [selected, '#fffdf8', 2]
    ]) {
      if (!n || n.score < min) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(sx(n), sy(n), n.r * sf + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5) Etiketler. Önce repo "bölge" adları (haritadaki ülke adları gibi, uzaktan belirgin),
    // sonra puana göre commit etiketleri; çakışan etiket atlanır.
    const placed = [];
    const free = (x, y, bw, bh) => {
      for (const p of placed) if (x < p.x + p.w && x + bw > p.x && y < p.y + p.h && y + bh > p.y) return false;
      return true;
    };
    const regionAlpha = clamp(1.15 - (rel - 1) / 2.2, 0, 0.95);
    if (regionAlpha > 0.05) {
      ctx.font = `700 11px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (const rp of repos) {
        if (focus && rp.name !== focus) continue;
        let cx = 0;
        let cy = 0;
        let maxY = -Infinity;
        let maxR = 0;
        for (const n of rp.nodes) {
          cx += n.x;
          cy += n.y;
          maxY = Math.max(maxY, n.y);
          maxR = Math.max(maxR, n.score >= min ? n.r * sf : n.r * sf * 0.3);
        }
        cx = (cx / rp.nodes.length) * k + tx;
        cy = (cy / rp.nodes.length) * k + ty;
        // Küçük kümelerde ad, düğümün üstüne binmesin diye kümenin altına yazılır.
        if (rp.nodes.length <= 3) cy = Math.max(cy, maxY * k + ty + maxR + 12);
        if (cx < -60 || cx > w + 60 || cy < -20 || cy > h + 20) continue;
        const text = rp.name.toUpperCase();
        const bw = ctx.measureText(text).width + 8;
        if (!free(cx - bw / 2, cy - 9, bw, 18)) continue;
        placed.push({ x: cx - bw / 2, y: cy - 9, w: bw, h: 18 });
        ctx.globalAlpha = regionAlpha;
        ctx.strokeStyle = BG;
        ctx.lineWidth = 4;
        ctx.strokeText(text, cx, cy);
        ctx.fillStyle = rp.color;
        ctx.fillText(text, cx, cy);
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = `11px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let count = 0;
    const label = (n, force) => {
      if (n.score < min || !inView(n) || (!force && dim(n))) return;
      const r = n.r * sf;
      const x = sx(n) + r + 5;
      const y = sy(n);
      const text = shorten(n.subject, w < 500 ? 26 : 38);
      const bw = ctx.measureText(text).width;
      if (!force && !free(x - 2, y - 8, bw + 4, 16)) return;
      placed.push({ x: x - 2, y: y - 8, w: bw + 4, h: 16 });
      ctx.strokeStyle = BG;
      ctx.lineWidth = 3;
      ctx.strokeText(text, x, y);
      ctx.fillStyle = force ? '#fffdf8' : 'rgba(242,239,230,0.74)';
      ctx.fillText(text, x, y);
      count++;
    };
    if (selected) label(selected, true);
    if (hovered && hovered !== selected) label(hovered, true);
    for (const n of desc) {
      if (count >= MAX_LABELS || n.score < min) break;
      if (n !== selected && n !== hovered) label(n, false);
    }
  }

  const pick = (px, py, slop) => {
    const min = LEVELS[levelOf(k / fitK)].min;
    const sf = Math.pow(k, 0.6);
    let best = null;
    let bestD = Infinity;
    for (const n of desc) {
      if (n.score < min) break;
      const d = Math.hypot(n.x * k + tx - px, n.y * k + ty - py);
      if (d <= Math.max(n.r * sf, 4) + slop && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  };

  // --- Etkileşim: tekerlek, sürükleme, çimdik, çift tık, klavye ---
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  const local = e => {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };
  const onWheel = e => {
    e.preventDefault();
    const [x, y] = local(e);
    const unit = e.deltaMode === 1 ? 0.05 : e.deltaMode === 2 ? 1 : 0.0018;
    zoomAt(x, y, Math.exp(-e.deltaY * unit));
  };
  const onDown = e => {
    canvas.setPointerCapture?.(e.pointerId);
    const p = local(e);
    pointers.set(e.pointerId, p);
    anim = null;
    if (pointers.size === 1) drag = { x: p[0], y: p[1], tx, ty, moved: false, type: e.pointerType };
    else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k };
      drag = null;
    }
  };
  const onMove = e => {
    const p = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (pinch.k * (d / pinch.d)) / k);
      return;
    }
    if (drag) {
      const dx = p[0] - drag.x;
      const dy = p[1] - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
      if (drag.moved) {
        touched = true;
        canvas.style.cursor = 'grabbing';
        setTransform(k, drag.tx + dx, drag.ty + dy);
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const n = pick(p[0], p[1], 3);
      if (n !== hovered) {
        hovered = n;
        canvas.style.cursor = n ? 'pointer' : 'grab';
        request();
      }
    }
  };
  const onUp = e => {
    const p = local(e);
    pointers.delete(e.pointerId);
    if (pinch) {
      if (pointers.size < 2) pinch = null;
      drag = null;
      return;
    }
    if (drag && !drag.moved) {
      const n = pick(p[0], p[1], drag.type === 'mouse' ? 3 : 12);
      selectNode(n, true);
    }
    drag = null;
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
  };
  const onCancel = e => {
    pointers.delete(e.pointerId);
    drag = null;
    pinch = null;
  };
  const onLeave = () => {
    if (hovered) {
      hovered = null;
      request();
    }
  };
  const onDbl = e => {
    const [x, y] = local(e);
    zoomAt(x, y, 2, true);
  };
  const onKey = e => {
    const step = 60;
    const keys = {
      '+': () => zoomAt(w / 2, h / 2, 1.6, true),
      '=': () => zoomAt(w / 2, h / 2, 1.6, true),
      '-': () => zoomAt(w / 2, h / 2, 1 / 1.6, true),
      0: () => fit(true),
      ArrowLeft: () => setTransform(k, tx + step, ty),
      ArrowRight: () => setTransform(k, tx - step, ty),
      ArrowUp: () => setTransform(k, tx, ty + step),
      ArrowDown: () => setTransform(k, tx, ty - step),
      Escape: () => selectNode(null)
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    if (e.key.startsWith('Arrow')) touched = true;
    fn();
  };

  // Tıklama = seç + (Google Maps gibi) o düğüme doğru bir basamak yakınlaş: daha küçük işler açılır.
  function selectNode(n, zoomIn = false) {
    selected = n;
    onSelect(n);
    if (n && zoomIn) {
      const lv = levelOf(k / fitK);
      const target = lv < LEVELS.length - 1 ? Math.max(k, LEVELS[lv + 1].at * 1.05 * fitK) : k;
      centerOn(n, target);
    }
    request();
  }

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('dblclick', onDbl);
  canvas.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  document.fonts?.ready.then(request);
  if (running) request();

  return {
    zoomIn: () => zoomAt(w / 2, h / 2, 1.6, true),
    zoomOut: () => zoomAt(w / 2, h / 2, 1 / 1.6, true),
    fit: () => {
      touched = false;
      fit(true);
    },
    select: n => selectNode(n),
    setFocus: repo => {
      focus = repo;
      request();
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      sim.stop();
      ro.disconnect();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('dblclick', onDbl);
      canvas.removeEventListener('keydown', onKey);
    }
  };
}

function Harita({ graph }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);
  const [legendOpen, setLegendOpen] = useState(() => window.innerWidth >= 760);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const engine = createEngine(canvasRef.current, graph, { reduced, onLevel: setLevel, onSelect: setSelected });
    engineRef.current = engine;
    return () => engine.destroy();
  }, [graph]);

  useEffect(() => engineRef.current?.setFocus(focus), [focus]);

  const L = LEVELS[level];
  const total = graph.nodes.length;
  return (
    <div className="akh__map">
      <canvas
        ref={canvasRef}
        className="akh__canvas"
        tabIndex={0}
        role="application"
        aria-roledescription="etkileşimli harita"
        aria-label={`Kod aktivite haritası: ${total} commit, ${graph.repos.length} repo. Yakınlaştırmak için + ve -, kaydırmak için ok tuşları, sığdırmak için 0.`}
      />

      <div className="akh__controls" role="group" aria-label="Yakınlaştırma">
        <button type="button" onClick={() => engineRef.current?.zoomIn()} aria-label="Yakınlaştır">+</button>
        <button type="button" onClick={() => engineRef.current?.zoomOut()} aria-label="Uzaklaştır">−</button>
        <button type="button" onClick={() => engineRef.current?.fit()} aria-label="Tümünü sığdır" className="akh__fit">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>

      <div className="akh__level mono" aria-live="polite">
        <span className="akh__steps" aria-hidden="true">
          {LEVELS.map((_, i) => (
            <i key={i} className={i <= level ? 'on' : undefined} />
          ))}
        </span>
        YAKINLIK {level + 1}/{LEVELS.length} · {L.min > 0 ? `PUAN ≥ ${L.min}` : 'TÜMÜ'} · {graph.visibleCounts[level]}/{total} İŞ
      </div>

      <aside className={`akh__legend${legendOpen ? ' is-open' : ''}`} aria-label="Açıklama">
        <button type="button" className="akh__legend-toggle mono" aria-expanded={legendOpen} onClick={() => setLegendOpen(o => !o)}>
          AÇIKLAMA <span aria-hidden="true">{legendOpen ? '−' : '+'}</span>
        </button>
        {legendOpen && (
          <div className="akh__legend-body">
            <p className="akh__key">
              <b>Renk</b> = repo <span className="muted-dark">(tıkla: yalnız onu vurgula)</span>
            </p>
            <ul className="akh__repos">
              {graph.repos.map(rp => (
                <li key={rp.name}>
                  <button
                    type="button"
                    aria-pressed={focus === rp.name}
                    className={focus && focus !== rp.name ? 'is-dim' : undefined}
                    onClick={() => setFocus(f => (f === rp.name ? null : rp.name))}
                  >
                    <i style={{ background: rp.color }} />
                    <span>{rp.name}</span>
                    <em>{rp.nodes.length}</em>
                  </button>
                </li>
              ))}
            </ul>
            <p className="akh__key">
              <b>Boyut</b> = önem puanı (0–100)
            </p>
            <div className="akh__sizes" aria-hidden="true">
              {[40, 60, 80, 95].map(s => (
                <span key={s}>
                  <i style={{ width: radiusOf(s) * 2, height: radiusOf(s) * 2 }} />
                  {s}
                </span>
              ))}
            </div>
            <p className="akh__key">
              <b>Çizgi</b> = aynı repoda art arda gelen commit'ler · <b>halka</b> = merge
            </p>
            <p className="akh__key muted-dark">
              Uzaktan yalnızca puanı ≥ 80 olan büyük işler görünür; yakınlaştıkça ≥ 60, ≥ 40 ve en sonunda tüm küçük işler açılır.
            </p>
          </div>
        )}
      </aside>

      {selected && (
        <article className="akh__card" aria-live="polite">
          <button type="button" className="akh__close" onClick={() => engineRef.current?.select(null)} aria-label="Kartı kapat">
            ×
          </button>
          <p className="akh__card-repo mono">
            <i style={{ background: selected.color }} />
            {selected.repo}
          </p>
          <h2 className="akh__card-title">{selected.subject}</h2>
          <dl className="akh__card-meta">
            <div>
              <dt>TARİH</dt>
              <dd>{fmtDate(selected.t)}</dd>
            </div>
            <div>
              <dt>PUAN</dt>
              <dd>{selected.score}/100</dd>
            </div>
            {selected.lines != null && (
              <div>
                <dt>SATIR</dt>
                <dd>{fmtInt(selected.lines)}</dd>
              </div>
            )}
            <div>
              <dt>COMMIT</dt>
              <dd className="mono">
                {selected.hash.slice(0, 7) || '—'}
                {selected.merge ? ' · merge' : ''}
              </dd>
            </div>
          </dl>
        </article>
      )}

      <p className="akh__hint mono">TEKERLEK / ÇİMDİK: YAKINLAŞ · SÜRÜKLE: KAYDIR · DÜĞÜME DOKUN: AYRINTI</p>
    </div>
  );
}

export default function AktiviteHaritasi() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    fetch(asset('/data/kod-aktivite.json'), { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => alive && setState({ status: 'ready', graph: buildGraph(data) }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  const graph = state.graph;
  const top = useMemo(() => (graph ? graph.desc.slice(0, 30) : []), [graph]);

  return (
    <section className="akh">
      <div className="wrap akh__head">
        <Link to="/" className="mono akh__back">
          ← ANA SAYFA
        </Link>
        <h1>Aktivite Haritası</h1>
        <p className="lead">
          Yazdığım kodun haritası. Uzaktan yalnızca büyük işler görünür; yakınlaştıkça küçük adımlar da ortaya çıkar.
        </p>
        {graph && graph.nodes.length > 0 && (
          <p className="mono akh__stats">
            {graph.nodes.length} COMMIT · {graph.repos.length} REPO
            {graph.from ? ` · ${DAY_FMT.format(new Date(graph.from)).toUpperCase()} – ${DAY_FMT.format(new Date(graph.to)).toUpperCase()}` : ''}
          </p>
        )}
      </div>
      {state.status === 'loading' && <div className="akh__map akh__map--empty mono">HARİTA YÜKLENİYOR…</div>}
      {state.status === 'error' && <div className="akh__map akh__map--empty mono">AKTİVİTE VERİSİ ŞU AN ALINAMADI.</div>}
      {graph && graph.nodes.length === 0 && <div className="akh__map akh__map--empty mono">HENÜZ KAYIT YOK.</div>}
      {graph && graph.nodes.length > 0 && (
        <>
          <Harita graph={graph} />
          <div className="sr-only">
            <h2>En yüksek puanlı işler</h2>
            <ol>
              {top.map(n => (
                <li key={`${n.repo}-${n.hash}-${n.i}`}>
                  {n.repo}: {n.subject} ({fmtDate(n.t)}, puan {n.score})
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
