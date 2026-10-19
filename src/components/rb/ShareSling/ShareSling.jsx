import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  InstagramIcon,
  Link01Icon,
  NewTwitterIcon,
  Share08Icon,
  TelegramIcon,
  WhatsappIcon
} from '@hugeicons/core-free-icons';

import SlingButton from '../SlingButton/SlingButton';
import './ShareSling.css';

const MotionSpan = motion.span;

/*
 * ShareSling — SlingButton'ı değiştirmeden sarar.
 * Basılı tut → "Çek" etiketi; çektikçe çevrede platform ikonları açılır;
 * bırakınca sapanın FIRLATMA yönüne (çekmenin tersi) en yakın ikona paylaşılır.
 * Çekme mesafesi SlingButton'ın armAt eşiğine ulaşmazsa SlingButton onSend'i
 * çağırmaz → hiçbir şey paylaşılmaz, sapan nötrlenir.
 */

const SLOP = { fine: 4, coarse: 8 };
const FIRED_MS = 620;
const TOAST_MS = 2600;
const TAU = Math.PI * 2;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const enc = encodeURIComponent;
const stripUrl = (text, url) => (url ? text.split(url).join(' ') : text).replace(/\s+/g, ' ').trim();
const withUrl = (text, url) => (!url || text.includes(url) ? text.trim() : `${text} ${url}`.trim());
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// --- Halka yerleşimi: viewport kenarına yakınken ikonlar ekran dışına taşmasın ---
const EDGE = 8; // viewport kenarından bırakılacak boşluk (px)
const CHIP = 44; // .share-sling__chip çapı (CSS --ss-chip ile aynı)
const CHIP_HALF = (CHIP / 2) * 1.16 + 6; // seçili hâldeki büyüme + lime halka payı
const LABEL_BELOW = 6 + 20; // isim etiketi chip'in altında
const SAMPLES = 180; // 2° çözünürlük

const evenRing = (n, r) =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * TAU) / n;
    return { a, x: r * Math.cos(a), y: r * Math.sin(a) };
  });

/*
 * Basış anında ölçülen merkez (cx, cy) için halkayı viewport'a sığdırır:
 * 1) Tam halka (varsayılan yarıçaptan, gerekirse %75'ine kadar küçülterek),
 * 2) olmazsa ikonları açık taraftaki en geniş yaya (sırayı koruyarak) dizer;
 *    yarıçap pad'e çarpmayacak alt sınıra kadar küçülebilir.
 * Açılar korunur → "fırlatma yönüne en yakın ikon" seçimi aynı mantıkla çalışır.
 */
function fitRing(n, base, size, { cx, cy, vw, vh, labelHalf }) {
  const hx = Math.max(CHIP_HALF, labelHalf);
  const fits = (r, a) => {
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    return x - hx >= EDGE && x + hx <= vw - EDGE && y - CHIP_HALF >= EDGE && y + CHIP_HALF + LABEL_BELOW <= vh - EDGE;
  };
  const minR = Math.min(base, size / 2 + CHIP / 2 + 16);
  const radii = [];
  for (let r = base; r > minR; r -= 4) radii.push(r);
  radii.push(minR);

  for (const r of radii) {
    if (r < base * 0.75) break;
    const pts = evenRing(n, r);
    if (pts.every(p => fits(r, p.a))) return { r, pts };
  }

  let best = null;
  for (const r of radii) {
    const ok = Array.from({ length: SAMPLES }, (_, k) => fits(r, (k * TAU) / SAMPLES));
    if (ok.every(Boolean)) return { r, pts: evenRing(n, r) };
    // Dairesel olarak en uzun izinli açı dizisi
    let runStart = -1;
    let runLen = 0;
    let curStart = 0;
    let cur = 0;
    for (let k = 0; k < SAMPLES * 2; k++) {
      if (ok[k % SAMPLES]) {
        if (cur === 0) curStart = k;
        cur += 1;
        if (cur > runLen && cur <= SAMPLES) {
          runLen = cur;
          runStart = curStart;
        }
      } else cur = 0;
    }
    if (runLen === 0) continue;
    const step = TAU / SAMPLES;
    const span = (runLen - 1) * step;
    const need = n > 1 ? (n - 1) * 2 * Math.asin(Math.min(1, (CHIP + 12) / (2 * r))) : 0;
    const cand = { r, start: runStart * step, span };
    if (!best || span - need > best.span - best.need) best = { ...cand, need };
    if (span >= need) break;
  }
  if (!best) return { r: base, pts: evenRing(n, base) };
  const gap = n > 1 ? Math.min(best.span / (n - 1), TAU / n) : 0;
  const mid = best.start + best.span / 2;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = Math.atan2(Math.sin(mid + (i - (n - 1) / 2) * gap), Math.cos(mid + (i - (n - 1) / 2) * gap));
    return { a, x: best.r * Math.cos(a), y: best.r * Math.sin(a) };
  });
  return { r: best.r, pts };
}

// Merkezi cx olan w genişliğindeki kutuyu viewport içine iten yatay kaydırma.
const edgeShift = (cx, w, vw) => {
  const left = cx - w / 2;
  const right = cx + w / 2;
  if (w + 2 * EDGE >= vw) return vw / 2 - cx;
  if (left < EDGE) return EDGE - left;
  if (right > vw - EDGE) return vw - EDGE - right;
  return 0;
};

const PLATFORMS = {
  whatsapp: {
    label: 'WhatsApp',
    icon: WhatsappIcon,
    href: (url, text) => `https://wa.me/?text=${enc(withUrl(text, url))}`
  },
  x: {
    label: 'X',
    icon: NewTwitterIcon,
    href: (url, text) => `https://twitter.com/intent/tweet?text=${enc(stripUrl(text, url))}&url=${enc(url)}`
  },
  telegram: {
    label: 'Telegram',
    icon: TelegramIcon,
    href: (url, text) => `https://t.me/share/url?url=${enc(url)}&text=${enc(stripUrl(text, url))}`
  },
  instagram: {
    label: 'Instagram',
    icon: InstagramIcon,
    copy: true,
    note: 'Link kopyalandı. Instagram’da hikâyene ya da DM’e yapıştır.'
  },
  copy: {
    label: 'Linki kopyala',
    icon: Link01Icon,
    copy: true,
    note: 'Link kopyalandı.'
  }
};
const DEFAULT_ORDER = ['whatsapp', 'x', 'telegram', 'instagram', 'copy'];

function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
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

export default function ShareSling({
  shareUrl,
  shareText = '',
  platforms = DEFAULT_ORDER,
  aim = 'launch',
  size = 56,
  radius = 112,
  maxPull = 120,
  armAt = 44,
  onShare,
  disabled = false,
  ariaLabel = 'Paylaş',
  className = ''
}) {
  const reduce = useReducedMotion();
  const R = maxPull;
  const ARM = Math.min(armAt, 0.8 * R); // SlingButton ile aynı eşik
  const REVEAL = ARM * 0.45;

  const [phase, setPhase] = useState('idle'); // idle | held | reveal | armed | fired
  const [target, setTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });

  const rootRef = useRef(null);
  const gesture = useRef(null);
  const releaseRef = useRef(null);
  const phaseRef = useRef('idle');
  const targetRef = useRef(null);
  const firedTimer = useRef(undefined);
  const toastTimer = useRef(undefined);

  const lx = useMotionValue(0);
  const ly = useMotionValue(0);
  const beamRot = useMotionValue(-90);
  const beamLen = useMotionValue(0);
  const beamT = useMotionTemplate`rotate(${beamRot}deg) scaleX(${beamLen})`;

  const ids = platforms.filter(id => PLATFORMS[id]);
  // Halka, üst elemanların overflow'undan etkilenmesin diye body'ye portal edilen
  // position:fixed bir katmanda çizilir; yerleşim basış anında viewport'a sığdırılır.
  const [layout, setLayout] = useState(null); // { n, r, pts }
  const layoutRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const layerRef = useRef(null);
  const toastRef = useRef(null);
  const cueTextRef = useRef(null);
  const centerRef = useRef(null); // { cx, cy, vw, vh }

  const ringFor = lay =>
    ids.map((id, i) => {
      if (lay && lay.n === ids.length) return { id, ...lay.pts[i] };
      const a = -Math.PI / 2 + (i * TAU) / ids.length;
      return { id, a, x: radius * Math.cos(a), y: radius * Math.sin(a) };
    });
  const ring = ringFor(layout);
  const ringR = layout && layout.n === ids.length ? layout.r : radius;

  // Bileşen merkezini ölç, katmanı oraya taşı.
  const measure = () => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return null;
    const b = root.getBoundingClientRect();
    const c = {
      cx: b.left + b.width / 2,
      cy: b.top + b.height / 2,
      vw: document.documentElement.clientWidth || window.innerWidth,
      vh: window.innerHeight
    };
    centerRef.current = c;
    const L = layerRef.current;
    if (L) {
      L.style.left = `${c.cx}px`;
      L.style.top = `${c.cy}px`;
      L.style.fontFamily = getComputedStyle(root).fontFamily;
    }
    return c;
  };

  // Çek/ipucu etiketini (pad ile birlikte hareket eder) yatayda ekranda tut.
  const placeCue = px => {
    const el = cueTextRef.current;
    const c = centerRef.current || measure();
    if (!el || !c) return;
    el.style.marginLeft = `${edgeShift(c.cx + px, el.offsetWidth, c.vw)}px`;
  };

  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const setPhaseSafe = p => {
    if (phaseRef.current === p) return;
    phaseRef.current = p;
    setPhase(p);
  };
  const setTargetSafe = t => {
    if (targetRef.current === t) return;
    targetRef.current = t;
    setTarget(t);
  };

  const showToast = msg => {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), TOAST_MS);
  };

  const nearest = angle => {
    let best = null;
    let bestD = Infinity;
    for (const r of ringFor(layoutRef.current)) {
      const d = angDiff(r.a, angle);
      if (d < bestD) {
        bestD = d;
        best = r.id;
      }
    }
    return best;
  };

  const reset = () => {
    gesture.current = null;
    setPhaseSafe('idle');
    setTargetSafe(null);
  };

  // --- Pointer izleme (capture fazı: SlingButton'ın kendi handler'larından önce) ---
  const onPointerDownCapture = e => {
    if (disabled || gesture.current || e.button !== 0) return;
    const el = rootRef.current;
    if (!el || !e.target.closest?.('.sling-button__pad')) return;
    const sling = el.querySelector('.sling-button');
    if (!sling) return;
    clearTimeout(firedTimer.current);
    releaseRef.current = null;
    const rect = sling.getBoundingClientRect();
    // Pad hâlâ geri yaylanıyorsa SlingButton çekmeye o konumdan devam eder; aynısını yap.
    const m = /translate\(\s*(-?[\d.e+-]+)px,\s*(-?[\d.e+-]+)px\)/.exec(
      el.querySelector('.sling-button__move')?.style.transform || ''
    );
    const x0 = m ? parseFloat(m[1]) : 0;
    const y0 = m ? parseFloat(m[2]) : 0;
    // Halkayı bu basışın konumuna göre viewport'a sığdır.
    const c = measure();
    if (c) {
      let labelHalf = 0;
      layerRef.current?.querySelectorAll('.share-sling__name').forEach(n => {
        labelHalf = Math.max(labelHalf, n.offsetWidth / 2);
      });
      const fit = fitRing(ids.length, radius, size, { ...c, labelHalf });
      const lay = { n: ids.length, r: fit.r, pts: fit.pts };
      layoutRef.current = lay;
      setLayout(lay);
    }
    placeCue(x0);
    const dNow = Math.hypot(x0, y0);
    const dC = Math.min(dNow, 0.95 * R);
    const rawNow = dNow > 0.5 ? (R * dC) / (R - dC) : 0;
    gesture.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: dNow > 0.5 ? (rawNow * x0) / dNow : 0,
      oy: dNow > 0.5 ? (rawNow * y0) / dNow : 0,
      scale: rect.width / (sling.offsetWidth || rect.width) || 1,
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
      moved: false,
      phase: 'held',
      aim: null
    };
    lx.jump(0);
    ly.jump(0);
    beamLen.jump(0);
    setTargetSafe(null);
    setPhaseSafe('held');
  };

  const onPointerMoveCapture = e => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = (e.clientX - g.sx) / g.scale;
    const dy = (e.clientY - g.sy) / g.scale;
    if (!g.moved && Math.hypot(dx, dy) > g.slop) g.moved = true;
    const rx = g.ox + dx;
    const ry = g.oy + dy;
    const raw = Math.hypot(rx, ry);
    if (raw < 0.01) return;
    const d = (R * raw) / (R + raw); // SlingButton'ın rubber-band formülü
    const ux = rx / raw;
    const uy = ry / raw;
    lx.set(d * ux);
    ly.set(d * uy);
    placeCue(d * ux);
    const aimAngle = aim === 'pull' ? Math.atan2(uy, ux) : Math.atan2(-uy, -ux);
    beamRot.set((aimAngle * 180) / Math.PI);
    beamLen.set(clamp((d - REVEAL) / (ARM - REVEAL), 0, 1));
    const next = !g.moved || d < REVEAL ? 'held' : d >= ARM ? 'armed' : 'reveal';
    g.phase = next;
    g.aim = aimAngle;
    setPhaseSafe(next);
    setTargetSafe(next === 'held' ? null : nearest(aimAngle));
  };

  const onPointerUpCapture = e => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    // SlingButton, bu olayın bubble aşamasında onSend'i senkron çağırır (yalnız
    // dokunuşta ya da armAt eşiği aşılmış fırlatmada). Hedefi burada dondur.
    releaseRef.current = { moved: g.moved, target: g.aim == null ? null : nearest(g.aim) };
    setTimeout(() => {
      releaseRef.current = null;
    }, 0);
    reset();
  };

  const onCancelCapture = e => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    releaseRef.current = null;
    reset();
  };

  const onKeyDownCapture = e => {
    if (e.key === 'Escape' && gesture.current) {
      releaseRef.current = null;
      reset();
    }
  };

  // --- Paylaşım ---
  const shareTo = id => {
    const p = PLATFORMS[id];
    if (!p) return;
    clearTimeout(firedTimer.current);
    phaseRef.current = 'fired';
    setPhase('fired');
    setTargetSafe(id);
    firedTimer.current = setTimeout(() => {
      setPhaseSafe('idle');
      setTargetSafe(null);
    }, FIRED_MS);

    if (p.copy) {
      copyText(url).then(ok => showToast(ok ? p.note : `Kopyalanamadı: ${url}`));
      onShare?.(id, url);
      return;
    }
    const href = p.href(url, shareText);
    window.open(href, '_blank', 'noopener,noreferrer');
    showToast(`${p.label} açılıyor…`);
    onShare?.(id, href);
  };

  const shareTap = () => {
    // Dokun / Enter: çekme yok → cihazın kendi paylaşım menüsü, yoksa link kopyala.
    if (navigator.share) {
      navigator.share({ text: stripUrl(shareText, url) || undefined, url }).catch(() => {});
      onShare?.('native', url);
      return;
    }
    copyText(url).then(ok => showToast(ok ? 'Link kopyalandı.' : `Kopyalanamadı: ${url}`));
    onShare?.('copy', url);
  };

  const handleSend = () => {
    const rel = releaseRef.current;
    releaseRef.current = null;
    if (rel?.moved) return rel.target ? shareTo(rel.target) : undefined;
    shareTap();
  };

  useEffect(
    () => () => {
      clearTimeout(firedTimer.current);
      clearTimeout(toastTimer.current);
    },
    []
  );

  // Katman body'de; mount sonrası portal'ı aç ve merkezi ölç.
  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    if (mounted) measure();
  });

  // Bilgi notu: viewport içinde kalsın (yatay kaydır; altta yer yoksa halkanın üstüne al).
  useLayoutEffect(() => {
    if (!toast.show) return;
    const el = toastRef.current;
    const c = measure();
    if (!el || !c) return;
    const h = el.offsetHeight;
    const below = ringR + 36;
    el.style.top = `${c.cy + below + h + EDGE <= c.vh ? below : -(below + h)}px`;
    el.style.marginLeft = `${edgeShift(c.cx, el.offsetWidth, c.vw)}px`;
  }, [toast.show, toast.msg, ringR]); // eslint-disable-line react-hooks/exhaustive-deps

  // Açıkken / not görünürken sayfa kayar ya da boyut değişirse katman takip etsin.
  const following = phase !== 'idle' || toast.show;
  useEffect(() => {
    if (!following) return undefined;
    const on = () => measure();
    window.addEventListener('scroll', on, true);
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on, true);
      window.removeEventListener('resize', on);
    };
  }, [following]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = phase === 'reveal' || phase === 'armed' || phase === 'fired';
  const pulling = phase === 'held' || phase === 'reveal' || phase === 'armed';

  const iconState = (r, i) => {
    const isT = target === r.id;
    const pos = reduce ? { x: r.x, y: r.y } : { x: open ? r.x : 0, y: open ? r.y : 0 };
    if (!open) return { ...pos, scale: reduce ? 1 : 0.35, opacity: 0, i };
    if (phase === 'fired') return { ...pos, scale: isT ? 1.28 : 0.8, opacity: isT ? 1 : 0, i };
    if (phase === 'armed') return { ...pos, scale: isT ? 1.16 : 0.9, opacity: isT ? 1 : 0.42, i };
    return { ...pos, scale: isT ? 1 : 0.86, opacity: isT ? 0.95 : 0.62, i };
  };

  const spring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 };

  return (
    <span
      ref={rootRef}
      className={`share-sling${className ? ` ${className}` : ''}`}
      data-phase={phase}
      data-open={open ? '' : undefined}
      style={{
        '--ss-size': `${size}px`,
        '--ss-radius': `${radius}px`
      }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMoveCapture={onPointerMoveCapture}
      onPointerUpCapture={onPointerUpCapture}
      onPointerCancelCapture={onCancelCapture}
      onLostPointerCaptureCapture={onCancelCapture}
      onKeyDownCapture={onKeyDownCapture}
    >
      <SlingButton
        onSend={handleSend}
        size={size}
        maxPull={maxPull}
        armAt={armAt}
        padColor="var(--ss-lime)"
        iconColor="var(--ss-ink)"
        accentColor="var(--ss-lime)"
        wellColor="var(--ss-ink)"
        bandColor="var(--ss-ink-line)"
        disabled={disabled}
        ariaLabel={ariaLabel}
        className="share-sling__sling"
      >
        <HugeiconsIcon icon={Share08Icon} size={Math.round(size * 0.38)} strokeWidth={2} />
      </SlingButton>

      <MotionSpan className="share-sling__cue" style={{ x: lx, y: ly }} aria-hidden="true">
        {/* Metin yalnız etkileşimde: hover/odakta kısa ipucu (CSS), çekerken hedef platform.
            Absolute konumlu → görünüp kaybolurken çevredeki öğeler kaymaz. */}
        <span
          ref={cueTextRef}
          className="share-sling__cue-text"
          data-show={pulling ? '' : undefined}
          data-hint={phase === 'idle' ? '' : undefined}
        >
          {phase === 'idle'
            ? 'Basılı tut, çek'
            : phase === 'armed' && target && PLATFORMS[target]
              ? `Bırak → ${PLATFORMS[target].label}`
              : 'Çek'}
        </span>
      </MotionSpan>

      {/* Halka + bilgi notu body'ye portal edilen position:fixed katmanda: üst
          elemanların overflow'u kırpmaz, yerleşim viewport'a sığdırılır. */}
      {mounted &&
        createPortal(
          <span
            ref={layerRef}
            className="share-sling-layer"
            data-phase={phase}
            data-open={open ? '' : undefined}
            style={{ '--ss-size': `${size}px`, '--ss-radius': `${ringR}px` }}
          >
            <span className="share-sling__stage" aria-hidden="true">
              <MotionSpan className="share-sling__beam" style={{ transform: beamT }} />
              {ring.map((r, i) => {
                const s = iconState(r, i);
                const P = PLATFORMS[r.id];
                return (
                  <MotionSpan
                    key={r.id}
                    className="share-sling__target"
                    data-platform={r.id}
                    data-target={target === r.id ? '' : undefined}
                    initial={false}
                    animate={{ x: s.x, y: s.y, scale: s.scale, opacity: s.opacity }}
                    transition={
                      reduce
                        ? { duration: 0.12 }
                        : {
                            ...spring,
                            x: { ...spring, delay: open ? i * 0.028 : 0 },
                            y: { ...spring, delay: open ? i * 0.028 : 0 },
                            opacity: { duration: phase === 'fired' ? 0.32 : 0.16 }
                          }
                    }
                  >
                    <span className="share-sling__chip">
                      <HugeiconsIcon icon={P.icon} size={20} strokeWidth={1.8} />
                    </span>
                    <span className="share-sling__name">{P.label}</span>
                  </MotionSpan>
                );
              })}
            </span>
            <span
              ref={toastRef}
              className="share-sling__toast"
              role="status"
              aria-live="polite"
              data-show={toast.show ? '' : undefined}
            >
              {toast.msg}
            </span>
          </span>,
          document.body
        )}
    </span>
  );
}
