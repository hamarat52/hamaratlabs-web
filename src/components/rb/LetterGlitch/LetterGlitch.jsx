'use client';

import { useEffect, useRef } from 'react';
import './LetterGlitch.css';

/*
 * LetterGlitch — ReactBits "letter-glitch" arkaplanının HamaratLabs uyarlaması.
 *
 * Statik bir karakter ızgarası (yağmur yok). Her `glitchSpeed` ms'de hücrelerin küçük
 * bir kısmının karakteri değişir; değişenlerin bir kısmı kısa süre vurgulu renkte
 * parlayıp taban renge geri döner.
 *
 * glitchColors: [taban, ...vurgular]. İlk renk sakin taban tonudur; geri kalanlar
 * yalnız parıltıda kullanılır. Tek renk verilirse yalnız karakter değişimi olur.
 *
 * Performans: tek Canvas 2D, yalnız değişen ("kirli") hücreler yeniden çizilir.
 * Hücre sayısı ekran boyutuna göre sınırlanır, küçük/zayıf cihazda tik seyrekleşir,
 * kare maliyeti yükselirse güncelleme oranı kendiliğinden düşer. Görünmüyorken
 * (ekran dışı / sekme gizli) döngü durur. prefers-reduced-motion: reduce → tek
 * statik kare çizilir, döngü hiç başlamaz (ayar canlı değişirse de izlenir).
 */

const DEFAULT_COLORS = ['#2a3038', '#d0ff63', '#fffdf8'];
const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';
const DEFAULT_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const UPDATE_RATIO = 0.05; // tik başına değişen hücre oranı
const HOLD_MIN = 260; // parıltının vurgu renginde kalma süresi (ms)
const HOLD_SPAN = 420;
const FADE_TAU = 110; // smooth geçiş zaman sabiti (ms)
const CELL_CAP_DESKTOP = 9000;
const CELL_CAP_LOW = 2600;
const SLOW_FRAME_MS = 7; // EMA çizim maliyeti bu eşiği aşarsa yük azaltılır

const probe = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const toRgb = value => {
  if (!probe) return [255, 255, 255];
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const hex = probe.fillStyle;
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = hex.match(/[\d.]+/g) || [255, 255, 255];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};

const isLowPower = width =>
  width < 640 ||
  (navigator.hardwareConcurrency || 8) <= 4 ||
  Boolean(navigator.connection && navigator.connection.saveData);

export default function LetterGlitch({
  glitchColors = DEFAULT_COLORS,
  glitchSpeed = 50,
  centerVignette = true,
  outerVignette = true,
  smooth = true,
  characters = DEFAULT_CHARACTERS,
  fontSize = 16,
  fontFamily = DEFAULT_FONT,
  background = '#101317',
  vignetteColor,
  flashChance = 0.06,
  className = '',
  style,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const colorsKey = glitchColors.join('|');

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: background === 'transparent' });
    if (!ctx) return undefined;

    const glyphs = Array.from(characters.length ? characters : DEFAULT_CHARACTERS);
    const palette = colorsKey.split('|').filter(Boolean).map(toRgb);
    if (!palette.length) palette.push(toRgb(DEFAULT_COLORS[0]));
    const base = palette[0];
    const accents = palette.length > 1 ? palette.slice(1) : [base];
    const transparent = background === 'transparent';
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cellW = 10;
    let cellH = 20;
    let size = fontSize;
    let cols = 0;
    let rows = 0;
    let count = 0;
    let glyph = new Uint16Array(0);
    let cur = new Float32Array(0); // mevcut rgb (3n)
    let tgt = new Uint8Array(0); // hedef palet indeksi: 0 = taban, k = accents[k-1]
    let holdUntil = new Float64Array(0);
    let live = new Uint8Array(0); // geçişte olan hücre bayrağı
    let liveList = [];
    let dirtyFlag = new Uint8Array(0);
    let dirtyList = [];

    let raf = 0;
    let lastFrame = 0;
    let lastTick = 0;
    let tickEvery = glitchSpeed;
    let load = 1; // uyarlamalı güncelleme çarpanı (0.25–1)
    let costEma = 0;
    let visible = true;
    let reduce = Boolean(motionQuery?.matches);

    const colorOf = idx => (idx === 0 ? base : accents[idx - 1]);

    const markDirty = i => {
      if (!dirtyFlag[i]) {
        dirtyFlag[i] = 1;
        dirtyList.push(i);
      }
    };
    const markLive = i => {
      if (!live[i]) {
        live[i] = 1;
        liveList.push(i);
      }
    };

    const drawCell = i => {
      const x = (i % cols) * cellW;
      const y = ((i / cols) | 0) * cellH;
      if (transparent) ctx.clearRect(x, y, cellW, cellH);
      else {
        ctx.fillStyle = background;
        ctx.fillRect(x, y, cellW, cellH);
      }
      const o = i * 3;
      ctx.fillStyle = `rgb(${cur[o] | 0},${cur[o + 1] | 0},${cur[o + 2] | 0})`;
      ctx.fillText(glyphs[glyph[i]], x + cellW / 2, y + cellH / 2);
    };

    const drawAll = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (transparent) ctx.clearRect(0, 0, width, height);
      else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.font = `500 ${size}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < count; i += 1) {
        const o = i * 3;
        ctx.fillStyle = `rgb(${cur[o] | 0},${cur[o + 1] | 0},${cur[o + 2] | 0})`;
        ctx.fillText(glyphs[glyph[i]], (i % cols) * cellW + cellW / 2, ((i / cols) | 0) * cellH + cellH / 2);
      }
      dirtyList.length = 0;
      dirtyFlag.fill(0);
    };

    const build = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const low = isLowPower(width);
      dpr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      // Hücre sayısını sınırla: aşarsa yazı boyunu büyüt (aynı görünüm, daha az hücre).
      size = fontSize;
      const cap = low ? CELL_CAP_LOW : CELL_CAP_DESKTOP;
      const need = Math.ceil(width / (size * 0.625)) * Math.ceil(height / (size * 1.25));
      if (need > cap) size = Math.ceil(size * Math.sqrt(need / cap));
      cellW = size * 0.625;
      cellH = size * 1.25;
      cols = Math.ceil(width / cellW);
      rows = Math.ceil(height / cellH);
      count = cols * rows;
      tickEvery = glitchSpeed * (low ? 1.6 : 1);

      glyph = new Uint16Array(count);
      cur = new Float32Array(count * 3);
      tgt = new Uint8Array(count);
      holdUntil = new Float64Array(count);
      live = new Uint8Array(count);
      liveList = [];
      dirtyFlag = new Uint8Array(count);
      dirtyList = [];
      for (let i = 0; i < count; i += 1) {
        glyph[i] = (Math.random() * glyphs.length) | 0;
        cur[i * 3] = base[0];
        cur[i * 3 + 1] = base[1];
        cur[i * 3 + 2] = base[2];
      }
      // Hareket kapalıyken de "glitch" dokusu görünsün: birkaç hücre statik vurgulu.
      if (reduce && accents[0] !== base) {
        for (let k = 0; k < Math.round(count * 0.012); k += 1) {
          const i = (Math.random() * count) | 0;
          const c = accents[(Math.random() * accents.length) | 0];
          cur[i * 3] = c[0];
          cur[i * 3 + 1] = c[1];
          cur[i * 3 + 2] = c[2];
        }
      }
      drawAll();
    };

    const tick = now => {
      const n = Math.max(1, Math.round(count * UPDATE_RATIO * load));
      for (let k = 0; k < n; k += 1) {
        const i = (Math.random() * count) | 0;
        glyph[i] = (Math.random() * glyphs.length) | 0;
        if (Math.random() < flashChance) {
          tgt[i] = 1 + ((Math.random() * accents.length) | 0);
          holdUntil[i] = now + HOLD_MIN + Math.random() * HOLD_SPAN;
          if (!smooth) {
            const c = colorOf(tgt[i]);
            cur[i * 3] = c[0];
            cur[i * 3 + 1] = c[1];
            cur[i * 3 + 2] = c[2];
          }
          markLive(i);
        }
        markDirty(i);
      }
    };

    const settle = (now, dt) => {
      const mix = smooth ? 1 - Math.exp(-dt / FADE_TAU) : 1;
      let w = 0;
      for (let r = 0; r < liveList.length; r += 1) {
        const i = liveList[r];
        if (tgt[i] !== 0 && now >= holdUntil[i]) tgt[i] = 0;
        const c = colorOf(tgt[i]);
        const o = i * 3;
        let done = true;
        for (let ch = 0; ch < 3; ch += 1) {
          const d = c[ch] - cur[o + ch];
          if (Math.abs(d) < 1.5) cur[o + ch] = c[ch];
          else {
            cur[o + ch] += d * mix;
            done = false;
          }
        }
        markDirty(i);
        if (done && tgt[i] === 0) live[i] = 0;
        else liveList[w++] = i;
      }
      liveList.length = w;
    };

    const frame = now => {
      raf = 0;
      if (!visible || reduce) return;
      const dt = lastFrame ? Math.min(now - lastFrame, 100) : 16;
      lastFrame = now;
      const t0 = performance.now();
      if (now - lastTick >= tickEvery) {
        lastTick = now;
        tick(now);
      }
      settle(now, dt);
      for (let k = 0; k < dirtyList.length; k += 1) {
        const i = dirtyList[k];
        dirtyFlag[i] = 0;
        drawCell(i);
      }
      dirtyList.length = 0;

      // Uyarlamalı yük: çizim pahalılaşırsa güncellemeyi azalt, rahatlarsa geri aç.
      costEma = costEma * 0.9 + (performance.now() - t0) * 0.1;
      if (costEma > SLOW_FRAME_MS) load = Math.max(0.25, load * 0.97);
      else if (costEma < SLOW_FRAME_MS * 0.5) load = Math.min(1, load * 1.01);

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduce || !visible) return;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    let resizeRaf = 0;
    let lastW = -1;
    let lastH = -1;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        if (Math.round(rect.width) === lastW && Math.round(rect.height) === lastH) return;
        lastW = Math.round(rect.width);
        lastH = Math.round(rect.height);
        build();
      });
    });
    resizeObserver.observe(container);

    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting) && !document.hidden;
      if (visible) start();
      else stop();
    });
    intersection.observe(container);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onMotion = event => {
      reduce = event.matches;
      stop();
      build();
      start();
    };
    motionQuery?.addEventListener?.('change', onMotion);

    // Web fontu geç yüklenirse ızgarayı doğru fontla yeniden çiz.
    let alive = true;
    document.fonts?.ready?.then(() => {
      if (alive) drawAll();
    });

    lastW = Math.round(container.getBoundingClientRect().width);
    lastH = Math.round(container.getBoundingClientRect().height);
    build();
    start();

    return () => {
      alive = false;
      stop();
      cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery?.removeEventListener?.('change', onMotion);
    };
  }, [colorsKey, glitchSpeed, smooth, characters, fontSize, fontFamily, background, flashChance]);

  const veil = vignetteColor || (background === 'transparent' ? '#101317' : background);

  return (
    <div
      ref={containerRef}
      className={`letter-glitch ${className}`.trim()}
      style={{ '--lg-bg': background, '--lg-veil': veil, ...style }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="letter-glitch__canvas" />
      {outerVignette && <div className="letter-glitch__veil letter-glitch__veil--outer" />}
      {centerVignette && <div className="letter-glitch__veil letter-glitch__veil--center" />}
    </div>
  );
}
