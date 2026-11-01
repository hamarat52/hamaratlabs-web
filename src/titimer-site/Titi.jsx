// tiTimer'ın maskotu Titi. Uygulamadaki lib/design/titi_painter.dart çiziminin SVG aktarımı:
// aynı oranlar (R = genişlik / 2.5), aynı renkler (app_theme.dart → TiColors), aynı ruh hâlleri.
// Uygulamadaki hafif "elle çizilmiş" titreme burada küçük, sabit bir dalgalanmayla verilir.

const C = {
  teal: '#2F6D7C',
  tealDark: '#245766',
  coral: '#F17D68',
  cream: '#FCFBF7',
  ink: '#1D3A42',
  mist: '#A9CCD3'
};

const R = 80;
const X = 100;
const Y = 100;
const LW = 4;

// Hafif organik elips (uygulamadaki OrganicShapes.blobPath'in sade karşılığı). Rastgelelik yok.
function blob(cx, cy, rx, ry, wob = 0.03, seed = 1, n = 36) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * Math.sin(a * 3 + seed) + wob * 0.6 * Math.cos(a * 5 + seed * 1.7);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = '';
  for (let i = 0; i < n; i += 1) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (i === 0) {
      const last = pts[n - 1];
      d += `M${((last[0] + p[0]) / 2).toFixed(2)},${((last[1] + p[1]) / 2).toFixed(2)} `;
    }
    d += `Q${p[0].toFixed(2)},${p[1].toFixed(2)} ${m[0].toFixed(2)},${m[1].toFixed(2)} `;
  }
  return `${d}Z`;
}

// Flutter'daki gibi açı saat yönünde, 0 = sağ.
function arc(cx, cy, r, a0, sweep) {
  const a1 = a0 + sweep;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  const large = Math.abs(sweep) > Math.PI ? 1 : 0;
  return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${r},${r} 0 ${large} 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
}

function Arm({ s, th }) {
  const sx = X + s * R * 0.88;
  const sy = Y + R * 0.12;
  const L = R * 0.62;
  const hx = sx + s * Math.sin(th) * L;
  const hy = sy + Math.cos(th) * L;
  const mx = (sx + hx) / 2 + s * R * 0.05 * Math.cos(th);
  const my = (sy + hy) / 2 - R * 0.04;
  return (
    <g className={`titi__arm titi__arm--${s < 0 ? 'l' : 'r'}`} style={{ transformOrigin: `${sx}px ${sy}px` }}>
      <path d={`M${sx},${sy} L${mx},${my} L${hx},${hy}`} fill="none" stroke={C.ink} strokeWidth={LW * 1.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={blob(hx, hy, R * 0.1, R * 0.1, 0.03, hx + hy)} fill={C.cream} stroke={C.ink} strokeWidth={LW * 0.7} />
    </g>
  );
}

function Eye({ s, kind }) {
  const cx = X + s * R * 0.3;
  const ey = Y - R * 0.12;
  const er = R * 0.085;
  if (kind === 'closed') {
    return <path d={arc(cx, ey + er * 0.7, er * 1.25, Math.PI * 1.15, Math.PI * 0.7)} fill="none" stroke={C.ink} strokeWidth={LW} strokeLinecap="round" />;
  }
  return (
    <g className="titi__eye">
      <path d={blob(cx, ey, er, er * 1.15, 0.03, cx + ey)} fill={C.ink} />
      <circle cx={cx + er * 0.35} cy={ey - er * 0.4} r={er * 0.32} fill="#fff" />
    </g>
  );
}

const EYES = {
  happy: ['open', 'open'],
  focus: ['closed', 'closed'],
  relax: ['closed', 'closed'],
  wink: ['open', 'closed']
};

/**
 * mood: 'happy' | 'focus' | 'relax' | 'wink'
 * progress: yüz halkasının doluluğu (0..1); ringColor: halka rengi (çalışmada teal, molada mercan).
 */
export default function Titi({ mood = 'happy', progress = 0, ringColor = C.teal, className = '', title }) {
  const th = mood === 'focus' ? Math.PI / 2 : 0.5;
  const my = Y + R * 0.3;
  const eyes = EYES[mood] || EYES.happy;
  const rr = R * 0.84;
  const rw = R * 0.13;
  const p = Math.min(Math.max(progress, 0), 1);

  let mouth;
  if (mood === 'relax' || mood === 'wink') {
    const r = R * 0.19;
    mouth = (
      <>
        <path d={`${arc(X, my - R * 0.07, r, 0.05 * Math.PI, 0.9 * Math.PI)} Z`} fill={C.ink} />
        <circle cx={X} cy={my + R * 0.07} r={R * 0.06} fill={C.coral} />
      </>
    );
  } else {
    const r = mood === 'focus' ? R * 0.12 : R * 0.17;
    mouth = <path d={arc(X, my - r * 0.6, r, 0.18 * Math.PI, 0.64 * Math.PI)} fill="none" stroke={C.ink} strokeWidth={LW} strokeLinecap="round" />;
  }

  return (
    <svg
      className={`titi titi--${mood} ${className}`}
      viewBox="-32 -14 264 222"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* gölge */}
      <path d={blob(X, Y + R * 1.12, R * 0.8, R * 0.13, 0.1)} fill={C.ink} opacity="0.15" />
      <Arm s={-1} th={th} />
      <Arm s={1} th={th} />
      {[-1, 1].map(s => (
        <path key={s} d={blob(X + s * R * 0.36, Y + R * 0.98, R * 0.2, R * 0.11, 0.03, s + 7)} fill={C.tealDark} stroke={C.ink} strokeWidth={LW * 0.6} />
      ))}
      {/* tepe düğmesi */}
      <rect x={X - R * 0.07} y={Y - R - R * 0.06 - R * 0.11} width={R * 0.14} height={R * 0.22} rx={R * 0.03} fill={C.tealDark} />
      <rect x={X - R * 0.23} y={Y - R - R * 0.2 - R * 0.085} width={R * 0.46} height={R * 0.17} rx={R * 0.08} fill={C.coral} stroke={C.ink} strokeWidth={LW * 0.7} />
      {/* gövde */}
      <path d={blob(X, Y, R, R, 0.03, 200)} fill={C.cream} stroke={C.tealDark} strokeWidth={LW * 1.25} />
      {/* yüz halkası */}
      <circle cx={X} cy={Y} r={rr} fill="none" stroke={C.mist} strokeOpacity="0.35" strokeWidth={rw} />
      {p > 0 && (
        <circle
          className="titi__progress"
          cx={X}
          cy={Y}
          r={rr}
          fill="none"
          stroke={ringColor}
          strokeOpacity="0.82"
          strokeWidth={rw}
          strokeLinecap="round"
          pathLength="1000"
          strokeDasharray={`${(p * 1000).toFixed(1)} 1000`}
          transform={`rotate(-90 ${X} ${Y})`}
        />
      )}
      {/* yanaklar */}
      {[-1, 1].map(s => (
        <path key={s} d={blob(X + s * R * 0.5, my - R * 0.08, R * 0.12, R * 0.08, 0.05, s + 3)} fill={C.coral} opacity="0.37" />
      ))}
      <Eye s={-1} kind={eyes[0]} />
      <Eye s={1} kind={eyes[1]} />
      {mouth}
    </svg>
  );
}

export { C as TI_COLORS };
