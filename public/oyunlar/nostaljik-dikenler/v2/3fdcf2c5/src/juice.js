// His (juice) yardımcıları: saf fonksiyonlar, oyun kuralını DEĞİŞTİRMEZ (Jonasson-Purho 2012).
// Kaynak ilkeler (docs/doodle-jump-arastirma/SENTEZ.md): sarsıntı = trauma^2 (Eiserloh GDC 2016,
// Perlin benzeri yumuşak gürültü), alanı koruyan ezilme/esneme (Saint11), dönen top önceden
// çizilmiş karelerle (piksel sanatı döndürülmez), inişte kısa durma (Nijman 2013, ~20 ms).
import * as K from './config.js';

// Sarsıntı ofsetini tam piksele yuvarla. Math.round küçük genlikleri (|v| < 0.5) 0'a indirip
// sarsıntıyı erkenden öldürür; burada |v| >= SHAKE_MIN_PX ise en az 1 px (işaret korunur),
// altıysa 0 (sarsıntı biter).
export function quantizeShake(v) {
  const a = Math.abs(v);
  if (!(a >= K.SHAKE_MIN_PX)) return 0;
  return Math.sign(v) * Math.max(1, Math.round(a));
}

// 1B değer gürültüsü (tamsayı kafes + smoothstep); [-1, 1], sürekli. Perlin'in ucuz eşdeğeri.
function hash1(i, seed) {
  let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed | 0, 0xc2b2ae35);
  h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2d); h ^= h >>> 15;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}
export function noise1(x, seed) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash1(i, seed) * (1 - u) + hash1(i + 1, seed) * u;
}

export const SHAKE_FREQ = 28; // gürültü frekansı (Hz civarı): sert ama titreşim değil

// trauma (0..1), tSec: saat. Döndürür tam sayı { x, y } (ekran px).
export function shakeOffset(trauma, tSec) {
  const amp = K.SHAKE_MAX_PX * trauma * trauma;
  return { x: quantizeShake(amp * noise1(tSec * SHAKE_FREQ, 11)), y: quantizeShake(amp * noise1(tSec * SHAKE_FREQ, 23)) };
}

// Ezilme/esneme: önceden seçilmiş tam sayı boyutlar, alan 16x16=256'ya +-2% (alan korunur).
// İniş: darbe hızına göre başlangıç basamağı, sonra her 45 ms bir basamak toparlanır.
export const SQUASH_STEPS = [[20, 13], [18, 14], [17, 15], [16, 16]];
export const STRETCH_STEPS = [[16, 16], [15, 17], [14, 18]];
export const SQUASH_STEP_MS = 45;

export function landingDims(msSince, impactVy) {
  if (msSince < 0 || impactVy < 120) return null;
  const start = impactVy >= 450 ? 0 : impactVy >= 300 ? 1 : 2; // sert iniş daha çok ezer
  const i = start + Math.floor(msSince / SQUASH_STEP_MS);
  return i >= SQUASH_STEPS.length - 1 ? null : SQUASH_STEPS[i];
}
export function fallDims(vy) {
  if (vy >= 470) return STRETCH_STEPS[2];
  if (vy >= 260) return STRETCH_STEPS[1];
  return null;
}

// Yuvarlanma karesi: yatay yol / (çevre / kare sayısı). Sağa giderken kareler ileri akar.
export function rollFrame(rollDist, n) {
  if (!(n > 1)) return 0;
  const per = (2 * Math.PI * K.BALL_R) / n;
  const k = Math.floor(rollDist / per) % n;
  return k < 0 ? k + n : k;
}
