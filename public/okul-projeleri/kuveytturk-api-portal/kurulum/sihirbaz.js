/* Kurulum sihirbazı (örnek akış). Ağ isteği yok; durum localStorage'da:
   kt-demo-sihirbaz (adım, uygulama, anahtar özeti), kt-demo-uygulamalar (panel listesi).
   Gizli anahtarın tamamı yalnız bellekte tutulur, kaydedilmez; yalnız son 4 karakteri saklanır. */
(function () {
  'use strict';
  var KT = window.KT;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function T(tr, en) { return KT.en() ? en : tr; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function jget(k) { try { return JSON.parse(KT.store(k) || 'null'); } catch (e) { return null; } }
  function jset(k, v) { KT.store(k, JSON.stringify(v)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ADIM_AD = [['Hesap', 'Account'], ['Uygulama', 'Application'], ['Test anahtarları', 'Sandbox keys'], ['İlk istek', 'First request'], ['Bitti', 'Done']];
  var URUN = {
    odeme: { tr: 'Ödeme', en: 'Payments', doc: 'odeme.html', m: 'POST', p: '/v1/vpos/digitalPaymentGetToken', body: 'PostDigitalPaymentGetTokenBody', model: '{ /* PostDigitalPaymentGetTokenBodyResponse */ }',
      uc: ['POST /v1/vpos/digitalPaymentGetToken', 'POST /v1/vpos/digitalPaymentQuery', 'POST /v1/vpos/sendDocument', 'POST /v1/vpos/digitalPaymentDoRefund (önce onayımı iste)'] },
    finansman: { tr: 'Finansman', en: 'Financing', doc: 'finansman.html', m: 'GET', p: '/v1/loans', model: '[ /* alanlar Swagger\'da */ ]',
      uc: ['GET /v1/loans', 'GET /v1/loans/{projectNumber}/info', 'GET /v1/loans/{projectNumber}/installments'] },
    hesap: { tr: 'Hesap verisi', en: 'Account data', doc: 'hesap-verisi.html', m: 'GET', p: '/v2/accounts/{suffix}', model: '{ /* alanlar Swagger\'da */ }',
      uc: ['GET /v2/accounts/{suffix}', 'GET /v3/accounts/{suffix}/transactions', 'GET /v2/accounts/{suffix}/transactions', 'POST /v2/accounts/transactions/receipts', 'GET /v1/data/testcustomers'] },
    bilgi: { tr: 'Bilgi servisleri', en: 'Information services', doc: 'bilgi-servisleri.html', m: 'GET', p: '/v1/fx/rates', model: '[ /* DataRatesObject */ ]',
      uc: ['GET /v1/fx/rates', 'GET /v1/data/fecs', 'GET /v1/data/branches', 'GET /v1/data/banks', 'GET /v1/data/banks/{bankId}/branches', 'GET /v1/data/atms', 'GET /v1/data/loans'] }
  };
  var SIRA = ['odeme', 'finansman', 'hesap', 'bilgi'];

  var st = jget('kt-demo-sihirbaz') || {};
  st.app = st.app || { ad: '', aciklama: '', urunler: [] };
  st.gonderilen = st.gonderilen || {};
  var secretMem = null;   // tam gizli anahtar yalnız bellekte
  var cur = 0;
  function save() { jset('kt-demo-sihirbaz', st); }

  function hesap() {
    if (KT.store('kt-demo-oturum') === '1') {
      var h = jget('kt-demo-hesap') || {};
      return { ad: h.ad || (h.email || 'Geliştirici').split('@')[0], email: h.email || '', gercek: true, amac: h.amac || [] };
    }
    if (st.hesap === 'ornek') return { ad: 'Deneme', email: 'deneme@ornek.example', gercek: false, amac: [] };
    return null;
  }

  /* ---- Adım geçerliliği ---- */
  function ok(n) {
    if (n === 1) return !!hesap();
    if (n === 2) return st.app.ad.trim().length >= 3 && st.app.urunler.length > 0;
    if (n === 3) return !!st.anahtar && !!st.saved;
    if (n === 4) return Object.keys(st.gonderilen).some(function (k) { return st.gonderilen[k] && st.app.urunler.indexOf(k) > -1; });
    return true;
  }
  function enUzak() { for (var n = 1; n <= 4; n++) if (!ok(n)) return n; return 5; }

  /* ---- Görünüm ---- */
  var form = $('#wz-form');
  var ileriT = $('#ileri-t'); delete ileriT.dataset.en;

  function go(n, odak) {
    n = Math.max(1, Math.min(n, enUzak()));
    cur = n; st.adim = n; save();
    $$('.wz-step').forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    var uzak = enUzak();
    $$('.wz-steps button').forEach(function (b) {
      var k = +b.dataset.go;
      b.classList.toggle('done', k < n || (k !== n && ok(k) && k < uzak));
      if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.disabled = k > uzak;
    });
    $('#mp-n').textContent = n + '/5';
    $('#mp-t').textContent = T(ADIM_AD[n - 1][0], ADIM_AD[n - 1][1]);
    $('#mp-bar').style.width = (n * 20) + '%';
    $('#wz-count').textContent = T('Adım ' + n + '/5: ' + ADIM_AD[n - 1][0], 'Step ' + n + '/5: ' + ADIM_AD[n - 1][1]);
    $('#geri').hidden = n === 1;
    $('#ileri').hidden = n === 5;
    ileriT.textContent = n === 4 ? T('Bitir', 'Finish') : T('İleri', 'Next');
    $$('.err').forEach(function (e) { e.textContent = ''; });
    $$('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    try { history.replaceState(null, '', location.pathname + '?adim=' + n); } catch (e) {}
    if (n === 1) adim1();
    if (n === 2) adim2();
    if (n === 3) adim3();
    if (n === 4) adim4();
    if (n === 5) adim5();
    ozet();
    if (odak) { var h = $('#h-' + n); h.focus({ preventScroll: true }); if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); }
  }

  function ozet() {
    var h = hesap();
    function set(id, v) { var d = $(id); if (v) { d.textContent = v; d.removeAttribute('data-bos'); } else { d.textContent = T('Henüz yok', 'Not yet'); d.setAttribute('data-bos', ''); } }
    set('#s-hesap', h ? (h.email || h.ad) + (h.gercek ? '' : T(' (örnek)', ' (sample)')) : '');
    set('#s-app', st.app.ad.trim().length >= 3 ? st.app.ad : '');
    set('#s-urun', st.app.urunler.map(function (k) { return T(URUN[k].tr, URUN[k].en); }).join(', '));
    set('#s-key', st.anahtar ? maskId(st.anahtar.id) : '');
    var sent = Object.keys(st.gonderilen).filter(function (k) { return st.gonderilen[k] && URUN[k]; });
    set('#s-istek', sent.length ? sent.map(function (k) { return URUN[k].m + ' ' + URUN[k].p; }).join(', ') + ' (200)' : '');
  }

  /* ---- 1. Hesap ---- */
  function adim1() {
    var h = hesap();
    var oturum = h && h.gercek;
    $('#acct-on').hidden = !oturum;
    $('#acct-off').hidden = !!oturum;
    if (oturum) {
      $('#acct-ad').textContent = h.ad;
      $('#acct-mail').textContent = h.email;
      $('#acct-av').textContent = (h.ad || '?').charAt(0).toLocaleUpperCase('tr');
    } else if (st.hesap === 'ornek') {
      $('input[name=hesap][value=ornek]').checked = true;
    }
    $('#acct-links').hidden = !($('input[name=hesap][value=kayit]').checked);
  }
  $$('input[name=hesap]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('#acct-links').hidden = r.value !== 'kayit' || !r.checked;
      $('#err-1').textContent = '';
      if (r.value === 'ornek') { st.hesap = 'ornek'; save(); ozet(); }
      else { st.hesap = null; save(); ozet(); }
    });
  });

  /* ---- 2. Uygulama ---- */
  function adim2() {
    $('#app-ad').value = st.app.ad;
    $('#app-ac').value = st.app.aciklama;
    $('#ac-say').textContent = st.app.aciklama.length;
    var sec = st.app.urunler.length ? st.app.urunler : ((hesap() || {}).amac || []);
    $$('input[name=amac]').forEach(function (c) { c.checked = sec.indexOf(c.value) > -1; });
  }
  function oku2() {
    st.app.ad = $('#app-ad').value.trim();
    st.app.aciklama = $('#app-ac').value.trim();
    st.app.urunler = $$('input[name=amac]:checked').map(function (c) { return c.value; });
    if (!st.app.id) st.app.id = 'app_' + rnd(6, '0123456789abcdef');
    save(); ozet();
  }
  $('#app-ac').addEventListener('input', function (e) { $('#ac-say').textContent = e.target.value.length; });
  ['#app-ad', '#app-ac'].forEach(function (s) { $(s).addEventListener('input', function () { if (cur === 2) oku2(); }); });
  $$('input[name=amac]').forEach(function (c) { c.addEventListener('change', function () { oku2(); $('#err-amac').textContent = ''; }); });

  /* ---- 3. Anahtarlar ---- */
  function rnd(n, abc) {
    var a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return abc[x % abc.length]; }).join('');
  }
  function maskId(id) { return 'kt_sandbox_••••••••' + id.slice(-4); }
  var gosterId = false, gosterSec = false;
  function yazAnahtar() {
    var a = st.anahtar;
    $('#k-id').textContent = gosterId ? a.id : maskId(a.id);
    var var_ = !!secretMem;
    $('#k-sec').textContent = var_ ? (gosterSec ? secretMem : '••••••••••••••••••••••••') : '••••••••' + a.son4;
    $('#sec-act').hidden = !var_;
    $('#sec-warn').hidden = !var_;
    $('#sec-gone').hidden = var_;
    $('#regen').hidden = var_;
    $$('[data-reveal]').forEach(function (b) {
      var on = b.dataset.reveal === 'id' ? gosterId : gosterSec;
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? T('Gizle', 'Hide') : T('Göster', 'Show');
    });
    $('#saved').checked = !!st.saved;
  }
  function uret(sadeceSecret) {
    var sec = rnd(32, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789');
    secretMem = 'kts_' + sec;
    if (!sadeceSecret || !st.anahtar) st.anahtar = { id: 'kt_sandbox_' + rnd(24, '0123456789abcdef'), son4: '', t: new Date().toISOString() };
    st.anahtar.son4 = secretMem.slice(-4);
    st.saved = false; gosterSec = false;
    save(); uygulamaKaydet();
  }
  function uygulamaKaydet() {
    var list = jget('kt-demo-uygulamalar') || [];
    var a = { id: st.app.id, ad: st.app.ad, aciklama: st.app.aciklama, urunler: st.app.urunler.slice(), clientId: st.anahtar.id, secSon4: st.anahtar.son4, olusturma: st.anahtar.t, ortam: 'test' };
    var i = list.findIndex(function (x) { return x.id === a.id; });
    if (i > -1) list[i] = a; else list.unshift(a);
    jset('kt-demo-uygulamalar', list);
  }
  var uretiliyor = false;
  function adim3() {
    if (st.anahtar) { $('#gen').hidden = true; $('#keys').hidden = false; uygulamaKaydet(); yazAnahtar(); return; }
    if (uretiliyor) return;
    uretiliyor = true;
    $('#gen').hidden = false; $('#keys').hidden = true;
    var lis = $$('#gen li'); lis.forEach(function (li) { li.className = ''; });
    var adim = reduce ? 0 : 380, i = 0;
    $('#ileri').setAttribute('aria-disabled', 'true');
    (function tik() {
      if (i > 0) lis[i - 1].className = 'ok';
      if (i < lis.length) { lis[i].className = 'on'; i++; setTimeout(tik, adim); return; }
      uret(false);
      setTimeout(function () {
        uretiliyor = false;
        $('#ileri').removeAttribute('aria-disabled');
        $('#gen').hidden = true; $('#keys').hidden = false; yazAnahtar(); ozet(); go(3);
        $('#h-3').focus({ preventScroll: true });
      }, adim);
    })();
  }
  $$('[data-reveal]').forEach(function (b) {
    b.addEventListener('click', function () { if (b.dataset.reveal === 'id') gosterId = !gosterId; else gosterSec = !gosterSec; yazAnahtar(); });
  });
  $$('[data-kcopy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.kcopy === 'id' ? st.anahtar.id : secretMem;
      if (!v) return;
      KT.copyText(v).then(function () { KT.copied(b); }, function () { KT.toast(T('Kopyalanamadı', 'Copy failed')); });
    });
  });
  $('#saved').addEventListener('change', function (e) { st.saved = e.target.checked; save(); $('#err-3').textContent = ''; go(3); });
  $('#regen').addEventListener('click', function () { uret(true); yazAnahtar(); KT.toast(T('Yeni gizli anahtar oluşturuldu (örnek)', 'New secret created (sample)')); });

  /* ---- 4. İlk istek ---- */
  function kod(k, dil) {
    var u = URUN[k], post = u.m === 'POST', id = st.anahtar ? maskId(st.anahtar.id) : 'kt_sandbox_••••';
    if (dil === 'curl') {
      return '<span class="c"># ' + esc(T('Token: ', 'Token: ') + id + T(' ile test kimlik sunucusundan alınır', ' used on the sandbox ID server')) + '</span>\n' +
        'curl' + (post ? ' -X POST' : '') + ' <span class="s">"{BASE_URL}' + u.p + '"</span> \\\n' +
        '  -H <span class="s">"Authorization: Bearer $KT_ACCESS_TOKEN"</span> \\\n' +
        '  -H <span class="s">"Signature: $KT_SIGNATURE"</span>' +
        (post ? ' \\\n  -H <span class="s">"Content-Type: application/json"</span> \\\n  -d @istek.json  <span class="c"># ' + u.body + '</span>' : '');
    }
    var rep = u.p.indexOf('{suffix}') > -1 ? '.replace(<span class="s">"{suffix}"</span>, suffix)' : '';
    return 'const BASE_URL = process.env.KT_BASE_URL; <span class="c">// {BASE_URL}</span>\n' +
      'const path = <span class="s">"' + u.p + '"</span>' + rep + ';\n\n' +
      'const res = await fetch(BASE_URL + path, {\n' + (post ? '  method: <span class="s">"POST"</span>,\n' : '') +
      '  headers: {\n    Authorization: <span class="s">`Bearer ${accessToken}`</span>,\n    Signature: signature,\n' +
      (post ? '    <span class="s">"Content-Type"</span>: <span class="s">"application/json"</span>,\n' : '') + '  },\n' +
      (post ? '  body: JSON.stringify(istek), <span class="c">// ' + u.body + '</span>\n' : '') +
      '});\nconst { value, success, results } = await res.json();';
  }
  var kodDil = KT.store('kt-kod-dil') === 'node' ? 'node' : 'curl';
  function adim4() {
    var urunler = SIRA.filter(function (k) { return st.app.urunler.indexOf(k) > -1; });
    if (urunler.indexOf(st.aktif) === -1) st.aktif = urunler[0];
    $('#urun-sekme').hidden = urunler.length < 2;
    $('#urun-sekme').innerHTML = urunler.map(function (k) {
      var on = k === st.aktif;
      return '<button type="button" role="tab" data-urun="' + k + '" aria-selected="' + on + '"' + (on ? '' : ' tabindex="-1"') + '>' + esc(T(URUN[k].tr, URUN[k].en)) + (st.gonderilen[k] ? ' <span class="sent" aria-label="' + T('gönderildi', 'sent') + '">200</span>' : '') + '</button>';
    }).join('');
    var u = URUN[st.aktif];
    $('#istek').innerHTML =
      '<div class="cb"><p class="cb-head"><span class="m m-' + u.m.toLowerCase() + '">' + u.m + '</span><code>' + esc(u.p) + '</code></p>' +
      '<div class="cb-bar"><div class="cb-tabs" role="tablist" aria-label="' + T('Dil', 'Language') + '">' +
      ['curl', 'node'].map(function (d) { var on = d === kodDil; return '<button type="button" role="tab" data-wzcode="' + d + '" aria-selected="' + on + '"' + (on ? '' : ' tabindex="-1"') + '>' + (d === 'curl' ? 'cURL' : 'Node.js') + '</button>'; }).join('') +
      '</div><button type="button" class="cb-copy"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5"/></svg><span class="copy-label">' + T('Kopyala', 'Copy') + '</span></button></div>' +
      '<pre><code>' + kod(st.aktif, kodDil) + '</code></pre></div>' +
      '<p class="wz-doclink"><a href="../docs/' + u.doc + '">' + esc(T(URUN[st.aktif].tr + ' dokümanı: tüm uç noktalar', URUN[st.aktif].en + ' docs: all endpoints')) + '</a></p>';
    if (st.gonderilen[st.aktif]) yanitGoster(); else { $('#yanit').hidden = true; $('#send-st').textContent = ''; }
  }
  function yanitGoster() {
    var u = URUN[st.aktif];
    $('#yanit').hidden = false;
    $('#yanit').innerHTML = '<div class="cb resp"><p class="cb-resp-bar"><span class="st-ok">200 OK</span><span class="ornek-chip">' + T('Örnek yanıt', 'Sample response') + '</span></p>' +
      '<pre><code>{\n  <span class="s">"value"</span>: <span class="c">' + esc(u.model) + '</span>,\n  <span class="s">"success"</span>: true,\n  <span class="s">"results"</span>: []\n}</code></pre></div>';
    $('#send-st').textContent = T('Örnek yanıt geldi. Ağ isteği yapılmadı.', 'Sample response shown. No network request was made.');
  }
  $('#urun-sekme').addEventListener('click', function (e) {
    var b = e.target.closest('[data-urun]'); if (!b) return;
    st.aktif = b.dataset.urun; save(); adim4(); $('[data-urun="' + st.aktif + '"]').focus();
  });
  $('#urun-sekme').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var bs = $$('[data-urun]'), i = bs.indexOf(document.activeElement);
    var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
    st.aktif = n.dataset.urun; save(); adim4(); $('[data-urun="' + st.aktif + '"]').focus(); e.preventDefault();
  });
  $('#istek').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wzcode]'); if (!b) return;
    kodDil = b.dataset.wzcode; KT.store('kt-kod-dil', kodDil); adim4(); $('[data-wzcode="' + kodDil + '"]').focus();
  });
  $('#gonder').addEventListener('click', function () {
    var b = $('#gonder');
    if (b.getAttribute('aria-busy') === 'true') return;
    b.setAttribute('aria-busy', 'true');
    $('#send-st').textContent = T('Gönderiliyor…', 'Sending…');
    $('#err-4').textContent = '';
    setTimeout(function () {
      b.removeAttribute('aria-busy');
      st.gonderilen[st.aktif] = true; save();
      adim4(); ozet(); go(4);
    }, reduce ? 0 : 700);
  });

  /* ---- 5. Bitti ---- */
  function prompt() {
    var ad = st.app.ad, urunler = SIRA.filter(function (k) { return st.app.urunler.indexOf(k) > -1; });
    var tr = '# 1) Kuveyt Türk MCP sunucusunu ekleyin (paket adı konsept)\n' +
      'claude mcp add kt-mcp -e KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}\n\n' +
      '# 2) Bu talimatı yapıştırın\n' +
      'Kuveyt Türk API Market test ortamında kurulum yapmama yardım et.\n\n' +
      'Ortam\n- API ağ geçidi: https://prep-gateway.kuveytturk.com.tr\n- Kimlik sunucusu: https://prep-identity.kuveytturk.com.tr\n- Yalnız test ortamında çalış; canlı anahtar isteme.\n\n' +
      'Adımlar\n1. Test müşterilerini listele: GET /v1/data/testcustomers\n2. Bağlantıyı doğrula: GET /v1/fx/rates\n3. Test hesabını oku: GET /v2/accounts/{suffix}\n   Hareketleri listele: GET /v3/accounts/{suffix}/transactions\n4. Ödeme akışını hazırla: POST /v1/vpos/digitalPaymentGetToken\n   Sonucu sorgula: POST /v1/vpos/digitalPaymentQuery\n\n' +
      'Kurallar\n- Her isteği Signature başlığıyla imzala (RSA-SHA256). Özel anahtarı dosyaya ya da sohbete yazma.\n- İadeden (POST /v1/vpos/digitalPaymentDoRefund) ve her para hareketinden önce dur, onayımı iste.\n- T.C. kimlik numarasını ve kart bilgisini loglara yazma.\n- Bu kuralları CLAUDE.md dosyasına kaydet.\n\n' +
      'Bu kurulum\n- Uygulama: ' + ad + '\n- Seçilen ürünler: ' + urunler.map(function (k) { return URUN[k].tr; }).join(', ') +
      '\n- Client ID ve secret ortam değişkeninde (KT_CLIENT_ID, KT_CLIENT_SECRET); değerlerini bana sorma, koda yazma.\n\n' +
      'Yalnız şu uç noktaları kullan\n' + urunler.map(function (k) { return URUN[k].tr + '\n' + URUN[k].uc.map(function (x) { return '- ' + x; }).join('\n'); }).join('\n') +
      '\n\nAyrıntı için AI paketini kullan: docs/kuveytturk/AGENTS.md';
    var en = '# 1) Add the Kuveyt Türk MCP server (package name is a concept)\n' +
      'claude mcp add kt-mcp -e KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}\n\n' +
      '# 2) Paste this prompt\n' +
      'Help me set up Kuveyt Türk API Market in the sandbox.\n\n' +
      'Environment\n- API gateway: https://prep-gateway.kuveytturk.com.tr\n- ID server: https://prep-identity.kuveytturk.com.tr\n- Work only in the sandbox; never ask for production keys.\n\n' +
      'Steps\n1. List test customers: GET /v1/data/testcustomers\n2. Check the connection: GET /v1/fx/rates\n3. Read the test account: GET /v2/accounts/{suffix}\n   List transactions: GET /v3/accounts/{suffix}/transactions\n4. Prepare the payment flow: POST /v1/vpos/digitalPaymentGetToken\n   Query the result: POST /v1/vpos/digitalPaymentQuery\n\n' +
      'Rules\n- Sign every request with the Signature header (RSA-SHA256). Never write the private key to a file or the chat.\n- Stop and ask for my approval before a refund (POST /v1/vpos/digitalPaymentDoRefund) or any money movement.\n- Never log national ID numbers or card details.\n- Save these rules to CLAUDE.md.\n\n' +
      'This setup\n- Application: ' + ad + '\n- Products: ' + urunler.map(function (k) { return URUN[k].en; }).join(', ') +
      '\n- Client ID and secret are in environment variables (KT_CLIENT_ID, KT_CLIENT_SECRET); never ask me for them or write them into code.\n\n' +
      'Use only these endpoints\n' + urunler.map(function (k) { return URUN[k].en + '\n' + URUN[k].uc.map(function (x) { return '- ' + x.replace(' (önce onayımı iste)', ' (ask me first)'); }).join('\n'); }).join('\n') +
      '\n\nFor details use the AI package: docs/kuveytturk/AGENTS.md';
    return T(tr, en);
  }
  function adim5() {
    var urunler = SIRA.filter(function (k) { return st.app.urunler.indexOf(k) > -1; });
    $('#bitti-ozet').textContent = T(
      '“' + st.app.ad + '” için test anahtarları hazır ve ilk örnek istek 200 döndü. Seçilen ürünler: ' + urunler.map(function (k) { return URUN[k].tr; }).join(', ') + '.',
      'Sandbox keys for “' + st.app.ad + '” are ready and the first sample request returned 200. Products: ' + urunler.map(function (k) { return URUN[k].en; }).join(', ') + '.');
    $('#prompt').textContent = prompt();
    $('#docs-link').href = '../docs/' + URUN[urunler[0]].doc;
  }
  $('#prompt-kopyala').addEventListener('click', function () {
    var b = $('#prompt-kopyala');
    KT.copyText(prompt()).then(function () { KT.copied(b); }, function () { KT.toast(T('Kopyalanamadı', 'Copy failed')); });
  });
  $('#sifirla').addEventListener('click', function () {
    var hes = st.hesap;
    st = { hesap: hes, app: { ad: '', aciklama: '', urunler: [] }, gonderilen: {} };
    secretMem = null; save();
    KT.toast(T('Sihirbaz sıfırlandı. Panelde oluşturulan uygulama kalır.', 'Wizard reset. The app stays in your dashboard.'));
    go(1, true);
  });

  /* ---- İleri / Geri ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('#ileri').getAttribute('aria-disabled') === 'true') return;
    if (cur === 1) {
      if (!hesap()) {
        var secim = $('input[name=hesap]:checked');
        $('#err-1').textContent = secim && secim.value === 'kayit'
          ? T('Hesap açın ya da giriş yapın; dönüşte 2. adımdan devam edersiniz.', 'Create an account or sign in; you will continue from step 2.')
          : T('Devam etmek için bir seçenek seçin.', 'Pick an option to continue.');
        (secim && secim.value === 'kayit' ? $('#acct-links a') : $('input[name=hesap]')).focus();
        return;
      }
    }
    if (cur === 2) {
      oku2();
      var hata = null;
      if (st.app.ad.length < 3) { $('#err-ad').textContent = T('Uygulama adı en az 3 karakter olmalı.', 'The name needs at least 3 characters.'); $('#app-ad').setAttribute('aria-invalid', 'true'); hata = hata || $('#app-ad'); }
      if (!st.app.urunler.length) { $('#err-amac').textContent = T('En az bir kullanım amacı seçin.', 'Pick at least one purpose.'); hata = hata || $('input[name=amac]'); }
      if (hata) { hata.focus(); return; }
      if (st.anahtar) uygulamaKaydet();
    }
    if (cur === 3 && !st.saved) {
      $('#err-3').textContent = T('Devam etmek için gizli anahtarı kaydettiğinizi onaylayın.', 'Confirm that you stored the secret to continue.');
      $('#saved').focus(); return;
    }
    if (cur === 4 && !ok(4)) {
      $('#err-4').textContent = T('Önce örnek isteği gönderin.', 'Send the sample request first.');
      $('#gonder').focus(); return;
    }
    go(cur + 1, true);
  });
  $('#geri').addEventListener('click', function () { go(cur - 1, true); });
  $$('.wz-steps button').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.go, true); }); });
  document.addEventListener('kt:lang', function () { go(cur); });

  /* ---- Başlangıç ---- */
  var params = new URLSearchParams(location.search);
  if (params.get('yeni') === '1') {
    st = { hesap: st.hesap, app: { ad: '', aciklama: '', urunler: [] }, gonderilen: {} };
    save();
  }
  var q = parseInt(params.get('adim'), 10) || (params.get('yeni') === '1' ? 2 : 0);
  go(q || st.adim || 1);
})();
