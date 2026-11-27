/* Swapline (working name) sahne motoru. Bağımlılık yok; file:// ve alt yolda çalışır.
   - Dil: [data-tr] öğelerinin içeriği EN <-> TR. Öncelik: ?lang=, localStorage, EN.
   - Görünüm: [data-mod="human|agent"] (düğme ya da bağlantı). ?mode=agent ya da #agent ajan görünümünü açar.
     Şalter her görünümde sabit; seçim adrese yazılır (aynı adres, ?mode=agent).
   - Kaydırma: [data-sahne] bölümüne --p (0..1). [data-at] eşiği geçince .on, [data-durum] .etkin, [data-say] sayar.
   - Dar ekranda (<760 px) ve az harekette sahneler yapışkan değil, akar. Az harekette her şey baştan görünür. */
(function () {
  var kok = document.documentElement;
  kok.classList.add('js');
  var q = new URLSearchParams(location.search);
  var azaltMq = matchMedia('(prefers-reduced-motion: reduce)');
  var dar = matchMedia('(max-width: 759px)');
  var sahneler = [].slice.call(document.querySelectorAll('[data-sahne]'));

  function azalt() { return azaltMq.matches; }
  function kis(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function yumusak(x) { return x * x * (3 - 2 * x); }
  function yerel() { return kok.lang === 'tr' ? 'tr-TR' : 'en-US'; }

  function say(s, p, akis) {
    s.querySelectorAll('[data-say]').forEach(function (el) {
      var hedef = parseFloat(el.dataset.say);
      var at = parseFloat(el.dataset.at || '0');
      var k;
      if (azalt()) k = 1;
      else if (akis) k = el.classList.contains('on') ? 1 : 0;
      else k = yumusak(kis((p - at) / 0.25));
      el.textContent = Math.round(hedef * k).toLocaleString(yerel());
    });
  }

  function tick() {
    var vh = window.innerHeight;
    var az = azalt();
    var akis = dar.matches || az;
    sahneler.forEach(function (s) {
      var r = s.getBoundingClientRect();
      var p;
      if (akis) {
        p = kis((vh - r.top) / (vh + r.height * 0.5));
      } else {
        var yol = r.height - vh;
        p = yol > 0 ? kis(-r.top / yol) : (r.top < vh * 0.5 ? 1 : 0);
      }
      if (az) p = 1;
      s.style.setProperty('--p', p.toFixed(4));
      s.querySelectorAll('[data-at]').forEach(function (el) {
        var on;
        if (az) on = true;
        else if (akis) on = el.classList.contains('on') || el.getBoundingClientRect().top < vh * 0.92;
        else on = p >= parseFloat(el.dataset.at);
        el.classList.toggle('on', on);
      });
      s.querySelectorAll('[data-durum]').forEach(function (el) {
        var on = az || (akis ? el.getBoundingClientRect().top < vh * 0.7 : p >= parseFloat(el.dataset.durum));
        el.classList.toggle('etkin', on);
      });
      say(s, p, akis);
    });
  }

  var bekliyor = false;
  function istek() {
    if (bekliyor) return;
    bekliyor = true;
    var bitti = false;
    function calis() { if (bitti) return; bitti = true; bekliyor = false; tick(); }
    requestAnimationFrame(calis);
    setTimeout(calis, 80); /* gizli sekmede rAF durur; yedek */
  }

  function adresYaz(f) {
    try {
      var u = new URL(location.href);
      f(u);
      history.replaceState(null, '', u.toString());
    } catch (e) { /* file:// kısıtı */ }
  }

  function dilKur(l, yaz) {
    document.querySelectorAll('[data-tr]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = l === 'tr' ? el.dataset.tr : el.dataset.en;
    });
    document.querySelectorAll('[data-tr-label]').forEach(function (el) {
      if (el.dataset.enLabel === undefined) el.dataset.enLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', l === 'tr' ? el.dataset.trLabel : el.dataset.enLabel);
    });
    kok.lang = l;
    document.querySelectorAll('[data-dil]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.dil === l));
    });
    try { localStorage.setItem('swl-dil', l); } catch (e) { /* file:// */ }
    if (yaz) adresYaz(function (u) { u.searchParams.set('lang', l); });
    tick();
  }

  function modKur(m, yaz) {
    var ajan = m === 'agent';
    document.body.classList.toggle('mod-ajan', ajan);
    document.querySelectorAll('.salter [data-mod]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mod === m));
    });
    if (yaz) {
      adresYaz(function (u) {
        if (ajan) u.searchParams.set('mode', 'agent'); else u.searchParams.delete('mode');
        u.hash = '';
      });
      window.scrollTo(0, 0);
      var hedef = document.getElementById(ajan ? 'agent' : 'top');
      if (hedef) hedef.focus({ preventScroll: true });
    }
    tick();
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-dil]');
    if (d) { dilKur(d.dataset.dil, true); return; }
    var m = e.target.closest('[data-mod]');
    if (m) { e.preventDefault(); modKur(m.dataset.mod, true); }
  });
  window.addEventListener('scroll', istek, { passive: true });
  window.addEventListener('resize', istek);
  [dar, azaltMq].forEach(function (mq) { if (mq.addEventListener) mq.addEventListener('change', istek); });

  var ilkDil = q.get('lang');
  if (!ilkDil) { try { ilkDil = localStorage.getItem('swl-dil'); } catch (e) { ilkDil = null; } }
  dilKur(ilkDil === 'tr' ? 'tr' : 'en');
  modKur(q.get('mode') === 'agent' || location.hash === '#agent' ? 'agent' : 'human', false);

  window.SWL = { tick: tick, dilKur: dilKur, modKur: modKur };
})();
