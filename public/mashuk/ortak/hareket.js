/* Ortak hafif davranış.
   1) Menüde bir bağlantıya basınca menü kapanır.
   2) Hareket: .belir öğeleri ekrana girince .gorundu alır; hareket azaltma açıksa hiçbir şey gizlenmez.
      IntersectionObserver hızlı kaydırmada öğe atlayabildiği için kaydırmada (rAF ile) konum denetlenir; ekranın üstünde kalanlar da açılır. */
(function () {
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; });
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var kalan = Array.prototype.slice.call(document.querySelectorAll('.belir'));
  if (!kalan.length) return;
  document.documentElement.classList.add('hareket');
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
  // rAF sekme arka plandayken durur; kaydırma bitince bir kez de zamanlayıcıyla denetle.
  function iste() {
    if (!bekliyor) { bekliyor = true; requestAnimationFrame(denetle); }
    clearTimeout(yedek); yedek = setTimeout(denetle, 180);
  }
  window.addEventListener('scroll', iste, { passive: true });
  window.addEventListener('resize', iste);
  denetle();
})();
