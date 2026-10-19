'use client';

import { useEffect, useRef } from 'react';

import './Lanyard.css';

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* İpe asılı kart. Kayış Verlet zinciri, kart ise kayışın ucuna bağlı ağır bir sarkaç;
   sürüklenir, bırakınca sallanır, sayfa kayınca hafifçe savrulur.
   Her kare yalnızca SVG yolu ile kartın transform'u güncellenir; React yeniden çizmez. */
export default function Lanyard({
  image,
  imageAlt = '',
  children,
  color = '#b6e04a',
  strapColor,
  anchorX = 0.5,
  ropeLength = 0.3,
  minRope = 120,
  maxRope = 320,
  segments = 14,
  cardWidth = 220,
  cardHeight = 300,
  gravity = 2200,
  damping = 0.992,
  wind = 1,
  scrollKick = 1,
  intro = true,
  label = 'LAB PASS',
  serial = 'HL · 001',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const pathRef = useRef(null);
  const pathEdgeRef = useRef(null);
  const cardRef = useRef(null);
  const sheenRef = useRef(null);
  const propsRef = useRef(null);
  propsRef.current = { gravity, damping, wind, scrollKick };

  useEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card) return undefined;
    const still = reducedMotion();

    let W = 0;
    let H = 0;
    let cw = cardWidth;
    let ch = cardHeight;
    let seg = 10;
    let anchor = { x: 0, y: -6 };
    let pts = [];
    let center = { x: 0, y: 0, px: 0, py: 0 };
    let hang = 0;
    let drag = null;
    let raf = 0;
    let visible = true;
    let last = 0;
    let t0 = 0;
    let pendingKick = 0;
    // Uyku: esinti son etkileşimden sonra söner; kart durulunca döngü durur, scroll/dokunuşla uyanır.
    let wakeAt = 0;
    let calm = 0;

    const layout = first => {
      const r = root.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const k = Math.min(1, Math.max(0.68, W / 900));
      cw = cardWidth * k;
      ch = cardHeight * k;
      card.style.width = `${cw}px`;
      card.style.height = `${ch}px`;
      const len = Math.min(maxRope, Math.max(minRope, H * ropeLength));
      seg = len / segments;
      hang = ch / 2 + 6;
      anchor = { x: W * anchorX, y: -6 };
      if (!first) return;
      // Açılış: kart yandan, yukarıdan bırakılır; ip kendiliğinden sarkar.
      const swing = intro && !still ? Math.min(W * 0.32, len * 0.9) : 0;
      pts = [];
      for (let i = 0; i <= segments; i++) {
        const f = i / segments;
        const x = anchor.x + swing * f;
        const y = anchor.y + len * f * (swing ? 0.55 : 1);
        pts.push({ x, y, px: x, py: y });
      }
      const end = pts[segments];
      const cx = end.x + (swing ? hang * 0.5 : 0);
      const cy = end.y + hang * (swing ? 0.85 : 1);
      center = { x: cx, y: cy, px: cx, py: cy };
    };

    const step = (dt, time) => {
      const { gravity: g, damping: damp, wind: wd, scrollKick: sk } = propsRef.current;
      const dt2 = dt * dt;
      const fade = Math.max(0, 1 - (time - wakeAt) / 7000);
      const breeze = still ? 0 : fade * wd * 26 * Math.sin(time * 0.0009) * Math.sin(time * 0.00037 + 1.3);
      if (pendingKick) {
        center.px -= pendingKick * sk;
        pendingKick = 0;
      }
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx + breeze * 0.3 * dt2;
        p.y += vy + g * 0.6 * dt2;
      }
      if (!drag) {
        const vx = (center.x - center.px) * damp;
        const vy = (center.y - center.py) * damp;
        center.px = center.x;
        center.py = center.y;
        center.x += vx + breeze * dt2;
        center.y += vy + g * dt2;
      } else {
        center.px = center.x;
        center.py = center.y;
        center.x += (drag.tx - center.x) * 0.5;
        center.y += (drag.ty - center.y) * 0.5;
      }
      for (let it = 0; it < 14; it++) {
        pts[0].x = anchor.x;
        pts[0].y = anchor.y;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          if (d <= seg) continue; // kayış gerilmez ama bükülebilir
          const diff = (d - seg) / d;
          const wa = i === 0 ? 0 : 0.5;
          const wb = i === 0 ? 1 : 0.5;
          a.x += dx * diff * wa;
          a.y += dy * diff * wa;
          b.x -= dx * diff * wb;
          b.y -= dy * diff * wb;
        }
        // Kart ile kayış ucu: sabit uzunluklu çubuk; kart daha ağır.
        const e = pts[pts.length - 1];
        const dx = center.x - e.x;
        const dy = center.y - e.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = (d - hang) / d;
        const we = drag ? 1 : 0.75;
        e.x += dx * diff * we;
        e.y += dy * diff * we;
        center.x -= dx * diff * (1 - we);
        center.y -= dy * diff * (1 - we);
      }
      pts[0].x = anchor.x;
      pts[0].y = anchor.y;
    };

    const render = () => {
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const e = pts[pts.length - 1];
      d += ` L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      pathRef.current?.setAttribute('d', d);
      pathEdgeRef.current?.setAttribute('d', d);
      const angle = Math.atan2(center.x - e.x, center.y - e.y);
      const vx = center.x - center.px;
      const tiltY = Math.max(-38, Math.min(38, vx * 2.4));
      card.style.transform = `translate3d(${(center.x - cw / 2).toFixed(1)}px, ${(center.y - ch / 2).toFixed(1)}px, 0) rotate(${(-angle).toFixed(4)}rad) rotateY(${tiltY.toFixed(2)}deg)`;
      if (sheenRef.current) sheenRef.current.style.setProperty('--ly-sheen', `${(50 + tiltY * 1.6 + angle * 60).toFixed(1)}%`);
    };

    const loop = now => {
      raf = 0;
      if (!visible) return;
      if (!t0) t0 = now;
      const dt = Math.min(1 / 30, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      // Sabit küçük adımlar: kare hızı düşse de zincir patlamaz.
      const n = Math.max(1, Math.round(dt / (1 / 120)));
      for (let i = 0; i < n; i++) step(dt / n, now - t0);
      render();
      const speed = Math.hypot(center.x - center.px, center.y - center.py) + Math.abs(pts[pts.length >> 1].x - pts[pts.length >> 1].px);
      const breezing = now - t0 - wakeAt < 7000;
      calm = !drag && !breezing && speed < 0.02 ? calm + 1 : 0;
      if (calm > 45) return; // ~0.75 sn tam durgun: uyku
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible) {
        last = 0;
        calm = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const wake = () => {
      if (t0) wakeAt = performance.now() - t0;
      start();
    };

    layout(true);
    render();
    start();

    const ro = new ResizeObserver(() => {
      const ax = anchor.x;
      layout(false);
      wake();
      const shift = anchor.x - ax;
      if (shift) {
        for (const p of pts) {
          p.x += shift;
          p.px += shift;
        }
        center.x += shift;
        center.px += shift;
      }
    });
    ro.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) start();
    });
    io.observe(root);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = Math.max(-60, Math.min(60, y - lastY));
      lastY = y;
      if (!still && dy) {
        pendingKick += dy * 0.18;
        wake();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const local = ev => {
      const r = root.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };
    const onDown = ev => {
      if (ev.button !== undefined && ev.button !== 0) return;
      const p = local(ev);
      drag = { ox: p.x - center.x, oy: p.y - center.y, tx: center.x, ty: center.y };
      card.setPointerCapture?.(ev.pointerId);
      card.classList.add('lanyard__card--drag');
      wake();
      ev.preventDefault();
    };
    const onMove = ev => {
      if (!drag) return;
      const p = local(ev);
      drag.tx = Math.max(cw * 0.3, Math.min(W - cw * 0.3, p.x - drag.ox));
      drag.ty = Math.max(0, Math.min(H - ch * 0.4, p.y - drag.oy));
    };
    const onUp = ev => {
      if (!drag) return;
      drag = null;
      card.releasePointerCapture?.(ev.pointerId);
      card.classList.remove('lanyard__card--drag');
      wake();
    };
    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
    };
  }, [anchorX, ropeLength, minRope, maxRope, segments, cardWidth, cardHeight, intro]);

  const strap = strapColor || color;

  return (
    <div ref={rootRef} className={`lanyard${className ? ` ${className}` : ''}`} style={{ '--ly-color': color, '--ly-strap': strap, ...style }}>
      <svg className="lanyard__strap" aria-hidden="true">
        <path ref={pathEdgeRef} className="lanyard__strap-edge" />
        <path ref={pathRef} className="lanyard__strap-band" />
      </svg>
      <div ref={cardRef} className="lanyard__card" role="img" aria-label={imageAlt || label}>
        <div ref={sheenRef} className="lanyard__face">
          <span className="lanyard__clip" aria-hidden="true" />
          <span className="lanyard__hole" aria-hidden="true" />
          <div className="lanyard__body">
            {children || (image ? <img src={image} alt="" draggable="false" /> : null)}
          </div>
          <div className="lanyard__meta" aria-hidden="true">
            <span>{label}</span>
            <span>{serial}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
