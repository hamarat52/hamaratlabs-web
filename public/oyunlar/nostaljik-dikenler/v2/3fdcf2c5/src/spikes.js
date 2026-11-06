// Tavan dikenleri: geometri, ölümcül uç ve gövde itmesi (v1 Faz 2 adillik mantığı birebir).
// Üçgen i: taban (i*SPIKE_W, 0)-((i+1)*SPIKE_W, 0), uç (i*SPIKE_W + SPIKE_W/2, SPIKE_STRIP_H).
// Ölümcül olan yalnız uç noktası (HURTBOX_R + SPIKE_TIP_LETHAL_R); gövde yalnız iter.
// Çizim (render.js) aynı spikeTipX/spikeTipY fonksiyonlarını kullanır: hitbox = görsel.
import * as K from './config.js';

export function spikeTipX(i) { return i * K.SPIKE_W + K.SPIKE_W / 2; }
export function spikeTipY(i, s) { return K.SPIKE_STRIP_H + (s && s.spikeDrop ? s.spikeDrop(i) : 0); }

function distToTip(ball, i, s) {
  return Math.hypot(ball.x - spikeTipX(i), ball.y - spikeTipY(i, s));
}

export function spikeBodyContacts(s) {
  const ball = s.ball, hr = K.HURTBOX_R, contacts = [];
  for (let i = 0; i < K.SPIKE_COUNT; i++) {
    const tx = spikeTipX(i), ty = spikeTipY(i, s);
    if (Math.abs(ball.x - tx) > K.SPIKE_W / 2 + hr) continue;
    if (ball.y - hr > ty) continue;
    const faces = [{ px: i * K.SPIKE_W, py: 0 }, { px: (i + 1) * K.SPIKE_W, py: 0 }];
    for (const f of faces) {
      const ux = tx - f.px, uy = ty - f.py;
      const len = Math.hypot(ux, uy);
      const dx = ball.x - f.px, dy = ball.y - f.py;
      const t = (dx * ux + dy * uy) / (len * len);
      if (t < 0 || t >= 1) continue;
      let nx = uy / len, ny = -ux / len;
      if (nx * (f.px - tx) < 0) { nx = -nx; ny = -ny; }
      const sd = dx * nx + dy * ny;
      if (sd < hr && sd > -K.SPIKE_W) contacts.push({ pen: hr - sd, nx, ny, spike: i });
    }
  }
  return contacts;
}

function tipHit(s) {
  for (let i = 0; i < K.SPIKE_COUNT; i++) if (distToTip(s.ball, i, s) <= K.SPIKE_KILL_DIST) return i;
  return -1;
}

// Ölüm nedeni döndürür ('spike_tip' | 'spike_crush') ya da null.
export function handleSpikes(s) {
  const ball = s.ball;
  if (tipHit(s) >= 0) return 'spike_tip';
  let contacts = spikeBodyContacts(s);
  if (contacts.length === 0) return null;
  if (ball.grounded) {
    for (let iter = 0; iter < 3 && contacts.length > 0; iter++) {
      const c = contacts[0];
      const ax = Math.max(Math.abs(c.nx), 0.3);
      ball.x += Math.sign(c.nx) * (c.pen / ax);
      ball.pushVx = Math.sign(c.nx) * K.SPIKE_PUSH_VX;
      contacts = spikeBodyContacts(s);
    }
    const residual = contacts.reduce((m, c) => Math.max(m, c.pen), 0);
    if (residual > K.SPIKE_CRUSH_TOL) return 'spike_crush';
  } else {
    for (const c of contacts) {
      ball.x += c.nx * c.pen;
      ball.y += c.ny * c.pen;
      ball.pushVx = Math.sign(c.nx) * K.SPIKE_PUSH_VX;
    }
    ball.vy = Math.max(ball.vy, K.SPIKE_PUSH_VY);
  }
  if (tipHit(s) >= 0) return 'spike_tip';
  return null;
}
