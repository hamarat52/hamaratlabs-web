// Oyun durumu ve temel döngü: sıfırlama, kare güncellemesi, can, kalp, ölüm, skor, en iyi skor.
// Sıra v1 updateGame ile aynı: zorluk -> skor -> fizik (yatay, kayma, düşüş/iniş) -> temizlik
// -> üretim -> kalpler -> dikenler -> düşüş. Tüm alt sistemler state üzerinden konuşur; olaylar
// (landing, takeoff, rowSpawn, stageUp, hurt, respawn, heartSpawn, heart, newRecord, death,
// restart) emit ile yayınlanır (ses, his, test).
//
// Can sistemi (Fikir 30 madde 5): diken ya da düşüş -> hurt(): can 1 azalır; 0 ise oyun biter.
// Değilse HURT_FREEZE_MS donma (top çarptığı yerde), sonra en yakın güvenli platforma konur ve
// INVULN_MS boyunca dikenler öldürmez (itme fiziği sürer). Düşüş dokunulmazlıkta da can götürür
// (oyuncunun kendi hareketi; dikenden farklı olarak kaçınılmaz değil).
import * as K from './config.js';
import { createRng } from './rng.js';
import { makeBall, updateBallAndWorld } from './physics.js';
import { handleSpikes } from './spikes.js';
import { updateDifficulty, fillInitialRows, ensureRows, cullPlatforms, resetRowPatternStats,
         getDifficultyElapsedS, getStage, wrapDx } from './world.js';

const HEART_SEED_SALT = 0x6b616c70; // 'kalp': kalp zamanlayıcısı ayrı rastgele akış (üretim dizisine girmez)
const heartSeed = seed => (seed == null ? null : ((seed ^ HEART_SEED_SALT) >>> 0));

export function createGame(opts) {
  const listeners = new Map();
  const rng = createRng(opts.seed == null ? null : opts.seed);
  const heartRng = createRng(heartSeed(opts.seed));
  const s = {
    rng, platforms: [], rowLog: [], nextPlatformId: 1, gameState: 'playing', stage: 0,
    bestScore: opts.save.data.bestScore, bestAtRunStart: 0, newRecordThisRun: false,
    clockMs: 0, runs: 0, deaths: [], hurts: [],
    landHitstop: opts.landHitstop !== false, // inişte ~20 ms durma (aç/kapa: ?inisdur=0)
    emit(name, data) { const l = listeners.get(name); if (l) for (const f of l) f(data); }
  };
  const game = { state: s };

  game.on = function (name, f) {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(f);
  };

  const nextHeartInterval = () => heartRng.random(K.HEART_INTERVAL_MIN_S, K.HEART_INTERVAL_MAX_S);

  game.reset = function (seed) {
    if (seed !== undefined) { rng.setSeed(seed); heartRng.setSeed(heartSeed(seed)); }
    s.seed = rng.getState();
    s.ball = makeBall();
    s.platforms = [];
    s.rowLog = [];
    s.scrollSpeed = K.BASE_SCROLL_SPEED;
    s.speedTimer = 0;
    s.score = 0;
    s.gameState = 'playing';
    s.stage = 0;
    s.runTimeS = 0;
    s.deathCause = null;
    s.hitstopMs = 0;
    s.squashFrames = 0;
    s.landings = 0;
    s.lives = K.LIVES_START;
    s.hurtMs = 0;           // can kaybı donması, kalan süre
    s.hurtAt = null;        // { x, y, cause }: donma sırasında top bu noktada çizilir
    s.invulnMs = 0;
    s.heartTimer = nextHeartInterval();
    s.heartPending = false;
    s.heartsSpawned = 0;
    s.heartsTaken = 0;
    s.trauma = 0;           // sarsıntı kaynağı (0..1), hurt ile artar, zamanla söner (his katmanı)
    s.lastLanding = null;   // { t: clockMs, vy, x, y, pid }: ezilme/toz için
    s.touchHintMs = opts.isTouch ? K.TOUCH_HINT_MS : 0;
    s.bestAtRunStart = s.bestScore;
    s.newRecordThisRun = false;
    resetRowPatternStats(s);
    fillInitialRows(s);
    s.runs++;
    s.emit('restart', {});
  };

  function triggerGameOver(cause) {
    s.gameState = 'gameover';
    s.deathCause = cause;
    s.hitstopMs = K.HITSTOP_MS;
    s.lives = 0;
    s.hurtMs = 0; s.hurtAt = null; s.invulnMs = 0;
    s.deaths.push({ cause, score: Math.floor(s.score), t: +s.runTimeS.toFixed(2) });
    if (s.deaths.length > 200) s.deaths.shift();
    game.commitBest();
    s.emit('death', { cause });
  }
  game.triggerGameOver = triggerGameOver;

  // En yakın güvenli platform: kırılan/dikenli değil; dokunulmazlık + 1 sn boyunca tavana
  // taşınamayacak kadar aşağıda (o anki kayma hızıyla), altında satır kalacak kadar yukarıda.
  // Uzaklık: wrap'li yatay + dikey, topun çarptığı noktadan. Hareketli platform hafif cezalı.
  game.safeBand = () => ({ minY: K.SPIKE_STRIP_H + 2 * K.BALL_R + s.scrollSpeed * K.RESPAWN_CEIL_LEAD_S,
                           maxY: K.RESPAWN_MAX_Y });
  game.findSafePlatform = function (fromX, fromY) {
    const { minY, maxY } = game.safeBand();
    let best = null, bd = Infinity;
    for (const p of s.platforms) {
      if (p.broken || p.kind === 'fragile' || p.kind === 'spiked') continue;
      if (p.y < minY || p.y > maxY) continue;
      const d = Math.hypot(wrapDx(p.x + p.w / 2, fromX), p.y - fromY) + (p.kind === 'moving' ? 12 : 0);
      if (d < bd) { bd = d; best = p; }
    }
    if (!best) { // bant boşsa (pratikte olmaz): banda en yakın platform
      for (const p of s.platforms) {
        if (p.broken) continue;
        const d = p.y < minY ? minY - p.y : Math.max(0, p.y - maxY);
        if (d < bd) { bd = d; best = p; }
      }
    }
    return best;
  };

  function hurt(cause) {
    s.lives--;
    s.hurts.push({ cause, lives: s.lives, score: Math.floor(s.score), t: +s.runTimeS.toFixed(2) });
    if (s.hurts.length > 200) s.hurts.shift();
    s.trauma = Math.min(1, s.trauma + K.TRAUMA_HURT);
    s.emit('hurt', { cause, lives: s.lives, x: s.ball.x, y: s.ball.y });
    if (s.lives <= 0) { triggerGameOver(cause); return; }
    s.hurtMs = K.HURT_FREEZE_MS;
    s.hurtAt = { x: s.ball.x, y: Math.min(s.ball.y, K.PLAY_H + K.BALL_R), cause };
  }
  game.hurt = hurt;

  function respawn() {
    const from = s.hurtAt || { x: s.ball.x, y: s.ball.y };
    const p = game.findSafePlatform(from.x, from.y);
    const b = s.ball;
    b.vx = 0; b.vy = 0; b.pushVx = 0;
    if (p) { b.x = p.x + p.w / 2; b.y = p.y - K.BALL_R; b.grounded = true; b.currentPlatform = p; }
    else { b.x = K.PLAY_W / 2; b.y = K.PLAY_H / 2; b.grounded = false; b.currentPlatform = null; }
    s.hurtAt = null;
    s.invulnMs = K.INVULN_MS;
    s.emit('respawn', { platform: p ? p.id : null, x: b.x, y: b.y, lives: s.lives });
  }

  game.commitBest = function () {
    const sc = Math.floor(s.score);
    if (sc > s.bestScore) {
      s.bestScore = sc;
      opts.save.data.bestScore = sc;
      opts.save.write();
    }
    return s.bestScore;
  };
  s.isRecordRun = () => Math.floor(s.score) > s.bestAtRunStart && Math.floor(s.score) > 0;
  s.isInvulnerable = () => s.invulnMs > 0;
  game.canRestart = () => s.gameState === 'gameover' && s.hitstopMs <= 0;

  // Koşu içi: önceki rekor (> 0) geçildiği ilk an (v1 Faz 21 kuralı).
  function checkNewRecord() {
    if (s.newRecordThisRun || s.bestAtRunStart <= 0) return;
    if (Math.floor(s.score) <= s.bestAtRunStart) return;
    s.newRecordThisRun = true;
    s.emit('newRecord', { score: Math.floor(s.score), prev: s.bestAtRunStart });
  }

  // Kalp: zamanlayıcı (oyun süresi) dolunca bir sonraki, ekran altında doğan satırın ana
  // platformuna konur. Can doluyken çıkmaz. Toplama: top merkezi kalbe HEART_PICK_R kadar yakın.
  function updateHearts(dt) {
    if (!s.heartPending) {
      s.heartTimer -= dt;
      if (s.heartTimer <= 0) {
        if (s.lives >= K.LIVES_MAX) s.heartTimer = K.HEART_RETRY_S;
        else s.heartPending = true;
      }
    }
    const b = s.ball;
    for (const p of s.platforms) {
      if (!p.heart) continue;
      const hx = p.x + p.w / 2, hy = p.y - K.HEART_LIFT;
      if (Math.hypot(wrapDx(b.x, hx), b.y - hy) <= K.HEART_PICK_R) {
        p.heart = false;
        const before = s.lives;
        s.lives = Math.min(K.LIVES_MAX, s.lives + 1);
        s.heartsTaken++;
        s.emit('heart', { lives: s.lives, gained: s.lives - before, x: hx, y: hy });
      }
    }
  }
  game.on('rowSpawn', anchor => {
    if (!s.heartPending || anchor.y <= K.PLAY_H || anchor.kind === 'fragile') return;
    anchor.heart = true;
    s.heartPending = false;
    s.heartsSpawned++;
    s.heartTimer = nextHeartInterval();
    s.emit('heartSpawn', { id: anchor.id, y: anchor.y });
  });

  // Donma kare süresinden TÜKETİLİR, kalan süre aynı karede simüle edilir.
  function consumeStop(key, dtMs) {
    if (s[key] <= 0) return dtMs;
    const take = Math.min(s[key], dtMs);
    s[key] -= take;
    return dtMs - take;
  }

  // Tek kare. dtMs: gerçek kare süresi (ms). Fizik v1 gibi 50 ms tavanla kırpılır.
  game.update = function (dtMs, inputDir) {
    s.clockMs += dtMs;
    if (s.squashFrames > 0) s.squashFrames--;
    if (s.trauma > 0) s.trauma = Math.max(0, s.trauma - K.TRAUMA_DECAY_PER_S * Math.min(dtMs, K.DT_CLAMP_MS) / 1000);
    if (s.gameState !== 'playing') { if (s.hitstopMs > 0) s.hitstopMs -= dtMs; return; }
    if (s.hurtMs > 0) {
      dtMs = consumeStop('hurtMs', dtMs);
      if (s.hurtMs > 0) return;
      respawn();
      if (dtMs <= 0) return;
    }
    dtMs = consumeStop('hitstopMs', dtMs); // iniş durması (Nijman: darbede ~20 ms)
    if (dtMs <= 0) return;
    const dt = Math.min(dtMs, K.DT_CLAMP_MS) / 1000;
    s.runTimeS += dt;
    if (s.touchHintMs > 0) s.touchHintMs -= dtMs;
    if (s.invulnMs > 0) s.invulnMs = Math.max(0, s.invulnMs - dtMs);
    updateDifficulty(s, dtMs);
    const worldSpeed = s.scrollSpeed;
    s.score += s.scrollSpeed * dt * K.SCORE_PER_PX;
    checkNewRecord();
    updateBallAndWorld(s, dt, inputDir, worldSpeed);
    cullPlatforms(s);
    ensureRows(s);
    updateHearts(dt);
    const cause = handleSpikes(s);
    if (cause && !s.isInvulnerable()) { hurt(cause); return; }
    if (s.ball.y > K.PLAY_H) hurt('fell');
  };

  game.on('landing', e => {
    s.landings++;
    s.squashFrames = K.SQUASH_FRAMES;
    s.lastLanding = { t: s.clockMs, vy: e.impactVy, x: s.ball.x, y: s.ball.y, pid: e.p.id };
    if (s.landHitstop && e.impactVy >= K.LAND_HITSTOP_MIN_VY) s.hitstopMs = Math.max(s.hitstopMs, K.LAND_HITSTOP_MS);
  });
  game.elapsedS = () => getDifficultyElapsedS(s);
  game.stageNow = () => getStage(s);

  // Sekme kapanır/gizlenirse koşu ortasındaki rekor kaybolmasın.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && s.gameState === 'playing') game.commitBest();
    });
  }
  return game;
}
