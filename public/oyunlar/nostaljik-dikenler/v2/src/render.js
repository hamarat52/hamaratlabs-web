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

const SPIKE_TIP_PX = 2, SPIKE_NECK_PX = 4, SPIKE_INSET = 1;
const STAR_COUNT = 40, STAR_PARALLAX = 0.3;
// Büyük yapılar: ekranda görünen genişlik en çok 112 px (360'ın %31'i), arası 140-300 px boşluk.
const STRUCT_VISIBLE_MAX = 112, STRUCT_GAP_MIN = 140, STRUCT_GAP_MAX = 300;

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
    R.structs = [{ kind: 'agac', y: 64 }, { kind: 'ada', y: 380 }];
    R.lastDist = 0;
  };

  // Büyük yapılar kendi parallax hızında yukarı kayar; ağaç (sol) ve ada (sağ) sırayla gelir.
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
    for (let guard = 0; guard < 4; guard++) {
      const last = R.structs[R.structs.length - 1];
      const sz = last && structSize(e, last.kind);
      const bottom = last ? last.y + (sz ? sz.H : 300) : 0;
      if (last && bottom >= 700) break;
      const kind = !last || last.kind === 'ada' ? 'agac' : 'ada';
      R.structs.push({ kind, y: Math.max(700, bottom + STRUCT_GAP_MIN + rnd() * (STRUCT_GAP_MAX - STRUCT_GAP_MIN)) });
    }
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
  function drawBall(s) {
    const b = s.ball, rs = cam.renderScale(), r = K.BALL_R * rs;
    let rx = r, ry = r;
    const sx = cam.sx(b.x);
    let cy = cam.sy(b.y);
    if (s.squashFrames > 0) { rx = r * 1.25; ry = r * 0.75; cy = cam.sy(b.y) + r - ry; }
    const x = Math.round(sx - rx), y = Math.round(cy - ry), w = Math.round(rx * 2), h = Math.round(ry * 2);
    if (Math.abs(rs - 1) < 1e-3 && assets.drawFrame('ball', x, y, w, h, era ? era.cur : null)) return;
    p.noStroke();
    p.fill(K.PAL.ballRing); p.ellipse(x + w / 2, y + h / 2, w + 2, h + 2);
    p.fill(K.PAL.ballOutline); p.ellipse(x + w / 2, y + h / 2, w, h);
    p.fill(K.PAL.ballShadow); p.ellipse(x + w / 2, y + h / 2, w - 2, h - 2);
    p.fill(K.PAL.ballMain); p.ellipse(x + w / 2 - 1, y + h / 2 - 1, w - 4, h - 4);
    p.fill(K.PAL.ballLight); p.rect(x + Math.round(w * 0.25), y + Math.round(h * 0.25), 2, 2);
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

  function drawHud(s) {
    p.noStroke();
    p.textFont('monospace');
    const y0 = K.SPIKE_STRIP_H + 6;
    hudText(String(Math.floor(s.score)), 8, y0, K.HUD_SIZE);
    const shown = Math.max(s.bestAtRunStart, s.newRecordThisRun ? Math.floor(s.score) : 0);
    hudText('EN İYİ ' + shown, 8, y0 + K.HUD_SIZE + 2, K.HUD_SMALL, p.LEFT, s.newRecordThisRun ? K.PAL.ballMain : K.PAL.hud);
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
    p.pop();
    drawBall(s);
    p.push();
    cam.apply(p);
    if (ep != null) drawSpikesEra(s, ep, 1 - t);
    drawSpikesEra(s, ec, t);  // v1 sırası: dikenler topun ÖNÜNDE (uç her zaman görünür)
    drawAbyss(view);
    p.pop();
    drawHud(s);
    drawTouchHint(s);
    if (s.gameState === 'gameover' && s.hitstopMs <= 0) drawGameOver(s);
    R.drawCount++;
  };
  R.resetLayers();
  return R;
}
