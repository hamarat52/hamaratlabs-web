import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';

import './DodgeField.css';

/*
 * DodgeField — "kaçan indir butonu".
 * ReactBits Dodge Field'dan esinlenildi, sıfırdan yazıldı. Fark: bu sürüm asla
 * pes etmez (uygulama henüz yok, tıklama imkânsız olmalı) ve süzülerek iterek
 * kaçmak yerine alan içinde rastgele, imleçten uzak bir noktaya zıplar.
 *
 * Akış:
 *  - Fare/kalem butonun kenarına `threshold` px yaklaşınca buton kaçar (tıklamadan önce).
 *  - Dokunmatikte yaklaşma yok: touchstart anında kaçar, tıklama engellenir.
 *  - Klavye (Enter/Space) veya bir şekilde ulaşan tıklama da kaçışı tetikler.
 *  - İlk kaçışta yazı `dodgeLabel` olur; sayaç `escalation` eşiklerinde yazıyı değiştirir.
 *  - İmleç uzaklaşıp `returnDelay` ms geçince buton evine süzülür, yazı `label`a döner.
 */

const INSET = 8; // alan kenarından iç boşluk
const SAMPLES = 24; // kaçış noktası adayı
const COOLDOWN_MS = 140; // art arda tetiklenmeyi yumuşatır
const SPRING = { type: 'spring', duration: 0.42, bounce: 0.28 };
const HOME_SPRING = { type: 'spring', duration: 0.7, bounce: 0.12 };

const MotionButton = motion.button;

const DEFAULT_ESCALATION = [
  { after: 3, label: 'Gerçekten henüz değil 😅' },
  { after: 6, label: 'Söz, yakında 🙏' }
];

// Nokta ile dikdörtgen arasındaki en kısa mesafe (içerideyse 0).
const distToRect = (px, py, r) => {
  const dx = Math.max(r.left - px, 0, px - r.right);
  const dy = Math.max(r.top - py, 0, py - r.bottom);
  return Math.hypot(dx, dy);
};

export default function DodgeField({
  label = 'İndir',
  dodgeLabel = 'Henüz değil',
  escalation = DEFAULT_ESCALATION,
  onImpossibleClick,
  ariaLabel = 'Bu uygulama henüz indirilemez',
  threshold = 64,
  height = 168,
  align = 'center',
  returnDelay = 2600,
  className = '',
  style
}) {
  const fieldRef = useRef(null);
  const moverRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  const [count, setCount] = useState(0);
  const [away, setAway] = useState(false);

  const countRef = useRef(0);
  const pointer = useRef(null);
  const lastDodge = useRef(0);
  const raf = useRef(0);
  const homeTimer = useRef(undefined);
  const target = useRef({ x: 0, y: 0 }); // animasyonun gittiği son ofset
  const live = useRef({});
  live.current = { threshold, returnDelay, reduce, onImpossibleClick };

  // Alanın içinde, verilen ofset için butonun alan-yerel dikdörtgeni.
  const rectAt = useCallback((ox, oy) => {
    const m = moverRef.current;
    const left = m.offsetLeft + ox;
    const top = m.offsetTop + oy;
    return { left, top, right: left + m.offsetWidth, bottom: top + m.offsetHeight };
  }, []);

  // Ofsetin alanın dışına taşmaması için sınırlar.
  const bounds = useCallback(() => {
    const f = fieldRef.current;
    const m = moverRef.current;
    return {
      minX: INSET - m.offsetLeft,
      maxX: f.clientWidth - INSET - m.offsetLeft - m.offsetWidth,
      minY: INSET - m.offsetTop,
      maxY: f.clientHeight - INSET - m.offsetTop - m.offsetHeight
    };
  }, []);

  const move = useCallback(
    (tx, ty, cfg) => {
      target.current = { x: tx, y: ty };
      if (live.current.reduce) {
        x.jump(tx);
        y.jump(ty);
        return;
      }
      animate(x, tx, cfg);
      animate(y, ty, cfg);
    },
    [x, y]
  );

  const scheduleHome = useCallback(() => {
    clearTimeout(homeTimer.current);
    homeTimer.current = setTimeout(function tryHome() {
      const f = fieldRef.current;
      if (!f || !moverRef.current) return;
      const p = pointer.current;
      if (p) {
        const fr = f.getBoundingClientRect();
        const near = distToRect(p.x - fr.left, p.y - fr.top, rectAt(0, 0)) < live.current.threshold * 1.6;
        if (near) {
          homeTimer.current = setTimeout(tryHome, 600);
          return;
        }
      }
      move(0, 0, HOME_SPRING);
      setAway(false);
    }, live.current.returnDelay);
  }, [move, rectAt]);

  // Kaçış: imleçten (alan-yerel px,py) uzak, rastgele bir noktaya zıpla.
  const dodge = useCallback(
    (source, px, py) => {
      const f = fieldRef.current;
      const m = moverRef.current;
      if (!f || !m) return;
      const now = performance.now();
      if (now - lastDodge.current < COOLDOWN_MS) return;
      lastDodge.current = now;

      const b = bounds();
      const cx = x.get();
      const cy = y.get();
      const T = live.current.threshold;
      const hop = Math.max(56, Math.min(m.offsetWidth, 120));
      const hasPoint = Number.isFinite(px) && Number.isFinite(py);

      let best = null;
      const good = [];
      for (let i = 0; i < SAMPLES; i++) {
        const tx = b.minX + Math.random() * Math.max(0, b.maxX - b.minX);
        const ty = b.minY + Math.random() * Math.max(0, b.maxY - b.minY);
        const d = hasPoint ? distToRect(px, py, rectAt(tx, ty)) : Infinity;
        const moved = Math.hypot(tx - cx, ty - cy);
        const score = (hasPoint ? Math.min(d, T * 3) : 0) + Math.min(moved, hop * 2) * 0.5;
        if (!best || score > best.score) best = { tx, ty, score };
        if ((!hasPoint || d >= T * 1.5) && moved >= hop) good.push({ tx, ty });
      }
      const pick = good.length ? good[Math.floor(Math.random() * good.length)] : best;
      move(pick.tx, pick.ty, SPRING);

      countRef.current += 1;
      setCount(countRef.current);
      setAway(true);
      scheduleHome();
      live.current.onImpossibleClick?.({ count: countRef.current, source });
    },
    [bounds, move, rectAt, scheduleHome, x, y]
  );

  // Fare/kalem yakınlığı: pencere genelinde dinle, rAF ile seyrelt.
  useEffect(() => {
    const frame = () => {
      raf.current = 0;
      const f = fieldRef.current;
      const btn = moverRef.current;
      const p = pointer.current;
      if (!f || !btn || !p) return;
      const r = btn.getBoundingClientRect(); // anlık (animasyondaki) konum
      if (distToRect(p.x, p.y, r) <= live.current.threshold) {
        const fr = f.getBoundingClientRect();
        dodge('pointer', p.x - fr.left, p.y - fr.top);
      }
    };
    const onMove = e => {
      if (e.pointerType === 'touch') return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (!raf.current) raf.current = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      pointer.current = null;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [dodge]);

  // Dokunma: touchstart anında kaç; preventDefault tıklamayı ve sahte fare olaylarını keser.
  // React'in touch dinleyicileri pasif olduğundan elle, passive:false ile bağlanır.
  useEffect(() => {
    const btn = moverRef.current;
    if (!btn) return undefined;
    const onTouch = e => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      const fr = fieldRef.current.getBoundingClientRect();
      dodge('touch', t ? t.clientX - fr.left : NaN, t ? t.clientY - fr.top : NaN);
    };
    btn.addEventListener('touchstart', onTouch, { passive: false });
    return () => btn.removeEventListener('touchstart', onTouch);
  }, [dodge]);

  // Yazı değişince genişlik (ve ortalı yerleşimde offsetLeft) değişir: hedef
  // ofseti yeni ölçülere göre alan içine geri sıkıştır. Ara değere değil hedefe
  // bakılır; yoksa uçuştaki buton hedefine varınca taşabilir.
  useEffect(() => {
    const f = fieldRef.current;
    const m = moverRef.current;
    if (!f || !m) return undefined;
    const reclamp = () => {
      const b = bounds();
      const { x: tx, y: ty } = target.current;
      const nx = Math.min(Math.max(tx, b.minX), Math.max(b.minX, b.maxX));
      const ny = Math.min(Math.max(ty, b.minY), Math.max(b.minY, b.maxY));
      if (Math.abs(nx - tx) > 0.5 || Math.abs(ny - ty) > 0.5) move(nx, ny, SPRING);
    };
    const observer = new ResizeObserver(reclamp);
    observer.observe(f);
    observer.observe(m);
    return () => observer.disconnect();
  }, [bounds, move]);

  useEffect(() => () => clearTimeout(homeTimer.current), []);

  // Klavye ya da kaçamayan bir tıklama: varsayılanı engelle, yine kaç.
  const handleClick = e => {
    e.preventDefault();
    const keyboard = e.detail === 0; // Enter/Space ile tetiklenen click'te detail 0
    if (keyboard) {
      dodge('keyboard', NaN, NaN);
      return;
    }
    const fr = fieldRef.current.getBoundingClientRect();
    lastDodge.current = 0; // tıklama her zaman kaçırır
    dodge('click', e.clientX - fr.left, e.clientY - fr.top);
  };

  let text = label;
  if (away) {
    text = dodgeLabel;
    for (const step of escalation) if (count >= step.after) text = step.label;
  }

  return (
    <div
      ref={fieldRef}
      className={`dodge-field${className ? ` ${className}` : ''}`}
      data-align={align}
      style={{ '--df-height': typeof height === 'number' ? `${height}px` : height, ...style }}
    >
      <MotionButton
        ref={moverRef}
        type="button"
        className="dodge-field__btn"
        style={{ x, y }}
        aria-label={ariaLabel}
        aria-disabled="true"
        data-away={away ? 'true' : 'false'}
        data-count={count}
        onClick={handleClick}
      >
        <span className="dodge-field__text" key={text} aria-hidden="true">
          {text}
        </span>
      </MotionButton>
    </div>
  );
}
