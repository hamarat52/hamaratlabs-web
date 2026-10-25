/* =========================================================================
   zBurada — test-motoru.js
   Jenerik, veri odaklı "senaryo testi" motoru. Sayfadaki <div class="oyun"
   data-test="hukuk"> niteliğine göre window.ZB_TESTLER içinden veriyi okur.
   Aynı motor Hukuk / Tıp / Bilgisayar Mühendisliği testlerinde kullanılır.

   PROTOTİP NOTU: Puanlama burada (tarayıcıda) yapılır; üretimde bu mantık
   sunucuya (/oturum/{id}/tamamla) taşınır, puan haritası tarayıcıya hiç
   gönderilmez (bkz. 02-PLAN.md §3.3). Form hiçbir yere veri göndermez.
   ========================================================================= */
(function () {
  "use strict";
  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];

  function testiBaslat(kok) {
    const testKey = kok.dataset.test;
    const veri = window.ZB_TESTLER && window.ZB_TESTLER[testKey];
    if (!veri) { console.error("zBurada test motoru: tanımsız test verisi:", testKey); return; }

    const azHareket = window.ZBOrtak ? window.ZBOrtak.azHareket : matchMedia("(prefers-reduced-motion: reduce)").matches;
    const oyun = kok;
    const ekranlar = $$(".ekran", oyun);
    const duyuru = $("#duyuru", oyun);
    const KAYIT = "zb-prototip-" + testKey;
    const durum = { i: 0, cevaplar: new Array(veri.sorular.length).fill(null), kilit: false };

    function ekranGoster(ad) {
      ekranlar.forEach(e => e.hidden = e.dataset.ekran !== ad);
      const hedef = $(`[data-ekran="${ad}"] [tabindex="-1"]`, oyun);
      if (hedef) requestAnimationFrame(() => hedef.focus({ preventScroll: true }));
      if (oyun.classList.contains("odak")) oyun.scrollTop = 0;
    }
    function odakModu(ac) {
      const mobil = matchMedia("(max-width: 759px)").matches;
      oyun.classList.toggle("odak", ac && mobil);
      document.body.classList.toggle("odakta", ac && mobil);
    }
    function kaydet() { try { localStorage.setItem(KAYIT, JSON.stringify({ i: durum.i, cevaplar: durum.cevaplar })); } catch (e) {} }
    function temizle() { try { localStorage.removeItem(KAYIT); } catch (e) {} }

    const ilerleme = $("#ilerleme", oyun);
    if (ilerleme) {
      ilerleme.style.setProperty("--adet", veri.sorular.length);
      ilerleme.innerHTML = veri.sorular.map(() => "<span></span>").join("");
    }

    function soruGoster() {
      const s = veri.sorular[durum.i];
      $("#sayac", oyun).textContent = `Soru ${durum.i + 1} / ${veri.sorular.length}`;
      $$("span", ilerleme).forEach((seg, k) => { seg.className = k < durum.i ? "dolu" : (k === durum.i ? "simdi" : ""); });
      $("#soru-metni", oyun).textContent = s.metin;
      const liste = $("#secenekler", oyun);
      liste.innerHTML = "";
      s.secenekler.forEach((sec, k) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button"; b.className = "secenek";
        b.setAttribute("aria-pressed", String(durum.cevaplar[durum.i] === k));
        b.innerHTML = `<kbd aria-hidden="true">${k + 1}</kbd><span></span>`;
        b.querySelector("span").textContent = sec.metin;
        b.addEventListener("click", () => secimYap(k));
        li.appendChild(b); liste.appendChild(li);
      });
      $("#geri", oyun).disabled = durum.i === 0;
      if (duyuru) duyuru.textContent = `Soru ${durum.i + 1} / ${veri.sorular.length}`;
      ekranGoster("soru");
    }

    function secimYap(k) {
      if (durum.kilit) return;
      durum.kilit = true;
      durum.cevaplar[durum.i] = k;
      $$(".secenek", oyun).forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
      kaydet();
      setTimeout(() => {
        durum.kilit = false;
        if (durum.i < veri.sorular.length - 1) { durum.i++; soruGoster(); }
        else { sonucGoster(); }
      }, azHareket ? 120 : 420);
    }

    function puanla() {
      const boyutKodlari = Object.keys(veri.boyutlar);
      const toplam = {}, enCok = {};
      boyutKodlari.forEach(b => { toplam[b] = 0; enCok[b] = 0; });
      let genel = 0, genelEnCok = 0;
      veri.sorular.forEach((s, i) => {
        boyutKodlari.forEach(b => { enCok[b] += Math.max(...s.secenekler.map(o => o.puan[b] || 0)); });
        genelEnCok += Math.max(...s.secenekler.map(o => Object.values(o.puan).reduce((a, c) => a + c, 0)));
        const sec = s.secenekler[durum.cevaplar[i]];
        if (sec) { Object.entries(sec.puan).forEach(([b, p]) => { toplam[b] += p; genel += p; }); }
      });
      const oran = {};
      const toplamPuan = Object.values(toplam).reduce((a, c) => a + c, 0) || 1;
      boyutKodlari.forEach(b => oran[b] = Math.round(100 * toplam[b] / toplamPuan));
      const sirali = boyutKodlari.sort((a, b) => toplam[b] - toplam[a] || enCok[a] - enCok[b]);
      return { oran, ust: sirali[0], uyum: Math.round(100 * genel / (genelEnCok || 1)) };
    }

    function sayaclaYaz(el, hedef) {
      if (azHareket) { el.textContent = "%" + hedef; return; }
      const bas = performance.now(), sure = 1100;
      const adim = (t) => {
        const x = Math.min(1, (t - bas) / sure);
        el.textContent = "%" + Math.round(hedef * (1 - Math.pow(1 - x, 3)));
        if (x < 1) requestAnimationFrame(adim);
      };
      requestAnimationFrame(adim);
    }

    function sonucGoster() {
      temizle();
      const { oran, ust, uyum } = puanla();
      const p = veri.profiller[ust];
      $("#profil-adi", oyun).textContent = p.ad;
      $("#rol-chip", oyun).textContent = `Rolün: ${p.rol}`;
      $("#profil-aciklama", oyun).textContent = uyum < 45
        ? p.metin + ` Yine de cevapların ${veri.ad.toLowerCase()} alanının senin için ilk sırada olmayabileceğini gösteriyor; Kariyer Haritası ile başka alanlara da bak.`
        : p.metin;
      $("#sonraki-metin", oyun).textContent = p.sonraki;
      $("#halka", oyun).setAttribute("aria-label", `${veri.ad} ile uyumun yüzde ${uyum}`);
      const kutu = $("#boyutlar", oyun);
      const enYuksek = Math.max(...Object.values(oran), 1);
      kutu.innerHTML = `<span class="etiket" style="font-size:.7rem">Tarzının dağılımı</span>` + Object.entries(veri.boyutlar).map(([b, ad]) =>
        `<div class="boyut"><span>${ad}</span><div class="boyut__iz" role="img" aria-label="${ad} yüzde ${oran[b]}"><div class="boyut__dolgu" data-deger="${Math.round(100 * oran[b] / enYuksek)}"></div></div><output>%${oran[b]}</output></div>`
      ).join("");
      const kart = $("#kkart", oyun);
      kart.classList.remove("gir"); void kart.offsetWidth; kart.classList.add("gir");
      const dolgu = $("#halka-dolgu", oyun);
      dolgu.style.transition = "none"; dolgu.style.strokeDashoffset = 326.73; void dolgu.getBoundingClientRect(); dolgu.style.transition = "";
      $$(".boyut__dolgu", kutu).forEach(d => d.style.width = "0%");
      ekranGoster("sonuc");
      if (duyuru) duyuru.textContent = `Sonucun hazır: ${p.ad}. ${veri.ad} ile uyumun yüzde ${uyum}.`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        dolgu.style.strokeDashoffset = 326.73 * (1 - uyum / 100);
        $$(".boyut__dolgu", kutu).forEach((d, k) => setTimeout(() => d.style.width = d.dataset.deger + "%", azHareket ? 0 : 150 * k));
      }));
      sayaclaYaz($("#uyum", oyun), uyum);
    }

    function baslat() { durum.i = 0; durum.cevaplar.fill(null); odakModu(true); soruGoster(); }
    function yenidenBaslat() {
      temizle();
      const form = $("#rapor-formu", oyun);
      if (form) form.reset();
      veliGuncelle();
      baslat();
    }

    $("#basla", oyun)?.addEventListener("click", baslat);
    $("#geri", oyun)?.addEventListener("click", () => { if (durum.i > 0) { durum.i--; soruGoster(); } });
    $$("[data-yeniden]", oyun).forEach(b => b.addEventListener("click", yenidenBaslat));
    $("#oyun-kapat", oyun)?.addEventListener("click", () => odakModu(false));
    $("#rapor-iste", oyun)?.addEventListener("click", () => ekranGoster("eposta"));
    $("#eposta-geri", oyun)?.addEventListener("click", () => ekranGoster("sonuc"));

    // Sayfadaki "teste başla" bağlantıları
    $$(`[data-baslat="${testKey}"]`).forEach(a => a.addEventListener("click", (e) => {
      e.preventDefault();
      oyun.scrollIntoView({ behavior: azHareket ? "auto" : "smooth", block: "start" });
      const gorunen = ekranlar.find(x => !x.hidden);
      if (gorunen && gorunen.dataset.ekran === "giris") setTimeout(baslat, azHareket ? 0 : 450);
      else odakModu(true);
    }));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && oyun.classList.contains("odak")) { odakModu(false); return; }
      const soruEkrani = $('[data-ekran="soru"]', oyun);
      if (!soruEkrani || soruEkrani.hidden) return;
      if (e.target.matches("input, textarea")) return;
      const harita = { "1": 0, "2": 1, "3": 2, "4": 3, "a": 0, "b": 1, "c": 2, "d": 3 };
      const k = harita[e.key.toLowerCase()];
      if (k !== undefined && k < veri.sorular[durum.i].secenekler.length) { e.preventDefault(); secimYap(k); }
      if (e.key === "ArrowLeft" && durum.i > 0) { e.preventDefault(); durum.i--; soruGoster(); }
    });

    try {
      const eski = JSON.parse(localStorage.getItem(KAYIT) || "null");
      if (eski && Array.isArray(eski.cevaplar) && eski.cevaplar.some(c => c !== null)) {
        durum.cevaplar = eski.cevaplar;
        const ilkBos = eski.cevaplar.findIndex(c => c === null);
        durum.i = ilkBos === -1 ? veri.sorular.length - 1 : ilkBos;
        const g = $('[data-ekran="giris"]', oyun);
        const devam = document.createElement("button");
        devam.type = "button"; devam.className = "btn btn--limon";
        devam.textContent = `Kaldığın yerden devam et (Soru ${durum.i + 1})`;
        devam.addEventListener("click", () => { odakModu(true); soruGoster(); });
        $(".ekran__alt", g)?.prepend(devam);
      }
    } catch (e) {}

    const form = $("#rapor-formu", oyun);
    const epostaGecerli = window.ZBOrtak ? window.ZBOrtak.epostaGecerli : (v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()));
    function veliGuncelle() {
      if (!form) return;
      const kucuk = form.yas.value === "18-alti";
      $("#alan-veli", oyun).hidden = !kucuk;
      $("#veli", oyun).required = kucuk;
    }
    if (form) {
      $$('input[name="yas"]', form).forEach(r => r.addEventListener("change", veliGuncelle));
      function alanHata(alan, hataEl, kosul) { alan.setAttribute("aria-invalid", String(kosul)); hataEl.hidden = !kosul; }
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const ep = form.eposta.value, veli = form.veli.value;
        const h1 = !epostaGecerli(ep);
        const h2 = !form.yas.value;
        const h3 = form.yas.value === "18-alti" && (!epostaGecerli(veli) || veli.trim().toLowerCase() === ep.trim().toLowerCase());
        alanHata($("#alan-eposta", oyun), $("#eposta-hata", oyun), h1);
        alanHata($("#alan-yas", oyun), $("#yas-hata", oyun), h2);
        alanHata($("#alan-veli", oyun), $("#veli-hata", oyun), h3);
        if (h1) { form.eposta.focus(); return; }
        if (h2) { $('input[name="yas"]', form).focus(); return; }
        if (h3) { form.veli.focus(); return; }
        const ad = form.ad.value.trim();
        const metin = $("#tamam-metin", oyun);
        metin.textContent = "";
        metin.append(ad ? `Teşekkürler ${ad}! ` : "Teşekkürler! ");
        const b = document.createElement("strong"); b.textContent = ep.trim(); metin.append(b);
        metin.append(" adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığında PDF raporun gelecek.");
        if (form.yas.value === "18-alti") metin.append(" Velinin adresine de bilgilendirme gönderdik.");
        if (form.ticari.checked) metin.append(" Duyuru tercihini de kaydettik; istediğin an vazgeçebilirsin.");
        ekranGoster("tamam");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$(".oyun[data-test]").forEach(testiBaslat);
  });
})();
