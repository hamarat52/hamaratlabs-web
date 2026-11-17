/* KADER tanıtım sayfası: sunum gezintisi, CPC usulü yazı, kuklacı eli sahnesi, kader seçimi demosu. */
(() => {
  'use strict';
  const AZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V = '/okul-projeleri/kader/varliklar/';
  const ekranlar = [...document.querySelectorAll('.ekran')];
  const sayac = document.getElementById('sayac');
  const noktalar = document.getElementById('noktalar');
  let aktif = 0;

  /* ---------------------------------------------------------------- ses (AY benzeri kare dalga) */
  let ses = localStorage.getItem('kader-ses') !== '0';
  let ac = null;
  const sesDugme = document.getElementById('ses');
  function sesYaz() {
    sesDugme.textContent = ses ? '♪ ON' : '♪ OFF';
    sesDugme.setAttribute('aria-pressed', String(ses));
  }
  function sesAc(v) { ses = v; localStorage.setItem('kader-ses', v ? '1' : '0'); sesYaz(); oyunSes(); }
  sesDugme.addEventListener('click', () => sesAc(!ses));
  sesYaz();
  function nota(frek, bas, sure, hacim = 0.05) {
    if (!ses) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = 'square'; o.frequency.value = frek;
      const t0 = ac.currentTime + bas;
      g.gain.setValueAtTime(hacim, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + sure);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + sure + 0.02);
    } catch { /* ses yoksa sessiz devam */ }
  }
  const yukselen = () => [523.25, 659.25, 783.99].forEach((f, i) => nota(f, i * 0.11, 0.12));
  const dusen = () => [392, 329.63, 261.63].forEach((f, i) => nota(f, i * 0.11, 0.14));

  /* ---------------------------------------------------------------- sunum gezintisi */
  ekranlar.forEach((e, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${i + 1}: ${e.getAttribute('aria-label') || e.id}`);
    b.addEventListener('click', () => git(i));
    noktalar.append(b);
  });
  function git(i) {
    i = Math.max(0, Math.min(ekranlar.length - 1, i));
    ekranlar[i].scrollIntoView({ behavior: AZ ? 'auto' : 'smooth', block: 'start' });
  }
  function tamEkran() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  document.getElementById('tamekran').addEventListener('click', tamEkran);
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const dugme = t && (t.tagName === 'BUTTON' || t.tagName === 'A');
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown':
        e.preventDefault(); git(aktif + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); git(aktif - 1); break;
      case ' ':
        if (dugme) return;
        e.preventDefault(); git(aktif + (e.shiftKey ? -1 : 1)); break;
      case 'Home': e.preventDefault(); git(0); break;
      case 'End': e.preventDefault(); git(ekranlar.length - 1); break;
      case 'f': case 'F': tamEkran(); break;
      case 'm': case 'M': sesAc(!ses); break;
      case '1': case '2': case '3':
        if (ekranlar[aktif].id === 'kader') { e.preventDefault(); sec(+e.key); }
        break;
      default:
    }
  });

  function etkinlestir(i) {
    aktif = i;
    sayac.textContent = `${String(i + 1).padStart(2, '0')}/${String(ekranlar.length).padStart(2, '0')}`;
    [...noktalar.children].forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
    ekranlar.forEach((e, k) => {
      e.classList.toggle('aktif', k === i);
      e.querySelectorAll('video').forEach((v) => {
        if (k === i && !AZ) { v.play().catch(() => {}); } else { v.pause(); }
      });
    });
    const e = ekranlar[i];
    e.classList.add('goruldu');
    e.querySelectorAll('[data-yaz]').forEach((el, n) => setTimeout(() => yaz(el), n * 120));
  }
  const gozcu = new IntersectionObserver((kayit) => {
    kayit.forEach((k) => {
      if (k.isIntersecting && k.intersectionRatio >= 0.5) etkinlestir(ekranlar.indexOf(k.target));
    });
  }, { threshold: [0.5, 0.75] });
  ekranlar.forEach((e) => gozcu.observe(e));

  /* ---------------------------------------------------------------- CPC usulü yazı (harf harf) */
  function hazirla(el) {
    if (AZ || el.dataset.hazir) return;
    el.dataset.hazir = '1';
    const tam = el.textContent.replace(/\s+/g, ' ').trim();
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = tam;
    const ic = document.createElement('span'); ic.setAttribute('aria-hidden', 'true');
    while (el.firstChild) ic.append(el.firstChild);
    const w = document.createTreeWalker(ic, NodeFilter.SHOW_TEXT);
    const dugumler = []; while (w.nextNode()) dugumler.push(w.currentNode);
    dugumler.forEach((d) => {
      const f = document.createDocumentFragment();
      for (const ch of d.data) {
        const s = document.createElement('span'); s.className = 'gz'; s.textContent = ch; f.append(s);
      }
      d.replaceWith(f);
    });
    el.append(sr, ic);
  }
  function yaz(el) {
    if (AZ || el.dataset.yazildi) return;
    el.dataset.yazildi = '1';
    const harfler = [...el.querySelectorAll('.gz')];
    const hiz = Number(el.dataset.yaz) || 22;
    let i = 0;
    el.classList.add('yaziyor');
    const t = setInterval(() => {
      for (let k = 0; k < 3 && i < harfler.length; k += 1) harfler[i++].classList.remove('gz');
      if (i >= harfler.length) { clearInterval(t); el.classList.remove('yaziyor'); }
    }, hiz);
  }
  document.querySelectorAll('[data-yaz]').forEach(hazirla);

  /* ---------------------------------------------------------------- kuklacı eli sahnesi */
  const KARE = window.KADER_EL;
  const PAL = [[0, 0, 128], [255, 128, 0], [0, 255, 255], [255, 255, 255]];
  const CY = 2; const WH = 3; const BG = 0;
  function sahne(cv) {
    const W = KARE.w; const H = KARE.h;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);
    const pix = new Uint8Array(W * H);
    const sprite = new Image();
    sprite.src = V + 'el-kareler.png';
    let hazir = false;
    sprite.onload = () => { hazir = true; ciz(0); };

    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) pix[y * W + x] = c; };
    // ipler: uçtan aşağı iner, CPC 4 renkte dither ile solar (beyaz > camgöbeği > seyrek nokta > boşluk)
    const OLC = H / 200; // ince ızgara: taban 320x200 sahnesine göre ölçek
    function ipRenk(y) {
      const yb = y / OLC;
      if (yb < 112) return WH;
      if (yb < 136) return CY;
      if (yb < 158) return y % 2 === 0 ? CY : BG;
      if (yb < 180) return y % 4 === 0 ? CY : BG;
      if (yb < 194) return y % 8 === 0 ? CY : BG;
      return BG;
    }
    const IPLER = ['serce', 'orta', 'isaret', 'bas'];
    const FAZ = { serce: 0, orta: 1.9, isaret: 3.3, bas: 4.6 };
    function ciz(t) {
      if (!hazir) return;
      pix.fill(BG);
      const kare = AZ ? 0 : Math.floor(t * 5) % KARE.n;
      const A = KARE.kareler[kare];
      IPLER.forEach((k) => {
        const ux = A[k][0]; const uy = Math.round(A[k][1]);
        const sal = AZ ? 0 : OLC * (1.6 * Math.sin(t * 1.1 + FAZ[k]) + 0.6 * Math.sin(t * 2.3 + FAZ[k] * 2));
        for (let y = uy; y < H; y += 1) {
          const f = (y - uy) / (H - uy);
          set(Math.round(ux + sal * f * f), y, ipRenk(y));
        }
      });
      const d = img.data;
      for (let p = 0; p < W * H; p += 1) {
        const c = pix[p]; const q = p * 4;
        if (c === BG) { d[q + 3] = 0; } else { d[q] = PAL[c][0]; d[q + 1] = PAL[c][1]; d[q + 2] = PAL[c][2]; d[q + 3] = 255; }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.putImageData(img, 0, 0);
      ctx.drawImage(sprite, kare * W, 0, W, H, 0, 0, W, H);
    }
    // tam sayı ölçek: pikseller eşit kalsın
    function olcekle() {
      const kutu = cv.parentElement.getBoundingClientRect();
      const k = Math.max(1, Math.floor(Math.min(kutu.height / H, kutu.width / (W * 0.8)))); // soldaki beşte bir boş, taşabilir
      cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
    }
    new ResizeObserver(olcekle).observe(cv.parentElement);
    let son = 0; let calis = false; const t0 = performance.now();
    function dongu(now) {
      if (!calis) return;
      if (now - son > 1000 / 12) { son = now; ciz((now - t0) / 1000); }
      requestAnimationFrame(dongu);
    }
    return {
      baslat() { if (calis || AZ) { ciz(0); return; } calis = true; requestAnimationFrame(dongu); },
      durdur() { calis = false; },
    };
  }
  const sahneler = [...document.querySelectorAll('canvas.sahne')].map((cv) => ({ cv, s: sahne(cv) }));
  const sahneGozcu = new IntersectionObserver((k) => k.forEach((x) => {
    const o = sahneler.find((y) => y.cv === x.target);
    if (o) { if (x.isIntersecting) o.s.baslat(); else o.s.durdur(); }
  }));
  sahneler.forEach((o) => sahneGozcu.observe(o.cv));

  /* ---------------------------------------------------------------- kader seçimi demosu */
  const sonuc = document.getElementById('sonuc');
  const zar = document.getElementById('zar');
  const SONUC = {
    1: { baslik: 'WON', metin: 'Goes abroad. Long distance.', etki: 'ANXIETY ▲  HAPPINESS ▼', not: 'Winning is not always good.' },
    2: { baslik: 'LOST', metin: 'Stays. The relationship grows stronger.', etki: 'BOND ▲', not: 'Losing is not always bad.' },
  };
  let donuyor = false;
  function goster(n, zardan) {
    const s = SONUC[n];
    sonuc.innerHTML = '';
    const satir = (cls, txt) => { const p = document.createElement('p'); p.className = cls; p.textContent = txt; sonuc.append(p); };
    if (zardan) satir('s-zar', `the die says: ${s.baslik}`);
    else satir('s-baslik', s.baslik);
    satir('s-metin', s.metin);
    satir('s-etki', s.etki);
    satir('s-not', s.not);
    if (n === 1) yukselen(); else dusen();
  }
  function sec(n) {
    if (donuyor) return;
    document.querySelectorAll('.secim button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    if (n !== 3) { goster(n, false); return; }
    donuyor = true;
    sonuc.innerHTML = '<p class="s-zar">...</p>';
    const yuzler = [1, 2, 3, 4, 5, 6];
    let adim = 0; const toplam = AZ ? 1 : 12;
    const sonucN = Math.random() < 0.5 ? 1 : 2; // her zaman yarı yarıya
    const tur = () => {
      zar.dataset.yuz = String(yuzler[Math.floor(Math.random() * 6)]);
      nota(1200 + Math.random() * 400, 0, 0.03, 0.03);
      adim += 1;
      if (adim < toplam) setTimeout(tur, 40 + adim * adim * 1.5);
      else { donuyor = false; goster(sonucN, true); }
    };
    tur();
  }
  document.querySelectorAll('.secim button').forEach((b) => b.addEventListener('click', () => sec(+b.dataset.n)));

  /* ---------------------------------------------------------------- tarayıcıda oyna (emülatör yalnız tıklayınca yüklenir) */
  function oyunPencere() {
    const f = document.querySelector('#oyun-ekran iframe');
    try { return f && f.contentWindow; } catch { return null; }
  }
  function oyunSes() {
    const w = oyunPencere();
    if (w && w.kaderSes) w.kaderSes(ses);
  }
  const oyun = document.getElementById('oyun');
  const oyunEkran = document.getElementById('oyun-ekran');
  const oyunDurum = document.getElementById('oyun-durum');
  const oyunTam = document.getElementById('oyun-tam');
  const oyunYeniden = document.getElementById('oyun-yeniden');
  oyunYeniden.addEventListener('click', () => {
    const f = oyunEkran.querySelector('iframe');
    if (!f) return;
    f.src = '/okul-projeleri/kader/oyna/';
    oyunDurum.textContent = 'starting again · loading the disc, about 30 seconds';
  });
  const DOKUN = matchMedia('(hover: none), (max-width: 700px)');
  function oyunOdak() {
    const f = oyunEkran.querySelector('iframe');
    if (!f || DOKUN.matches) return;
    f.focus();
    try { f.contentWindow.focus(); } catch { /* aynı köken; olmazsa tıklama yeter */ }
  }
  document.getElementById('oyun-baslat').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = '/okul-projeleri/kader/oyna/';
    f.title = 'KADER running in an Amstrad CPC emulator';
    f.allow = 'fullscreen; autoplay';
    f.addEventListener('load', () => { oyunSes(); oyunOdak(); });
    oyunEkran.replaceChildren(f);
    oyun.classList.add('basladi');
    oyunTam.hidden = false;
    oyunYeniden.hidden = false;
    oyunDurum.textContent = DOKUN.matches
      ? 'loading the disc · about 30 seconds · then tap the keys'
      : 'loading the disc · about 30 seconds · the keyboard now goes to the game';
  });
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data.kader !== 'string') return;
    if (e.data.kader === 'cik') {
      if (oyun.classList.contains('tam')) { oyun.classList.remove('tam'); oyunTamYaz(); }
      const f = oyunEkran.querySelector('iframe');
      if (f) f.blur();
      window.focus();
      oyun.focus({ preventScroll: true });
      oyunDurum.textContent = 'back on the page · click the screen to play on';
    } else if (e.data.kader === 'odak') {
      oyunDurum.textContent = DOKUN.matches ? 'the game has the keys' : 'the keyboard goes to the game · Esc goes back to the page';
    }
  });
  document.querySelectorAll('#oyun-tuslar button').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const w = oyunPencere();
      if (w && w.kaderTus) w.kaderTus(b.dataset.tus);
      oyunDurum.textContent = 'the real disc in an Amstrad CPC 6128 emulator';
      b.classList.add('basili'); setTimeout(() => b.classList.remove('basili'), 120);
    });
    b.addEventListener('click', (e) => e.preventDefault());
  });
  function oyunTamYaz() {
    const acik = document.fullscreenElement === oyun || oyun.classList.contains('tam');
    oyunTam.textContent = acik ? 'EXIT' : 'FULL SCREEN';
    document.documentElement.classList.toggle('oyun-tam-acik', oyun.classList.contains('tam'));
  }
  oyunTam.addEventListener('click', () => {
    if (document.fullscreenElement === oyun) { document.exitFullscreen(); return; }
    if (oyun.classList.contains('tam')) { oyun.classList.remove('tam'); oyunTamYaz(); return; }
    if (oyun.requestFullscreen && document.fullscreenEnabled) {
      oyun.requestFullscreen().then(oyunOdak).catch(() => { oyun.classList.add('tam'); oyunTamYaz(); });
    } else { oyun.classList.add('tam'); oyunTamYaz(); }
  });
  document.addEventListener('fullscreenchange', () => { oyunTamYaz(); if (document.fullscreenElement === oyun) oyunOdak(); });

  etkinlestir(0);
})();
