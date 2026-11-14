/* Yön 3 · Ürün — dil, sahne akışı, onay kartları, sekmeler, kopyala, konsol. Tüm sayfalarda ortak. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* Doküman menüsü mobilde kapalı başlar */
  if (window.matchMedia('(max-width: 1100px)').matches) $$('.side-in[open]').forEach(function (d) { d.open = false; });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setLang(lang) {
    root.lang = lang;
    $$('[data-en],[data-en-html]').forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.innerHTML;
      el.innerHTML = lang === 'en' ? (el.dataset.enHtml !== undefined ? el.dataset.enHtml : esc(el.dataset.en)) : el.dataset.tr;
    });
    $$('[data-en-label]').forEach(function (el) {
      if (el.dataset.trLabel === undefined) el.dataset.trLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enLabel : el.dataset.trLabel);
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    try { localStorage.setItem('kt-lang', lang); } catch (e) {}
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  var q = new URLSearchParams(location.search).get('lang'), saved = null;
  try { saved = localStorage.getItem('kt-lang'); } catch (e) {}
  if ((q || saved) === 'en') setLang('en');
  var en = function () { return root.lang === 'en'; };

  /* Sahne: [data-seq] öğeleri sırayla görünür */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.stage').forEach(function (stage) {
    var seq = $$('[data-seq]', stage);
    if (!seq.length || reduce) { stage.classList.add('played'); return; }
    seq.forEach(function (el, i) { setTimeout(function () { el.classList.add('shown'); }, 500 + i * 420); });
    setTimeout(function () { stage.classList.add('played'); }, 500 + seq.length * 420 + 700);
  });

  /* Onay kartları: [data-approve] → hedef çağrı satırı data-target */
  $$('[data-approve]').forEach(function (card) {
    var res = card.querySelector('.ap-result');
    var row = card.dataset.target ? document.querySelector(card.dataset.target) : null;
    var pill = row && row.querySelector('.pill');
    function finish(ok) {
      card.classList.add('done');
      res.textContent = ok ? (en() ? 'Approved. The test refund ran in the sandbox.' : 'Onaylandı. Test iadesi test ortamında çalıştı.')
                           : (en() ? 'Cancelled. No call was made.' : 'Vazgeçildi. Çağrı yapılmadı.');
      if (row) { row.classList.remove('wait'); row.classList.add(ok ? 'ok' : 'no'); }
      if (pill) pill.textContent = ok ? (en() ? 'Approved' : 'Onaylandı') : (en() ? 'Cancelled' : 'Vazgeçildi');
    }
    var y = card.querySelector('.ap-yes'), n = card.querySelector('.ap-no');
    if (y) y.addEventListener('click', function () { finish(true); });
    if (n) n.addEventListener('click', function () { finish(false); });
  });

  /* Kurulum kapıları */
  var doors = $$('.door');
  function openDoor(d) {
    doors.forEach(function (x) {
      var on = x === d;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
  }
  doors.forEach(function (d, i) {
    d.addEventListener('click', function () { openDoor(d); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = doors[(i + (e.key === 'ArrowRight' ? 1 : doors.length - 1)) % doors.length]; openDoor(n); n.focus(); }
    });
  });

  /* Genel sekmeler: [data-tabs=ad] > [data-tab=x]  ↔  [data-tabpanel="ad:x"] */
  $$('[data-tabs]').forEach(function (list) {
    var name = list.dataset.tabs, tabs = $$('[data-tab]', list);
    function sel(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        $$('[data-tabpanel="' + name + ':' + x.dataset.tab + '"]').forEach(function (p) { p.hidden = !on; });
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; sel(n); n.focus(); e.preventDefault(); }
      });
    });
  });

  /* Kopyala */
  $$('.copy[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = $$(b.dataset.copy).filter(function (el) { return !el.closest('[hidden]'); })[0];
      if (!t) return;
      var label = b.querySelector('.copy-label') || b;
      var done = function () { var o = label.innerHTML; label.textContent = en() ? 'Copied' : 'Kopyalandı'; setTimeout(function () { label.innerHTML = o; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t.innerText).then(done, done); else done();
    });
  });

  /* Doküman konsolu: Gönder → örnek yanıt (ağ isteği yok) */
  var send = document.getElementById('gonder');
  if (send) {
    var out = document.getElementById('konsol-yanit');
    send.addEventListener('click', function () {
      out.classList.remove('ready');
      out.classList.add('loading');
      send.disabled = true;
      setTimeout(function () { out.classList.remove('loading'); out.classList.add('ready'); send.disabled = false; }, 650);
    });
  }
})();
