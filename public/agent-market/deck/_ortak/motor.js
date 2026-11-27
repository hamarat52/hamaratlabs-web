/* Swapline sunum motoru. drafts/_ortak/motor.js'ten türedi (AŞAMA 1); bağımlılık yok, file:// ile de açılır.
   Tuşlar: Sağ/Aşağı/PageDown/Boşluk/Enter = ileri, Sol/Yukarı/PageUp/Backspace = geri,
           Home/End = ilk/son slayt, F = tam ekran, S = konuşmacı ekranı, B ya da . = kara ekran.
   Adres: #2 = 2. slayt, #2.3 = 2. slayt 3. adıma kadar açık (geçiş oynamaz).
          #gecis=1-2@0.45 = 1'den 2'ye geçişi başlatır ve süresinin %45'inde dondurur (ekran görüntüsü için).
          ?az = az hareket varyantı (prefers-reduced-motion ile aynı). ?onizleme = konuşmacı ekranındaki kopya:
          tuş dinlemez, yayın yapmaz, adres değişince doğrudan o slayta gider.
   Konuşmacı ekranı: BroadcastChannel(AYAR.kanal) + açan/açılan pencereye postMessage (file:// için yedek).
     giden: {tur:'durum', slayt, adim, enCok, toplam, id, kara}
     gelen: {tur:'komut', ne:'ileri'|'geri'|'git'|'kara'|'sor', slayt?, adim?}
   Yön dosyası isterse window.YON.gecis(o) tanımlar; o = {eski, yeni, ileri, sure, egri, olcek, sahne}.
   Dönüş: Animation dizisi (Web Animations API, fill:'both'). Tanımlı değilse yumuşak çapraz geçiş. */
(function () {
  var ara = new URLSearchParams(location.search);
  var onizleme = ara.has('onizleme');
  var sahne = document.querySelector('.sahne');
  var slaytlar = [].slice.call(document.querySelectorAll('.slayt'));
  var azalt = onizleme || ara.has('az') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (azalt) document.documentElement.classList.add('az');
  if (onizleme) document.documentElement.classList.add('onizleme');
  var no = 0, adim = 0, oynayan = [], bekleyen = null, kara = false;
  var ayar = window.AYAR || {};
  var kanal = null, konusmaci = null;

  function token(ad, yedek) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
    return v || yedek;
  }
  function ms(v) { return v.indexOf('ms') > -1 ? parseFloat(v) : parseFloat(v) * 1000; }

  function olcekle() {
    var o = Math.min(innerWidth / 1920, innerHeight / 1080);
    sahne.style.setProperty('--olcek', o);
    sahne.dataset.olcek = o;
  }

  function enCok(s) {
    var m = 0;
    s.querySelectorAll('[data-adim]').forEach(function (e) { m = Math.max(m, +e.dataset.adim); });
    return m;
  }

  function adimla(s, n) {
    s.dataset.asama = n;
    s.querySelectorAll('[data-adim]').forEach(function (e) { e.classList.toggle('acik', +e.dataset.adim <= n); });
  }

  function durum() {
    var s = slaytlar[no];
    return { tur: 'durum', slayt: no + 1, adim: adim, enCok: enCok(s), toplam: slaytlar.length, id: s.dataset.id || '', kara: kara };
  }

  function yayinla() {
    if (onizleme) return;
    var d = durum();
    if (kanal) try { kanal.postMessage(d); } catch (e) { /* kanal kapalı */ }
    [konusmaci, window.opener].forEach(function (w) {
      if (w && !w.closed) try { w.postMessage(d, '*'); } catch (e) { /* başka köken */ }
    });
  }

  function sayac() {
    slaytlar.forEach(function (s, i) {
      s.querySelectorAll('[data-sayac]').forEach(function (e) {
        e.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slaytlar.length).padStart(2, '0');
      });
    });
    document.body.dataset.slayt = no + 1;
    if (!onizleme) history.replaceState(null, '', location.pathname + location.search + '#' + (no + 1) + (adim ? '.' + adim : ''));
    document.dispatchEvent(new CustomEvent('slayt', { detail: durum() }));
    yayinla();
  }

  function bitir() { if (bekleyen) bekleyen(); oynayan = []; }

  function capraz(o) {
    var t = { duration: o.sure, easing: 'ease', fill: 'both' };
    return [o.eski.animate([{ opacity: 1 }, { opacity: 0 }], t), o.yeni.animate([{ opacity: 0 }, { opacity: 1 }], t)];
  }

  function git(hedef, ileri, sonAdim) {
    if (hedef < 0 || hedef >= slaytlar.length || hedef === no) return;
    bitir();
    var eski = slaytlar[no], yeni = slaytlar[hedef];
    no = hedef;
    adim = sonAdim ? enCok(yeni) : 0;
    document.body.classList.add('anlik');
    adimla(yeni, adim);
    yeni.getBoundingClientRect();
    document.body.classList.remove('anlik');
    eski.classList.add('cikan');
    yeni.classList.add('aktif', 'giren');
    var o = {
      eski: eski, yeni: yeni, ileri: ileri, sahne: sahne,
      olcek: +sahne.dataset.olcek || 1,
      sure: azalt ? 200 : ms(token('--sure-gecis', '700ms')),
      egri: token('--egri-gecis', 'ease')
    };
    var f = (!azalt && window.YON && window.YON.gecis) || capraz;
    var anims = f(o) || [];
    oynayan = anims;
    /* Geçiş bitmeden yeni tuş gelirse bitir() bu temizliği HEMEN koşar; yoksa eski slayt 'aktif' kalırdı. */
    var bitti = function () {
      if (bekleyen !== bitti) return;
      bekleyen = null;
      eski.classList.remove('aktif', 'cikan');
      yeni.classList.remove('giren');
      anims.forEach(function (a) { a.cancel(); });
      if (oynayan === anims) oynayan = [];
      if (window.YON && window.YON.girdi) window.YON.girdi(yeni);
    };
    bekleyen = bitti;
    Promise.all(anims.map(function (a) { return a.finished; })).then(bitti, function () {});
    if (!anims.length) bitti();
    sayac();
  }

  function ileri() {
    var s = slaytlar[no];
    if (adim < enCok(s)) { adim++; adimla(s, adim); sayac(); }
    else git(no + 1, true, false);
  }
  function geri() {
    var s = slaytlar[no];
    if (adim > 0) { adim--; adimla(s, adim); sayac(); }
    else git(no - 1, false, true);
  }
  function karart(v) {
    kara = typeof v === 'boolean' ? v : !kara;
    document.body.classList.toggle('kara', kara);
    yayinla();
  }

  function dondur(oran) {
    var son = 0;
    oynayan.forEach(function (a) {
      var e = a.effect.getComputedTiming().endTime;
      if (isFinite(e)) son = Math.max(son, e);
    });
    var t = oran * son;
    oynayan.forEach(function (a) { a.pause(); a.currentTime = t; });
    document.documentElement.dataset.donduruldu = Math.round(t) + 'ms';
  }

  function dogrudan(s, n) {
    bitir();
    document.body.classList.add('anlik');
    slaytlar.forEach(function (x) { x.classList.remove('aktif', 'giren', 'cikan'); });
    no = Math.max(0, Math.min(slaytlar.length - 1, s));
    adim = Math.max(0, Math.min(enCok(slaytlar[no]), n));
    slaytlar[no].classList.add('aktif');
    slaytlar.forEach(function (x, i) { adimla(x, i === no ? adim : 0); });
    slaytlar[no].getBoundingClientRect();
    document.body.classList.remove('anlik');
    if (window.YON && window.YON.girdi) window.YON.girdi(slaytlar[no]);
    sayac();
  }

  function adrestenAc() {
    var h = decodeURIComponent(location.hash.slice(1));
    var g = /^gecis=(\d+)-(\d+)@([\d.]+)$/.exec(h);
    if (g) {
      var a = +g[1] - 1, b = +g[2] - 1;
      dogrudan(a, b > a ? 0 : 99);
      git(b, b > a, false);
      dondur(parseFloat(g[3]));
      return;
    }
    var m = /^(\d+)(?:\.(\d+))?$/.exec(h);
    dogrudan(m ? +m[1] - 1 : 0, m && m[2] ? +m[2] : 0);
  }

  var gorulen = [];
  function komut(d) {
    if (!d || d.tur !== 'komut') return;
    /* aynı komut iki yoldan (kanal + postMessage) gelebilir: kimliğiyle bir kez işlenir */
    if (d.kimlik) { if (gorulen.indexOf(d.kimlik) > -1) return; gorulen.push(d.kimlik); if (gorulen.length > 50) gorulen.shift(); }
    if (d.ne === 'ileri') ileri();
    else if (d.ne === 'geri') geri();
    else if (d.ne === 'git') { if (d.slayt - 1 === no && d.adim == null) return; dogrudan(d.slayt - 1, d.adim || 0); }
    else if (d.ne === 'kara') karart();
    else if (d.ne === 'sor') yayinla();
  }

  function konusmaciAc() {
    konusmaci = window.open('konusmaci.html', 'swapline-konusmaci', 'width=1440,height=900');
    setTimeout(yayinla, 600);
  }

  if (!onizleme) {
    if ('BroadcastChannel' in window) {
      try { kanal = new BroadcastChannel(ayar.kanal || 'sunum'); kanal.onmessage = function (e) { komut(e.data); }; } catch (e) { kanal = null; }
    }
    addEventListener('message', function (e) { if (e.data && e.data.tur === 'komut') { if (e.source && e.source !== window) konusmaci = e.source; komut(e.data); } });

    addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      var hedef = e.target && e.target.closest && e.target.closest('button, a, input, textarea, select');
      if (hedef && (k === ' ' || k === 'Enter')) return; /* odaktaki düğme/bağlantı kendi işini yapsın */
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); ileri(); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); geri(); }
      else if (k === 'Home') { e.preventDefault(); git(0, false, false); }
      else if (k === 'End') { e.preventDefault(); git(slaytlar.length - 1, true, false); }
      else if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {});
      }
      else if (k === 's' || k === 'S') { e.preventDefault(); konusmaciAc(); }
      else if (k === 'b' || k === 'B' || k === '.') { e.preventDefault(); karart(); }
    });
  } else {
    addEventListener('hashchange', adrestenAc);
  }
  addEventListener('resize', olcekle);

  olcekle();
  adrestenAc();
  window.MOTOR = {
    ileri: ileri, geri: geri, git: git, dondur: dondur, karart: karart, konusmaciAc: konusmaciAc,
    durum: function () { var d = durum(); return { slayt: d.slayt, adim: d.adim, enCok: d.enCok, toplam: d.toplam, id: d.id, kara: d.kara }; },
    kanalVar: function () { return !!kanal; }
  };
})();
