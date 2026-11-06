// Varlık yükleme katmanı: çağ başına sprite atlası (PNG) + JSON. Oyun mantığı bu modülü okumaz;
// yalnız çizim (render.js) ve platform genişliği kancası (snapWidth) kullanır.
//
// İki kaynak:
//  1) assets/eras/era{0..3}.{png,json} (schema 2, v2/tools/varlik-hatti/hat.py üretir): üretilmiş
//     piksel temalar. Tümü preload'da yüklenir (§0.4: çağ değişiminde yeni dosya yüklenmez).
//  2) assets/atlas.{png,json} (schema 1, Faz A geçici yer tutucu): çağ atlası yoksa yedek.
// Hiçbiri yüklenemezse çizim prosedürel şekillere düşer (oyun kırılmaz, konsola uyarı).
//
// Platform 'pieces' (schema 2): her parça {frame, asset, scale, surface: {x0, x1, y}, cut, seams,
// ext}. Çarpışma = oyunun platform kutusu (x, y, w); parça, üst yüzeyi (surface) bu kutunun üst
// çizgisine oturacak şekilde çizilir. Genişlik eşleştirme TAM: 'orta' kesimli parçada sütunlar
// [0, c) + [c+d, w) çizilir (d > 0 ortadan d sütun çıkar, d < 0 [c+d, c) tekrar eder; c, hattın
// en az görünür dikiş için seçtiği sütun: seams[d-1] / ext[-d-1]). Yeni piksel üretilmez, yalnız
// var olan sütunlar yeniden dizilir. Bu yüzden üretim genişliği çağdan bağımsız kalır (snapWidth
// kimlik), çağ değişince sahnedeki platformların çarpışması değişmez.
// Seçim: genişliğe en yakın oturan parça (en az kesim/uzatma), aynı varlık art arda gelmez
// (plat.id - 1'in varlığı cezalı), eşitlikte plat.vis ile deterministik çeşitlilik.

const CACHE_MAX = 256;

function hashf(a, b) {
  let h = (Math.imul((a | 0) ^ 0x27d4eb2d, 0x85ebca6b) ^ Math.imul((b | 0) + 0x165667b1, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export function createAssets(p) {
  const A = { img: null, json: null, ready: false, failed: false, family: 'default',
              stats: { draws: 0, picks: 0, repeats: 0, fallbacks: 0 }, eras: [], era: 0 };

  A.preload = function (base, eraCount) {
    A.json = p.loadJSON(base + 'atlas.json', () => {}, () => { A.failed = true; console.warn('[v2] atlas.json yüklenemedi'); });
    A.img = p.loadImage(base + 'atlas.png', () => {}, () => { A.failed = true; console.warn('[v2] atlas.png yüklenemedi'); });
    for (let e = 0; e < (eraCount || 0); e++) {
      const E = { era: e, failed: false, ready: false, cache: new Map(), pattern: null, src: null };
      E.json = p.loadJSON(base + 'eras/era' + e + '.json', () => {}, () => { E.failed = true; console.warn('[v2] era' + e + '.json yüklenemedi'); });
      E.img = p.loadImage(base + 'eras/era' + e + '.png', () => {}, () => { E.failed = true; console.warn('[v2] era' + e + '.png yüklenemedi'); });
      A.eras.push(E);
    }
  };

  A.init = function () {
    A.ready = !!(!A.failed && A.img && A.img.width > 0 && A.json && A.json.frames);
    A.placeholderSrc = A.ready ? (A.img.canvas || A.img.elt) : null;
    for (const E of A.eras) {
      E.ready = !!(!E.failed && E.img && E.img.width > 0 && E.json && E.json.frames && E.json.platforms);
      if (!E.ready) continue;
      E.src = E.img.canvas || E.img.elt;
      E.frames = E.json.frames;
      // Atlas karelerini ayrı küçük kanvaslara böl: büyük (1024 px) bir kanvastan alt dikdörtgen
      // çizmek her drawImage çağrısında kaynağın anlık kopyasını tetikliyor (ölçüldü: headless
      // Chrome'da 30 platform çizimi 83 ms; küçük kaynaktan 0.7 ms). Atlas teslim biçimi olarak
      // kalır (tek PNG/çağ), bölme yalnız açılışta bir kez.
      E.sprites = {};
      for (const name in E.frames) {
        const f = E.frames[name];
        const c = document.createElement('canvas');
        c.width = f.w; c.height = f.h;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(E.src, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
        E.sprites[name] = c;
      }
      E.structByKind = {};
      for (const st of (E.json.layers && E.json.layers.structures) || []) E.structByKind[st.kind] = st;
      // Tavan dişi dizilimi: deterministik, art arda aynı diş yok.
      const units = (E.json.ceiling && E.json.ceiling.units) || [];
      E.pattern = [];
      for (let i = 0, last = -1; i < 64; i++) {
        let k = Math.floor(hashf(i * 31 + 7, E.era + 101) * units.length);
        if (units.length > 1 && k === last) k = (k + 1) % units.length;
        E.pattern.push(k); last = k;
      }
      // Gökyüzü dikey ayna kopyası (dikişsiz sonsuz kayma): mevcut pikseller ters çevrilir.
      const sky = E.json.layers && E.json.layers.sky ? E.frames[E.json.layers.sky.frame] : null;
      if (sky && typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = sky.w; c.height = sky.h;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.translate(0, sky.h); g.scale(1, -1);
        g.drawImage(E.sprites.sky, 0, 0);
        E.skyFlip = c;
      }
    }
    return A.ready || A.eras.some(E => E.ready);
  };

  A.hasEra = e => !!(A.eras[e] && A.eras[e].ready);
  A.eraAtlas = e => (A.hasEra(e) ? A.eras[e] : null);
  // Önceden çizilmiş yuvarlanma kareleri: atlas 'top_r0'..'top_r{n-1}' (yoksa 0, tek 'ball' karesi).
  A.rollCount = function (e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    if (!E) return 0;
    if (E.rollN == null) { let n = 0; while (E.frames['top_r' + n]) n++; E.rollN = n; }
    return E.rollN;
  };
  A.setEra = function (e) { A.era = e; };
  A.frame = function (name, e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    if (E) return E.frames[name] || null;
    return A.ready ? A.json.frames[name] || null : null;
  };
  A.platformDef = function (e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    if (E) return E.json.platforms[A.family] || null;
    return A.ready && A.json.platforms ? A.json.platforms[A.family] || null : null;
  };

  // Üretim kancası. Schema 2 parçaları kesim/uzatma ile HER genişliğe tam oturur: kimlik (üretim
  // v1 ile aynı sayı dizisini korur). Yalnız eski schema 1 'pieces' (dikişsiz) ailesinde oturtma.
  A.snapWidth = function (w) {
    if (A.eras.some(E => E.ready)) return w;
    const d = A.ready && A.json.platforms ? A.json.platforms[A.family] : null;
    if (!d || d.type !== 'pieces' || !d.pieces.length || d.pieces[0].seams) return w;
    let best = null, bd = Infinity;
    for (const pc of d.pieces) {
      const sw = pc.surface.x1 - pc.surface.x0, dd = Math.abs(sw - w);
      if (dd < bd) { bd = dd; best = sw; }
    }
    return best;
  };

  function srcFor(e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    return E ? E.src : A.placeholderSrc;
  }

  A.drawFrame = function (name, dx, dy, dw, dh, e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    if (E) {
      const f = E.frames[name], s = E.sprites[name];
      if (!f || !s) return false;
      p.drawingContext.drawImage(s, dx, dy, dw == null ? f.w : dw, dh == null ? f.h : dh);
      A.stats.draws++;
      return true;
    }
    const f = A.frame(name, e), src = srcFor(e);
    if (!f || !src) return false;
    p.drawingContext.drawImage(src, f.x, f.y, f.w, f.h, dx, dy, dw == null ? f.w : dw, dh == null ? f.h : dh);
    A.stats.draws++;
    return true;
  };
  A.sprite = function (name, e) { const E = A.eraAtlas(e); return E ? E.sprites[name] || null : null; };

  // Platform için parça seçimi (çağ başına önbellek, plat.id anahtarlı).
  function pickPiece(E, plat, w) {
    const key = plat.id;
    const hit = E.cache.get(key);
    if (hit && hit.w === w) return hit;
    const pieces = E.json.platforms[A.family].pieces;
    const prev = E.cache.get(key - 1), prev2 = E.cache.get(key - 2);
    const prevAsset = prev ? prev.asset : null, prev2Asset = prev2 ? prev2.asset : null;
    let best = null, bs = Infinity;
    for (let i = 0; i < pieces.length; i++) {
      const pc = pieces[i], sw = pc.surface.x1 - pc.surface.x0, dd = sw - w;
      let fit;
      if (pc.cut === 'orta') {
        if (dd > 0 && dd > pc.seams.length) continue;
        if (dd < 0 && -dd > pc.ext.length) continue;
        fit = dd >= 0 ? dd / sw : (-dd / sw) * 1.25; // uzatma (doku tekrarı) kesimden biraz pahalı
      } else {
        if (Math.abs(dd) > 3) continue;
        fit = Math.abs(dd) / sw;
      }
      let sc = fit + hashf(plat.vis, i) * 0.2;
      if (pc.asset === prevAsset) sc += 100;
      else if (pc.asset === prev2Asset) sc += 0.15; // çeşitlilik: iki önceki de tercih edilmez
      if (sc < bs) { bs = sc; best = { pc, dd }; }
    }
    let sel;
    if (best) {
      const { pc, dd } = best;
      const cuttable = pc.cut === 'orta' && dd !== 0;
      sel = { w, asset: pc.asset, pc, f: E.frames[pc.frame],
              d: cuttable ? dd : 0, c: cuttable ? (dd > 0 ? pc.seams[dd - 1] : pc.ext[-dd - 1]) : null,
              off: cuttable ? 0 : Math.floor(dd / 2) };
    } else { // hiçbiri oturmadı: en yakın parça ortalanır (sayılır, testte 0 beklenir)
      let pc = pieces[0], bd = Infinity;
      for (const q of pieces) { const dd = Math.abs((q.surface.x1 - q.surface.x0) - w); if (dd < bd) { bd = dd; pc = q; } }
      const dd = (pc.surface.x1 - pc.surface.x0) - w;
      sel = { w, asset: pc.asset, pc, f: E.frames[pc.frame], d: 0, c: null, off: Math.floor(dd / 2), fallback: true };
      A.stats.fallbacks++;
    }
    A.stats.picks++;
    if (sel.asset === prevAsset) A.stats.repeats++;
    E.cache.set(key, sel);
    if (E.cache.size > CACHE_MAX) { // en eski (en küçük id) kayıtlar
      let n = E.cache.size - CACHE_MAX + 32;
      for (const k of E.cache.keys()) { if (n-- <= 0) break; E.cache.delete(k); }
    }
    return sel;
  }
  A.pickPiece = function (plat, w, e) { const E = A.eraAtlas(e == null ? A.era : e); return E ? pickPiece(E, plat, w) : null; };

  // Platform: (x, y) = çarpışma kutusunun sol üstü (tam sayı), w = çarpışma genişliği.
  // Schema 3 (sanat v3, TEK ölçü 48 px): tür başına tek sprite; yüzey satırı (surfaceY) kutunun üst
  // çizgisine oturur. Oyun türü -> görsel tür: static/moving normal, fragile kirilan, spiked dikenli,
  // spring yay (Faz B türleri şimdiden taşınır; yoksa normal).
  const KIND3 = { static: 'normal', moving: 'normal', fragile: 'kirilan', spiked: 'dikenli', spring: 'yay' };
  A.platformKind3 = (plat, e) => {
    const E = A.eraAtlas(e == null ? A.era : e), k3 = E && E.json.platforms && E.json.platforms.kit48;
    if (!k3) return null;
    return k3.kinds[KIND3[plat.kind] || 'normal'] || k3.kinds.normal;
  };
  A.drawPlatform = function (plat, x, y, w, e) {
    const E = A.eraAtlas(e == null ? A.era : e);
    if (E && E.json.platforms.kit48) {
      const k3 = E.json.platforms.kit48, d = k3.kinds[KIND3[plat.kind] || 'normal'] || k3.kinds.normal;
      p.drawingContext.drawImage(E.sprites[d.frame], x + Math.round((w - k3.w) / 2), y - d.surfaceY);
      A.stats.draws++;
      return true;
    }
    if (E) {
      const sel = pickPiece(E, plat, w), f = sel.f, pc = sel.pc, ctx = p.drawingContext, s = E.sprites[pc.frame];
      const ox = x - pc.surface.x0 - sel.off, oy = y - pc.surface.y;
      if (sel.c == null) ctx.drawImage(s, ox, oy);
      else {
        const c = sel.c, r0 = c + sel.d;
        ctx.drawImage(s, 0, 0, c, f.h, ox, oy, c, f.h);
        ctx.drawImage(s, r0, 0, f.w - r0, f.h, ox + c, oy, f.w - r0, f.h);
      }
      A.stats.draws++;
      return true;
    }
    const d = A.platformDef(e);
    if (!d) return false;
    if (d.type === 'slice3') {
      const L = A.frame(d.left), R = A.frame(d.right);
      const top = y - (d.surfaceY || 0);
      if (w < L.w + R.w) { // çok dar: yalnız kapakları kırparak çiz
        const half = Math.floor(w / 2);
        p.image(A.img, x, top, half, L.h, L.x, L.y, half, L.h);
        p.image(A.img, x + half, top, w - half, R.h, R.x + R.w - (w - half), R.y, w - half, R.h);
        return true;
      }
      p.image(A.img, x, top, L.w, L.h, L.x, L.y, L.w, L.h);
      let cx = x + L.w, seg = 0;
      const end = x + w - R.w;
      while (cx < end) {
        const m = A.frame(d.mid[(plat.vis + seg * 7) % d.mid.length]);
        const dw = Math.min(m.w, end - cx);
        p.image(A.img, cx, top, dw, m.h, m.x, m.y, dw, m.h);
        cx += dw; seg++;
      }
      p.image(A.img, end, top, R.w, R.h, R.x, R.y, R.w, R.h);
      A.stats.draws++;
      return true;
    }
    if (d.type === 'pieces') { // schema 1 (dikişsiz): en yakın parça, genişlik snapWidth ile oturtulmuş
      let best = d.pieces[0], bd = Infinity;
      for (const pc of d.pieces) {
        const dd = Math.abs((pc.surface.x1 - pc.surface.x0) - w);
        if (dd < bd) { bd = dd; best = pc; }
      }
      const f = A.frame(best.frame);
      p.image(A.img, x - best.surface.x0, y - best.surface.y, f.w, f.h, f.x, f.y, f.w, f.h);
      A.stats.draws++;
      return true;
    }
    return false;
  };

  // Tavan: diş i, ucu (tipX(i), tipY(i)) ölümcül noktasına hizalanır (hitbox = görsel uç).
  // Dişin uç pikseli [tipY-1, tipY) satırında biter. Diş boyları farklı; üstte kalan kısım ekran
  // dışına taşar (tavan ekranın üst kenarıdır).
  A.drawCeiling = function (e, count, tipX, tipY) {
    const E = A.eraAtlas(e);
    if (!E || !E.json.ceiling || !E.json.ceiling.units.length) return false;
    const units = E.json.ceiling.units, ctx = p.drawingContext;
    for (let i = 0; i < count; i++) {
      const u = units[E.pattern[i % E.pattern.length]];
      const dx = Math.round(tipX(i)) - u.tip[0], dy = Math.round(tipY(i)) - 1 - u.tip[1];
      ctx.drawImage(E.sprites[u.frame], dx, dy);
    }
    A.stats.draws++;
    return true;
  };
  return A;
}
