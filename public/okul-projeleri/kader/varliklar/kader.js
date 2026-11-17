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
  function sesAc(v) { ses = v; localStorage.setItem('kader-ses', v ? '1' : '0'); sesYaz(); }
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

    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) pix[y * W + x] = c; };
    function cizgi(a, b, c, w = 1) {
      const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) + 1;
      const lo = -Math.floor(w / 2); const hi = w - Math.floor(w / 2);
      for (let i = 0; i <= n; i += 1) {
        const t = i / n; const x = Math.round(a[0] + (b[0] - a[0]) * t); const y = Math.round(a[1] + (b[1] - a[1]) * t);
        for (let dx = lo; dx < hi; dx += 1) for (let dy = lo; dy < hi; dy += 1) set(x + dx, y + dy, c);
      }
    }
    function disk(cx, cy, r, c) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y += 1) {
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x += 1) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) set(x, y, c);
        }
      }
    }
    // iki kemikli ters kinematik: omuz/kalça s, hedef t, uzunluklar a b, dirsek yönü yon (+1 sağa, -1 sola)
    function ik(s, t, a, b, yon) {
      let dx = t[0] - s[0]; let dy = t[1] - s[1];
      let d = Math.hypot(dx, dy);
      const dmax = a + b - 0.01; const dmin = Math.abs(a - b) + 0.5;
      if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
      if (d < dmin) { dx *= dmin / d; dy *= dmin / d; d = dmin; }
      const al = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d))));
      const taban = Math.atan2(dy, dx);
      const c1 = taban + al; const c2 = taban - al;
      const e1 = [s[0] + a * Math.cos(c1), s[1] + a * Math.sin(c1)];
      const e2 = [s[0] + a * Math.cos(c2), s[1] + a * Math.sin(c2)];
      const dirsek = (yon > 0 ? (e1[0] > e2[0]) : (e1[0] < e2[0])) ? e1 : e2;
      return [dirsek, [s[0] + dx, s[1] + dy]];
    }
    const yumusak = (x) => x * x * (3 - 2 * x);
    // serbest kol: kendi döngüsü (elin döngüsüyle eşleşmez)
    function serbestKol(t, omuz) {
      const P = 9.0; const u = (t % P) / P;
      const bel = [1, 17]; const yukari = [-3, -19];
      let h;
      if (u < 0.30) h = bel;
      else if (u < 0.40) { const k = yumusak((u - 0.30) / 0.10); h = [bel[0] + (yukari[0] - bel[0]) * k, bel[1] + (yukari[1] - bel[1]) * k]; }
      else if (u < 0.75) { h = [yukari[0] - 3 * Math.sin((u - 0.40) * 2 * Math.PI * 5), yukari[1] + 1.5 * Math.abs(Math.sin((u - 0.40) * 2 * Math.PI * 5))]; }
      else if (u < 0.85) { const k = yumusak((u - 0.75) / 0.10); h = [yukari[0] + (bel[0] - yukari[0]) * k, yukari[1] + (bel[1] - yukari[1]) * k]; }
      else h = bel;
      return ik(omuz, [omuz[0] + h[0], omuz[1] + h[1]], 10.5, 10.5, -1);
    }
    function ciz(t) {
      if (!hazir) return;
      pix.fill(BG);
      const kare = AZ ? 0 : Math.floor(t * 6) % KARE.n;
      const sx = AZ ? 0 : Math.round(2 * Math.sin(t * 0.7));
      const sy = AZ ? 0 : Math.round(1.5 * Math.sin(t * 0.9 + 1));
      const A = KARE.kareler[kare];
      const uc = (k) => [A[k][0] + sx, A[k][1] + sy];
      const salin = AZ ? 0 : 1.2 * Math.sin(t * 1.3);
      // gövde orta parmağın ipine asılı
      const o = uc('orta');
      const bas = [o[0] - 1 + salin, o[1] + 18.5];
      const om = { l: [bas[0] - 7, bas[1] + 12], r: [bas[0] + 7, bas[1] + 12] };
      const ka = { l: [bas[0] - 4, bas[1] + 33], r: [bas[0] + 4, bas[1] + 33] };
      // sağ el işaret parmağının ipinde
      const i = uc('isaret');
      const [dsR, elR] = ik(om.r, [i[0], i[1] + 25], 10.4, 10.8, +1);
      // ayaklar serçe ve başparmağın iplerinde (ip boyları sabit)
      const s = uc('serce'); const b = uc('bas');
      const [dzL, ayL] = ik(ka.l, [s[0] + 22, s[1] + 97.5], 12.6, 13, -1);
      const [dzR, ayR] = ik(ka.r, [b[0] - 36, b[1] + 104.8], 12.6, 13, +1);
      const [dsL, elL] = AZ ? ik(om.l, [om.l[0] + 1, om.l[1] + 17], 10.5, 10.5, -1) : serbestKol(t, om.l);
      // ipler (önce, kuklanın ve elin arkasında)
      cizgi(s, ayL, WH); cizgi(o, [bas[0], bas[1] - 5], WH); cizgi(i, elR, WH); cizgi(b, ayR, WH);
      // bacaklar
      cizgi(ka.l, dzL, CY, 3); cizgi(dzL, ayL, CY, 3); cizgi(ka.r, dzR, CY, 3); cizgi(dzR, ayR, CY, 3);
      // gövde
      for (let y = Math.round(om.l[1]); y <= Math.round(ka.l[1]); y += 1) {
        const k = (y - om.l[1]) / (ka.l[1] - om.l[1]);
        const xa = om.l[0] + (ka.l[0] - 1 - om.l[0]) * k; const xb = om.r[0] + (ka.r[0] + 1 - om.r[0]) * k;
        for (let x = Math.round(xa); x <= Math.round(xb); x += 1) set(x, y, CY);
      }
      // kollar
      cizgi(om.l, dsL, CY, 2); cizgi(dsL, elL, CY, 2); cizgi(om.r, dsR, CY, 2); cizgi(dsR, elR, CY, 2);
      disk(elL[0], elL[1], 1.6, WH); disk(elR[0], elR[1], 1.6, WH);
      set(dsL[0], dsL[1], WH); set(dsR[0], dsR[1], WH); set(dzL[0], dzL[1], WH); set(dzR[0], dzR[1], WH);
      cizgi([ayL[0] - 3, ayL[1]], ayL, WH, 2); cizgi(ayR, [ayR[0] + 3, ayR[1]], WH, 2);
      // boyun ve baş
      cizgi([bas[0], bas[1] + 5], [bas[0], om.l[1]], WH, 2);
      disk(bas[0], bas[1], 5.5, WH);
      set(bas[0] - 2, bas[1], BG); set(bas[0] + 2, bas[1], BG);
      // piksel tamponu -> tuval
      const d = img.data;
      for (let p = 0; p < W * H; p += 1) {
        const c = pix[p]; const q = p * 4;
        if (c === BG) { d[q + 3] = 0; } else { d[q] = PAL[c][0]; d[q + 1] = PAL[c][1]; d[q + 2] = PAL[c][2]; d[q + 3] = 255; }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.putImageData(img, 0, 0);
      ctx.drawImage(sprite, kare * W, 0, W, H, sx, sy, W, H);
    }
    // tam sayı ölçek: pikseller eşit kalsın
    function olcekle() {
      const kutu = cv.parentElement.getBoundingClientRect();
      const k = Math.max(1, Math.floor(Math.min(kutu.height / H, kutu.width / W)));
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

  etkinlestir(0);
})();
