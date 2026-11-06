// Tohumlanabilir RNG. p5.js 1.9 randomSeed()/random() ile BİREBİR aynı LCG ve aralık kuralı:
// aynı tohumla v1 (p5 random) ve v2 aynı sayı dizisini çeker -> desen/geometri kararları
// satır satır karşılaştırılabilir (yan yana his testi, tools/v2-tests/test_compare_v1.js).
// Tohumsuz kullanımda Math.random tabanlıdır (canlı oyun).

const M = 4294967296, A = 1664525, C = 1013904223;

export function createRng(seed) {
  let state = seed == null ? null : (seed >>> 0);
  function next01() {
    if (state === null) return Math.random();
    state = (A * state + C) % M;
    return state / M;
  }
  // p5 random(): () -> [0,1); (max) -> [0,max); (min, max) -> takaslı aralık
  function random(min, max) {
    const r = next01();
    if (min === undefined) return r;
    if (max === undefined) return r * min;
    if (min > max) { const t = min; min = max; max = t; }
    return r * (max - min) + min;
  }
  function setSeed(s) { state = s == null ? null : (s >>> 0); }
  function getState() { return state; }
  return { random, setSeed, getState };
}
