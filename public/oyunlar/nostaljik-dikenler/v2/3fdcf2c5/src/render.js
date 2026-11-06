// Çizim katmanı. Oyun durumunu YALNIZ okur. Katmanlar (arkadan öne, §6.1):
//  1) ekran uzayı arka plan, çağ atlasından: gökyüzü (en arka, hafif dikey kayma, ayna döşeme),
//     uzak katman (yalnız HD, soluk), büyük yapılar (uzun ağaç solda / satıcı adası sağda; dekor,
//     hitbox yok, ekran kenarına taşar, ortayı kapatmaz, atmosferik soluk; kendi parallax hızında).
//     Çağ atlası yoksa Faz A gradyan + yıldız.
//  2) kamera dönüşümü (cam.apply): oyun alanı kenarları, platformlar (üretilmiş parçalar), top,
//     tavan dişleri (uçlar ölümcül noktaya hizalı), ölüm çizgisi altı karartma (yalnız x0.5)
//  3) HUD (sarsılmaz, ekran uzayı): skor, EN İYİ, ses düğmesi, kamera etiketi, dokunma ipucu,
//     oyun bitti paneli
// Çağ geçişi (era.prev != null): eski çağ tam, yeni çağ alfa t ile üstüne (arka katman); platform
// ve dikenler (1-t) / t ile çizilir. 0.5 sn geçici çapraz geçiş, Faz D'de kesik geçiş.
import * as K from './config.js';
import { spikeTipX, spikeTipY } from './spikes.js';
import { shakeOffset, landingDims, fallDims, rollFrame } from './juice.js';

const SPIKE_TIP_PX = 2, SPIKE_NECK_PX = 4, SPIKE_INSET = 1;
// Kalp yedeği (atlas 'kalp' karesi yoksa): elle piksellenmiş 9x8. o kontur, h ışık, r gövde, d gölge.
const HEART_PX = [
  '.oo...oo.',
  'ohho.orro',
  'ohrrorrro',
  'orrrrrrdo',
  '.orrrrdo.',
  '..orrdo..',
  '...odo...',
  '....o....'
];
const HEART_PAL = { o: '#2a0a12', h: '#ffd0d6', r: '#e8263f', d: '#8c1028' };
const HEART_DIM = { o: '#55505e', h: null, r: '#2a2733', d: '#2a2733' }; // boş can yuvası
const STAR_COUNT = 40, STAR_PARALLAX = 0.3;
const LAND_FRAME_MS = 40; // önceden çizilmiş iniş karesi süresi (4 tozlu + 2 ezilme = 240 ms)
// Büyük yapılar: ekranda görünen genişlik en çok 112 px (360 px ekranın %31i); aralık STRUCT_GAP_SCREENS (aşağıda).
const STRUCT_VISIBLE_MAX = 112;

export function createRenderer(p, ctx) {
  const { game, cam, assets, audio, isTouch, era } = ctx;
  const R = { bg: null, stars: [], drawCount: 0, lastVisibleRows: 0, structs: [], lastDist: 0, nextKind: 0 };

  R.init = function () {
    // Dikey gradyan bir kez üretilir (her kare yeniden hesaplanmaz).
    const g = p.createGraphics(K.LOGICAL_W, K.LOGICAL_H);
    g.pixelDensity(1);
    g.noStroke();
    const lo = p.color(K.PAL.bgLo), hi = p.color(K.PAL.bgHi);
    for (let y = 0; y < K.LOGICAL_H; y += 4) {
      g.fill(p.lerpColor(hi, lo, Math.pow(y / K.LOGICAL_H, 0.8)));
      g.rect(0, y, K.LOGICAL_W, 4);
    }
    R.bg = g;
    for (let i = 0; i < STAR_COUNT; i++) {
      R.stars.push({ x: Math.random() * K.LOGICAL_W, y: Math.random() * K.LOGICAL_H, s: Math.random() < 0.2 ? 2 : 1 });
    }
  };

  function drawBackground(s, dt) {
    p.image(R.bg, 0, 0);
    p.noStroke();
    p.fill(K.PAL.star);
    const speed = s.gameState === 'playing' ? s.scrollSpeed * STAR_PARALLAX * cam.renderScale() : 0;
    for (const st of R.stars) {
      st.y -= speed * dt;
      if (st.y < -2) { st.y += K.LOGICAL_H + 4; st.x = Math.random() * K.LOGICAL_W; }
      p.rect(Math.round(st.x), Math.round(st.y), st.s, st.s);
    }
  }

  // ---- Çağ arka katmanları (ekran uzayı) ----
  // Dünya kayma mesafesi (px): skor ile birebir (SCORE_PER_PX), yeniden başlatmada 0.
  const worldDist = s => s.score / K.SCORE_PER_PX;
  let lcg = 7;
  const rnd = () => ((lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0) / 4294967296);

  function structSize(e, kind) {
    const E = assets.eraAtlas(e), st = E && E.structByKind[kind];
    if (!st) return null;
    const f = E.frames[st.frame], k = st.k || 1;
    return { E, st, f, W: f.w * k, H: f.h * k };
  }

  R.resetLayers = function () {
    lcg = 7;
    R.structs = [];
    R.structEra = null;
    R.lastDist = 0;
  };

  // Büyük dekor aralığı (Organizer, sanat-3 düzeltme): aynı büyük dekor ekranda en fazla 1 kez; ardışık iki
  // büyük dekor (ada, ağaç tacı, ağaç kökü) arası en az STRUCT_GAP_SCREENS ekran yüksekliği. Hepsi aynı
  // structDrift ile kaydığı için aralık ekran uzayında sabit kalır.
  const STRUCT_GAP_SCREENS = 1.5, STRUCT_GAP_JITTER = 0.5, STRUCT_FIRST_Y = 380;
  function treeBlocks(e, s, drawnOnly) { // ağaç tacı ve kökü: ekran uzayı [üst, alt]
    const E = assets.eraAtlas(e), L = E && R.treeLayout(E, e, s);
    const out = [];
    if (L) {
      out.push([L.top, L.top + L.ch]);
      if (L.n !== Infinity) out.push([L.rootsTop, L.rootsTop + L.rh]);
    }
    if (drawnOnly) return out; // ekranda gerçekten çizilenler (sonraki çağın tacı çağ değişince çizilir)
    // Sonraki çağın tacı çağ başında TREE_TOP0'da belirir: şimdiki kayma hızıyla oraya izdüşürülür ki
    // geçişte ekranda duran bir ada ile taç arasında da aralık korunsun.
    const En = assets.eraAtlas(e + 1), Tn = En && En.json.layers.tree;
    if (E && Tn) {
      const d0n = R.eraSpan(e + 1).d0, dist = worldDist(s), drift = E.json.layers.structDrift || 0.4;
      if (d0n > dist) { const top = TREE_TOP0 + (d0n - dist) * drift; out.push([top, top + En.frames[Tn.crown].h]); }
    }
    return out;
  }
  function clearOf(y, H, blocks) { // y'yi bloklardan STRUCT_GAP uzak olana dek aşağı it
    const G = STRUCT_GAP_SCREENS * K.LOGICAL_H;
    for (let moved = true, guard = 0; moved && guard < 8; guard++) {
      moved = false;
      for (const [a, b] of blocks) if (y < b + G && y + H > a - G) { y = b + G; moved = true; }
    }
    return y;
  }
  function structKinds(E) {
    return Object.keys(E.structByKind || {}).filter(k => !(E.json.layers.tree && k === 'agac')); // v3: ağaç ayrı katman
  }

  // Büyük yapılar kendi parallax hızında yukarı kayar; çağın türleri sırayla gelir (v3: yalnız ada).
  function updateStructs(s, e) {
    const E = assets.eraAtlas(e);
    if (!E) return;
    const dist = worldDist(s);
    let dd = dist - R.lastDist;
    if (dd < 0) { R.resetLayers(); dd = 0; }
    R.lastDist = dist;
    const drift = E.json.layers.structDrift || 0.4;
    for (const it of R.structs) it.y -= dd * drift;
    while (R.structs.length && R.structs[0].y < -520) R.structs.shift();
    const kinds = structKinds(E);
    if (!kinds.length) return;
    const blocks = treeBlocks(e, s);
    if (R.structEra !== e) { // çağ değişti: henüz görünmeyen yapılar yeni çağın ağacına göre yeniden yerleşir
      R.structEra = e;
      for (const it of R.structs) {
        if (it.y <= K.LOGICAL_H) continue;
        const sz = structSize(e, it.kind) || structSize(e, kinds[0]);
        if (!E.structByKind[it.kind]) it.kind = kinds[0];
        it.y = clearOf(it.y, sz ? sz.H : 300, blocks);
      }
    }
    for (let guard = 0; guard < 4; guard++) {
      const last = R.structs[R.structs.length - 1];
      if (last && last.y > K.LOGICAL_H) break; // bir sonraki zaten sırada (ekran altında)
      const kind = !last ? kinds[0] : kinds[(kinds.indexOf(last.kind) + 1) % kinds.length];
      const sz = structSize(e, kind), H = sz ? sz.H : 300;
      const lsz = last && structSize(e, last.kind), bottom = last ? last.y + (lsz ? lsz.H : 300) : 0;
      let y = !last ? STRUCT_FIRST_Y : bottom + K.LOGICAL_H * (STRUCT_GAP_SCREENS + rnd() * STRUCT_GAP_JITTER);
      y = clearOf(y, H, blocks);
      R.structs.push({ kind, y });
    }
  }
  R.updateStructs = updateStructs;
  R.structBlocks = (e, s, drawnOnly) => treeBlocks(e, s, drawnOnly);

  // Uzun ağaç (sanat v3, Fikir 28a/30-1 B seçeneği; Organizer düzeltmesi): gövde ekranın SOL kenarında,
  // YARISI ekran dışında (gövde ortası x=0); görünen gövde SIDE_CLEAR şeridinde kalır, platformlar bu
  // şeride hiç girmez (world.js), yani platform gövdenin üstüne hizalanmaz. Taç ve kök aynı kenarda.
  // Oyun katmanının arkasında ve sönük (TREE_ALPHA). Taç çağın başında görünür, gövde dikişsiz dilim
  // tekrarıyla ekran altına KESİNTİSİZ akar, kökler yalnız çağın sonuna varınca alttan girer. Son çağda
  // (HD) kök yok, gövde sürer. Dekor katmanı: kendi parallax hızında (structDrift), hitbox yok.
  const TREE_TOP0 = 72, TREE_ALPHA = 0.6;
  const treeX = T => -Math.round((T.trunkX[0] + T.trunkX[1]) / 2); // gövde ortası ekran kenarında
  R.eraSpan = function (e) { // çağın başladığı/bittiği dünya mesafesi (px); era.start'a göre
    // era.locked (yalnız test/video kaydı: çağ sabit) iken çağ bitmez: ağaç da bitmez (kök gelmez),
    // yoksa kök çağ eşiğinden sonra yukarı kayıp ağacı havada bırakır.
    const st = era ? era.start : 0, i = e - st, th = K.ERA_THRESHOLDS, locked = !!(era && era.locked);
    const d0 = i > 0 ? th[i - 1] / K.SCORE_PER_PX : 0;
    const d1 = !locked && i >= 0 && i < th.length && e < K.ERA_COUNT - 1 ? th[i] / K.SCORE_PER_PX : null;
    return { d0, d1 };
  };
  R.treeLayout = function (E, e, s) {
    const T = E.json.layers.tree;
    if (!T) return null;
    const drift = E.json.layers.structDrift || 0.4, span = R.eraSpan(e);
    const top = TREE_TOP0 - (worldDist(s) - span.d0) * drift;
    const ch = E.frames[T.crown].h, P = E.frames[T.trunk].h, rh = E.frames[T.roots].h;
    let n = Infinity; // gövde dilimi sayısı: kök tabanı çağ sonunda ekran altına (>= 640) otursun; yukarı
    // yuvarlanır (Math.round kök tabanını 640'ın üstünde bırakıp ağacı son karelerde havada gösterebiliyordu)
    if (span.d1 != null) n = Math.max(1, Math.ceil((K.LOGICAL_H - TREE_TOP0 - ch - rh + (span.d1 - span.d0) * drift) / P));
    return { T, top, ch, P, rh, n, rootsTop: top + ch + n * P, x: treeX(T), // teslim ağacı sol kenar için çizili
             trunkVis: [Math.max(0, treeX(T) + T.trunkX[0]), treeX(T) + T.trunkX[1]] }; // ekranda görünen gövde
  };
  function drawTree(E, s, e) {
    const L = R.treeLayout(E, e, s);
    if (!L) return;
    const c = p.drawingContext, x = L.x, sp = E.sprites, a0 = c.globalAlpha;
    c.globalAlpha = a0 * TREE_ALPHA;
    const top = Math.round(L.top);
    if (top + L.ch > 0 && top < K.LOGICAL_H) c.drawImage(sp[L.T.crown], x, top);
    let y = top + L.ch, k = 0;
    if (y < -L.P) { k = Math.min(L.n, Math.floor((-L.P - y) / L.P) + 1); y += k * L.P; } // ekran üstündeki dilimleri atla
    for (; k < L.n && y < K.LOGICAL_H; k++, y += L.P) c.drawImage(sp[L.T.trunk], x, y);
    const ry = Math.round(L.rootsTop);
    if (L.n !== Infinity && k >= L.n && ry < K.LOGICAL_H && ry + L.rh > 0) c.drawImage(sp[L.T.roots], x, ry);
    c.globalAlpha = a0;
  }

  function drawSky(E, s) {
    const L = E.json.layers.sky, f = E.frames[L.frame], k = L.k;
    const W = f.w * k, H = f.h * k, x0 = Math.round((K.LOGICAL_W - W) / 2), c = p.drawingContext;
    if (!L.drift) { // kayma yok (8-bit, §0.1 tek düz katman): üst hizalı sabit
      c.drawImage(E.sprites[L.frame], x0, 0, W, H);
      return;
    }
    const off = Math.floor(worldDist(s) * L.drift) % (2 * H);
    for (let j = Math.floor(off / H), y = j * H - off; y < K.LOGICAL_H; j++, y += H) {
      c.drawImage(j % 2 === 0 ? E.sprites[L.frame] : E.skyFlip, x0, y, W, H);
    }
  }

  function drawFar(E, s) {
    const L = E.json.layers.far;
    if (!L) return;
    const f = E.frames[L.frame], k = L.k, W = f.w * k, H = f.h * k, c = p.drawingContext;
    const x0 = Math.round((K.LOGICAL_W - W) / 2), off = Math.floor(worldDist(s) * L.drift) % H;
    for (let y = -off; y < K.LOGICAL_H; y += H) c.drawImage(E.sprites[L.frame], x0, y, W, H);
  }

  function drawStructs(e) {
    const c = p.drawingContext;
    for (const it of R.structs) {
      const sz = structSize(e, it.kind);
      if (!sz) continue;
      const vis = Math.min(Math.round(sz.W * 0.6), STRUCT_VISIBLE_MAX);
      const x = sz.st.side === 'sol' ? vis - sz.W : K.LOGICAL_W - vis, y = Math.round(it.y);
      if (y > K.LOGICAL_H || y + sz.H < 0) continue;
      c.drawImage(sz.E.sprites[sz.st.frame], x, y, sz.W, sz.H);
    }
  }

  function drawEraBack(s, e, alpha) {
    const E = assets.eraAtlas(e);
    if (!E) return false;
    const c = p.drawingContext;
    c.globalAlpha = alpha;
    drawSky(E, s);
    drawFar(E, s);
    drawTree(E, s, e);
    drawStructs(e);
    c.globalAlpha = 1;
    return true;
  }

  function drawPlayfieldBounds(view) {
    // Yalnız uzaklaşınca: oyun alanı dışı (yanlar) karartılır, wrap kapısı ince çizgiyle okunur.
    if (view.x0 >= -0.5) return;
    p.noStroke();
    p.fill(0, 0, 0, 120);
    p.rect(view.x0, 0, -view.x0, view.y1);
    p.rect(K.PLAY_W, 0, view.x1 - K.PLAY_W, view.y1);
    p.fill(255, 255, 255, 28);
    p.rect(-1, 0, 1, view.y1);
    p.rect(K.PLAY_W, 0, 1, view.y1);
  }

  function drawPlatformProc(pl, x, y, w) {
    p.fill(K.PAL.platMain); p.rect(x, y, w, pl.h);
    p.fill(K.PAL.platLight); p.rect(x, y, w, 2);
    p.fill(K.PAL.platShadow); p.rect(x, y + pl.h - 2, w, 2);
  }

  function drawPlatforms(s, view, e, alpha, countRowsToo) {
    p.noStroke();
    p.drawingContext.globalAlpha = alpha == null ? 1 : alpha;
    let rows = new Set();
    for (const pl of s.platforms) {
      if (pl.y > view.y1 + 16 || pl.y < -16) continue;
      const x = Math.round(pl.x), y = Math.round(pl.y), w = Math.round(pl.w);
      if (!assets.drawPlatform(pl, x, y, w, e)) drawPlatformProc(pl, x, y, w);
      if (pl.kind === 'moving') { // hareketli: iki uçta parlak ray işareti (v1)
        p.fill(K.PAL.ballLight);
        p.rect(x + 2, y + 3, 1, 3); p.rect(x + w - 3, y + 3, 1, 3);
      }
      if (pl.y + pl.h > 0 && pl.y < view.y1) rows.add(Math.round(pl.y));
    }
    p.drawingContext.globalAlpha = 1;
    if (countRowsToo !== false) R.lastVisibleRows = countRows(rows);
  }

  // Aynı y'deki (±PLATFORM_H) platformlar tek satır sayılır.
  function countRows(set) {
    const ys = [...set].sort((a, b) => a - b);
    let n = 0, last = -1e9;
    for (const y of ys) { if (y - last > K.PLATFORM_H) { n++; last = y; } }
    return n;
  }

  // Top kamera dönüşümünün DIŞINDA, ekran uzayında tam sayı konumla çizilir: x0.5'te sprite'ı
  // kesirli ölçekte en-yakın-komşu ile küçültmek konturu/ışık noktasını bozar (§2.2: top her
  // koşulda en net çizilen nesne). renderScale 1 iken atlas sprite'ı 1:1.
  // His: önceden çizilmiş yuvarlanma kareleri (atlas 'top_r0..N', yoksa 'ball'; döndürme yok),
  // alanı koruyan ezilme (iniş, alt hizalı) / esneme (hızlı düşüş, ortalı), hız izi.
  function ballSprite(s) {
    const e = era ? era.cur : null, n = assets.rollCount ? assets.rollCount(e) : 0;
    const B = preDrawn(e), b = s.ball, L = s.lastLanding;
    if (B) { // önceden çizilmiş iniş/esneme kareleri (sanat v3)
      if (b.grounded && L) {
        const seq = L.vy >= 300 && B.dust.length ? B.dust.concat(B.squash.slice(1)) : L.vy >= 120 ? B.squash.slice(1) : [];
        const i = Math.floor((s.clockMs - L.t) / LAND_FRAME_MS);
        if (i >= 0 && i < seq.length) return seq[i];
      }
      if (!b.grounded && B.stretch && b.vy >= 260) return B.stretch;
    }
    return n > 1 ? 'top_r' + rollFrame(s.ball.roll, n) : 'ball';
  }
  // Sanat v3 atlası top için önceden çizilmiş ezilme kareleri taşıyorsa onlar 1:1 kullanılır
  // (ölçekleme yok); yoksa tek kare alan korunarak tam sayı boyutlara ölçeklenir.
  function preDrawn(e) {
    const E = assets.eraAtlas(e), B = E && E.json.ball;
    return B && typeof B === 'object' && B.squash && B.squash.length ? B : null;
  }
  R.preDrawn = () => !!preDrawn(era ? era.cur : null);
  function ballDims(s) {
    if (preDrawn(era ? era.cur : null)) return { w: 16, h: 16, anchor: 'center' };
    const b = s.ball, L = s.lastLanding;
    if (b.grounded && L) { const d = landingDims(s.clockMs - L.t, L.vy); if (d) return { w: d[0], h: d[1], anchor: 'bottom' }; }
    if (!b.grounded) { const d = fallDims(b.vy); if (d) return { w: d[0], h: d[1], anchor: 'center' }; }
    return { w: 16, h: 16, anchor: 'center' };
  }
  function drawBallImage(name, x, y, w, h) {
    const atlasOk = Math.abs(cam.renderScale() - 1) < 1e-3; // x0.5'te kesirli küçültme yerine prosedürel (§2.2)
    if (atlasOk && assets.drawFrame(name, x, y, w, h, era ? era.cur : null)) return;
    if (atlasOk && name !== 'ball' && assets.drawFrame('ball', x, y, w, h, era ? era.cur : null)) return;
    p.noStroke();
    p.fill(K.PAL.ballRing); p.ellipse(x + w / 2, y + h / 2, w + 2, h + 2);
    p.fill(K.PAL.ballOutline); p.ellipse(x + w / 2, y + h / 2, w, h);
    p.fill(K.PAL.ballShadow); p.ellipse(x + w / 2, y + h / 2, w - 2, h - 2);
    p.fill(K.PAL.ballMain); p.ellipse(x + w / 2 - 1, y + h / 2 - 1, w - 4, h - 4);
    p.fill(K.PAL.ballLight); p.rect(x + Math.round(w * 0.25), y + Math.round(h * 0.25), 2, 2);
  }
  // Hız izi: hızlı düşüşte son 3 konum, solan kopyalar (Jonasson-Purho: top izi).
  R.trail = [];
  R.trailCount = () => R.trail.length;
  function updateTrail(s) {
    const b = s.ball;
    if (s.gameState === 'playing' && !b.grounded && s.hurtMs <= 0 && b.vy >= K.TRAIL_MIN_VY) {
      R.trail.push({ x: cam.sx(b.x), y: cam.sy(b.y) });
      if (R.trail.length > 4) R.trail.shift();
    } else if (R.trail.length) R.trail.shift();
  }
  function drawTrail(s) {
    const ctx = p.drawingContext, rs = cam.renderScale(), name = ballSprite(s);
    const n = R.trail.length - 1; // sonuncusu topun kendisi
    for (let i = 0; i < n; i++) {
      const t = R.trail[i], a = 0.1 + 0.25 * (i / Math.max(1, n - 1));
      ctx.globalAlpha = a;
      const F = preDrawn(era ? era.cur : null) && Math.abs(rs - 1) < 1e-3 ? assets.frame(name, era ? era.cur : null) : null;
      const w = F ? F.w : Math.round(14 * rs), h = F ? F.h : Math.round(16 * rs);
      drawBallImage(name, Math.round(t.x - w / 2), Math.round(t.y - h / 2), w, h);
    }
    ctx.globalAlpha = 1;
  }

  function drawBall(s) {
    const b = s.ball, rs = cam.renderScale(), r = K.BALL_R * rs;
    const hurtPose = s.hurtMs > 0 && s.hurtAt;
    const bx = hurtPose ? s.hurtAt.x : b.x, by = hurtPose ? s.hurtAt.y : b.y;
    // Dokunulmazlık: yanıp söner (görünmez olmaz: kapalı fazda %30 opak, top hep izlenebilir)
    const blinkOff = s.invulnMs > 0 && Math.floor(s.invulnMs / K.INVULN_BLINK_MS) % 2 === 1;
    const ctx = p.drawingContext;
    const sx = cam.sx(bx), sy = cam.sy(by);
    if (hurtPose) { // can kaybı: beyaz siluet (Jonasson-Purho: darbede beyaz parlama)
      const x = Math.round(sx - r), y = Math.round(sy - r), w = Math.round(2 * r);
      p.noStroke(); p.fill(255); p.ellipse(x + w / 2, y + w / 2, w + 2, w + 2);
      return;
    }
    const d = ballDims(s);
    let w = Math.max(1, Math.round(d.w * rs)), h = Math.max(1, Math.round(d.h * rs));
    const frame = ballSprite(s), F = Math.abs(rs - 1) < 1e-3 ? assets.frame(frame, era ? era.cur : null) : null;
    if (F && preDrawn(era ? era.cur : null)) { w = F.w; h = F.h; } // önceden çizilmiş kare 1:1 (halka dahil 18 px)
    const x = Math.round(sx - w / 2);
    const y = d.anchor === 'bottom' ? Math.round(sy + r - h) : Math.round(sy - h / 2);
    R.lastBallRect = { x, y, w, h, frame };
    if (blinkOff) ctx.globalAlpha = 0.3;
    drawBallImage(R.lastBallRect.frame, x, y, w, h);
    ctx.globalAlpha = 1;
  }

  // Parçacıklar (dünya koordinatı, dünya ile kayar): iniş tozu, kalp ve rekor parıltısı.
  R.parts = [];
  R.particleCount = () => R.parts.length;
  function spawnParts(n, x, y, o) {
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + (Math.random() - 0.5) * o.spread : Math.random() * Math.PI * 2;
      const sp = o.speed[0] + Math.random() * (o.speed[1] - o.speed[0]);
      R.parts.push({ x: x + (o.dx ? (Math.random() - 0.5) * o.dx : 0), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                     g: o.g || 0, life: o.life, max: o.life, col: o.cols[i % o.cols.length], size: o.size || 1 });
    }
    if (R.parts.length > 160) R.parts.splice(0, R.parts.length - 160);
  }
  R.spawnParts = spawnParts;
  function updateParts(s, dt) {
    const scroll = s.gameState === 'playing' && s.hurtMs <= 0 && s.hitstopMs <= 0 ? s.scrollSpeed : 0;
    for (const q of R.parts) {
      q.vy += q.g * dt; q.x += q.vx * dt; q.y += (q.vy - scroll) * dt; q.life -= dt * 1000;
    }
    R.parts = R.parts.filter(q => q.life > 0);
  }
  function drawParts() {
    const ctx = p.drawingContext;
    p.noStroke();
    for (const q of R.parts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life / q.max * 1.4));
      p.fill(q.col); p.rect(Math.round(q.x), Math.round(q.y), q.size, q.size);
    }
    ctx.globalAlpha = 1;
  }
  function dustColors(e) {
    const E = assets.eraAtlas(e), c = E && E.json.renk && E.json.renk.toz;
    return c ? (Array.isArray(c) ? c : [c]) : ['#d9c9a3', '#b8a27a', '#efe3c4'];
  }
  game.on('landing', ev => {
    if (ev.impactVy < 120) return;
    const s = game.state, n = ev.impactVy >= 400 ? 6 : 4;
    const y = ev.p.y - 1, x = s.ball.x;
    spawnParts(n >> 1, x - 4, y, { angle: Math.PI + 0.35, spread: 0.6, speed: [25, 55], g: 160, life: 260, cols: dustColors(era ? era.cur : null), dx: 4 });
    spawnParts(n - (n >> 1), x + 4, y, { angle: -0.35, spread: 0.6, speed: [25, 55], g: 160, life: 260, cols: dustColors(era ? era.cur : null), dx: 4 });
  });
  game.on('heart', ev => spawnParts(10, ev.x, ev.y, { speed: [30, 70], g: 40, life: 450, cols: ['#ffd0d6', '#ffffff', '#e8263f'] }));

  // Beyaz parlama (can kaybı) ve sarsıntı (trauma^2, yalnız oyun katmanı; HUD sabit).
  R.flashAt = -1e9; R.lastShake = { x: 0, y: 0 };
  R.flashAlpha = () => Math.max(0, 1 - (game.state.clockMs - R.flashAt) / 110) * 0.45;
  game.on('hurt', () => { R.flashAt = game.state.clockMs; });

  // Rekor çizgisi (Doodle Jump'ın oyun alanı içi rekor işareti, SENTEZ öneri 7): önceki en iyi
  // skorun dünya derinliği. Dünya ile kayar; skor rekoru geçtiği anda RECORD_REF_Y hizasında.
  R.recordLineY = function (s) {
    if (!(s.bestAtRunStart > 0)) return null;
    return K.RECORD_REF_Y + (s.bestAtRunStart - s.score) / K.SCORE_PER_PX;
  };
  R.recordFx = { at: 0 };
  R.recordLabelBox = null;
  const REC_GOLD = '#ffd34d', REC_SHADOW = '#3a2400';
  function drawRecordLine(s, view) {
    const ly = R.recordLineY(s);
    if (ly === null || ly < -12 || ly > view.y1 + 4) { R.recordLabelBox = null; return; }
    const y = Math.round(ly), since = s.clockMs - R.recordFx.at;
    const flash = R.recordFx.at > 0 && since < 600; // geçiş parıltısı: çizgi beyaz + kalın
    const phase = Math.floor(s.clockMs / 120) % 10; // kesikler yavaşça akar (gözü çeker)
    p.noStroke();
    for (let x = -10 + phase; x < K.PLAY_W; x += 10) {
      const x0 = Math.max(0, x), x1 = Math.min(K.PLAY_W, x + 6);
      if (x1 <= x0) continue;
      p.fill(REC_SHADOW); p.rect(x0, y + 1, x1 - x0, 1);
      p.fill(flash && Math.floor(since / 80) % 2 === 0 ? '#ffffff' : REC_GOLD);
      p.rect(x0, y, x1 - x0, flash ? 2 : 1);
    }
    // Etiket: sağ uçta küçük koyu kutu içinde REKOR + eski en iyi
    const label = 'REKOR ' + s.bestAtRunStart;
    p.textSize(9); p.textAlign(p.RIGHT, p.BOTTOM);
    const tw = Math.ceil(p.textWidth(label)) + 6, bx = K.PLAY_W - 4 - tw, by = y - 12;
    p.fill(0, 0, 0, 150); p.rect(bx, by, tw, 11);
    p.fill(REC_GOLD); p.text(label, K.PLAY_W - 7, y - 2);
    R.recordLabelBox = { x: bx, y: by, w: tw, h: 11 };
  }
  game.on('restart', () => { R.recordFx.at = 0; R.parts = []; R.trail = []; R.flashAt = -1e9; });
  game.on('newRecord', () => {
    const s = game.state;
    R.recordFx.at = s.clockMs;
    const y = R.recordLineY(s);
    for (let x = 12; x < K.PLAY_W; x += 24) spawnParts(2, x, y, { speed: [20, 60], g: -20, life: 500, cols: [REC_GOLD, '#ffffff'] });
  });

  // Kalp: varlık atlasında 'kalp' karesi varsa o, yoksa elle piksellenmiş 9x8 yedek (HEART_PX).
  function drawHeartAt(x, y, e, dim) {
    if (!dim && assets.drawFrame('kalp', x, y, null, null, e)) return;
    const pal = dim ? HEART_DIM : HEART_PAL;
    p.noStroke();
    for (let j = 0; j < HEART_PX.length; j++) {
      const row = HEART_PX[j];
      for (let i = 0; i < row.length; i++) {
        const c = pal[row[i]];
        if (!c) continue;
        p.fill(c); p.rect(x + i, y + j, 1, 1);
      }
    }
  }
  R.drawHeartAt = drawHeartAt;

  function drawPlatformHearts(s, view, e) {
    for (const pl of s.platforms) {
      if (!pl.heart || pl.y > view.y1 + 16 || pl.y < -16) continue;
      const bob = Math.floor(s.clockMs / 300) % 2; // 1 px yavaş zıplama: alınabilir işareti
      drawHeartAt(Math.round(pl.x + pl.w / 2) - 4, Math.round(pl.y - K.HEART_LIFT) - 4 - bob, e);
    }
  }

  function drawSpikes(s) {
    p.noStroke();
    for (let i = 0; i < K.SPIKE_COUNT; i++) {
      const x0 = i * K.SPIKE_W, tx = spikeTipX(i), ty = spikeTipY(i, s);
      p.fill(K.PAL.spikeShadow);
      p.triangle(x0, 0, x0 + K.SPIKE_W, 0, tx, ty);
      p.fill(K.PAL.spikeMain);
      p.triangle(x0 + SPIKE_INSET, 0, x0 + K.SPIKE_W - SPIKE_INSET, 0, tx, ty - SPIKE_NECK_PX);
      p.fill(K.PAL.spikeTip);
      p.rect(Math.floor(tx) - 1, Math.round(ty) - SPIKE_TIP_PX, SPIKE_TIP_PX, SPIKE_TIP_PX);
    }
  }

  function drawSpikesEra(s, e, alpha) {
    p.drawingContext.globalAlpha = alpha == null ? 1 : alpha;
    if (!assets.drawCeiling(e, K.SPIKE_COUNT, spikeTipX, i => spikeTipY(i, s))) drawSpikes(s);
    p.drawingContext.globalAlpha = 1;
  }

  function drawAbyss(view) {
    // Ölüm çizgisi (dünya y=PLAY_H) altı yalnız x0.5'te görünür: ileriye bakış, karartılmış.
    if (view.y1 <= K.PLAY_H + 0.5) return;
    const h = view.y1 - K.PLAY_H;
    p.noStroke();
    for (let k = 0; k < 6; k++) {
      p.fill(0, 0, 0, 60 + k * 25);
      p.rect(view.x0, K.PLAY_H + (h * k) / 6, view.x1 - view.x0, h / 6 + 1);
    }
    p.fill(K.PAL.spikeMain);
    for (let x = 0; x < K.PLAY_W; x += 8) p.rect(x, K.PLAY_H, 4, 1);
  }

  function hudText(str, x, y, size, align, col) {
    p.textSize(size);
    p.textAlign(align || p.LEFT, p.TOP);
    p.fill(0, 0, 0, 200);
    p.text(str, x + 1, y + 1);
    p.fill(col || K.PAL.hud);
    p.text(str, x, y);
  }

  function drawMuteButton() {
    const b = K.MUTE_BTN, m = audio.muted;
    p.noStroke();
    p.fill(0, 0, 0, 110); p.rect(b.x, b.y, b.w, b.h, 3);
    p.fill(K.PAL.hud);
    // hoparlör gövdesi + koni (piksel)
    p.rect(b.x + 4, b.y + 7, 3, 4);
    p.triangle(b.x + 7, b.y + 9, b.x + 11, b.y + 4, b.x + 11, b.y + 14);
    if (m) {
      p.fill(K.PAL.spikeTip);
      for (let k = 0; k < 6; k++) { p.rect(b.x + 12 + k, b.y + 6 + k, 1, 1); p.rect(b.x + 17 - k, b.y + 6 + k, 1, 1); }
    } else {
      p.rect(b.x + 13, b.y + 7, 1, 4); p.rect(b.x + 15, b.y + 5, 1, 8);
    }
  }

  // HUD can göstergesi: dolu kalpler + en çok 5'e kadar boş yuvalar (üst sınır okunur). Can
  // kaybında giden kalp HURT_FREEZE + 400 ms yanıp söner; kalp alınınca yeni kalp 300 ms büyür.
  R.hudHeartFx = { lostAt: -1e9, lostIdx: -1, gainAt: -1e9, gainIdx: -1 };
  function drawHudHearts(s, x0, y0) {
    const fx = R.hudHeartFx, now = s.clockMs, lives = Math.max(0, s.lives);
    for (let i = 0; i < K.LIVES_MAX; i++) {
      const x = x0 + i * 11, y = y0;
      if (i < lives) {
        if (i === fx.gainIdx && now - fx.gainAt < 300 && Math.floor((now - fx.gainAt) / 75) % 2 === 0) {
          drawHeartAt(x, y - 1, null); // pop: 1 px yukarı sıçrar
        } else drawHeartAt(x, y, null);
      } else if (i === fx.lostIdx && now - fx.lostAt < K.HURT_FREEZE_MS + 400 && Math.floor((now - fx.lostAt) / 70) % 2 === 0) {
        drawHeartAt(x, y, null);
      } else drawHeartAt(x, y, null, true);
    }
  }
  game.on('hurt', e => { R.hudHeartFx.lostAt = game.state.clockMs; R.hudHeartFx.lostIdx = e.lives; });
  game.on('heart', e => { if (e.gained > 0) { R.hudHeartFx.gainAt = game.state.clockMs; R.hudHeartFx.gainIdx = e.lives - 1; } });

  function drawHud(s) {
    p.noStroke();
    p.textFont('monospace');
    const y0 = K.SPIKE_STRIP_H + 6;
    hudText(String(Math.floor(s.score)), 8, y0, K.HUD_SIZE);
    const shown = Math.max(s.bestAtRunStart, s.newRecordThisRun ? Math.floor(s.score) : 0);
    hudText('EN İYİ ' + shown, 8, y0 + K.HUD_SIZE + 2, K.HUD_SMALL, p.LEFT, s.newRecordThisRun ? K.PAL.ballMain : K.PAL.hud);
    drawHudHearts(s, 8, y0 + K.HUD_SIZE + K.HUD_SMALL + 7);
    drawMuteButton();
    if (Math.abs(cam.zoom - K.ZOOM_BASE) > 1e-3 || cam.to !== K.ZOOM_BASE) {
      hudText('KAMERA x' + cam.zoom.toFixed(2), K.LOGICAL_W - 8, K.LOGICAL_H - 18, K.HUD_SMALL, p.RIGHT);
    }
    if (R.fpsInfo) {
      hudText('FPS ' + R.fpsInfo.fps.toFixed(0) + '  CPU ' + R.fpsInfo.cpuMs.toFixed(1) + ' ms  ' + K.ERA_LABELS[era ? era.cur : 0],
              8, K.LOGICAL_H - 18, K.HUD_SMALL, p.LEFT);
    }
  }

  function drawTouchHint(s) {
    if (s.touchHintMs <= 0) return;
    const t = Math.min(1, Math.max(0, s.touchHintMs) / K.TOUCH_HINT_FADE_MS);
    const a = Math.ceil(t * 4) / 4 * 90;
    if (a <= 0) return;
    const c = p.color(K.PAL.hud); c.setAlpha(a);
    p.noStroke(); p.fill(c);
    const x0 = K.LOGICAL_W / 2 - 1;
    for (let y = K.LOGICAL_H / 2; y < K.LOGICAL_H - 12; y += 12) p.rect(x0, y, 2, 6);
    const ay = Math.round(K.LOGICAL_H * 0.78);
    for (let i = 0; i < 6; i++) {
      const h = 2 + i * 4;
      p.rect(K.LOGICAL_W * 0.25 - 6 + i * 2, ay - h / 2, 2, h);
      p.rect(K.LOGICAL_W * 0.75 + 4 - i * 2, ay - h / 2, 2, h);
    }
    p.textAlign(p.CENTER, p.TOP); p.textSize(10);
    p.text('BASILI TUT', K.LOGICAL_W * 0.25, ay + 18);
    p.text('BASILI TUT', K.LOGICAL_W * 0.75, ay + 18);
  }

  function drawGameOver(s) {
    const cx = K.LOGICAL_W / 2, cy = K.LOGICAL_H / 2;
    p.noStroke();
    p.fill(0, 0, 0, 170);
    p.rect(cx - 130, cy - 90, 260, 170, 6);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(K.PAL.hud);
    p.textSize(26); p.text('OYUN BİTTİ', cx, cy - 50);
    p.textSize(18); p.text('SKOR ' + Math.floor(s.score), cx, cy - 12);
    p.textSize(14); p.text('EN İYİ ' + s.bestScore, cx, cy + 14);
    if (s.isRecordRun() && Math.floor(s.clockMs / 250) % 2 === 0) {
      p.fill(K.PAL.ballMain); p.textSize(16); p.text('YENİ REKOR!', cx, cy - 76);
    }
    p.fill(K.PAL.hud); p.textSize(11);
    p.text(isTouch ? 'Yeniden başlamak için dokun' : 'Yeniden: BOŞLUK ya da tıkla', cx, cy + 50);
  }

  R.draw = function (dtMs) {
    const s = game.state, dt = Math.min(dtMs, K.DT_CLAMP_MS) / 1000;
    const view = cam.viewRect();
    const ec = era ? era.cur : null, ep = era && era.prev != null && era.t < 1 ? era.prev : null;
    const t = ep == null ? 1 : era.t;
    // Sarsıntı: tüm oyun katmanı (arka plan dahil) tam sayı px kayar; HUD kaymaz.
    const sh = R.lastShake = shakeOffset(s.trauma, s.clockMs / 1000);
    if (sh.x || sh.y) p.background(0);
    p.push();
    p.translate(sh.x, sh.y);
    // 1) arka katmanlar: eski çağ tam, yeni çağ t alfasıyla üstüne
    updateStructs(s, ec);
    let back = false;
    if (ep != null) back = drawEraBack(s, ep, 1);
    back = drawEraBack(s, ec, ep == null || !back ? 1 : t) || back;
    if (!back) drawBackground(s, dt);
    p.push();
    cam.apply(p);
    drawPlayfieldBounds(view);
    if (ep != null) drawPlatforms(s, view, ep, 1 - t, false);
    drawPlatforms(s, view, ec, t);
    drawPlatformHearts(s, view, ec);
    drawRecordLine(s, view);
    updateParts(s, dt);
    drawParts();
    p.pop();
    updateTrail(s);
    drawTrail(s);
    drawBall(s);
    p.push();
    cam.apply(p);
    if (ep != null) drawSpikesEra(s, ep, 1 - t);
    drawSpikesEra(s, ec, t);  // v1 sırası: dikenler topun ÖNÜNDE (uç her zaman görünür)
    drawAbyss(view);
    p.pop();
    p.pop();
    const fa = R.flashAlpha();
    if (fa > 0) { p.noStroke(); p.fill(255, 255, 255, Math.round(fa * 255)); p.rect(0, 0, K.LOGICAL_W, K.LOGICAL_H); }
    drawHud(s);
    drawTouchHint(s);
    if (s.gameState === 'gameover' && s.hitstopMs <= 0) drawGameOver(s);
    R.drawCount++;
  };
  R.resetLayers();
  return R;
}
