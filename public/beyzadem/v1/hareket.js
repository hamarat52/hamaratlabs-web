/* Ortak hafif davranış (her taslağa kopyalanır).
   1) Menüde bir bağlantıya basınca menü kapanır; menü dışına dokununca kapanır.
   2) Hareket: .belir öğeleri ekrana girince .gorundu alır. Hareket azaltma açıksa hiçbir şey gizlenmez.
      Hızlı kaydırmada öğe atlanmasın diye kaydırmada (rAF + zamanlayıcı) konum denetlenir; ekranın üstünde kalanlar da açılır.
   3) [data-ilerleme] varsa sayfa kaydırma oranı html'e --kaydirma (0..1) olarak yazılır (C'deki mezura). */
(function () {
  var menu = document.querySelector('.menu');
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; });
  });
  document.addEventListener('click', function (e) { if (menu && menu.open && !menu.contains(e.target)) menu.open = false; });

  var kok = document.documentElement;
  var ilerleme = document.querySelector('[data-ilerleme]');
  function oran() {
    var h = kok.scrollHeight - window.innerHeight;
    kok.style.setProperty('--kaydirma', h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)).toFixed(4) : '0');
  }
  if (ilerleme) { oran(); window.addEventListener('scroll', function () { requestAnimationFrame(oran); }, { passive: true }); }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  kok.classList.add('hareket');
  var kalan = Array.prototype.slice.call(document.querySelectorAll('.belir'));
  if (!kalan.length) return;
  var bekliyor = false;
  var yedek = 0;
  function denetle() {
    bekliyor = false;
    var sinir = window.innerHeight * 0.92;
    kalan = kalan.filter(function (el) {
      if (el.getBoundingClientRect().top < sinir) { el.classList.add('gorundu'); return false; }
      return true;
    });
    if (!kalan.length) { window.removeEventListener('scroll', iste); window.removeEventListener('resize', iste); }
  }
  function iste() {
    if (!bekliyor) { bekliyor = true; requestAnimationFrame(denetle); }
    clearTimeout(yedek); yedek = setTimeout(denetle, 180);
  }
  window.addEventListener('scroll', iste, { passive: true });
  window.addEventListener('resize', iste);
  denetle();
})();
