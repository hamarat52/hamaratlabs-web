// Dünya üretimi ve zorluk eğrisi (TASARIM-v2.md §3). v1 sketch.js Faz 6/8 üretiminin v2
// sabitleriyle birebir taşınmış hali: aynı 4 desen + ağırlıklar + borç sistemi, aynı adil dizilim
// garantisi (her satırın anchor platformu için Δx_eff <= 0.75 * X_reach), aynı aşama kapısı.
// Rastgelelik YALNIZ state.rng.random() ile (p5 random() ile aynı dizi, bkz. rng.js); görsel
// varyant seçimi Math.random kullanır ve üretim dizisine girmez.
import * as K from './config.js';

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

// ---------------------------------------------------------------------------
// Zorluk ve aşama
// ---------------------------------------------------------------------------
export function getDifficultyT(s) {
  return clamp((s.scrollSpeed - K.BASE_SCROLL_SPEED) / (K.MAX_SCROLL_SPEED - K.BASE_SCROLL_SPEED), 0, 1);
}

// Koşu süresi zorluk eğrisinin kendi durumundan geri hesaplanır (v1 getDifficultyElapsedS).
export function getDifficultyElapsedS(s) {
  const steps = Math.round(Math.log(s.scrollSpeed / K.BASE_SCROLL_SPEED) / Math.log(K.SPEED_INCREASE_FACTOR));
  return (steps * K.SPEED_INCREASE_INTERVAL + s.speedTimer) / 1000;
}

export function getStageForElapsed(e) {
  let st = 0;
  for (let k = 1; k < K.STAGE_THRESHOLDS_S.length; k++) if (e >= K.STAGE_THRESHOLDS_S[k]) st = k;
  return st;
}

export function getStage(s) { return getStageForElapsed(getDifficultyElapsedS(s)); }

function stageRamp(e, idx) {
  return clamp((e - K.STAGE_THRESHOLDS_S[idx]) / K.STAGE_RAMP_S, 0, 1);
}

export function getPlatformChances(s) {
  const e = getDifficultyElapsedS(s);
  const st = getStageForElapsed(e);
  return {
    stage: st,
    moving: st >= 1 ? K.MOVING_CHANCE_MAX * stageRamp(e, 1) : 0,
    fragile: st >= 2 ? K.FRAGILE_CHANCE_MAX * stageRamp(e, 2) : 0
  };
}

// Zorluk eğrisi: her 13 sn %9 hızlanma, x3 tavan (v1 updateGame başı).
export function updateDifficulty(s, dtMs) {
  s.speedTimer += dtMs;
  if (s.speedTimer >= K.SPEED_INCREASE_INTERVAL && s.scrollSpeed < K.MAX_SCROLL_SPEED) {
    s.scrollSpeed = Math.min(s.scrollSpeed * K.SPEED_INCREASE_FACTOR, K.MAX_SCROLL_SPEED);
    s.speedTimer = 0;
  }
  const st = getStage(s);
  if (st > s.stage) { const from = s.stage; s.stage = st; s.emit('stageUp', { from, to: st }); }
}

// ---------------------------------------------------------------------------
// Platform nesnesi
// ---------------------------------------------------------------------------
export function makePlatform(s, x, y, w, kind, motion) {
  const p = { id: s.nextPlatformId++, x, y, w, h: K.PLATFORM_H, kind, baseX: x,
              amp: 0, period: 0, phase: 0, t: 0, broken: false, isAnchor: false, rowPattern: 1,
              vis: Math.floor(Math.random() * 1e9) }; // yalnız çizim varyantı (üretim dizisine girmez)
  if (kind === 'moving' && motion) {
    p.amp = motion.amp; p.period = motion.period; p.phase = motion.phase;
    p.x = movingPlatformX(p);
  }
  return p;
}

export function movingPlatformX(p) {
  return p.baseX + p.amp * Math.sin((2 * Math.PI * p.t) / p.period + p.phase);
}

// ---------------------------------------------------------------------------
// Satır üretimi (v1 spawnRow + Faz 8 desenleri)
// ---------------------------------------------------------------------------
function pickRowPattern(s, stage) {
  let total = 0;
  for (const p of K.ROW_PATTERNS) total += p.weight;
  let r = s.rng.random(0, total);
  for (const p of K.ROW_PATTERNS) {
    if (r < p.weight) return stage >= p.minStage ? p.id : 1;
    r -= p.weight;
  }
  return 1;
}

export function wrapDx(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, Math.max(0, K.WRAP_SPAN - d));
}

// X_reach = düşüş süresi x yatay hız + genişlik toleransı (araştırma raporu §2.4).
export function rowMaxReach(rowGap, w, prevW) {
  return K.MOVE_SPEED * Math.sqrt((2 * rowGap) / K.GRAVITY) + (w + prevW) / 2;
}

function zoneCenterRange(zone, w, amp, prevCenter) {
  const z = K.LANE_ZONES[zone];
  // Bant önceki satırın merkezini izler (ekran içinde kalacak şekilde kırpılır): v1'de oyuncu her
  // zaman "kendi ekranının" içindeydi; v2'de geniş ekranda aynı yerel geometri korunur.
  const x0 = clamp(prevCenter - K.LANE_BAND_W / 2, 0, K.PLAY_W - K.LANE_BAND_W);
  const a = x0 + K.LANE_BAND_W * z[0], b = x0 + K.LANE_BAND_W * z[1];
  return [Math.max(a, w / 2 + amp + K.SIDE_CLEAR), Math.min(b, K.PLAY_W - w / 2 - amp - K.SIDE_CLEAR)];
}

// --- Sütun ve yayılım (Organizer sanat-3 düzeltmesi) ---
// Son COLUMN_WINDOW-1 satırın merkezleri ve azalan ağırlıklı çeyrek sayımı tutulur (yalnız dünya durumu,
// görselden bağımsız).
function noteRow(s, centers) {
  s.recentRows = (s.recentRows || []).concat([centers]).slice(-(K.COLUMN_WINDOW - 1));
  const q = s.quarterW || (s.quarterW = [0, 0, 0, 0]);
  for (let i = 0; i < 4; i++) q[i] *= K.SPREAD_DECAY;
  for (const c of centers) q[quarterOf(c)] += 1;
}
// Yeni merkezin yasak aralıkları: verilen son nRows satırdan iki AYRI satırda aynı bantta duran (c1, c2)
// çifti varsa, ikisiyle birlikte COLUMN_BAND_W içinde kalacak her merkez yasak (nRows=2: ardışık üçüncü
// satır = sütun).
function columnForbidden(s, nRows) {
  const all = s.recentRows || [], R = all.slice(-(nRows || all.length)), out = [], B = K.COLUMN_BAND_W;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) for (const c1 of R[i]) for (const c2 of R[j]) {
    if (Math.abs(c1 - c2) >= B) continue;
    out.push([Math.max(c1, c2) - B, Math.min(c1, c2) + B]);
  }
  return out;
}
const inForbidden = (F, c) => F.some(iv => c > iv[0] && c < iv[1]);
function excludeAll(list, F) {
  for (const iv of F) list = excludeInterval(list, iv[0], iv[1]);
  return list.filter(iv => iv[1] - iv[0] > 0.01);
}
// En az görülen çeyrek (azalan ağırlıklı sayım), şimdiki çeyrek hariç; eşitlikte kenar çeyrekleri önce.
function quarterOf(c) { return Math.min(3, Math.max(0, Math.floor(c / (K.PLAY_W / 4)))); }
function targetQuarter(s, cur) {
  const q = s.quarterW || [0, 0, 0, 0];
  // kenar çeyreklerine geçişte uğranmaz (yalnız hedeflenince dolar): sayımları SPREAD_EDGE_W ile hafifletilir
  const w = i => q[i] * (i === 0 || i === 3 ? K.SPREAD_EDGE_W : 1);
  let best = -1;
  // eşitlikte (koşu başı: iki kenar da 0) taraf rng ile seçilir; sabit sıra sola kayma yaratıyordu
  const order = s.rng.random() < 0.5 ? [0, 3, 1, 2] : [3, 0, 2, 1];
  for (const i of order) if (i !== cur && (best < 0 || w(i) < w(best))) best = i;
  return best;
}
// Yayılım hedefi: en az görülen çeyrek seçilir ve varılana dek tutulur; varınca SPREAD_DWELL satır
// orada kalınmaya çalışılır (kenar çeyrekleri de dolsun), sonra yeni hedef. Döndürür: hedefe yön
// (-1 sol, +1 sağ, 0 hedefteyiz). Yalnız konum SEÇİMİNİ yönlendirir; erim ve adillik sınırları aynı.
function updateSpread(s, prevCenter) {
  const curQ = quarterOf(prevCenter);
  if (s.spreadTarget === undefined || s.spreadTarget === null) { s.spreadTarget = targetQuarter(s, curQ); s.spreadDwell = 0; }
  if (curQ === s.spreadTarget && s.spreadDwell++ >= K.SPREAD_DWELL[curQ]) { s.spreadTarget = targetQuarter(s, curQ); s.spreadDwell = 0; }
  return curQ === s.spreadTarget ? 0 : (s.spreadTarget > curQ ? 1 : -1);
}

function laneCenterIntervals(range, prevCenter, dMin, dMax) {
  const lo = range[0], hi = range[1];
  const d1 = Math.max(0, dMin + K.LANE_EPS), d2 = dMax - K.LANE_EPS;
  if (lo > hi || d2 < d1) return [];
  const out = [];
  for (const band of [[d1, d2], [K.WRAP_SPAN - d2, K.WRAP_SPAN - d1]]) {
    for (const iv of [[prevCenter + band[0], prevCenter + band[1]], [prevCenter - band[1], prevCenter - band[0]]]) {
      const a = Math.max(iv[0], lo), b = Math.min(iv[1], hi);
      if (b >= a) out.push([a, b]);
    }
  }
  return out;
}

function intersectIntervals(A, B) {
  const out = [];
  for (const a of A) for (const b of B) {
    const x = Math.max(a[0], b[0]), y = Math.min(a[1], b[1]);
    if (y >= x) out.push([x, y]);
  }
  return out;
}

function excludeInterval(list, a, b) {
  const out = [];
  for (const iv of list) {
    if (iv[1] < a || iv[0] > b) { out.push(iv); continue; }
    if (iv[0] < a) out.push([iv[0], a]);
    if (iv[1] > b) out.push([b, iv[1]]);
  }
  return out;
}

function pickInIntervals(s, list) {
  if (list.length === 0) return null;
  let total = 0;
  for (const iv of list) total += iv[1] - iv[0];
  let r = s.rng.random(0, total);
  for (const iv of list) {
    if (r <= iv[1] - iv[0]) return iv[0] + r;
    r -= iv[1] - iv[0];
  }
  return list[list.length - 1][1];
}

function shuffledCopy(s, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(s.rng.random(0, i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Aşama 0'da (şanslar 0) rng çağrılmaz. Arka arkaya iki kırılgan satır yok.
function pickPlatformKind(s, prev) {
  const c = getPlatformChances(s);
  const fragileOk = !(prev && prev.kind === 'fragile');
  const pf = fragileOk ? c.fragile : 0;
  if (pf + c.moving <= 0) return 'static';
  const r = s.rng.random();
  if (r < pf) return 'fragile';
  if (r < pf + c.moving) return 'moving';
  return 'static';
}

function rollMotion(s) {
  return { amp: s.rng.random(K.MOVING_AMP_MIN, K.MOVING_AMP_MAX),
           period: s.rng.random(K.MOVING_PERIOD_MIN_S, K.MOVING_PERIOD_MAX_S),
           phase: s.rng.random(0, Math.PI * 2) };
}

function pickLaneKind(s, prev, allowMoving) {
  let kind = pickPlatformKind(s, prev);
  if (kind === 'moving' && !allowMoving) kind = 'static';
  const motion = kind === 'moving' ? rollMotion(s) : null;
  return { kind, motion, amp: motion ? motion.amp : 0 };
}

// Tek platform ölçüsü (Fikir 30 madde 4): her desen aynı genişliği kullanır, rng'den genişlik
// çekilmez. (Eski snapWidth kancası kaldırıldı: görsel artık üretimi hiç etkilemez.)
const PW = K.PLATFORM_W;

function commitLaneRow(s, rowGap, pattern, specs) {
  const newY = s.lastSpawnY + rowGap;
  let anchor = null;
  for (const sp of specs) {
    const plat = makePlatform(s, sp.center - sp.w / 2, newY, sp.w, sp.kind, sp.motion);
    plat.rowPattern = pattern;
    plat.isAnchor = !!sp.isAnchor;
    if (sp.isRiskSpot) plat.isRiskSpot = true;
    s.platforms.push(plat);
    if (sp.isAnchor) anchor = plat;
  }
  noteRow(s, specs.map(sp => sp.center));
  s.lastSpawnY = newY;
  return anchor;
}

// Desen 2: Asimetrik Çatal.
function spawnForkRow(s, rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const mainW = PW, riskW = PW;
  const k = pickLaneKind(s, prev, true);
  const mainSafe = Math.max(0, rowMaxReach(rowGap, mainW, prevW) * K.ANCHOR_REACH_MARGIN - k.amp - prevAmp);
  const riskReach = rowMaxReach(rowGap, riskW, prevW);
  const riskMin = riskReach * K.ANCHOR_REACH_MARGIN;
  const riskMax = riskReach - prevAmp;
  const configs = shuffledCopy(s, [['C', ['L', 'R']], ['L', ['R']], ['R', ['L']]]);
  // yayılım: ana platform hedef çeyreğe doğru olan bölgede (SPREAD_TOWARD olasılıkla) önce denenir
  const sd = s.spreadDirNow || 0;
  if (sd !== 0 && s.rng.random() < K.SPREAD_TOWARD) {
    const want = sd > 0 ? 'R' : 'L', i = configs.findIndex(c => c[0] === want);
    if (i > 0) configs.unshift(configs.splice(i, 1)[0]);
  }
  const F = columnForbidden(s, 2);
  for (const cfg of configs) {
    const mainIv = excludeAll(laneCenterIntervals(zoneCenterRange(cfg[0], mainW, k.amp, prevCenter), prevCenter, 0, mainSafe), F);
    const mainC = pickInIntervals(s, mainIv);
    if (mainC === null) continue;
    const half = (mainW + riskW) / 2 + k.amp + K.LANE_MIN_GAP;
    for (const rz of shuffledCopy(s, cfg[1])) {
      let riskIv = laneCenterIntervals(zoneCenterRange(rz, riskW, 0, prevCenter), prevCenter, riskMin, riskMax);
      riskIv = excludeAll(excludeInterval(riskIv, mainC - half, mainC + half), F);
      const riskC = pickInIntervals(s, riskIv);
      if (riskC === null) continue;
      return commitLaneRow(s, rowGap, 2, [
        { center: mainC, w: mainW, kind: k.kind, motion: k.motion, isAnchor: true },
        { center: riskC, w: riskW, kind: 'static', motion: null, isRiskSpot: true }
      ]);
    }
  }
  return null;
}

// Desen 3: İkiz Sahanlık (aşama 1+).
function spawnTwinRow(s, rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const wL = PW, wR = PW;
  const sdT = s.spreadDirNow || 0; // yayılım: çapa (ana) taraf hedef çeyreğe doğru olsun
  const anchorLeft = s.rng.random() < (sdT < 0 ? K.SPREAD_TOWARD : sdT > 0 ? 1 - K.SPREAD_TOWARD : 0.5);
  const k = pickLaneKind(s, prev, true);
  const ampL = anchorLeft ? k.amp : 0, ampR = anchorLeft ? 0 : k.amp;
  const safeL = Math.max(0, rowMaxReach(rowGap, wL, prevW) * K.ANCHOR_REACH_MARGIN - ampL - prevAmp);
  const safeR = Math.max(0, rowMaxReach(rowGap, wR, prevW) * K.ANCHOR_REACH_MARGIN - ampR - prevAmp);
  const F = columnForbidden(s, 2);
  const ivL = excludeAll(laneCenterIntervals(zoneCenterRange('L', wL, ampL, prevCenter), prevCenter, 0, safeL), F);
  const ivR = excludeAll(laneCenterIntervals(zoneCenterRange('R', wR, ampR, prevCenter), prevCenter, 0, safeR), F);
  const sMin = (wL + wR) / 2 + Math.max(K.TWIN_GAP_MIN, K.LANE_MIN_GAP + 2 * k.amp);
  const sMax = (wL + wR) / 2 + K.TWIN_GAP_MAX;
  if (sMax < sMin) return null;
  const shifted = ivR.map(iv => [iv[0] - sMax, iv[1] - sMin]);
  const cL = pickInIntervals(s, intersectIntervals(ivL, shifted));
  if (cL === null) return null;
  const cR = pickInIntervals(s, intersectIntervals(ivR, [[cL + sMin, cL + sMax]]));
  if (cR === null) return null;
  const left = { center: cL, w: wL, kind: 'static', motion: null, isAnchor: false };
  const right = { center: cR, w: wR, kind: 'static', motion: null, isAnchor: false };
  const a = anchorLeft ? left : right;
  a.kind = k.kind; a.motion = k.motion; a.isAnchor = true;
  return commitLaneRow(s, rowGap, 3, anchorLeft ? [left, right] : [right, left]);
}

// Desen 4: Kenar Trampleni (aşama 2+), wrap ile tek "dikiş" platformu gibi davranır.
function spawnEdgeRow(s, rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const w = PW;
  const k = pickLaneKind(s, prev, false);
  const reach = rowMaxReach(rowGap, w, prevW);
  const safe = reach * K.ANCHOR_REACH_MARGIN - prevAmp - K.LANE_EPS;
  const cL = K.SIDE_CLEAR + w / 2;
  const cR = K.PLAY_W - K.SIDE_CLEAR - w / 2;
  const F = columnForbidden(s, 2);
  if (inForbidden(F, cL) || inForbidden(F, cR)) return null;
  const dL = wrapDx(cL, prevCenter), dR = wrapDx(cR, prevCenter);
  const okL = dL <= safe, okR = dR <= safe;
  if (!okL && !okR) return null;
  const anchorLeft = okL && okR ? s.rng.random() < 0.5 : okL;
  if ((anchorLeft ? dR : dL) > reach - prevAmp - K.LANE_EPS) return null;
  const left = { center: cL, w, kind: anchorLeft ? k.kind : 'static', motion: null, isAnchor: anchorLeft };
  const right = { center: cR, w, kind: anchorLeft ? 'static' : k.kind, motion: null, isAnchor: !anchorLeft };
  return commitLaneRow(s, rowGap, 4, anchorLeft ? [left, right] : [right, left]);
}

// Desen 1: Tekli Merkez (v1 Faz 1-7 spawnRow gövdesi).
function spawnSingleRow(s, rowGap, difficultyT, prevX, prevW, easyStart, prev) {
  const platW = PW;
  let kind = easyStart ? 'static' : pickPlatformKind(s, prev);
  let motion = kind === 'moving' ? rollMotion(s) : null;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const fallTime = Math.sqrt((2 * rowGap) / K.GRAVITY);
  const maxReach = K.MOVE_SPEED * fallTime + (platW + prevW) / 2;
  const margin = easyStart ? K.EASY_REACH_MARGIN : K.ANCHOR_REACH_MARGIN;
  const prevCenter = prevX + prevW / 2;
  const F3 = columnForbidden(s, 2);                    // kesin kural: ardışık 3 satırda aynı bant yok
  const F = F3;
  const geom = a => {
    const sr = Math.max(0, maxReach * margin - a - prevAmp);
    const lo = platW / 2 + a + K.SIDE_CLEAR, hi = K.PLAY_W - platW / 2 - a - K.SIDE_CLEAR;
    return { sr, lo, hi, free: excludeAll([[Math.max(prevCenter - sr, lo), Math.min(prevCenter + sr, hi)]], F) };
  };
  // Hareketli platformun genliği güvenli erimi daraltır; sütundan kaçacak yer kalmıyorsa platform sabit olur
  // (adillik ve sütun kuralı türden önce gelir).
  if (motion && !geom(motion.amp).free.length) { kind = 'static'; motion = null; }
  const amp = motion ? motion.amp : 0;
  const safeReach = Math.max(0, maxReach * margin - amp - prevAmp);
  const cMin = platW / 2 + amp + K.SIDE_CLEAR, cMax = K.PLAY_W - platW / 2 - amp - K.SIDE_CLEAR;
  const clip = iv => [Math.max(iv[0], cMin), Math.min(iv[1], cMax)];
  let c;
  if (easyStart) {
    // Kolay başlangıç: tek yönde EASY_STEP adımlı yumuşak merdiven (2 adım >= bant genişliği, sütun olmaz;
    // adım kolay erim içinde: 0.3 x X_reach = 27.8 px). Yön koşu başında bir kez seçilir.
    if (s.easyDir === undefined || s.easyDir === 0) s.easyDir = s.rng.random() < 0.5 ? -1 : 1;
    const step = Math.min(safeReach, s.rng.random(K.EASY_STEP_MIN, K.EASY_STEP_MAX));
    c = clamp(prevCenter + s.easyDir * step, cMin, cMax);
    if (inForbidden(F3, c)) { // sütun olmasın: kolay erim içindeki EN YAKIN serbest nokta (merdiven gibi yana kayar)
      const free = excludeAll([clip([prevCenter - safeReach, prevCenter + safeReach])], F3);
      let best = null;
      for (const iv of free) for (const x of iv) if (best === null || Math.abs(x - c) < Math.abs(best - c)) best = x;
      if (best !== null) c = best;
      else s.columnFallbacks = (s.columnFallbacks || 0) + 1;
    }
  } else {
    // Dizilim zorluğu: |kayma| alt sınırı difficultyT ile büyür (üst sınır safeReach, adillik aynı).
    // Kenara çarpan taraf kırpılır (alt sınır korunur, kayma 0'a inmez), sütun bantları dışlanır; yön,
    // son satırlarda en az görülen çeyreğe doğru SPREAD_TOWARD olasılıkla seçilir (yatay yayılım).
    // Kesin kural F3 (ardışık 3 satırda aynı bant yok) ile taraflar kurulur; alt sınır sığmazsa bırakılır.
    // Taraf (yön) yalnız yayılım hedefiyle seçilir; SONRA o tarafın içinde merdiven tercihi uygulanır
    // (aşağıda: son satırların yatay yayılımı LADDER_SPAN_MIN altına düşmesin).
    const lo = safeReach * K.OFFSET_MIN_FRAC_MAX * difficultyT;
    let left = [], right = [];
    for (const l0 of [lo, 0]) {
      left = excludeAll([clip([prevCenter - safeReach, prevCenter - l0])], F3);
      right = excludeAll([clip([prevCenter + l0, prevCenter + safeReach])], F3);
      if (left.length || right.length) break;
    }
    // Yayılım yönü spawnRow'da satır başına bir kez güncellenir (updateSpread).
    const curQ = quarterOf(prevCenter);
    const r = s.rng.random();
    let side;
    if (curQ === s.spreadTarget) {
      const qa = curQ * K.PLAY_W / 4, qb = qa + K.PLAY_W / 4;
      const inq = l => l.map(iv => [Math.max(iv[0], qa), Math.min(iv[1], qb)]).filter(iv => iv[1] > iv[0]);
      const L = inq(left), Rr = inq(right);
      side = L.length && Rr.length ? (r < 0.5 ? Rr : L) : (L.length ? L : Rr);
      if (!side.length) side = r < 0.5 ? right : left;
    } else {
      const pR = s.spreadTarget > curQ ? K.SPREAD_TOWARD : 1 - K.SPREAD_TOWARD;
      side = r < pR ? right : left;
    }
    if (!side.length) side = side === right ? left : right;
    if (!side.length) side = right.length ? right : left;
    if (side.length) {
      // Merdiven/sütun önleme (tercih): son COLUMN_WINDOW-1 satır + yeni satırın yatay yayılımı en az
      // LADDER_SPAN_MIN olsun (dar bantta zikzak da dikey sütun gibi görünür); tarafı boşaltıyorsa uygulanmaz.
      // Kademeli: son k satır + yeni satır için eşik LADDER_SPAN_MIN * (k+1) / COLUMN_WINDOW (k = 3..5), ki
      // erim yetmeden önce yayılım büyümeye başlasın.
      const RR = s.recentRows || [];
      const cuts = [];
      for (let k = 3; k <= K.COLUMN_WINDOW - 1 && k <= RR.length; k++) {
        let mn = Infinity, mx = -Infinity;
        for (const row of RR.slice(-k)) for (const x of row) { mn = Math.min(mn, x); mx = Math.max(mx, x); }
        const th = K.LADDER_SPAN_MIN * (k + 1) / K.COLUMN_WINDOW;
        if (mx - mn < th) cuts.push([mx - th, mn + th]);
      }
      const pref = l => { for (const [a, b] of cuts) l = excludeInterval(l, a, b); return l.filter(iv => iv[1] - iv[0] > 0.01); };
      let pick = pref(side);
      if (!pick.length) pick = pref(left.concat(right)); // yayılım hedefinden (kalıştan) vazgeçilir, merdiven olmaz
      c = pickInIntervals(s, pick.length ? pick : side);
    }
    else { // hiç serbest yer yok (ölçümde görülmedi): kuralsız yarım kayma, sayılır
      s.columnFallbacks = (s.columnFallbacks || 0) + 1;
      s.lastFallback = { prevCenter, safeReach, lo, F, cMin, cMax, amp, prevAmp, rows: s.recentRows };
      c = clamp(prevCenter + (r < 0.5 ? -1 : 1) * safeReach * 0.5, cMin, cMax);
    }
  }
  const newX = c - platW / 2;
  const newY = s.lastSpawnY + rowGap;
  const plat = makePlatform(s, newX, newY, platW, kind, motion);
  s.platforms.push(plat);
  noteRow(s, [c]);
  s.lastSpawnY = newY;
  return plat;
}

export function resetRowPatternStats(s) {
  s.rowPatternStats = { requested: [0, 0, 0, 0, 0], actual: [0, 0, 0, 0, 0], fallbacks: 0, debt: [0, 0, 0, 0, 0] };
}

// Bir satır üretir, satırın ANCHOR platformunu döndürür (sonraki satırın prev'i).
export function spawnRow(s, prevX, prevW, easyStart, prev) {
  const difficultyT = getDifficultyT(s);
  const rowGap = K.ROW_GAP_BASE + s.rng.random(0, K.ROW_GAP_VARIANCE_MAX * difficultyT);
  const stage = easyStart ? 0 : getStage(s);
  if (!easyStart) s.spreadDirNow = updateSpread(s, prevX + prevW / 2);
  const requested = easyStart ? 1 : pickRowPattern(s, stage);
  let anchor = null;
  if (!easyStart) {
    const debt = s.rowPatternStats.debt;
    if (requested !== 1) debt[requested] = Math.min(K.ROW_PATTERN_DEBT_MAX, debt[requested] + 1);
    for (const id of K.ROW_PATTERN_DEBT_ORDER) {
      if (debt[id] <= 0) continue;
      if (id === 2) anchor = spawnForkRow(s, rowGap, prevX, prevW, prev);
      else if (id === 3) anchor = spawnTwinRow(s, rowGap, prevX, prevW, prev);
      else if (id === 4) anchor = spawnEdgeRow(s, rowGap, prevX, prevW, prev);
      if (anchor) { debt[id]--; break; }
    }
  }
  if (!anchor) {
    anchor = spawnSingleRow(s, rowGap, difficultyT, prevX, prevW, easyStart, prev);
    anchor.isAnchor = true;
    anchor.rowPattern = 1;
  }
  anchor.rowGap = rowGap; // test/ölçüm: bu satırın bir öncekine dikey uzaklığı
  anchor.prevCenter = prevX + prevW / 2;
  anchor.prevW = prevW;
  s.rowPatternStats.requested[requested]++;
  s.rowPatternStats.actual[anchor.rowPattern]++;
  if (anchor.rowPattern !== requested) s.rowPatternStats.fallbacks++;
  s.rowLog.push({ y: anchor.y, gap: rowGap, w: anchor.w, cx: anchor.x + anchor.w / 2, pattern: anchor.rowPattern,
                  kind: anchor.kind, amp: anchor.amp, dx: wrapDx(anchor.baseX + anchor.w / 2, prevX + prevW / 2),
                  reach: rowMaxReach(rowGap, anchor.w, prevW), prevAmp: prev && prev.amp ? prev.amp : 0,
                  easy: !!easyStart, t: s.runTimeS });
  if (s.rowLog.length > 4000) s.rowLog.shift();
  s.emit('rowSpawn', anchor);
  return anchor;
}

// Koşu başı: ilk platform topun altında, ufuk dolana dek satır (ilk 3 satır kolay başlangıç).
export function fillInitialRows(s) {
  const first = makePlatform(s, K.PLAY_W / 2 - PW / 2, s.ball.y + K.BALL_R + 2, PW, 'static', null);
  first.isAnchor = true;
  s.platforms.push(first);
  s.ball.currentPlatform = first;
  s.lastSpawnY = first.y;
  s.recentRows = []; s.quarterW = [0, 0, 0, 0]; s.columnFallbacks = 0; s.easyDir = 0; s.spreadTarget = null; s.spreadDwell = 0; s.spreadDirNow = 0;
  noteRow(s, [K.PLAY_W / 2]);
  let prev = first, rowIndex = 0;
  while (s.lastSpawnY < K.SPAWN_HORIZON) {
    prev = spawnRow(s, prev.baseX, prev.w, rowIndex < K.EASY_START_ROWS, prev);
    rowIndex++;
  }
}

// Ufuk boşaldıkça en alttaki satırın anchor'ından zincir sürer.
export function ensureRows(s) {
  if (s.platforms.length === 0) return;
  let last = s.platforms[0];
  for (const p of s.platforms) {
    if (p.y > last.y || (p.y === last.y && p.isAnchor && !last.isAnchor)) last = p;
  }
  while (s.lastSpawnY < K.SPAWN_HORIZON) last = spawnRow(s, last.baseX, last.w, false, last);
}

export function cullPlatforms(s) {
  s.platforms = s.platforms.filter(p => p.y > K.CULL_Y && !p.broken);
}
