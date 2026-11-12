// Canlı bağlantı diyagramının motoru (React dışı, bağımlılıksız). Onaylı taslaktaki motorun (docs/taslak/wingwire-landing-v2/5)
// seçilen iki yerleşimi: 'a' (tuval; masaüstü ve 621-820 px dikey akış) ve 'm1' (telefon sade düzeni, <=620 px).
//
// Yollar düğümlerin gerçek kutularından hesaplanır (CSS yerleşimi genişliğe göre değişir) ve tek bir SVG'ye çizilir; boyut
// değişince (ResizeObserver, yazı tipi yüklenince, 820 px eşiği) yeniden çizilir. Yollarda ok işareti yok (Yusuf, 2026-11-12).
// Işık hüzmesi yolun kendi kopyası üstünde kayan bir dash penceresidir (pathLength=1); kare başına yalnız stroke-dashoffset ve
// gradyanın iki ucu yazılır, uç noktalar önceden örneklenmiş nokta tablosundan okunur (kare başına getTotalLength yok).
// Diyagram görünmüyorken, sekme gizliyken ya da "Durdur"a basılınca döngü tamamen durur. Hareket azaltmada hüzme hiç kurulmaz.
// Sabit tohumlu rastgele bekleme: taslakla aynı tohum, aynı sıra; kareler tekrarlanabilir.

const A = { u: ['mesaj', 'onay', 'dosya'], d: ['bildirim', 'onay isteği', 'Beni ara'] };
/* boy: hüzme penceresinin px boyu (yolun en çok %60'ı). Telefon: ince, seyrek (yavas çarpanı) */
const SEC = { a: { adet: 1, boy: 90 }, m1: { adet: 1, mobil: true, hiz: 105, yavas: 1.5, boy: 48 } };
const Y = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };

function f(p) {
  return p[0].toFixed(1) + ',' + p[1].toFixed(1);
}
/* n8n tarzı eğri: uçlarda port yönünde çıkan kübik Bezier */
function bez(a, sa, b, sb, k) {
  const u = Y[sa], v = Y[sb], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  k = k || Math.max(24, Math.min(130, L * 0.45));
  return 'C' + f([a[0] + u[0] * k, a[1] + u[1] * k]) + ' ' + f([b[0] + v[0] * k, b[1] + v[1] * k]) + ' ' + f(b);
}
/* köşeleri yuvarlatılmış dik yol (dar ekranda kenar kanalından geçen yollar) */
function orto(p, r) {
  r = r || 14;
  let s = '';
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1], o = p[i], b = p[i + 1];
    const l1 = Math.hypot(o[0] - a[0], o[1] - a[1]), l2 = Math.hypot(b[0] - o[0], b[1] - o[1]), q = Math.min(r, l1 / 2, l2 / 2);
    s += 'L' + f([o[0] + ((a[0] - o[0]) / l1) * q, o[1] + ((a[1] - o[1]) / l1) * q]) + 'Q' + f(o) + ' ' + f([o[0] + ((b[0] - o[0]) / l2) * q, o[1] + ((b[1] - o[1]) / l2) * q]);
  }
  return s + 'L' + f(p[p.length - 1]);
}

/**
 * dy: diyagram kökü ([data-dy]); içinde .dy__svg ve [data-n] / [data-c] düğümleri.
 * az: hareket azaltma. durdu: başlangıçta durdurulmuş mu.
 * Döner: { durdur(bool), sok() }.
 */
export function motorKur(dy, key, { az, durdu: ilkDurdu = false }) {
  const sec = SEC[key];
  const svg = dy.querySelector('.dy__svg');
  const dar = matchMedia('(max-width: 820px)');
  let R0, durdu = ilkDurdu, gorunur = false, raf = 0, son = 0, bekRaf = 0, sokuldu = false;

  function n(id) {
    const l = dy.querySelectorAll('[data-n="' + id + '"]');
    for (let i = 0; i < l.length; i++) if (l[i].offsetParent !== null) return l[i];
    return l[0];
  }
  function c(id) {
    return dy.querySelector('[data-c="' + id + '"]');
  }
  function kut(el) {
    const r = el.getBoundingClientRect(), x = r.left - R0.left, y = r.top - R0.top;
    return { l: x, t: y, r: x + r.width, b: y + r.height, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
  }
  function P(el, s, k) {
    const b = kut(el);
    k = k == null ? 0.5 : k;
    return s === 'l' ? [b.l, b.t + b.h * k] : s === 'r' ? [b.r, b.t + b.h * k] : s === 't' ? [b.l + b.w * k, b.t] : [b.l + b.w * k, b.b];
  }

  /* sade telefon omurgası: telefon ve Hermes yan yana, şeritler üstte (gelen) ve altta (giden), model Hermes'in üstünde */
  function omurga() {
    const tel = n('tel'), her = n('her'), mod = n('mod'), cu = c('u'), cd = c('d'), o = [];
    const t1 = P(tel, 't', 0.5), u1 = P(cu, 'l'), u2 = P(cu, 'r'), h1 = P(her, 't', 0.42);
    o.push({ ad: 'u', d: 'M' + f(t1) + bez(t1, 't', u1, 'l', 30) + 'L' + f(u2) + bez(u2, 'r', h1, 't', 30), kat: 'a', k: tel, h: her, cip: cu, tur: A.u });
    const h2 = P(her, 'b', 0.3), d1 = P(cd, 't', 0.8), d2 = P(cd, 'l'), t2 = P(tel, 'b', 0.8);
    o.push({ ad: 'd', d: 'M' + f(h2) + bez(h2, 'b', d1, 't', 20) + 'L' + f(d2) + bez(d2, 'l', t2, 'b', 26), kat: 'a', k: her, h: tel, cip: cd, tur: A.d });
    const h3 = P(her, 't', 0.86), m1 = P(mod, 'b', Math.min(0.8, Math.max(0.2, (h3[0] - kut(mod).l) / kut(mod).w)));
    o.push({ ad: 'hm', d: 'M' + f(h3) + bez(h3, 't', m1, 'b', 16), kat: 'a', yon: 'iki', k: her, h: mod });
    return o;
  }

  /* Kenar: d (yol), yon ileri|iki, kat a|b, k (kaynak düğüm), h (hedef düğüm), cip, tur */
  const KENAR = {
    a() {
      const tel = n('tel'), her = n('her'), mod = n('mod'), mcp = n('mcp'), cli = n('cli'), kapi = n('kapi'), web = n('web'), cu = c('u'), cd = c('d'), o = [];
      const svc = ['dep', 'ses', 'lmp', 'yt', 'git', 'play', 'appst'];
      if (!dar.matches) {
        const u1 = P(cu, 'l'), u2 = P(cu, 'r'), d1 = P(cd, 'r'), d2 = P(cd, 'l'), t1 = P(tel, 'r', 0.3), t2 = P(tel, 'r', 0.7), h1 = P(her, 'l', 0.3), h2 = P(her, 'l', 0.62);
        o.push({ ad: 'u', d: 'M' + f(t1) + bez(t1, 'r', u1, 'l') + 'L' + f(u2) + bez(u2, 'r', h1, 'l'), kat: 'a', k: tel, h: her, cip: cu, tur: A.u });
        o.push({ ad: 'd', d: 'M' + f(h2) + bez(h2, 'l', d1, 'r') + 'L' + f(d2) + bez(d2, 'l', t2, 'r'), kat: 'a', k: her, h: tel, cip: cd, tur: A.d });
        const t3 = P(tel, 'b', 0.7), k1 = P(kapi, 'l');
        o.push({ ad: 'e', d: 'M' + f(t3) + bez(t3, 'b', k1, 'l', 90), kat: 'b', k: tel, h: kapi });
        const k2 = P(kapi, 'b'), w1 = P(web, 'l');
        o.push({ ad: 'k', d: 'M' + f(k2) + bez(k2, 'b', w1, 'l', 60), kat: 'b', yon: 'iki', k: kapi, h: web });
        const hb = P(her, 'b'), wt = P(web, 't');
        o.push({ ad: 'hw', d: 'M' + f(hb) + bez(hb, 'b', wt, 't'), kat: 'b', yon: 'iki', k: her, h: web });
        const hr = P(her, 'r', 0.3), ml = P(mod, 'l');
        o.push({ ad: 'hm', d: 'M' + f(hr) + bez(hr, 'r', ml, 'l'), kat: 'a', yon: 'iki', k: her, h: mod });
        /* Hermes bağlantıları: MCP (genel katman, modelin altında) ve CLI'lar (kurulum katmanının ilk satırı, Web'in sağında) */
        const hr2 = P(her, 'r', 0.72), cl = P(mcp, 'l');
        o.push({ ad: 'hmcp', d: 'M' + f(hr2) + bez(hr2, 'r', cl, 'l'), kat: 'a', yon: 'iki', k: her, h: mcp });
        const hb2 = P(her, 'b', 0.86), ct = P(cli, 't');
        o.push({ ad: 'cli', d: 'M' + f(hb2) + bez(hb2, 'b', ct, 't'), kat: 'b', yon: 'iki', k: her, h: cli });
        const wb = P(web, 'b');
        svc.forEach(id => {
          const e = n(id), et = P(e, 't');
          o.push({ ad: id, d: 'M' + f(wb) + bez(wb, 'b', et, 't', 60), kat: 'b', k: web, h: e });
        });
        const lb = P(n('lmp'), 'b'), pt = P(n('plat'), 't', 0.12);
        o.push({ ad: 'pl', d: 'M' + f(lb) + bez(lb, 'b', pt, 't', 40), kat: 'b', k: n('lmp'), h: n('plat') });
        const db = P(n('dep'), 'b'), vt = P(n('drive'), 't');
        o.push({ ad: 'dr', d: 'M' + f(db) + bez(db, 'b', vt, 't', 30), kat: 'b', k: n('dep'), h: n('drive') });
      } else {
        const R = kut(dy), sag = R.w - 6;
        const cU = kut(cu), cD = kut(cd), T = kut(tel), H = kut(her);
        const a1 = [cU.cx, T.b], a2 = [cU.cx, cU.t], a3 = [cU.cx, cU.b], hx = Math.min(Math.max(cU.cx, H.l + 24), H.r - 24), a4 = [hx, H.t];
        o.push({ ad: 'u', d: 'M' + f(a1) + bez(a1, 'b', a2, 't', 18) + 'L' + f(a3) + bez(a3, 'b', a4, 't', 30), kat: 'a', k: tel, h: her, cip: cu, tur: A.u });
        const b1 = [H.r - 22, H.t], b2 = [cD.cx, cD.b], b3 = [cD.cx, cD.t], b4 = [Math.min(cD.cx, T.r - 24), T.b];
        o.push({ ad: 'd', d: 'M' + f(b1) + bez(b1, 't', b2, 'b', 30) + 'L' + f(b3) + bez(b3, 't', b4, 'b', 18), kat: 'a', k: her, h: tel, cip: cd, tur: A.d });
        const K = kut(kapi), W = kut(web);
        /* kapı dar ekranda grubun başında (sağda): telefon sağ kenar kanalından iner */
        o.push({ ad: 'e', d: 'M' + f([T.r, T.cy]) + orto([[T.r, T.cy], [sag, T.cy], [sag, K.cy], [K.r, K.cy]]), kat: 'b', k: tel, h: kapi });
        const k1 = [K.l + K.w * 0.3, K.b], k2 = [W.l + W.w * 0.8, W.t];
        o.push({ ad: 'k', d: 'M' + f(k1) + bez(k1, 'b', k2, 't', 22), kat: 'b', yon: 'iki', k: kapi, h: web });
        const hx2 = Math.max(H.l + 40, W.l + 26), p1 = [hx2, H.b], p2 = [hx2, W.t];
        o.push({ ad: 'hw', d: 'M' + f(p1) + 'L' + f(p2), kat: 'b', yon: 'iki', k: her, h: web });
        /* dar ekranda model ve MCP Hermes'in hemen sağında (12 px aralık): model kısa düz yol; MCP Hermes'in altına taşarsa dik yol */
        const M = kut(mod), Mc = kut(mcp), xm = (H.r + Mc.l) / 2, ym = Math.min(Mc.cy, H.b - 14);
        o.push({ ad: 'hm', d: 'M' + f([H.r, M.cy]) + 'L' + f([M.l, M.cy]), kat: 'a', yon: 'iki', k: her, h: mod });
        o.push({ ad: 'hmcp', d: 'M' + f([H.r, ym]) + (ym < Mc.cy - 1 ? orto([[H.r, ym], [xm, ym], [xm, Mc.cy], [Mc.l, Mc.cy]], 5) : 'L' + f([Mc.l, ym])), kat: 'a', yon: 'iki', k: her, h: mcp });
        const G = kut(dy.querySelector('.grp')), gx = G.l + 16;
        svc.forEach(id => {
          const e = n(id), E2 = kut(e);
          o.push({ ad: id, d: 'M' + f([W.l, W.cy]) + orto([[W.l, W.cy], [gx, W.cy], [gx, E2.cy], [E2.l, E2.cy]], 10), kat: 'b', k: web, h: e });
        });
        const Lm = kut(n('lmp')), Pl = kut(n('plat')), x1 = Lm.l + 16;
        o.push({ ad: 'pl', d: 'M' + f([x1, Lm.b]) + orto([[x1, Lm.b], [x1, Pl.t + 22], [Pl.l, Pl.t + 22]], 10), kat: 'b', k: n('lmp'), h: n('plat') });
        const Dp = kut(n('dep')), Dv = kut(n('drive')), x2 = Dp.l + 16;
        o.push({ ad: 'dr', d: 'M' + f([x2, Dp.b]) + orto([[x2, Dp.b], [x2, Dv.cy], [Dv.l, Dv.cy]], 10), kat: 'b', k: n('dep'), h: n('drive') });
        /* CLI'lar dar ekranda grubun sonunda: Hermes'in altından grubun üstüne iner, sağ kenar kanalından (kapı yolunun 9 px içi) CLI'ya */
        const C = kut(cli), s2 = sag - 9, y0 = G.t - 7, x0 = H.r - 24;
        o.push({ ad: 'cli', d: 'M' + f([x0, H.b]) + orto([[x0, H.b], [x0, y0], [s2, y0], [s2, C.cy], [C.r, C.cy]], 10), kat: 'b', yon: 'iki', k: her, h: cli });
      }
      return o;
    },
    /* sade telefon: omurga + küme (kapı, Web, tek servis düğümü) */
    m1() {
      const o = omurga(), tel = n('tel'), her = n('her'), kapi = n('kapi'), web = n('web'), svc = n('svc');
      const t3 = P(tel, 'b', 0.3), k1 = P(kapi, 't', 0.35);
      o.push({ ad: 'e', d: 'M' + f(t3) + bez(t3, 'b', k1, 't', 90), kat: 'b', k: tel, h: kapi });
      const kr = P(kapi, 'r'), wl = P(web, 'l');
      o.push({ ad: 'k', d: 'M' + f(kr) + 'L' + f(wl), kat: 'b', yon: 'iki', k: kapi, h: web });
      const h4 = P(her, 'b', 0.82), w1 = P(web, 't', 0.65);
      o.push({ ad: 'hw', d: 'M' + f(h4) + bez(h4, 'b', w1, 't', 90), kat: 'b', yon: 'iki', k: her, h: web });
      const wb = P(web, 'b', 0.5), st = P(svc, 't', 0.75);
      o.push({ ad: 'svc', d: 'M' + f(wb) + bez(wb, 'b', st, 't', 12), kat: 'b', k: web, h: svc });
      return o;
    }
  };

  /* sabit tohumlu rastgele: kareler her çekimde benzer çıksın */
  let tohum = 7;
  function rnd() {
    tohum = (tohum * 16807) % 2147483647;
    return (tohum - 1) / 2147483646;
  }
  let kenar = [];
  const hzm = [];

  function ciz() {
    if (sokuldu) return;
    R0 = dy.getBoundingClientRect();
    if (!R0.width) return;
    const ks = KENAR[key]();
    let s = '';
    ks.forEach(k => {
      s += '<path class="yol' + (k.kat === 'b' ? ' yol--b' : '') + '" data-k="' + k.ad + '" d="' + k.d + '"/>';
    });
    svg.setAttribute('viewBox', '0 0 ' + R0.width.toFixed(1) + ' ' + R0.height.toFixed(1));
    svg.innerHTML = s;
    /* tuvalde n8n portları: yolun iki ucunda küçük halka */
    let g = '';
    if (key === 'a') {
      ks.forEach(k => {
        const p = svg.querySelector('[data-k="' + k.ad + '"]'), L = p.getTotalLength(), a = p.getPointAtLength(0), b = p.getPointAtLength(L);
        const cl = 'port' + (k.kat === 'b' ? ' port--b' : '');
        g += '<circle class="' + cl + '" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="3.6"/><circle class="' + cl + '" cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="3.6"/>';
      });
    }
    svg.insertAdjacentHTML('beforeend', g);
    kenar = ks.map(k => {
      const p = svg.querySelector('[data-k="' + k.ad + '"]'), L = p.getTotalLength(), N = Math.max(24, Math.ceil(L / 8)), pt = [];
      for (let i = 0; i <= N; i++) {
        const q = p.getPointAtLength((L * i) / N);
        pt.push(q.x, q.y);
      }
      k.L = L;
      k.N = N;
      k.pt = pt;
      return k;
    });
    if (az) return;
    if (!hzm.length) kur();
    else hzm.forEach(h => (h.k = kenar[h.i]));
    hzCiz();
  }
  /* hüzmeler: her biri yolun aynı d'siyle ikinci bir path, kalınlığı yolun kalınlığı; svg her çizimde yenilendiği için öğeler de
     yeniden kurulur, durum (t, bekle) korunur */
  function hzCiz() {
    const yp = svg.querySelector('.yol'), gen = yp ? parseFloat(getComputedStyle(yp).strokeWidth) || 2 : 2;
    let defs = '', g = '';
    hzm.forEach((h, i) => {
      const k = h.k, id = 'hg-' + key + '-' + i, b = k.kat === 'b';
      h.w = Math.min(0.6, (sec.boy || 90) / k.L);
      defs += '<linearGradient id="' + id + '" class="hg' + (b ? ' hg--b' : '') + '" gradientUnits="userSpaceOnUse"><stop offset="0" class="hs0"/><stop offset=".55" class="hs1"/><stop offset=".84" class="hs2"/><stop offset="1" class="hs3"/></linearGradient>';
      g += '<path class="hb' + (b ? ' hb--b' : '') + '" pathLength="1" d="' + k.d + '" stroke="url(#' + id + ')" stroke-width="' + gen + '" stroke-dasharray="' + h.w.toFixed(4) + ' 3" stroke-dashoffset="2" opacity="0"/>';
    });
    svg.insertAdjacentHTML('beforeend', '<defs>' + defs + '</defs><g class="hbk">' + g + '</g>');
    const els = svg.querySelectorAll('.hb'), grs = svg.querySelectorAll('.hg');
    hzm.forEach((h, i) => {
      h.el = els[i];
      h.gr = grs[i];
      if (h.bekle <= 0) {
        h.el.setAttribute('opacity', '1');
        koy(h);
      }
    });
  }
  function yer(k, t) {
    const x = t * k.N, i = Math.min(k.N - 1, Math.floor(x)), r = x - i, p = k.pt, a = i * 2, b = a + 2;
    return [p[a] + (p[b] - p[a]) * r, p[a + 1] + (p[b + 1] - p[a + 1]) * r];
  }
  /* pencereyi t anına yerleştirir: baş = min(t,1), kuyruk = max(t-w,0); ters yönde ikisi aynalanır */
  function koy(h) {
    const k = h.k, bas = Math.min(1, h.t), kuy = Math.max(0, h.t - h.w), pb = h.ters ? 1 - bas : bas, pk = h.ters ? 1 - kuy : kuy;
    const B = yer(k, pb), K = yer(k, pk), gr = h.gr;
    h.el.setAttribute('stroke-dashoffset', (h.ters ? h.t - 1 : h.w - h.t).toFixed(4));
    gr.setAttribute('x1', K[0].toFixed(1));
    gr.setAttribute('y1', K[1].toFixed(1));
    gr.setAttribute('x2', B[0].toFixed(1));
    gr.setAttribute('y2', B[1].toFixed(1));
  }
  function kur() {
    kenar.forEach((k, i) => {
      const adet = sec.adet + (sec.mobil && k.tur ? 1 : 0);
      for (let j = 0; j < adet; j++) {
        /* masaüstünde ilk hüzme şeridin türünü taşır; telefonda ek hüzmeler tür taşımaz, yalnız akış */
        const bek = sec.mobil ? (j * 0.9 + rnd() * 0.6) * (sec.yavas || 1) : k.ad === 'd' ? 0.3 : k.ad === 'u' ? 1.6 : 0.4 + rnd() * 2.6;
        hzm.push({ i, k, el: null, gr: null, w: 0.2, vardi: false, t: 0, ters: sec.mobil && k.yon === 'iki' && j % 2 === 1, tur: -1, ek: j > 0, bekle: bek });
      }
    });
  }
  const zaman = new Set();
  function vur(el) {
    if (!el) return;
    el.classList.add('vurdu');
    clearTimeout(el._wwVur);
    zaman.add(el);
    el._wwVur = setTimeout(() => el.classList.remove('vurdu'), 650);
  }
  /* şerit etiketi: taşınan tür vurgulanır */
  function cipYak(k, ix) {
    if (!k.cip) return;
    const sp = k.cip.children;
    for (let i = 0; i < k.tur.length; i++) sp[i].classList.toggle('on', i === ix);
  }
  const HIZ = sec.hiz || 150;
  function adim(now) {
    const dt = Math.min(0.05, (now - son) / 1000);
    son = now;
    for (let i = 0; i < hzm.length; i++) {
      const h = hzm[i], k = h.k;
      if (h.bekle > 0) {
        h.bekle -= dt;
        if (h.bekle <= 0) {
          h.t = 0;
          h.el.setAttribute('opacity', '1');
          if (k.tur && !h.ek) {
            h.tur = (h.tur + 1) % k.tur.length;
            cipYak(k, h.tur);
          }
        } else continue;
      }
      h.t += (dt * HIZ) / Math.max(60, k.L);
      /* baş hedefe varınca düğüm yanar; pencere kuyruğu da yolun sonuna girene kadar akar (t = 1 + w), uçta kesilmez */
      if (h.t >= 1 && !h.vardi) {
        h.vardi = true;
        vur(h.ters ? k.k : k.h);
      }
      if (h.t >= 1 + h.w) {
        h.vardi = false;
        if (k.yon === 'iki') h.ters = !h.ters;
        h.bekle = sec.mobil
          ? (h.ek ? 0.15 + rnd() * 0.5 : k.tur ? 1.1 : 0.2 + rnd() * 0.7) * (sec.yavas || 1)
          : k.ad === 'd' ? 1.6 : k.ad === 'u' ? 2.2 : 0.8 + rnd() * 2.8;
        h.el.setAttribute('opacity', '0');
        continue;
      }
      koy(h);
    }
    raf = requestAnimationFrame(adim);
  }
  function calis() {
    const olmali = !sokuldu && !az && gorunur && !durdu && document.visibilityState === 'visible';
    if (olmali && !raf) {
      son = performance.now();
      raf = requestAnimationFrame(adim);
    } else if (!olmali && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  ciz();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ciz);
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(bekRaf);
    bekRaf = requestAnimationFrame(ciz);
  });
  ro.observe(dy);
  dar.addEventListener('change', ciz);
  let io = null;
  if (!az) {
    io = new IntersectionObserver(
      e => {
        gorunur = e[e.length - 1].isIntersecting;
        calis();
      },
      { rootMargin: '60px 0px' }
    );
    io.observe(dy);
    document.addEventListener('visibilitychange', calis);
  }

  return {
    durdur(v) {
      durdu = v;
      calis();
    },
    sok() {
      sokuldu = true;
      calis();
      cancelAnimationFrame(bekRaf);
      ro.disconnect();
      if (io) io.disconnect();
      dar.removeEventListener('change', ciz);
      document.removeEventListener('visibilitychange', calis);
      zaman.forEach(el => clearTimeout(el._wwVur));
    }
  };
}
