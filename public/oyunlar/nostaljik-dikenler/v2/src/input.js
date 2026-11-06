// Kontrol (§2.1, değişmez): ekranın sol/sağ yarısına dokunup basılı tutma + Sol/Sağ ok ve A/D.
// v1 dokunma deseni birebir: EN SON basılan ve hâlâ basılı parmak kazanır (touchOrder sonu),
// orta çizgi pencerenin ortası (letterbox bantları da dokunma alanı), touchcancel/blur sıfırlar.
// Faz 21 G4 düzeltmesi taşındı: ölümde basılı kalan parmak yeni koşuyu sürüklemez; yeniden
// başlatan dokunuş yöne sayılmaz; ölüm donması (hitstop) sürerken dokunuş yeniden başlatmaz.
// Tüm dokunma olaylarında preventDefault (kaydırma/zoom/sahte mouse olayı yok).
// Ek: sağ üst ses düğmesi alanına dokunuş yalnız sesi açar/kapatır, yöne sayılmaz.

export function createInput(hooks) {
  const inp = { touchOrder: [], touchDir: 0, keys: new Set(), muteTouchIds: new Set(), log: [] };
  const H = hooks;

  function touchSide(clientX) { return clientX < window.innerWidth / 2 ? -1 : 1; }

  function updateTouchDir(e) {
    const live = new Map();
    if (e && e.touches) for (const t of e.touches) live.set(t.identifier, t.clientX);
    inp.touchOrder = inp.touchOrder.filter(id => live.has(id));
    for (const id of [...inp.muteTouchIds]) if (!live.has(id)) inp.muteTouchIds.delete(id);
    inp.touchDir = inp.touchOrder.length ? touchSide(live.get(inp.touchOrder[inp.touchOrder.length - 1])) : 0;
  }

  function onTouchStart(e) {
    e.preventDefault();
    H.unlockAudio();
    if (H.isGameOver()) {
      if (H.canRestart()) {
        H.restart('touch');
        inp.touchOrder = [];
        inp.touchDir = 0;
        return;
      }
      updateTouchDir(e);
      return;
    }
    for (const t of e.changedTouches) {
      if (H.hitsMuteButton(t.clientX, t.clientY)) {
        inp.muteTouchIds.add(t.identifier);
        H.toggleMute('touch');
        continue;
      }
      if (!inp.touchOrder.includes(t.identifier)) inp.touchOrder.push(t.identifier);
    }
    updateTouchDir(e);
  }
  function onTouchMove(e) { e.preventDefault(); updateTouchDir(e); }
  function onTouchEnd(e) {
    e.preventDefault();
    H.unlockAudio(); // iOS Safari: AudioContext ancak touchend gibi bir jestte açılır
    updateTouchDir(e);
  }
  function onTouchCancel(e) { updateTouchDir(e); }
  function onBlur() { inp.touchOrder = []; inp.touchDir = 0; inp.keys.clear(); }

  const LEFT = new Set(['ArrowLeft', 'KeyA']);
  const RIGHT = new Set(['ArrowRight', 'KeyD']);
  function onKeyDown(e) {
    H.unlockAudio();
    if (LEFT.has(e.code) || RIGHT.has(e.code)) { inp.keys.add(e.code); e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'KeyM') H.toggleMute('key');
    if (e.code === 'KeyZ') H.toggleZoom('key'); // test tetikleyici: x0.65 <-> x0.5
    if (e.code === 'Space') { e.preventDefault(); if (H.isGameOver() && H.canRestart()) H.restart('key'); }
  }
  function onKeyUp(e) { inp.keys.delete(e.code); }
  function onMouseDown(e) {
    H.unlockAudio();
    if (H.hitsMuteButton(e.clientX, e.clientY)) { H.toggleMute('mouse'); return; }
    if (H.isGameOver() && H.canRestart()) H.restart('mouse');
  }

  // Klavye önce, yoksa dokunma (v1 ile aynı öncelik).
  inp.dir = function () {
    let d = 0;
    for (const c of inp.keys) { if (LEFT.has(c)) d -= 1; if (RIGHT.has(c)) d += 1; }
    if (d === 0) d = inp.touchDir;
    if (inp.forcedDir !== undefined && inp.forcedDir !== null) d = inp.forcedDir; // otopilot/test
    return Math.sign(d);
  };
  inp.clearAll = function () { inp.touchOrder = []; inp.touchDir = 0; inp.keys.clear(); };
  // Her yeniden başlatmada (dokunma, klavye, fare) ölümden kalan parmaklar yeni koşuyu sürüklemez.
  inp.clearTouches = function () { inp.touchOrder = []; inp.touchDir = 0; };

  const opt = { passive: false };
  window.addEventListener('touchstart', onTouchStart, opt);
  window.addEventListener('touchmove', onTouchMove, opt);
  window.addEventListener('touchend', onTouchEnd, opt);
  window.addEventListener('touchcancel', onTouchCancel, opt);
  window.addEventListener('blur', onBlur);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('contextmenu', e => e.preventDefault());
  return inp;
}
