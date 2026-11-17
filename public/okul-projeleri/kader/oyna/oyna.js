/* KADER tarayıcıda oyna: emülatör sayfasının küçük yardımcısı.
   - Diski ve RUN"KADER komutunu emülatöre URL parametresiyle verir (sokol_args adresi okur).
   - Esc emülatöre gitmez (CPC'de ESC programı durdurur); üst sayfaya "çık" der.
   - Üst sayfa ekran tuşlarını ve sesi window.kaderTus / window.kaderSes ile yönetir (aynı köken). */
(() => {
  const DISK = '/okul-projeleri/kader/kader.dsk';
  // Adres parametreleri her zaman sabitlenir: başka disk ya da başka komut verilemez.
  const q = `?file=${encodeURIComponent(DISK)}&input=${encodeURIComponent('run"kader\n')}`;
  if (location.search !== q) history.replaceState(null, '', location.pathname + q);

  window.Module = {
    canvas: document.getElementById('canvas'),
    print: () => {},
    printErr: () => {},
  };

  const ust = window.parent !== window ? window.parent : null;
  const haber = (tur) => { if (ust) ust.postMessage({ kader: tur }, location.origin); };

  // sokol klavyeyi window üzerinde yakalama evresinde dinler; bu dinleyici ondan önce kaydedilir.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopImmediatePropagation(); e.preventDefault();
      if (document.activeElement) document.activeElement.blur();
      try { if (ust) ust.focus(); } catch { /* aynı köken değilse yalnız haber yeter */ }
      haber('cik');
    }
  }, true);
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  // Ekran tuşları: 1-4 karakter olayı, SPACE ve RETURN tuş olayı olarak gider.
  const KOD = { ' ': ['Space', 32], Enter: ['Enter', 13] };
  window.kaderTus = (tus) => {
    const ozel = KOD[tus];
    const kod = ozel ? ozel[0] : `Digit${tus}`;
    const kc = ozel ? ozel[1] : tus.charCodeAt(0);
    const ortak = { key: tus, code: kod, keyCode: kc, which: kc, bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', ortak));
    if (!ozel) window.dispatchEvent(new KeyboardEvent('keypress', { ...ortak, charCode: kc }));
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', ortak)), 90);
  };

  // Ses: sokol_audio bağlamı askıya alınınca kendini yeniden başlatır; bu yüzden düğümü çıkışdan ayırıp bağlarız.
  let sesAcik = true;
  window.kaderSes = (acik) => {
    sesAcik = acik;
    const M = window.Module; const node = M && M._saudio_node; const ctx = M && M._saudio_context;
    if (!node || !ctx) return;
    try {
      if (acik) { node.connect(ctx.destination); if (ctx.state !== 'running') ctx.resume().catch(() => {}); }
      else node.disconnect();
    } catch { /* zaten bağlı ya da ayrık */ }
  };
  // Ses düğümü emülatör açılınca oluşur; kapalı istendiyse oluşur oluşmaz ayır.
  const bekle = setInterval(() => {
    if (window.Module && window.Module._saudio_node) { clearInterval(bekle); if (!sesAcik) window.kaderSes(false); }
  }, 250);

  document.getElementById('canvas').addEventListener('contextmenu', (e) => e.preventDefault());
  document.getElementById('canvas').addEventListener('pointerdown', () => { window.focus(); haber('odak'); });
  window.addEventListener('focus', () => haber('odak'));
  window.addEventListener('blur', () => haber('birak'));
})();
