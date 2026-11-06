// Giriş noktası: p5 örnek modu (instance mode), modülleri bağlar, ekran ölçeklemesi.
// Ekran: mantıksal 360x640 canvas, pixelDensity(1) + noSmooth; CSS ile TAM SAYI ölçekte
// (cihaz pikseli cinsinden) büyütülür, kalan alan siyah letterbox. Ekran 1x'ten küçükse
// (çok küçük pencere) oran korunarak küçültülür (kesirli, yalnız o durumda).
// window.V2: test/ölçüm erişimi (oyun mantığı bunu okumaz).
import * as K from './config.js';
import { createGame } from './game.js';
import { createCamera } from './camera.js';
import { createInput } from './input.js';
import { createAssets } from './assets.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { createSave } from './save.js';
import { createV1Engine } from './audio/v1-bridge.js';
import { getDifficultyT } from './world.js';
import { createEra } from './era.js';
import * as juice from './juice.js';

const params = new URLSearchParams(location.search);
const IS_TOUCH = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;

// Tam sayı ölçek, kesirli sığdırmanın en az %75'ini dolduruyorsa kullanılır (tüm yaygın telefonlar:
// 390x844@3 -> 3, 375x667@2 -> 2, 412x915@2.625 -> 3). Dolduramıyorsa (ör. 1x masaüstü 1440x900'de
// 360x640 küçük kalır) kesirli sığdırmaya düşülür; yine en yakın komşu büyütme.
export const INT_FILL_MIN = 0.75;
export function computeFit(innerW, innerH, dpr) {
  const frac = Math.min((innerW * dpr) / K.LOGICAL_W, (innerH * dpr) / K.LOGICAL_H);
  const k = Math.floor(frac);
  if (k >= 1 && k / frac >= INT_FILL_MIN) return { k, cssW: (K.LOGICAL_W * k) / dpr, cssH: (K.LOGICAL_H * k) / dpr, integer: true };
  return { k: frac, cssW: (K.LOGICAL_W * frac) / dpr, cssH: (K.LOGICAL_H * frac) / dpr, integer: false };
}

const sketch = (p) => {
  const save = createSave();
  save.load();
  const assets = createAssets(p);
  const cam = createCamera();
  const audio = createAudio(save);
  const seed = params.has('seed') ? parseInt(params.get('seed'), 10) : null;
  // Müzik köprüsü: v1 sentez motoru (v2 müziği Faz D). ?music=0 ile motorsuz (sessiz) çalışır.
  if (params.get('music') !== '0') audio.attachEngine(createV1Engine());
  // His bayrakları (deneme için URL ile aç/kapa): ?inisdur=0 iniş durmasını kapatır.
  const flags = { landHitstop: params.get('inisdur') !== '0' };
  const game = createGame({ seed, save, isTouch: IS_TOUCH, landHitstop: flags.landHitstop });
  // Çağ (yalnız görsel): ?era=N ile N. çağdan başlar (test), eşikler 1250/2500/3750 puan.
  const era = createEra(params.has('era') ? parseInt(params.get('era'), 10) || 0 : 0);
  const SHOW_FPS = params.get('fps') === '1';
  let fpsEma = 0, cpuEma = 0;
  let input = null, renderer = null, canvasEl = null, fit = null;

  function hitsMuteButton(clientX, clientY) {
    if (!canvasEl) return false;
    const r = canvasEl.getBoundingClientRect();
    const lx = ((clientX - r.left) / r.width) * K.LOGICAL_W, ly = ((clientY - r.top) / r.height) * K.LOGICAL_H;
    const b = K.MUTE_BTN, pad = 6;
    return lx >= b.x - pad && lx <= b.x + b.w + pad && ly >= b.y - pad && ly <= b.y + b.h + pad;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    fit = computeFit(window.innerWidth, window.innerHeight, dpr);
    canvasEl.style.width = fit.cssW + 'px';
    canvasEl.style.height = fit.cssH + 'px';
  }

  function frame(dtMs) {
    const t0 = performance.now();
    game.update(dtMs, input.dir());
    cam.update(Math.min(dtMs, K.DT_CLAMP_MS) / 1000);
    const ev = era.update(game.state.score, Math.min(dtMs, K.DT_CLAMP_MS) / 1000);
    if (ev) { assets.setEra(era.cur); game.state.emit('eraChange', ev); }
    audio.update({ playing: game.state.gameState === 'playing', elapsedS: game.elapsedS(),
                   stage: game.state.stage, ballY: game.state.ball.y,
                   difficultyT: getDifficultyT(game.state) });
    const t1 = performance.now();
    renderer.draw(dtMs);
    const t2 = performance.now();
    V2.lastFrame = { updateMs: t1 - t0, drawMs: t2 - t1, totalMs: t2 - t0 };
    if (SHOW_FPS && dtMs > 0) { // ?fps=1: gerçek cihazda rAF kare hızı + CPU süresi (telefon kontrolü)
      fpsEma = fpsEma ? fpsEma * 0.95 + (1000 / dtMs) * 0.05 : 1000 / dtMs;
      cpuEma = cpuEma ? cpuEma * 0.95 + (t2 - t0) * 0.05 : t2 - t0;
      renderer.fpsInfo = { fps: fpsEma, cpuMs: cpuEma };
    }
  }

  p.preload = () => assets.preload('assets/', K.ERA_COUNT);

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(K.LOGICAL_W, K.LOGICAL_H);
    canvasEl = c.elt;
    p.noSmooth();
    p.textFont('monospace');
    assets.init();
    assets.setEra(era.cur);
    renderer = createRenderer(p, { game, cam, assets, audio, isTouch: IS_TOUCH, era });
    renderer.init();
    input = createInput({
      unlockAudio: () => audio.unlock(),
      isGameOver: () => game.state.gameState === 'gameover',
      canRestart: () => game.canRestart(),
      restart: () => { game.reset(); },
      toggleMute: src => audio.toggleMute(src),
      toggleZoom: src => cam.toggle(src),
      hitsMuteButton
    });
    game.on('restart', () => { input.clearTouches && input.clearTouches(); audio.onReset(); era.reset(); assets.setEra(era.cur); renderer.resetLayers(); });
    game.on('landing', e => audio.sfx('landing', e));
    game.on('death', e => audio.onDeath(e));
    game.on('hurt', e => { if (e.lives > 0) audio.sfx('hurt', e); });
    game.on('respawn', e => audio.sfx('respawn', e));
    game.on('heart', e => audio.sfx('heart', e));
    game.on('newRecord', e => audio.sfx('record', e));
    game.reset();
    if (params.get('zoom') === 'wide') cam.snap(K.ZOOM_WIDE);
    resize();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  };

  p.draw = () => frame(p.deltaTime);

  // Test/ölçüm erişimi
  const V2 = window.V2 = { K, p, game, cam, assets, audio, save, era, juice, flags, get input() { return input; },
                           get renderer() { return renderer; }, get fit() { return fit; },
                           frame, resize, computeFit, IS_TOUCH, lastFrame: null };
};

new p5(sketch, document.getElementById('game'));
