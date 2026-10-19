import { useCallback, useEffect, useRef, useState } from 'react';
import PaperCrumple from './components/rb/PaperCrumple/PaperCrumple';
import { hasPaperPath, noteCrumpleOptions, preparePaper } from './crumplePrep';

/* Fikir panosunda "buruştur ve at":
   - Notun kâğıt görüntüsü ideaBoardSnapshot.js'te üretilir; PaperCrumple'ın dokusu olur.
   - Buruşma yolu crumplePrep.js ile Web Worker'da (çoğunlukla önceden) hesaplanır.
   - CrumpleFlight: kâğıdı notun durduğu yerde, aynı açı ve ölçekte buruşturur, sonra top
     hâline gelmiş kâğıdı kavisle çöp kutusuna atar.
   - TrashBin: panonun sol altındaki dolgun ofis çöp kutusu. Atılan notlar içinde, ağzından
     taşan buruşuk kâğıt topları olarak görünür;
     basınca son atılan not panoya geri döner. Silme yalnız bu oturumda, veri değişmez. */

const PAD = 48; // PaperCrumple kâğıdı tam boyutta çizsin diye sahneye eklenen pay

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CRUMPLE_S = 0.6;

// Bir notun buruşup çöpe uçuşu. Bitince onDone(key).
export function CrumpleFlight({ item, getTarget, onDone }) {
  const ref = useRef(null);
  const [cover, setCover] = useState(true); // WebGL ilk kareyi çizene kadar düz kâğıt görüntüsü
  const [options] = useState(() => noteCrumpleOptions(item.key, item.w, item.h));
  const [prepared, setPrepared] = useState(() => hasPaperPath(options));
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
    list.push(setTimeout(fly, 4000)); // WebGL ya da worker hiç hazır olmazsa bile not çöpe gider
    return () => list.forEach(clearTimeout);
  }, [fly]);

  // Yol önceden hazırlanmadıysa worker'da hemen (sıranın başında) hesaplat; bu sırada düz kâğıt görünür.
  useEffect(() => {
    if (prepared) return;
    let on = true;
    preparePaper(options, true).then(() => on && setPrepared(true));
    return () => {
      on = false;
    };
  }, [prepared, options]);

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
      data-prepared={prepared}
      aria-hidden="true"
      inert
    >
      {cover && <img className="ib-crumple__cover" src={item.src} alt="" style={{ width: item.w, height: item.h }} />}
      {prepared && (
        <PaperCrumple
          {...options}
          src={item.src}
          alt=""
          sceneHeight={H}
          style={{ width: W }}
          crumpled
          draggable={false}
          releaseBehavior="stay"
          crumpleAmount={1}
          crumpleDuration={CRUMPLE_S}
          paperColor={item.color}
          lightIntensity={1.7}
          shadowOpacity={0.14}
          onStateChange={onState}
          onError={fly}
        />
      )}
    </div>
  );
}

/* Ofis çöp kutusu çizimi (100×100): dolgun, hafif konik, haddelenmiş ağız kenarı, iki
   kabartma bant, silindir gölgelemesi ve ince tane. Kâğıtta duruyormuş gibi altında
   yumuşak bir temas gölgesi var. Çizim sırası derinliği verir: iç duvar → arka kenar →
   kâğıt topları → ön gövde → ön kenar. Böylece toplar ön kenarın arkasından taşar.
   Ağız elipsi: merkez (50, 24), yarıçap 33×8; dip: (50, 87), 24×5.5. */
const RIM = { cx: 50, cy: 24, rx: 33, ry: 8 };
const BOTTOM = { cy: 87, rx: 24, ry: 5.5 };
const sideX = y => RIM.rx + ((BOTTOM.rx - RIM.rx) * (y - RIM.cy)) / (BOTTOM.cy - RIM.cy);
const sideRy = y => RIM.ry + ((BOTTOM.ry - RIM.ry) * (y - RIM.cy)) / (BOTTOM.cy - RIM.cy);
const frontArc = y => {
  const rx = sideX(y);
  return `M${(50 - rx).toFixed(2)} ${y}A${rx.toFixed(2)} ${sideRy(y).toFixed(2)} 0 0 0 ${(50 + rx).toFixed(2)} ${y}`;
};
const BODY = `M${RIM.cx - RIM.rx} ${RIM.cy}L${50 - BOTTOM.rx} ${BOTTOM.cy}A${BOTTOM.rx} ${BOTTOM.ry} 0 0 0 ${50 + BOTTOM.rx} ${BOTTOM.cy}L${RIM.cx + RIM.rx} ${RIM.cy}A${RIM.rx} ${RIM.ry} 0 0 1 ${RIM.cx - RIM.rx} ${RIM.cy}Z`;
const RIM_BACK = `M${RIM.cx - RIM.rx} ${RIM.cy}A${RIM.rx} ${RIM.ry} 0 0 1 ${RIM.cx + RIM.rx} ${RIM.cy}`;
const RIM_FRONT = `M${RIM.cx - RIM.rx} ${RIM.cy}A${RIM.rx} ${RIM.ry} 0 0 0 ${RIM.cx + RIM.rx} ${RIM.cy}`;
const RIBS = [37, 77].map(frontArc);

/* Buruşuk kâğıt topu: tohumlu, yuvarlatılmış ama yer yer içe göçük bir dış hat; kenardan
   içeri kırılarak uzanan kat izleri. Her katın bir yanı gölgede, öbür yanı ışıkta kalır
   (buruşuk kâğıdı kâğıt gibi gösteren şey bu). Her yuva kendi tohumuyla çizilir: toplar
   birbirine benzemez ama her açılışta aynıdır. */
function wad(seed) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = 12;
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const r = 9.2 + rnd() * 1.8 - (k % 4 === 2 ? 2.4 : 0); // ara ara içe göçük
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  let d = `M${f(mid(pts[0], pts[1]))}`;
  for (let k = 1; k <= n; k++) d += `Q${f(pts[k % n])} ${f(mid(pts[k % n], pts[(k + 1) % n]))}`;
  d += 'Z';
  const creases = [];
  const dark = [];
  const light = [];
  for (let c = 0; c < 5; c++) {
    const a = (c / 5) * Math.PI * 2 + rnd() * 0.9;
    let p = [Math.cos(a) * 8, Math.sin(a) * 8];
    let dir = a + Math.PI + (rnd() - 0.5) * 1.1;
    const line = [p];
    for (let seg = 0; seg < 2; seg++) {
      const len = 3.2 + rnd() * 2.6;
      const q = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
      const nx = -Math.sin(dir) * 2.2;
      const ny = Math.cos(dir) * 2.2;
      dark.push(`M${f(p)}L${f(q)}L${f([q[0] + nx, q[1] + ny])}Z`);
      light.push(`M${f(p)}L${f(q)}L${f([p[0] - nx, p[1] - ny])}Z`);
      line.push(q);
      p = q;
      dir += (rnd() - 0.5) * 1.4;
    }
    creases.push(`M${line.map(f).join('L')}`);
  }
  return { d, dark: dark.join(''), light: light.join(''), creases: creases.join('') };
}
// Top yuvaları: önce ön sıra, sonra arka sıra, en son yığının tepesi. z küçük olan önce çizilir.
const SLOTS = [
  { x: 39, y: 24, s: 1.22, r: 0, z: 2 },
  { x: 62, y: 23.5, s: 1.16, r: 50, z: 3 },
  { x: 50, y: 16.5, s: 1.12, r: 110, z: 1 },
  { x: 28.5, y: 19.5, s: 1, r: 200, z: 0 },
  { x: 71, y: 18, s: 1, r: 290, z: 0 },
  { x: 47, y: 7.5, s: 1.14, r: 160, z: 4 }
].map((slot, i) => ({ ...slot, wad: wad(9301 + i * 7919) }));

/* Kutu, panoyu kaplayan görünmez bir katmanın dibinde ve "sticky": pano ekrandan uzunsa
   (telefon) ekranın sol altında yüzer, panonun dibine gelince yerine oturur. Böylece
   sürüklenen not her zaman kutuya ulaşabilir. */
export function TrashBin({ binRef, tones, armed, hot, pulse, onRestore, canRestore }) {
  // Yalnız yeni düşen top "düşme" animasyonu alır; geri alınca kalan toplar yerinde durur.
  const [count, setCount] = useState(tones.length);
  const [dropped, setDropped] = useState(-1);
  if (count !== tones.length) {
    setCount(tones.length);
    setDropped(tones.length > count ? tones.length : -1);
  }
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
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="ibbin-body" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#24272b" />
                <stop offset="0.16" stopColor="#3b4047" />
                <stop offset="0.3" stopColor="#5b626b" />
                <stop offset="0.42" stopColor="#4a5058" />
                <stop offset="0.72" stopColor="#32363c" />
                <stop offset="1" stopColor="#1c1e22" />
              </linearGradient>
              <linearGradient id="ibbin-in" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#3d434b" />
                <stop offset="0.5" stopColor="#1b1d21" />
                <stop offset="1" stopColor="#111215" />
              </linearGradient>
              <radialGradient id="ibbin-shade" cx="0.36" cy="0.3" r="0.78">
                <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#2a2116" stopOpacity="0.42" />
              </radialGradient>
              <clipPath id="ibbin-clip">
                <path d={BODY} />
              </clipPath>
              {SLOTS.map((slot, i) => (
                <clipPath key={i} id={`ibbin-wad-${i}`}>
                  <path d={slot.wad.d} />
                </clipPath>
              ))}
              <filter id="ibbin-grain" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" />
                <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0" />
              </filter>
              <filter id="ibbin-blur" x="-20%" y="-60%" width="140%" height="220%">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            <ellipse className="ib-bin__floor" cx="50" cy="89.5" rx="30" ry="5" filter="url(#ibbin-blur)" />
            <ellipse cx={RIM.cx} cy={RIM.cy} rx={RIM.rx} ry={RIM.ry} fill="url(#ibbin-in)" />
            <path className="ib-bin__lip-ink" d={RIM_BACK} />
            <path className="ib-bin__lip ib-bin__lip--back" d={RIM_BACK} />
            {tones
              .slice(-SLOTS.length)
              .map((tone, i, list) => ({ tone, i, slot: SLOTS[i], last: i === list.length - 1 }))
              .sort((a, b) => a.slot.z - b.slot.z)
              .map(({ tone, i, slot, last }) => (
                <g key={i} transform={`translate(${slot.x} ${slot.y}) rotate(${slot.r}) scale(${slot.s})`}>
                  <g className={last && dropped === tones.length ? 'ib-bin__wad is-new' : 'ib-bin__wad'} style={{ fill: `var(--ib-${tone})` }}>
                    <path className="ib-bin__ball" d={slot.wad.d} />
                    <g clipPath={`url(#ibbin-wad-${i})`}>
                      <path className="ib-bin__facet" d={slot.wad.dark} />
                      <path className="ib-bin__facet ib-bin__facet--lit" d={slot.wad.light} />
                      <path className="ib-bin__crease" d={slot.wad.creases} />
                    </g>
                    <path d={slot.wad.d} fill="url(#ibbin-shade)" />
                    <path className="ib-bin__ball-edge" d={slot.wad.d} />
                  </g>
                </g>
              ))}
            <path className="ib-bin__body" d={BODY} fill="url(#ibbin-body)" />
            <rect clipPath="url(#ibbin-clip)" width="100" height="100" filter="url(#ibbin-grain)" opacity="0.5" />
            {RIBS.map(d => (
              <g key={d}>
                <path className="ib-bin__rib" d={d} />
                <path className="ib-bin__rib-hi" d={d} transform="translate(0 1.3)" />
              </g>
            ))}
            <path className="ib-bin__shine" d="M29.5 31.5L34.5 84" />
            <path className="ib-bin__lip-ink" d={RIM_FRONT} />
            <path className="ib-bin__lip" d={RIM_FRONT} />
            <path className="ib-bin__lip-hi" d={RIM_FRONT} transform="translate(0 -0.9)" />
          </svg>
        </span>
      </button>
    </div>
  );
}
