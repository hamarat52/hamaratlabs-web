/* Sesli soru-cevap istemcisi (17. slayt). Bağımlılık yok: ElevenLabs Agents WebSocket protokolü doğrudan.
   Akış: Start -> AYAR.soruUcu'dan imzalı URL -> mikrofon -> wss -> PCM ses gider/gelir.
   Ekranda durum (LISTENING / THINKING / SPEAKING) ve kısa döküm. İnternet, uç ya da anahtar yoksa
   "written answers" yedek slaytına düşer. ?onizleme (konuşmacı ekranı kopyası) ve ?kayit (ekran görüntüsü) kipinde pasif.
   Protokol: docs/arastirma-elevenlabs-ajan.md */
(function () {
  var ara = new URLSearchParams(location.search);
  if (ara.has('onizleme')) return;
  var kayit = ara.has('kayit');
  var bolum = document.querySelector('.slayt[data-id="soru"]');
  if (!bolum) return;
  var ajanEl = bolum.querySelector('.soru-ajan');
  var dugme = document.getElementById('soru-dugme');
  var baglantiEl = document.getElementById('soru-baglanti');
  var doku = document.getElementById('doku');
  var ayar = window.AYAR || {};

  var ws = null, ctx = null, akis = null, dugum = null, analiz = null, cikis = null;
  var girisHz = 16000, cikisHz = 16000, sonraki = 0, kaynaklar = [], acik = false, bagliydi = false;
  var dususSayac = null, seviyeDongu = null;

  function durum(d) {
    bolum.dataset.durum = d;
    ajanEl.dataset.durum = d;
  }
  function baglanti(metin, tur) {
    baglantiEl.textContent = metin;
    bolum.dataset.baglanti = tur || '';
  }
  function satir(kim, metin, guncelle) {
    var bos = doku.querySelector('.bos-satir');
    if (bos) bos.remove();
    var son = doku.lastElementChild;
    if (guncelle && son && son.classList.contains(kim)) { son.lastChild.textContent = metin; return; }
    var p = document.createElement('p');
    p.className = kim;
    var etiket = document.createElement('span');
    etiket.className = 'kim';
    etiket.textContent = kim === 'soran' ? 'Q' : 'A';
    p.appendChild(etiket);
    p.appendChild(document.createTextNode(metin));
    doku.appendChild(p);
    while (doku.children.length > 5) doku.firstElementChild.remove();
  }

  function yedegeDus(neden) {
    durdur(true);
    durum('bos');
    baglanti(neden + ' Written answers in 3 s.', 'yok');
    if (kayit) return;
    clearTimeout(dususSayac);
    dususSayac = setTimeout(function () {
      var d = window.MOTOR && window.MOTOR.durum();
      if (d && d.id === 'soru') window.MOTOR.ileri();
    }, 3000);
  }

  /* --- ses: base64 <-> PCM16 --- */
  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function pcmCal(b64metin) {
    var ikili = atob(b64metin), n = ikili.length >> 1;
    var veri = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var v = ikili.charCodeAt(2 * i) | (ikili.charCodeAt(2 * i + 1) << 8);
      veri[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000;
    }
    if (!n) return;
    var tampon = ctx.createBuffer(1, n, cikisHz);
    tampon.copyToChannel(veri, 0);
    var k = ctx.createBufferSource();
    k.buffer = tampon;
    k.connect(analiz);
    var t = Math.max(ctx.currentTime + 0.03, sonraki);
    k.start(t);
    sonraki = t + tampon.duration;
    kaynaklar.push(k);
    k.onended = function () {
      kaynaklar = kaynaklar.filter(function (x) { return x !== k; });
      if (!kaynaklar.length && acik) durum('dinliyor');
    };
    durum('konusuyor');
  }
  function sustur() {
    kaynaklar.forEach(function (k) { try { k.stop(); } catch (e) { /* bitti */ } });
    kaynaklar = [];
    sonraki = 0;
  }

  /* Mikrofon: AudioWorklet (Blob URL; ayrı dosya gerekmez). Bağlam hızından girisHz'e kutu ortalamasıyla indirir
     (basit kenar yumuşatma), ~100 ms'lik PCM16 parçalar yollar. */
  var ISLEYICI = [
    'class Mik extends AudioWorkletProcessor {',
    '  constructor(o) { super(); this.oran = sampleRate / o.processorOptions.hedef; this.t = []; this.top = 0; this.n = 0; this.konum = 0; this.boy = o.processorOptions.hedef / 10; }',
    '  process(g) { var c = g[0] && g[0][0]; if (!c) return true;',
    '    for (var j = 0; j < c.length; j++) { this.top += c[j]; this.n++; this.konum += 1;',
    '      if (this.konum >= this.oran) { this.t.push(this.top / this.n); this.top = 0; this.n = 0; this.konum -= this.oran; } }',
    '    if (this.t.length >= this.boy) { var a = new Int16Array(this.t.length);',
    '      for (var i = 0; i < this.t.length; i++) { var s = Math.max(-1, Math.min(1, this.t[i])); a[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }',
    '      this.port.postMessage(a.buffer, [a.buffer]); this.t = []; }',
    '    return true; } }',
    "registerProcessor('mik', Mik);"
  ].join('\n');

  function hz(bicim, yedek) { var m = /^pcm_(\d+)$/.exec(bicim || ''); return m ? +m[1] : yedek; }

  async function mikrofonuBaslat() {
    var url = URL.createObjectURL(new Blob([ISLEYICI], { type: 'text/javascript' }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    var kaynak = ctx.createMediaStreamSource(akis);
    dugum = new AudioWorkletNode(ctx, 'mik', { processorOptions: { hedef: girisHz } });
    dugum.port.onmessage = function (e) {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify({ user_audio_chunk: b64(e.data) }));
    };
    kaynak.connect(dugum);
  }

  function olay(m) {
    var t = m.type;
    if (t === 'conversation_initiation_metadata') {
      var o = m.conversation_initiation_metadata_event || {};
      girisHz = hz(o.user_input_audio_format, 16000);
      cikisHz = hz(o.agent_output_audio_format, 16000);
      bagliydi = true;
      baglanti('Live', 'canli');
      durum('dinliyor');
      mikrofonuBaslat().catch(function () { yedegeDus('Microphone could not start.'); });
    } else if (t === 'ping') {
      var p = m.ping_event || {};
      ws.send(JSON.stringify({ type: 'pong', event_id: p.event_id }));
    } else if (t === 'audio') {
      var a = m.audio_event || {};
      if (a.audio_base_64) pcmCal(a.audio_base_64);
    } else if (t === 'user_transcript') {
      var u = (m.user_transcription_event || {}).user_transcript;
      if (u) { satir('soran', u); durum('dusunuyor'); }
    } else if (t === 'agent_response') {
      var r = (m.agent_response_event || {}).agent_response;
      if (r) satir('cevap', r);
    } else if (t === 'agent_response_correction') {
      var c = (m.agent_response_correction_event || {}).corrected_agent_response;
      if (c) satir('cevap', c, true);
    } else if (t === 'interruption') {
      sustur();
      durum('dinliyor');
    }
  }

  async function baslat() {
    clearTimeout(dususSayac);
    if (location.protocol === 'file:') return yedegeDus('Opened from a file: no voice agent.');
    if (!navigator.onLine) return yedegeDus('Offline.');
    baglanti('Connecting...', '');
    durum('dusunuyor');
    var imzali;
    try {
      var r = await fetch(ayar.soruUcu || 'api/soru/imzali-url', { cache: 'no-store', signal: AbortSignal.timeout(9000) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.signed_url) {
        var neden = { 'anahtar-yok': 'Voice agent key missing.', 'ajan-yok': 'Voice agent not set up.' }[j.hata] || 'Voice agent unavailable.';
        return yedegeDus(neden);
      }
      imzali = j.signed_url;
    } catch (e) { return yedegeDus('Voice agent unreachable.'); }
    try {
      akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { return yedegeDus('No microphone permission.'); }
    ctx = new AudioContext();
    analiz = ctx.createAnalyser();
    analiz.fftSize = 512;
    cikis = ctx.createGain();
    analiz.connect(cikis);
    cikis.connect(ctx.destination);
    seviyeOlc();
    acik = true;
    bagliydi = false;
    dugme.textContent = 'Stop';
    dugme.setAttribute('aria-pressed', 'true');
    ws = new WebSocket(imzali);
    ws.onopen = function () { ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' })); };
    ws.onmessage = function (e) { try { olay(JSON.parse(e.data)); } catch (x) { /* bozuk ileti atlanır */ } };
    ws.onerror = function () { if (!bagliydi) yedegeDus('Voice agent connection failed.'); };
    ws.onclose = function () {
      if (!acik) return;
      if (!bagliydi) yedegeDus('Voice agent connection failed.');
      else { durdur(); baglanti('Conversation ended', ''); }
    };
  }

  function seviyeOlc() {
    var dizi = new Uint8Array(analiz.fftSize);
    cancelAnimationFrame(seviyeDongu);
    (function dongu() {
      if (!analiz) return;
      analiz.getByteTimeDomainData(dizi);
      var t = 0;
      for (var i = 0; i < dizi.length; i++) { var v = (dizi[i] - 128) / 128; t += v * v; }
      ajanEl.style.setProperty('--seviye', Math.min(1, Math.sqrt(t / dizi.length) * 5).toFixed(3));
      seviyeDongu = requestAnimationFrame(dongu);
    })();
  }

  function durdur(sessiz) {
    acik = false;
    sustur();
    if (ws) { try { ws.close(); } catch (e) { /* */ } ws = null; }
    if (dugum) { try { dugum.disconnect(); } catch (e) { /* */ } dugum = null; }
    if (akis) { akis.getTracks().forEach(function (t) { t.stop(); }); akis = null; }
    if (ctx) { ctx.close().catch(function () {}); ctx = null; }
    analiz = null;
    cancelAnimationFrame(seviyeDongu);
    ajanEl.style.setProperty('--seviye', 0);
    dugme.textContent = 'Start';
    dugme.setAttribute('aria-pressed', 'false');
    if (!sessiz) { durum('bos'); baglanti('Not connected', ''); }
  }

  dugme.addEventListener('click', function () { if (acik) durdur(); else baslat(); });

  /* Slayta girişte ön denetim: dosyadan açıldıysa, internet ya da ajan hazır değilse yedeğe düş. Slayttan çıkınca kapat. */
  var buradaydi = false;
  function gir(d) {
    var burada = d.id === 'soru';
    if (burada && !buradaydi && !kayit) {
      durum('bos');
      if (location.protocol === 'file:') yedegeDus('Opened from a file: no voice agent.');
      else if (!navigator.onLine) yedegeDus('Offline.');
      else {
        baglanti('Checking...', '');
        fetch('api/soru/durum', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j.hazir) baglanti('Ready. Press Start.', 'hazir');
            else yedegeDus(j.statik ? 'Static copy: no voice agent.' : !j.internet ? 'Offline.' : !j.anahtar ? 'Voice agent key missing.' : 'Voice agent not set up.');
          })
          .catch(function () { yedegeDus('Voice agent unreachable.'); });
      }
    }
    if (!burada && buradaydi) { clearTimeout(dususSayac); if (acik) durdur(); else baglanti('Not connected', ''); }
    buradaydi = burada;
  }
  document.addEventListener('slayt', function (e) { gir(e.detail); });
  durum('bos');
  if (window.MOTOR) gir(window.MOTOR.durum());
  window.SORU = { durum: function () { return { durum: bolum.dataset.durum, baglanti: baglantiEl.textContent, acik: acik }; } };
})();
