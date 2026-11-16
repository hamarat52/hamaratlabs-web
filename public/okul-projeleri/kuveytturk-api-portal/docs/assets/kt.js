/* Kuveyt Türk Developers · ortak betik (docs, kurulum, hesap).
   Dil (TR/EN, data-en), kopyala, kod sekmeleri, oturum bağlantısı; docs sayfalarında: sayfayı kopyala menüsü,
   "Bu sayfada" izleyici, mobil menü paneli ve Cmd/Ctrl+K arama paleti. Hiçbir ağ isteği yapmaz (yalnız aynı klasördeki .md dosyasını okur). */
(function () {
  'use strict';
  var root = document.documentElement;
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function $(s, el) { return (el || document).querySelector(s); }
  function en() { return root.lang === 'en'; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  window.KT = window.KT || {};
  KT.store = store;
  KT.en = en;

  /* ---- Kısa bildirim ---- */
  var toastT;
  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 1800);
  }
  KT.toast = toast;

  /* ---- Panoya kopyala (güvenli bağlam yoksa textarea yedeği) ---- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); } finally { ta.remove(); }
    });
  }
  KT.copyText = copyText;
  function copied(btn) {
    var label = btn.querySelector('.copy-label') || btn;
    var old = label.innerHTML;
    label.textContent = en() ? 'Copied' : 'Kopyalandı';
    setTimeout(function () { label.innerHTML = old; }, 1600);
  }
  KT.copied = copied;

  /* ---- TR / EN ---- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setLang(lang) {
    root.lang = lang;
    $$('[data-en],[data-en-html]').forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.innerHTML;
      if (lang === 'en') el.innerHTML = el.dataset.enHtml !== undefined ? el.dataset.enHtml : esc(el.dataset.en);
      else el.innerHTML = el.dataset.tr;
    });
    $$('[data-en-label]').forEach(function (el) {
      if (el.dataset.trLabel === undefined) el.dataset.trLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enLabel : el.dataset.trLabel);
    });
    $$('[data-en-ph]').forEach(function (el) {
      if (el.dataset.trPh === undefined) el.dataset.trPh = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', lang === 'en' ? el.dataset.enPh : el.dataset.trPh);
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    store('kt-lang', lang);
    document.dispatchEvent(new CustomEvent('kt:lang', { detail: lang }));
  }
  KT.setLang = setLang;
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  /* ---- Oturum: "Giriş yap" bağlantısı oturum varsa "Panel" olur ---- */
  if (store('kt-demo-oturum') === '1') {
    $$('[data-auth-link]').forEach(function (a) {
      a.href = a.dataset.panelHref || a.href;
      a.dataset.en = 'Dashboard';
      a.textContent = 'Panel';
    });
  }

  /* ---- Genel sekmeler (ai.html ile aynı model): [data-tabs=ad] > [data-tab=x] <-> [data-tabpanel="ad:x"] ---- */
  $$('[data-tabs]').forEach(function (list) {
    var name = list.dataset.tabs, tabs = $$('[data-tab]', list);
    function sel(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
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

  /* ---- Kod dili sekmeleri: sayfadaki tüm bloklar birlikte değişir, seçim hatırlanır ---- */
  function setCodeLang(lang) {
    $$('.cb').forEach(function (cb) {
      var tabs = $$('.cb-tabs [data-code]', cb);
      if (!tabs.length || !tabs.some(function (t) { return t.dataset.code === lang; })) return;
      tabs.forEach(function (t) {
        var on = t.dataset.code === lang;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      });
      $$('pre[data-code]', cb).forEach(function (p) { p.hidden = p.dataset.code !== lang; });
    });
    store('kt-kod-dil', lang);
  }
  KT.setCodeLang = setCodeLang;
  $$('.cb-tabs').forEach(function (list) {
    var tabs = $$('[data-code]', list);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { setCodeLang(t.dataset.code); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; setCodeLang(n.dataset.code); n.focus(); e.preventDefault(); }
      });
    });
  });
  var savedCode = store('kt-kod-dil'); if (savedCode) setCodeLang(savedCode);

  /* ---- Kopyala ---- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.cb-copy');
    if (b) {
      var cb = b.closest('.cb');
      var pre = $$('pre', cb).filter(function (p) { return !p.hidden && !p.closest('.cb-resp'); })[0];
      if (pre) copyText(pre.innerText.replace(/\n$/, '')).then(function () { copied(b); }, function () { toast(en() ? 'Copy failed' : 'Kopyalanamadı'); });
      return;
    }
    var c = e.target.closest('.copy[data-copy]');
    if (c) {
      var t = $$(c.dataset.copy).filter(function (el) { return !el.closest('[hidden]'); })[0];
      if (t) copyText(t.innerText).then(function () { copied(c); }, function () { toast(en() ? 'Copy failed' : 'Kopyalanamadı'); });
    }
  });

  var q = new URLSearchParams(location.search).get('lang');
  if ((q || store('kt-lang')) === 'en') setLang('en');

  /* ================= Yalnız doküman sayfaları ================= */
  var body = document.body;
  if (!body.classList.contains('docs')) return;

  /* ---- Sayfayı kopyala ▾ ---- */
  var mdName = body.dataset.md;
  var mdUrl = mdName ? new URL(mdName, location.href).href : '';
  var summary = (document.querySelector('meta[name="description"]') || {}).content || document.title;
  function aiPrompt(target) {
    var tr = 'Kuveyt Türk API dokümanındaki "' + document.title.split(' | ')[0] + '" sayfasını oku: ' + mdUrl + '\nÖzet: ' + summary + '\nBu sayfaya dayanarak sorularımı yanıtla; sayfada olmayan uç nokta uydurma.';
    return (target === 'claude' ? 'https://claude.ai/new?q=' : 'https://chatgpt.com/?q=') + encodeURIComponent(tr);
  }
  $$('[data-ai-open]').forEach(function (a) { a.href = aiPrompt(a.dataset.aiOpen); });
  function getMarkdown() {
    if (!mdName) return Promise.resolve($('.d-art').innerText);
    return fetch(mdName).then(function (r) { if (!r.ok) throw 0; return r.text(); }).catch(function () { return $('.d-art').innerText; });
  }
  $$('[data-pcopy]').forEach(function (b) {
    b.addEventListener('click', function () {
      getMarkdown().then(copyText).then(function () { copied(b); toast(en() ? 'Page copied as Markdown' : 'Sayfa Markdown olarak kopyalandı'); }, function () { toast(en() ? 'Copy failed' : 'Kopyalanamadı'); });
      closeMenu();
    });
  });
  var pcBtn = $('.pc-more'), pcMenu = $('.pc-menu');
  function closeMenu(focusBack) { if (!pcMenu || pcMenu.hidden) return; pcMenu.hidden = true; pcBtn.setAttribute('aria-expanded', 'false'); if (focusBack) pcBtn.focus(); }
  if (pcBtn && pcMenu) {
    pcBtn.addEventListener('click', function () {
      var open = pcMenu.hidden; pcMenu.hidden = !open; pcBtn.setAttribute('aria-expanded', String(open));
      if (open) { var f = pcMenu.querySelector('a,button'); if (f) f.focus(); }
    });
    pcMenu.addEventListener('keydown', function (e) {
      var items = $$('a,button', pcMenu), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { items[(i + 1) % items.length].focus(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { items[(i - 1 + items.length) % items.length].focus(); e.preventDefault(); }
      if (e.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pcopy')) closeMenu(); });
  }

  /* ---- "Bu sayfada" izleyici ---- */
  var heads = $$('.d-art h2[id]');
  var tocLinks = $$('.d-toc a, .side-sub a, .sb-toc-list a');
  if (heads.length && 'IntersectionObserver' in window) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en_) { if (en_.isIntersecting) current = en_.target.id; });
      if (!current) return;
      tocLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + current); });
    }, { rootMargin: '-' + (64 + 60) + 'px 0px -65% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }
  var sbToc = $('.sb-toc');
  if (sbToc) {
    sbToc.addEventListener('click', function (e) { if (e.target.closest('a')) sbToc.open = false; });
    document.addEventListener('click', function (e) { if (!e.target.closest('.sb-toc')) sbToc.open = false; });
  }

  /* ---- Mobil menü paneli ---- */
  var mp = $('#mpanel'), mpOpener = null;
  function mpOpen(btn) { if (!mp) return; mpOpener = btn; mp.hidden = false; body.classList.add('mp-open'); $('.mp-close', mp).focus(); }
  function mpClose() { if (!mp || mp.hidden) return; mp.hidden = true; body.classList.remove('mp-open'); if (mpOpener) mpOpener.focus(); }
  $$('[data-mp-open]').forEach(function (b) { b.addEventListener('click', function () { mpOpen(b); }); });
  if (mp) {
    $('.mp-close', mp).addEventListener('click', mpClose);
    mp.addEventListener('click', function (e) { if (e.target.closest('a')) mpClose(); });
    mp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') mpClose();
      if (e.key === 'Tab') {
        var f = $$('a[href],button:not([disabled])', mp), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
  }

  /* ---- Arama paleti (Cmd/Ctrl+K) ---- */
  var DATA = window.KT_ARAMA || [];
  var pal = null, palInput, palList, palSel = 0, palItems = [], palOpener = null;
  function norm(s) {
    return String(s).toLocaleLowerCase('tr').replace(/[çğıöşüâî]/g, function (c) { return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i' }[c]; });
  }
  DATA.forEach(function (d) { d._t = norm(d.t); d._all = norm(d.t + ' ' + d.s + ' ' + (d.q || '')); });
  function score(d, nq, words) {
    if (!nq) return d.k === 'Sayfa' ? 1 : 0;
    for (var i = 0; i < words.length; i++) if (d._all.indexOf(words[i]) === -1) return 0;
    var sc = 10;
    if (d._t.indexOf(nq) === 0) sc += 40; else if (d._t.indexOf(nq) > -1) sc += 25;
    if (d.k === 'Sayfa') sc += 5;
    return sc;
  }
  function hi(text, words) {
    var out = esc(text);
    if (!words.length) return out;
    var nt = norm(text), marks = [];
    words.forEach(function (w) { var i = nt.indexOf(w); if (w && i > -1) marks.push([i, i + w.length]); });
    if (!marks.length) return out;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var res = '', pos = 0;
    marks.forEach(function (m) { if (m[0] < pos) return; res += esc(text.slice(pos, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return res + esc(text.slice(pos));
  }
  function render() {
    var nq = norm(palInput.value.trim()), words = nq.split(/\s+/).filter(Boolean);
    palItems = DATA.map(function (d) { return { d: d, s: score(d, nq, words) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 14).map(function (x) { return x.d; });
    palSel = 0;
    if (!palItems.length) {
      palList.innerHTML = '';
      $('.pal-empty', pal).hidden = false;
      palInput.setAttribute('aria-activedescendant', '');
      return;
    }
    $('.pal-empty', pal).hidden = true;
    palList.innerHTML = palItems.map(function (d, i) {
      var isM = d.k === 'GET' || d.k === 'POST';
      var lbl = { 'Sayfa': ['Sayfa', 'Page'], 'Bölüm': ['Bölüm', 'Section'] }[d.k] || [d.k, d.k];
      var kind = isM ? '<span class="m m-' + d.k.toLowerCase() + '">' + d.k + '</span>' : '<span class="pk">' + (en() ? lbl[1] : lbl[0]) + '</span>';
      var title = isM ? '<code>' + hi(d.t, words) + '</code>' : hi(d.t, words);
      return '<li role="option" id="pal-o' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + kind + '<span><span class="pt">' + title + '</span><span class="ps">' + esc(d.s) + '</span></span></li>';
    }).join('');
    palInput.setAttribute('aria-activedescendant', 'pal-o0');
  }
  function move(n) {
    if (!palItems.length) return;
    palSel = (palSel + n + palItems.length) % palItems.length;
    $$('li', palList).forEach(function (li, i) { li.setAttribute('aria-selected', String(i === palSel)); if (i === palSel) li.scrollIntoView({ block: 'nearest' }); });
    palInput.setAttribute('aria-activedescendant', 'pal-o' + palSel);
  }
  function go(i) { var d = palItems[i]; if (d) { closePal(); location.href = d.u; } }
  function buildPal() {
    pal = document.createElement('div');
    pal.className = 'pal'; pal.hidden = true;
    pal.innerHTML =
      '<div class="pal-box" role="dialog" aria-modal="true" aria-label="' + (en() ? 'Search the docs' : 'Dokümanlarda ara') + '">' +
      '<div class="pal-in"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>' +
      '<input type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="' + (en() ? 'Search pages and endpoints' : 'Sayfa ya da uç nokta ara') + '">' +
      '<button type="button" class="pal-x">Esc</button></div>' +
      '<ul class="pal-res" id="pal-list" role="listbox" aria-label="' + (en() ? 'Results' : 'Sonuçlar') + '"></ul>' +
      '<p class="pal-empty" hidden>' + (en() ? 'No match. Try “rates” or “/v1/loans”.' : 'Eşleşme yok. “kur” ya da “/v1/loans” deneyin.') + '</p>' +
      '<div class="pal-foot"><span>' + (en() ? '↑ ↓ move' : '↑ ↓ seç') + '</span><span>' + (en() ? 'Enter open' : 'Enter aç') + '</span><span>' + (en() ? 'Esc close' : 'Esc kapat') + '</span></div></div>';
    document.body.appendChild(pal);
    palInput = $('input', pal); palList = $('.pal-res', pal);
    palInput.addEventListener('input', render);
    palInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
      else if (e.key === 'Enter') { go(palSel); e.preventDefault(); }
      else if (e.key === 'Escape') { closePal(); e.preventDefault(); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    palList.addEventListener('mousemove', function (e) { var li = e.target.closest('li'); if (li && +li.dataset.i !== palSel) move(+li.dataset.i - palSel); });
    palList.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) go(+li.dataset.i); });
    $('.pal-x', pal).addEventListener('click', closePal);
    pal.addEventListener('mousedown', function (e) { if (e.target === pal) closePal(); });
  }
  function openPal(opener) {
    if (!pal) buildPal();
    palOpener = opener || document.activeElement;
    pal.hidden = false; body.classList.add('mp-open');
    palInput.value = ''; render(); palInput.focus();
  }
  function closePal() {
    if (!pal || pal.hidden) return;
    pal.hidden = true;
    if (!mp || mp.hidden) body.classList.remove('mp-open');
    if (palOpener && palOpener.focus) palOpener.focus();
  }
  KT.openSearch = openPal;
  $$('[data-search]').forEach(function (b) { b.addEventListener('click', function () { if (mp && !mp.hidden) mpClose(); openPal(b); }); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (pal && !pal.hidden) closePal(); else openPal(); }
  });
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) $$('.kbd-k').forEach(function (k) { k.textContent = 'Ctrl K'; });
})();

/* Yayında enjekte edilen proje şeridi (body > sticky div) varsa üst bar onun altına iner (tur2 app.js ile aynı yöntem). */
(function () { var s = document.querySelector("body > div[style*=\"position:sticky\"]"); if (!s) return; function o() { document.documentElement.style.setProperty("--serit-h", s.offsetHeight + "px"); } o(); window.addEventListener("resize", o); })();
