// Top fiziği: yatay kontrol + wrap, platformla taşınma, yerçekimi, YALNIZ ÜST YÜZEY çarpışma.
// v1 updateGame fizik bölümünün v2 sabitleriyle taşınmış hali. Platformun görseli (alt taraf,
// sarkan kök vb.) burada hiç okunmaz: çarpışma kutusu p.x..p.x+p.w üst kenarı p.y (§5.0).
import * as K from './config.js';
import { movingPlatformX } from './world.js';

export function makeBall() {
  return { x: K.PLAY_W / 2, y: K.BALL_START_Y, vx: 0, vy: 0, pushVx: 0, grounded: true,
           currentPlatform: null, r: K.BALL_R };
}

// inputDir: -1 | 0 | +1. worldSpeed: bu karenin dünya kayma hızı (px/sn).
export function updateBallAndWorld(s, dt, inputDir, worldSpeed) {
  const ball = s.ball, R = K.BALL_R;
  // Yatay (yalnız sol/sağ; dikey tamamen otomatik)
  ball.vx = inputDir * K.MOVE_SPEED;
  ball.x += (ball.vx + ball.pushVx) * dt;
  ball.pushVx *= Math.exp(-dt / K.SPIKE_PUSH_DECAY);
  if (Math.abs(ball.pushVx) < 1) ball.pushVx = 0;
  // Kenardan sarma (§2.3 KALSIN)
  if (ball.x < -R) ball.x = K.PLAY_W + R;
  if (ball.x > K.PLAY_W + R) ball.x = -R;

  // Dünya kayması (+ hareketli platform salınımı, üstündeki top taşınır)
  for (const p of s.platforms) {
    p.y -= worldSpeed * dt;
    if (p.kind === 'moving') {
      p.t += dt;
      const nx = movingPlatformX(p);
      const dx = nx - p.x;
      p.x = nx;
      if (ball.grounded && ball.currentPlatform === p) ball.x += dx;
    }
  }
  s.lastSpawnY -= worldSpeed * dt;

  if (ball.grounded) {
    ball.y -= worldSpeed * dt;
    ball.vy = 0;
    const p = ball.currentPlatform;
    if (!p || p.broken || ball.x + R < p.x || ball.x - R > p.x + p.w) {
      ball.grounded = false;
      ball.currentPlatform = null;
      s.emit('takeoff', p);
    }
    return null;
  }
  ball.vy = Math.min(ball.vy + K.GRAVITY * dt, K.MAX_FALL_SPEED);
  ball.y += ball.vy * dt;
  if (ball.vy < 0) return null;
  const ballBottom = ball.y + R;
  const prevBallBottom = ballBottom - ball.vy * dt;
  for (const p of s.platforms) {
    if (p.broken) continue;
    // Platformlar bu karede zaten kaydı: önceki karedeki üst kenarla süpür (tünelleme yok).
    const prevTop = p.y + worldSpeed * dt;
    const withinX = ball.x + R > p.x && ball.x - R < p.x + p.w;
    if (withinX && prevBallBottom <= prevTop && ballBottom >= p.y) {
      const impactVy = ball.vy;
      ball.y = p.y - R;
      ball.vy = 0;
      ball.grounded = true;
      ball.currentPlatform = p;
      s.emit('landing', { p, impactVy });
      return p;
    }
  }
  return null;
}
