/* =========================================================================
   zBurada — ortak.js
   Her sayfada kullanılan: header davranışı, mobil menü, görünme animasyonu,
   bildirim, bülten/iletişim form doğrulama. WordPress'e taşırken bu dosya
   temanın `assets/js/ortak.js` dosyasına birebir taşınabilir (enqueue ile).
   ========================================================================= */
window.ZBOrtak = (() => {
  "use strict";
  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const epostaGecerli = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

  function bildirimKur() {
    const bildirim = $("#bildirim");
    if (!bildirim) return () => {};
    let zaman;
    return (metin) => {
      bildirim.textContent = metin;
      bildirim.classList.add("acik");
      clearTimeout(zaman);
      zaman = setTimeout(() => bildirim.classList.remove("acik"), 3800);
    };
  }

  function headerKur() {
    const ust = $("#ust");
    if (ust) {
      const kaydir = () => ust.classList.toggle("kaydi", scrollY > 8);
      addEventListener("scroll", kaydir, { passive: true });
      kaydir();
    }
    const menuDugme = $(".menu-dugme"), mobilMenu = $("#mobil-menu");
    if (menuDugme && mobilMenu) {
      const kapat = () => { mobilMenu.hidden = true; menuDugme.setAttribute("aria-expanded", "false"); menuDugme.setAttribute("aria-label", "Menüyü aç"); };
      menuDugme.addEventListener("click", () => {
        const acik = menuDugme.getAttribute("aria-expanded") === "true";
        mobilMenu.hidden = acik;
        menuDugme.setAttribute("aria-expanded", String(!acik));
        menuDugme.setAttribute("aria-label", acik ? "Menüyü aç" : "Menüyü kapat");
      });
      $$("a", mobilMenu).forEach(a => a.addEventListener("click", kapat));
      document.addEventListener("keydown", e => { if (e.key === "Escape" && menuDugme.getAttribute("aria-expanded") === "true") { kapat(); menuDugme.focus(); } });
    }
    // Geçerli sayfanın menü linkini işaretle
    const dosya = location.pathname.split("/").pop() || "index.html";
    $$(".nav a[href], .mobil-menu a[href]").forEach(a => {
      if (a.getAttribute("href") === dosya) a.setAttribute("aria-current", "page");
    });
  }

  function gorunmeKur() {
    const ogeler = $$(".gorun");
    if (!ogeler.length) return;
    if ("IntersectionObserver" in window && !azHareket) {
      const io = new IntersectionObserver((girdiler) => {
        girdiler.forEach(g => { if (g.isIntersecting) { g.target.classList.add("gorundu"); io.unobserve(g.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      ogeler.forEach(el => io.observe(el));
    } else {
      ogeler.forEach(el => el.classList.add("gorundu"));
    }
  }

  function prototipLinkleriKur(bildir) {
    $$("[data-prototip]").forEach(el => el.addEventListener("click", (e) => {
      if (el.tagName === "A") e.preventDefault();
      bildir(el.dataset.prototip);
    }));
  }

  function filtreKur() {
    $$(".filtre").forEach(filtre => {
      const hedefSecici = filtre.dataset.hedef || ".tkart";
      $$("button", filtre).forEach(b => b.addEventListener("click", () => {
        $$("button", filtre).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        const f = b.dataset.filtre;
        $$(hedefSecici).forEach(k => { k.hidden = !(f === "hepsi" || k.dataset.tur === f); });
      }));
    });
  }

  function bultenFormlariKur(bildir) {
    $$("form[data-bulten]").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const ep = $('input[type="email"]', form);
        const onay = $('input[data-onay]', form);
        const hata = $("[data-hata]", form);
        if (!epostaGecerli(ep.value)) {
          if (hata) { hata.textContent = "Geçerli bir e-posta adresi yaz."; hata.hidden = false; }
          ep.closest(".alan")?.setAttribute("aria-invalid", "true");
          ep.focus();
          return;
        }
        ep.closest(".alan")?.setAttribute("aria-invalid", "false");
        if (onay && !onay.checked) {
          if (hata) { hata.textContent = "Abone olmak için duyuru e-postalarını almayı onaylaman gerekiyor."; hata.hidden = false; }
          onay.focus();
          return;
        }
        if (hata) hata.hidden = true;
        form.reset();
        bildir("Prototip: gerçek sistemde şimdi bir doğrulama e-postası gönderilirdi (çift onay). Veri gönderilmedi.");
      });
    });
  }

  function iletisimFormKur(bildir) {
    const form = $("#iletisim-formu");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ad = $("#i-ad", form), ep = $("#i-eposta", form), mesaj = $("#i-mesaj", form);
      let hata = false;
      [[ad, ad.value.trim().length < 2], [ep, !epostaGecerli(ep.value)], [mesaj, mesaj.value.trim().length < 10]]
        .forEach(([alan, kosul]) => {
          alan.closest(".alan").setAttribute("aria-invalid", String(kosul));
          if (kosul) hata = true;
        });
      if (hata) { $('.alan[aria-invalid="true"] input, .alan[aria-invalid="true"] textarea', form)?.focus(); return; }
      form.hidden = true;
      $("#iletisim-tesekkur").hidden = false;
      bildir("Prototip: mesajın gerçek sistemde e-posta kuyruğuna düşerdi. Veri gönderilmedi.");
    });
  }

  function basla() {
    const bildir = bildirimKur();
    headerKur();
    gorunmeKur();
    prototipLinkleriKur(bildir);
    filtreKur();
    bultenFormlariKur(bildir);
    iletisimFormKur(bildir);
    return { bildir, $, $$, epostaGecerli, azHareket };
  }

  return { basla, epostaGecerli, azHareket };
})();

document.addEventListener("DOMContentLoaded", () => { window.ZB_API = window.ZBOrtak.basla(); });
