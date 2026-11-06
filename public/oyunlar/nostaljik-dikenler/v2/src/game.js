// Oyun durumu ve temel döngü: sıfırlama, kare güncellemesi, ölüm, skor, en iyi skor.
// Sıra v1 updateGame ile aynı: zorluk -> skor -> fizik (yatay, kayma, düşüş/iniş) -> temizlik
// -> üretim -> dikenler -> düşüş ölümü. Tüm alt sistemler state üzerinden konuşur; olaylar
// (landing, takeoff, rowSpawn, stageUp, death, restart) emit ile yayınlanır (ses, juice, test).
import * as K from './config.js';
import { createRng } from './rng.js';
import { makeBall, updateBallAndWorld } from './physics.js';
import { handleSpikes } from './spikes.js';
import { updateDifficulty, fillInitialRows, ensureRows, cullPlatforms, resetRowPatternStats,
         getDifficultyElapsedS, getStage } from './world.js';

export function createGame(opts) {
  const listeners = new Map();
  const rng = createRng(opts.seed == null ? null : opts.seed);
  const s = {
    rng, platforms: [], rowLog: [], nextPlatformId: 1, gameState: 'playing', stage: 0,
    bestScore: opts.save.data.bestScore, bestAtRunStart: 0, newRecordThisRun: false,
    clockMs: 0, runs: 0, deaths: [], snapWidth: opts.snapWidth || null,
    emit(name, data) { const l = listeners.get(name); if (l) for (const f of l) f(data); }
  };
  const game = { state: s };

  game.on = function (name, f) {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(f);
  };

  game.reset = function (seed) {
    if (seed !== undefined) rng.setSeed(seed);
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
    s.deaths.push({ cause, score: Math.floor(s.score), t: +s.runTimeS.toFixed(2) });
    if (s.deaths.length > 200) s.deaths.shift();
    game.commitBest();
    s.emit('death', { cause });
  }
  game.triggerGameOver = triggerGameOver;

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
  game.canRestart = () => s.gameState === 'gameover' && s.hitstopMs <= 0;

  // Koşu içi: önceki rekor (> 0) geçildiği ilk an (v1 Faz 21 kuralı).
  function checkNewRecord() {
    if (s.newRecordThisRun || s.bestAtRunStart <= 0) return;
    if (Math.floor(s.score) <= s.bestAtRunStart) return;
    s.newRecordThisRun = true;
    s.emit('newRecord', { score: Math.floor(s.score), prev: s.bestAtRunStart });
  }

  // Tek kare. dtMs: gerçek kare süresi (ms). Fizik v1 gibi 50 ms tavanla kırpılır.
  game.update = function (dtMs, inputDir) {
    s.clockMs += dtMs;
    if (s.squashFrames > 0) s.squashFrames--;
    if (s.hitstopMs > 0) { s.hitstopMs -= dtMs; return; }
    if (s.gameState !== 'playing') return;
    const dt = Math.min(dtMs, K.DT_CLAMP_MS) / 1000;
    s.runTimeS += dt;
    if (s.touchHintMs > 0) s.touchHintMs -= dtMs;
    updateDifficulty(s, dtMs);
    const worldSpeed = s.scrollSpeed;
    s.score += s.scrollSpeed * dt * K.SCORE_PER_PX;
    checkNewRecord();
    updateBallAndWorld(s, dt, inputDir, worldSpeed);
    cullPlatforms(s);
    ensureRows(s);
    const cause = handleSpikes(s);
    if (cause) { triggerGameOver(cause); return; }
    if (s.ball.y > K.PLAY_H) triggerGameOver('fell');
  };

  game.on('landing', () => { s.landings++; s.squashFrames = K.SQUASH_FRAMES; }); // iniş karesinde çizilir, sonraki karede söner
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
