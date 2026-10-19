import { useCallback, useEffect, useRef, useState } from 'react';
import PaperCrumple from './components/rb/PaperCrumple/PaperCrumple';

/* Fikir panosunda "buruştur ve at":
   - Notun kâğıt görüntüsü ideaBoardSnapshot.js'te üretilir; PaperCrumple'ın dokusu olur.
   - CrumpleFlight: kâğıdı notun durduğu yerde, aynı açı ve ölçekte buruşturur, sonra top
     hâline gelmiş kâğıdı kavisle çöp kutusuna atar.
   - TrashBin: panonun sol altındaki tel çöp kutusu. Atılan notlar içinde top olarak görünür;
     basınca son atılan not panoya geri döner. Silme yalnız bu oturumda, veri değişmez. */

const PAD = 48; // PaperCrumple kâğıdı tam boyutta çizsin diye sahneye eklenen pay

const seedOf = text => {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h) % 997;
};

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CRUMPLE_S = 0.6;

// Bir notun buruşup çöpe uçuşu. Bitince onDone(key).
export function CrumpleFlight({ item, getTarget, onDone }) {
  const ref = useRef(null);
  const [cover, setCover] = useState(true); // WebGL ilk kareyi çizene kadar düz kâğıt görüntüsü
  const flown = useRef(false);
  const timers = useRef([]);
  const W = item.w + PAD;
  const H = item.h + PAD;
  const base = `rotate(${item.rot}deg) scale(${item.scale})`;

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const fly = useCallback(() => {
    if (flown.current) return;
    flown.current = true;
    const el = ref.current;
    if (!el) return onDone(item.key);
    const t = getTarget();
    const dx = t.x - item.cx;
    const dy = t.y - item.cy;
    const hop = Math.min(150, 46 + Math.hypot(dx, dy) * 0.18);
    const anim = el.animate(
      [
        { transform: `translate(0px, 0px) ${base}`, opacity: 1 },
        {
          transform: `translate(${dx * 0.5}px, ${Math.min(dy * 0.5, 0) - hop}px) rotate(${item.rot + 210}deg) scale(${item.scale * 0.6})`,
          offset: 0.45
        },
        { transform: `translate(${dx}px, ${dy}px) rotate(${item.rot + 430}deg) scale(0.3)`, opacity: 1, offset: 0.88 },
        { transform: `translate(${dx}px, ${dy + 8}px) rotate(${item.rot + 450}deg) scale(0.24)`, opacity: 0 }
      ],
      { duration: reduced() ? 1 : 640, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' }
    );
    const done = () => onDone(item.key);
    anim.finished.then(done, done);
  }, [base, getTarget, item, onDone]);

  useEffect(() => {
    const list = timers.current;
    list.push(setTimeout(fly, 3000)); // WebGL hiç hazır olmazsa bile not çöpe gider
    return () => list.forEach(clearTimeout);
  }, [fly]);

  const onState = s => {
    if (s !== 'holding') return;
    requestAnimationFrame(() => requestAnimationFrame(() => setCover(false)));
    later(fly, reduced() ? 60 : CRUMPLE_S * 1000 + 140);
  };

  return (
    <div
      ref={ref}
      className="ib-crumple"
      style={{ left: item.cx - W / 2, top: item.cy - H / 2, width: W, height: H, transform: base }}
      data-crumple={item.key}
      aria-hidden="true"
      inert
    >
      {cover && <img className="ib-crumple__cover" src={item.src} alt="" style={{ width: item.w, height: item.h }} />}
      <PaperCrumple
        src={item.src}
        alt=""
        width={item.w}
        height={item.h}
        sceneHeight={H}
        style={{ width: W }}
        crumpled
        draggable={false}
        releaseBehavior="stay"
        crumpleAmount={1}
        crumpleDuration={CRUMPLE_S}
        foldCount={7}
        foldSharpness={0.7}
        wrinkleDepth={0.8}
        paperColor={item.color}
        lightIntensity={1.7}
        shadowOpacity={0.14}
        detail={56}
        seed={seedOf(item.key) + 3}
        onStateChange={onState}
        onError={fly}
      />
    </div>
  );
}

// Tel çöp kutusu çizimi (64×64). Ağız elipsi: merkez (32, 19), yarıçap 21×5.
const RIM = { cx: 32, cy: 19, rx: 21, ry: 5 };
const MESH = [-16, -9, -2, 5, 12].map(off => {
  const x = RIM.cx + off + 2;
  const top = RIM.cy + RIM.ry * Math.sqrt(1 - ((x - RIM.cx) / RIM.rx) ** 2);
  const bx = RIM.cx + (x - RIM.cx) * 0.69;
  const bottom = 56.5 + 3 * Math.sqrt(Math.max(0, 1 - ((bx - RIM.cx) / 14.5) ** 2));
  return `M${x.toFixed(1)} ${top.toFixed(1)}L${bx.toFixed(1)} ${bottom.toFixed(1)}`;
});
const BALLS = [
  { x: 24, y: 17, s: 1 },
  { x: 39, y: 16, s: 0.92 },
  { x: 31.5, y: 12.5, s: 0.86 }
];

/* Kutu, panoyu kaplayan görünmez bir katmanın dibinde ve "sticky": pano ekrandan uzunsa
   (telefon) ekranın sol altında yüzer, panonun dibine gelince yerine oturur. Böylece
   sürüklenen not her zaman kutuya ulaşabilir. */
export function TrashBin({ binRef, tones, armed, hot, pulse, onRestore, canRestore }) {
  const cls = ['ib-bin', armed && 'is-armed', hot && 'is-hot', tones.length > 0 && 'has-items'].filter(Boolean).join(' ');
  const label = canRestore
    ? `Çöp kutusu, ${tones.length} not. Son atılan notu panoya geri almak için bas.`
    : 'Çöp kutusu. Notu buraya sürükleyip bırakırsan buruşup atılır.';
  return (
    <div className="ib-bin-dock">
      <button
        ref={binRef}
        type="button"
        className={cls}
        aria-label={label}
        title={canRestore ? 'Son atılanı geri al' : 'Çöp kutusu'}
        aria-disabled={!canRestore}
        onClick={() => canRestore && onRestore()}
      >
        <span key={pulse} className={pulse ? 'ib-bin__can is-gulp' : 'ib-bin__can'}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <ellipse className="ib-bin__mouth" cx={RIM.cx} cy={RIM.cy} rx={RIM.rx} ry={RIM.ry} />
            {tones.slice(-3).map((tone, i) => {
              const b = BALLS[i];
              return (
                <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s}) rotate(${i * 47})`} style={{ fill: `var(--ib-${tone})` }}>
                  <path className="ib-bin__ball" d="M-7.5-1.5l2.6-4.8 5.4-1.6 4.6 2.2 2.4 4.6-1.4 5.2-4.8 3-5.6-.6-3.4-3.6z" />
                  <path className="ib-bin__crease" d="M-4.5-3.8l3.8 3.4 4.6-1.6M-.7-.4l-1 4.6" />
                </g>
              );
            })}
            <path className="ib-bin__body" d="M11 19L17.5 56.5Q32 61.5 46.5 56.5L53 19Q32 29 11 19Z" />
            <path className="ib-bin__mesh" d={`${MESH.join('')}M13.6 33.5Q32 42 50.4 33.5M15.5 45Q32 52.5 48.5 45`} />
            <path className="ib-bin__rim" d="M11 19Q32 29 53 19" />
          </svg>
        </span>
      </button>
    </div>
  );
}
