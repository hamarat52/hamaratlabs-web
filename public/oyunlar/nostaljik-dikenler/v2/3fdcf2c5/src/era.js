// Çağ saati (§0, yalnız GÖRSEL katman): skor eşiklerinde (1250, 2500, 3750) 8-bit -> 16-bit ->
// 32-bit -> HD. Oyun mantığı bu modülü OKUMAZ (fizik, üretim, çarpışma çağdan bağımsız, §0.3).
// Geçiş şimdilik 0.5 sn çapraz geçiş (render iki çağı alfa ile üst üste çizer); Faz D'de kesik
// geçiş + flaş ile değişecek (§0.2). ?era=N: koşu N. çağdan başlar, eşikler ondan sonra sayılır.
import * as K from './config.js';

export function eraForScore(score, start) {
  let e = start || 0;
  for (const t of K.ERA_THRESHOLDS) if (score >= t) e++;
  return Math.min(K.ERA_COUNT - 1, e);
}

export function createEra(startEra) {
  const st = Math.max(0, Math.min(K.ERA_COUNT - 1, startEra | 0));
  const E = { start: st, cur: st, prev: null, t: 1, log: [] };

  E.reset = function () { E.cur = E.start; E.prev = null; E.t = 1; };
  // dtS: saniye. Döndürür: değiştiyse { from, to }, yoksa null.
  E.update = function (score, dtS) {
    const tg = E.locked ? E.cur : eraForScore(score, E.start); // locked: yalnız test/video (çağ sabit kayıt)
    let ev = null;
    if (tg !== E.cur) {
      ev = { from: E.cur, to: tg, score: Math.floor(score) };
      E.prev = E.cur; E.cur = tg; E.t = 0;
      E.log.push(ev);
      if (E.log.length > 32) E.log.shift();
    }
    if (E.t < 1) {
      E.t = Math.min(1, E.t + dtS / K.ERA_BLEND_S);
      if (E.t >= 1) E.prev = null;
    }
    return ev;
  };
  E.force = function (e) { // test/ölçüm: başlangıç çağını değiştir ve anında geç (geçişsiz)
    E.start = E.cur = Math.max(0, Math.min(K.ERA_COUNT - 1, e | 0)); E.prev = null; E.t = 1;
  };
  return E;
}
