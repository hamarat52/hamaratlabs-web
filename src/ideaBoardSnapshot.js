/* Fikir panosu: notun kâğıdını (renk, doku, yazı, tikler, sticker) canvas'a birebir çizer.
   Bu görüntü buruşturma sahnesinde (PaperCrumple, Three.js) kâğıt dokusu olarak kullanılır. */

const SCALE = 2; // doku çözünürlüğü (CSS px başına)

let noise = null;
function noiseCanvas() {
  if (noise) return noise;
  noise = document.createElement('canvas');
  noise.width = noise.height = 160;
  const g = noise.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 77;
    img.data[i + 1] = 64;
    img.data[i + 2] = 26;
    img.data[i + 3] = Math.random() * 0.16 * 255;
  }
  g.putImageData(img, 0, 0);
  return noise;
}

// Sticker (AppIcon SVG'si) bir kez görüntüye çevrilip saklanır; anlık görüntü eşzamanlı kalır.
const stickerCache = new Map();
export function preloadSticker(svg) {
  if (!svg) return null;
  const markup = new XMLSerializer().serializeToString(svg);
  if (stickerCache.has(markup)) return stickerCache.get(markup);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  stickerCache.set(markup, img);
  return img;
}

const alphaOf = (el, root) => {
  let a = 1;
  for (let n = el; n && n !== root.parentElement; n = n.parentElement) {
    const o = Number(getComputedStyle(n).opacity);
    if (Number.isFinite(o)) a *= o;
  }
  return a;
};

const fontOf = st => `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;

// Metni kelime kelime, tarayıcının dizdiği konumlara yazar (satır kırılımları birebir).
function drawText(ctx, root, o) {
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.data.trim() || el.closest('.sr-only, .ib-sticker, svg')) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') continue;
    ctx.save();
    ctx.globalAlpha = alphaOf(el, root);
    ctx.fillStyle = st.color;
    ctx.font = fontOf(st);
    if ('letterSpacing' in ctx) ctx.letterSpacing = st.letterSpacing === 'normal' ? '0px' : st.letterSpacing;
    const ascent = ctx.measureText('Hg').fontBoundingBoxAscent;
    const upper = st.textTransform === 'uppercase';
    let run = '';
    let at = null;
    const flush = () => {
      if (run) ctx.fillText(upper ? run.toLocaleUpperCase('tr-TR') : run, at.left - o.left, at.top - o.top + ascent);
      run = '';
      at = null;
    };
    for (let i = 0; i < node.data.length; i++) {
      const ch = node.data[i];
      if (/\s/.test(ch)) {
        flush();
        continue;
      }
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getClientRects()[0];
      if (!r) continue;
      if (at && Math.abs(r.top - at.top) > 2) flush(); // kelime satır sonunda bölündü
      if (!at) at = r;
      run += ch;
    }
    flush();
    ctx.restore();
  }
}

function drawTicks(ctx, root, o) {
  for (const svg of root.querySelectorAll('svg.ib-tick')) {
    const r = svg.getBoundingClientRect();
    const s = r.width / 24;
    for (const p of svg.querySelectorAll('path')) {
      const ps = getComputedStyle(p);
      ctx.save();
      ctx.translate(r.left - o.left, r.top - o.top);
      ctx.scale(s, s);
      ctx.globalAlpha = alphaOf(p, root);
      ctx.strokeStyle = /currentcolor/i.test(ps.stroke) ? ps.color : ps.stroke;
      ctx.lineWidth = parseFloat(ps.strokeWidth) || 1.6;
      ctx.lineCap = ps.strokeLinecap;
      ctx.lineJoin = ps.strokeLinejoin;
      ctx.stroke(new Path2D(p.getAttribute('d')));
      ctx.restore();
    }
  }
}

// Platform listesindeki "→" (::before) imleri.
function drawMarkers(ctx, root, o) {
  for (const li of root.querySelectorAll('.ib-tags li')) {
    const ps = getComputedStyle(li, '::before');
    const content = (ps.content || '').replace(/^["']|["']$/g, '');
    if (!content || content === 'none') continue;
    const st = getComputedStyle(li);
    const r = li.getBoundingClientRect();
    ctx.save();
    ctx.font = fontOf(ps);
    ctx.fillStyle = st.color;
    ctx.globalAlpha = alphaOf(li, root) * Number(ps.opacity || 1);
    const m = ctx.measureText(content);
    const lh = parseFloat(st.lineHeight) || parseFloat(st.fontSize) * 1.1;
    const lead = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
    ctx.fillText(content, r.left - o.left, r.top - o.top + lead + m.fontBoundingBoxAscent);
    ctx.restore();
  }
}

function drawSticker(ctx, root, o) {
  const svg = root.querySelector('.ib-sticker svg');
  const img = svg && preloadSticker(svg);
  if (!img || !img.complete || !img.naturalWidth) return;
  const r = svg.getBoundingClientRect();
  const size = parseFloat(getComputedStyle(svg).width) || r.width;
  const m = new DOMMatrix(getComputedStyle(svg.parentElement).transform);
  ctx.save();
  ctx.translate(r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top);
  ctx.rotate(Math.atan2(m.b, m.a));
  ctx.shadowColor = 'rgba(16, 19, 23, 0.22)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/* Notun o anki konumu/açısı/ölçeği (pano koordinatında) ve kâğıdın doku görüntüsü.
   Ölçüm için notun döndürülmemiş, görünmez bir kopyası aynı listeye eklenir; böylece
   genişlik, font ve renkler (dar ekran kuralları dahil) birebir aynı kalır. */
export function snapshotNote(li, board) {
  const body = li.querySelector('.ib-note__body');
  const paper = li.querySelector('.ib-note__paper');
  const t = getComputedStyle(body).transform;
  const m = new DOMMatrix(t === 'none' ? undefined : t);
  const pr = paper.getBoundingClientRect();
  const br = board.getBoundingClientRect();
  const geometry = {
    cx: pr.left + pr.width / 2 - br.left,
    cy: pr.top + pr.height / 2 - br.top,
    rot: (Math.atan2(m.b, m.a) * 180) / Math.PI,
    scale: Math.hypot(m.a, m.b)
  };

  const clone = li.cloneNode(true);
  clone.className = li.className.replace(/\bis-(lifted|dropped|active|over-bin|restored)\b/g, '');
  clone.removeAttribute('data-note');
  clone.removeAttribute('tabindex');
  Object.assign(clone.style, { transform: 'none', animation: 'none', transition: 'none', visibility: 'hidden', pointerEvents: 'none' });
  const cbody = clone.querySelector('.ib-note__body');
  Object.assign(cbody.style, { transform: 'none', animation: 'none', transition: 'none' });
  li.parentNode.appendChild(clone);
  try {
    const cpaper = clone.querySelector('.ib-note__paper');
    const o = cpaper.getBoundingClientRect();
    const w = cpaper.offsetWidth;
    const h = cpaper.offsetHeight;
    const st = getComputedStyle(cpaper);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * SCALE);
    canvas.height = Math.round(h * SCALE);
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    // Kâğıt: CSS'teki köşe yarıçapları (sol alt kıvrık), zemin rengi, ışık geçişi, doku.
    const isCard = li.classList.contains('ib-note--card');
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, isCard ? 3 : [2, 2, 3, { x: 14, y: 6 }]);
    ctx.fillStyle = st.backgroundColor;
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (isCard) {
      ctx.fillStyle = 'rgba(80, 140, 200, 0.22)';
      for (let y = 13; y < h; y += 34) ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = 'rgba(232, 131, 58, 0.55)';
      ctx.fillRect(20, 0, 1.5, h);
    } else if (!li.classList.contains('is-empty')) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.035)');
      g.addColorStop(0.22, 'rgba(0, 0, 0, 0)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = ctx.createPattern(noiseCanvas(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    drawText(ctx, cpaper, o);
    drawMarkers(ctx, cpaper, o);
    drawTicks(ctx, cpaper, o);
    drawSticker(ctx, cpaper, o);
    ctx.restore();

    return { ...geometry, w, h, color: st.backgroundColor, src: canvas.toDataURL('image/png') };
  } finally {
    clone.remove();
  }
}
