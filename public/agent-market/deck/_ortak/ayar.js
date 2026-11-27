/* Sunum ayarları TEK yerde. */
window.AYAR = {
  /* Canlı demo (9. slayt) ayrı sekmede bu adreste açılır.
     Şimdilik demo reposunun yerel önizlemesi: cd agent-pazari-demo && npm run build && npm run preview
     Yayında hamaratlabs alt yolu olacak (adres henüz belli değil). */
  demoAdresi: '../demo/',

  /* Soru-cevap ajanı: imzalı URL veren yerel uç (deck/soru-ajani/sunucu.mjs aynı adresten sunar).
     Sunum file:// ile açıldıysa ya da uç cevap vermezse ajan yedek slayta düşer. */
  soruUcu: 'api/soru/imzali-url',

  /* Konuşmacı ekranı ile ana pencere arasındaki kanal adı. */
  kanal: 'swapline-sunum',

  /* Hedef süre (soru-cevap hariç), dakika. Konuşmacı ekranındaki süre çubuğu buna göre. */
  hedefDakika: 7.5
};

/* Demo bağlantısı adresi ayardan: target=_blank ve rel=noopener HTML'de sabit. */
(function () {
  var a = document.getElementById('demo-bag');
  if (!a) return;
  a.href = window.AYAR.demoAdresi;
  document.querySelectorAll('[data-demo-adres]').forEach(function (e) {
    e.textContent = window.AYAR.demoAdresi.replace(/^https?:\/\//, '').replace(/\/$/, '');
  });
})();
