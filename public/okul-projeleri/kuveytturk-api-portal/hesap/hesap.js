/* Örnek giriş, kayıt ve panel. Ağ isteği yok; şifre hiçbir yerde tutulmaz.
   localStorage: kt-demo-hesap (e-posta, ad, şirket, rol, amaç), kt-demo-oturum ("1"),
   kt-demo-uygulamalar (sihirbazın yazdığı liste), kt-demo-canli (örnek talep durumu). */
(function () {
  'use strict';
  var KT = window.KT;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function T(tr, en) { return KT.en() ? en : tr; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function jget(k) { try { return JSON.parse(KT.store(k) || 'null'); } catch (e) { return null; } }
  function jset(k, v) { KT.store(k, JSON.stringify(v)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URUN = { odeme: ['Ödeme', 'Payments'], finansman: ['Finansman', 'Financing'], hesap: ['Hesap verisi', 'Account data'], bilgi: ['Bilgi servisleri', 'Information services'] };
  var ROL = { gelistirici: ['Geliştirici', 'Developer'], urun: ['Ürün ya da proje yöneticisi', 'Product or project manager'], yonetici: ['Kurucu ya da yönetici', 'Founder or executive'], diger: ['Diğer', 'Other'] };
  function hata(input, el, msg) { el.textContent = msg; if (input) { input.setAttribute('aria-invalid', 'true'); } }
  function temiz(form) { $$('.err', form).forEach(function (e) { e.textContent = ''; }); $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); }); }
  var sayfa = document.body.dataset.sayfa;

  /* ================= Kayıt ================= */
  if (sayfa === 'kayit') {
    var taslak = {};
    var k = 1;
    var sayac = null, yonT = null;
    function asama(n, odak) {
      k = n;
      $$('.k-stage').forEach(function (s) { s.hidden = +s.dataset.k !== n; });
      $$('.auth-prog li').forEach(function (li, i) { li.classList.toggle('on', i < n); });
      $('#prog-t').textContent = T('Adım ' + n + '/4', 'Step ' + n + '/4');
      if (odak !== false) $('#k-h' + n).focus();
      if (n === 2) {
        $('#kod-lead').innerHTML = T('Doğrulama kodu gönderildi (örnek): <b>' + esc(taslak.email) + '</b>', 'Verification code sent (sample): <b>' + esc(taslak.email) + '</b>');
        $$('#otp input').forEach(function (i) { i.value = ''; });
        setTimeout(function () { $('#otp input').focus(); }, 0);
        geriSay();
      }
    }
    function geriSay() {
      var b = $('#kod-tekrar'), s = 30;
      clearInterval(sayac);
      b.disabled = true;
      function yaz() { b.textContent = s > 0 ? T('Kodu yeniden gönder (' + s + ')', 'Resend code (' + s + ')') : T('Kodu yeniden gönder (örnek)', 'Resend code (sample)'); }
      yaz();
      sayac = setInterval(function () { s--; yaz(); if (s <= 0) { clearInterval(sayac); b.disabled = false; } }, 1000);
    }
    $('[data-k="1"]').addEventListener('submit', function (e) {
      e.preventDefault(); temiz(this);
      var mail = $('#k-mail').value.trim(), ad = $('#k-ad').value.trim(), ilk = null;
      if (!MAIL.test(mail)) { hata($('#k-mail'), $('#e-mail'), mail ? T('E-posta adresi eksik görünüyor. ad@sirket.com biçiminde yazın.', 'That email looks incomplete. Write it as name@company.com.') : T('E-posta adresinizi yazın.', 'Enter your email.')); ilk = ilk || $('#k-mail'); }
      if (ad.length < 2) { hata($('#k-ad'), $('#e-ad'), T('Adınızı ve soyadınızı yazın.', 'Enter your full name.')); ilk = ilk || $('#k-ad'); }
      if (ilk) { ilk.focus(); return; }
      taslak = { email: mail, ad: ad, sirket: $('#k-sirket').value.trim() };
      asama(2);
    });
    var otp = $$('#otp input');
    otp.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        $('#e-kod').textContent = ''; $('#otp').removeAttribute('aria-invalid');
        if (inp.value && i < otp.length - 1) otp[i + 1].focus();
        if (otp.every(function (x) { return x.value; })) $('[data-k="2"]').requestSubmit();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && i > 0) { otp[i - 1].focus(); otp[i - 1].value = ''; e.preventDefault(); }
        if (e.key === 'ArrowLeft' && i > 0) { otp[i - 1].focus(); e.preventDefault(); }
        if (e.key === 'ArrowRight' && i < otp.length - 1) { otp[i + 1].focus(); e.preventDefault(); }
      });
      inp.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (!t) return;
        e.preventDefault();
        t.split('').forEach(function (c, j) { if (otp[j]) otp[j].value = c; });
        (otp[Math.min(t.length, 5)]).focus();
        if (t.length === 6) $('[data-k="2"]').requestSubmit();
      });
    });
    $('[data-k="2"]').addEventListener('submit', function (e) {
      e.preventDefault();
      var kod = otp.map(function (x) { return x.value; }).join('');
      if (kod.length < 6) { $('#otp').setAttribute('aria-invalid', 'true'); $('#e-kod').textContent = T('6 haneyi de girin. Örnek akışta her kod çalışır.', 'Enter all 6 digits. Any code works in this sample.'); (otp.filter(function (x) { return !x.value; })[0] || otp[0]).focus(); return; }
      clearInterval(sayac);
      asama(3);
    });
    $('#kod-tekrar').addEventListener('click', function () { KT.toast(T('Örnek akış: kod gönderilmedi. Herhangi 6 hane çalışır.', 'Sample flow: no code sent. Any 6 digits work.')); geriSay(); });
    $('#mail-degistir').addEventListener('click', function () { clearInterval(sayac); asama(1); $('#k-mail').focus(); });
    $('[data-k="3"]').addEventListener('submit', function (e) {
      e.preventDefault(); temiz(this);
      var rol = $('input[name=rol]:checked'), amac = $$('input[name=amac]:checked').map(function (c) { return c.value; });
      var ilk = null;
      if (!rol) { $('#e-rol').textContent = T('Rolünüzü seçin.', 'Choose your role.'); ilk = $('input[name=rol]'); }
      if (!amac.length) { $('#e-amac').textContent = T('En az bir alan seçin.', 'Pick at least one area.'); ilk = ilk || $('input[name=amac]'); }
      if (ilk) { ilk.focus(); return; }
      taslak.rol = rol.value; taslak.amac = amac; taslak.olusturma = new Date().toISOString();
      jset('kt-demo-hesap', taslak);
      KT.store('kt-demo-oturum', '1');
      var sz = jget('kt-demo-sihirbaz') || {};
      sz.app = sz.app || { ad: '', aciklama: '', urunler: [] };
      if (!sz.app.urunler.length) sz.app.urunler = amac.slice();
      jset('kt-demo-sihirbaz', sz);
      hazir();
    });
    function hazir() {
      var h = jget('kt-demo-hesap');
      $('#hazir-dl').innerHTML =
        '<dt>' + T('E-posta', 'Email') + '</dt><dd>' + esc(h.email) + '</dd>' +
        '<dt>' + T('Ad', 'Name') + '</dt><dd>' + esc(h.ad) + '</dd>' +
        (h.sirket ? '<dt>' + T('Şirket', 'Company') + '</dt><dd>' + esc(h.sirket) + '</dd>' : '') +
        '<dt>' + T('Rol', 'Role') + '</dt><dd>' + esc(T(ROL[h.rol][0], ROL[h.rol][1])) + '</dd>' +
        '<dt>' + T('Alanlar', 'Areas') + '</dt><dd>' + esc(h.amac.map(function (a) { return T(URUN[a][0], URUN[a][1]); }).join(', ')) + '</dd>';
      asama(4);
      var s = 5;
      function yaz() { $('#redir').textContent = T(s + ' saniye içinde kurulum sihirbazının 2. adımına geçiyorsunuz.', 'Moving to step 2 of the setup wizard in ' + s + ' s.'); }
      yaz();
      $('#kal').hidden = false;
      clearInterval(yonT);
      yonT = setInterval(function () { s--; if (s <= 0) { clearInterval(yonT); location.href = $('#sihirbaza').getAttribute('href'); return; } yaz(); }, 1000);
    }
    $('#kal').addEventListener('click', function () { clearInterval(yonT); $('#redir').textContent = T('Yönlendirme durduruldu.', 'Redirect stopped.'); $('#kal').hidden = true; $('#sihirbaza').focus(); });
    document.addEventListener('kt:lang', function () { if (k === 4) { var h = jget('kt-demo-hesap'); if (h) { clearInterval(yonT); $('#redir').textContent = ''; } } $('#prog-t').textContent = T('Adım ' + k + '/4', 'Step ' + k + '/4'); });
    asama(1, false);
  }

  /* ================= Giriş ================= */
  if (sayfa === 'giris') {
    var f = $('#giris-form'), pw = $('#g-pw');
    $('#pw-goster').addEventListener('click', function () {
      var on = pw.type === 'password';
      pw.type = on ? 'text' : 'password';
      this.setAttribute('aria-pressed', String(on));
      this.textContent = on ? T('Gizle', 'Hide') : T('Göster', 'Show');
    });
    $('#unuttum').addEventListener('click', function () {
      var box = $('#unuttum-bilgi'), on = box.hidden;
      box.hidden = !on; this.setAttribute('aria-expanded', String(on));
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); temiz(f);
      var mail = $('#g-mail').value.trim(), ilk = null;
      if (!MAIL.test(mail)) { hata($('#g-mail'), $('#e-gmail'), mail ? T('E-posta adresi eksik görünüyor.', 'That email looks incomplete.') : T('E-posta adresinizi yazın.', 'Enter your email.')); ilk = $('#g-mail'); }
      if (!pw.value) { hata(pw, $('#e-gpw'), T('Şifrenizi yazın. Örnek akışta herhangi bir şifre çalışır.', 'Enter your password. Any password works in this sample.')); ilk = ilk || pw; }
      if (ilk) { ilk.focus(); return; }
      pw.value = '';  // şifre bellekte de tutulmaz
      var b = $('#g-btn');
      b.setAttribute('aria-busy', 'true'); b.disabled = true;
      b.querySelector('span').textContent = T('Giriş yapılıyor…', 'Signing in…');
      var h = jget('kt-demo-hesap');
      if (!h || h.email !== mail) {
        var ad = mail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toLocaleUpperCase('tr'); });
        h = { email: mail, ad: ad, sirket: '', rol: 'gelistirici', amac: [] };
        jset('kt-demo-hesap', h);
      }
      KT.store('kt-demo-oturum', '1');
      var next = new URLSearchParams(location.search).get('next');
      setTimeout(function () { location.href = next === 'kurulum' ? '../kurulum/?adim=2' : 'panel.html'; }, reduce ? 0 : 600);
    });
  }

  /* ================= Panel ================= */
  if (sayfa === 'panel') {
    function ciz() {
      var oturum = KT.store('kt-demo-oturum') === '1';
      $('#pn-gate').hidden = oturum;
      $('#pn').hidden = !oturum;
      $('#cikis').hidden = !oturum;
      if (!oturum) return;
      var h = jget('kt-demo-hesap') || { email: 'deneme@ornek.example', ad: 'Deneme' };
      $('#pn-merhaba').textContent = T('Merhaba, ', 'Hello, ') + (h.ad || '').split(' ')[0];
      $('#pn-mail').textContent = h.email + (h.sirket ? ', ' + h.sirket : '');
      var apps = jget('kt-demo-uygulamalar') || [];
      if (!apps.length) {
        $('#apps').innerHTML = '<div class="empty"><p>' + T('Henüz uygulama yok. Kurulum sihirbazıyla bir uygulama ve test anahtarları oluşturun.', 'No applications yet. Create one with sandbox keys in the setup wizard.') +
          '</p><a class="btn btn-primary" href="../kurulum/?yeni=1">' + T('Uygulama oluştur', 'Create an application') + '</a></div>';
        $('#keys').innerHTML = '<div class="empty"><p>' + T('Anahtarlar uygulama oluşturulunca burada görünür.', 'Keys appear here once you create an application.') + '</p></div>';
      } else {
        $('#apps').innerHTML = '<div class="apps">' + apps.map(function (a) {
          var tarih = new Date(a.olusturma);
          var tstr = isNaN(tarih) ? '' : tarih.toLocaleDateString(KT.en() ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
          return '<article class="app"><div class="app-top"><b>' + esc(a.ad) + '</b><span class="env-badge">' + T('Test', 'Sandbox') + '</span></div>' +
            (a.aciklama ? '<p>' + esc(a.aciklama) + '</p>' : '') +
            '<div class="chips">' + (a.urunler || []).map(function (u) { return '<span class="chip">' + esc(T(URUN[u][0], URUN[u][1])) + '</span>'; }).join('') + '</div>' +
            '<small>' + T('Oluşturma: ', 'Created: ') + esc(tstr) + '</small></article>';
        }).join('') + '</div>';
        $('#keys').innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + T('Uygulama', 'Application') + '</th><th>Client ID</th><th>Client secret</th><th class="hide-s"></th></tr></thead><tbody>' +
          apps.map(function (a, i) {
            return '<tr><td>' + esc(a.ad) + '</td><td><code>kt_sandbox_••••' + esc(String(a.clientId).slice(-4)) + '</code></td><td><code>••••' + esc(a.secSon4) + '</code></td>' +
              '<td class="hide-s"><button type="button" class="btn btn-quiet btn-sm" data-idkopya="' + i + '"><span class="copy-label">' + T('Client ID kopyala', 'Copy client ID') + '</span></button></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      var canli = jget('kt-demo-canli') || { durum: 'yok' };
      var testOk = apps.length > 0;
      var adimlar = [
        [T('Test', 'Testing'), testOk ? T('Uygulama ve test anahtarı var', 'App and sandbox key exist') : T('Önce uygulama oluşturun', 'Create an app first'), testOk ? 'ok' : 'now'],
        [T('Talep', 'Request'), canli.durum === 'yok' ? T('Henüz oluşturulmadı', 'Not created yet') : T('Oluşturuldu (örnek)', 'Created (sample)'), canli.durum === 'yok' ? (testOk ? 'now' : '') : 'ok'],
        [T('İnceleme', 'Review'), canli.durum === 'yok' ? T('Talepten sonra', 'After the request') : T('Bekliyor (örnek)', 'Pending (sample)'), canli.durum === 'yok' ? '' : 'now'],
        [T('Canlı anahtar', 'Production key'), T('Onaydan sonra', 'After approval'), '']
      ];
      $('#golive').innerHTML = adimlar.map(function (x) { return '<li class="' + x[2] + '"><b>' + x[0] + '</b>' + x[1] + '</li>'; }).join('');
      var tb = $('#talep');
      tb.disabled = !testOk || canli.durum !== 'yok';
      $('#talep-not').textContent = canli.durum !== 'yok' ? T('Örnek durum: talep oluşturuldu, inceleme bekliyor. Gerçek süre ve koşullar doğrulanmadı.', 'Sample status: request created, pending review. Real timing and requirements are not verified.') : (testOk ? '' : T('Talep için önce bir test uygulaması gerekir.', 'A sandbox application is needed first.'));
    }
    $('#keys').addEventListener('click', function (e) {
      var b = e.target.closest('[data-idkopya]'); if (!b) return;
      var a = (jget('kt-demo-uygulamalar') || [])[+b.dataset.idkopya];
      if (a) KT.copyText(a.clientId).then(function () { KT.copied(b); }, function () { KT.toast(T('Kopyalanamadı', 'Copy failed')); });
    });
    $('#talep').addEventListener('click', function () { jset('kt-demo-canli', { durum: 'inceleme', t: new Date().toISOString() }); ciz(); $('#talep-not').focus && KT.toast(T('Örnek talep oluşturuldu', 'Sample request created')); });
    $('#ornek-ac').addEventListener('click', function () {
      if (!jget('kt-demo-hesap')) jset('kt-demo-hesap', { email: 'deneme@ornek.example', ad: 'Deneme', sirket: '', rol: 'gelistirici', amac: ['bilgi'] });
      KT.store('kt-demo-oturum', '1'); ciz(); $('#pn-merhaba').setAttribute('tabindex', '-1'); $('#pn-merhaba').focus();
    });
    $('#cikis').addEventListener('click', function () { KT.store('kt-demo-oturum', null); ciz(); KT.toast(T('Çıkış yapıldı', 'Signed out')); });
    /* Bölüm gezinmesi: görünen bölümü işaretle */
    var linkler = $$('.pn-nav a');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en_) { if (en_.isIntersecting) linkler.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en_.target.id); }); });
      }, { rootMargin: '-30% 0px -60% 0px' });
      $$('.pn-sec').forEach(function (s) { io.observe(s); });
    }
    document.addEventListener('kt:lang', ciz);
    ciz();
  }
})();
