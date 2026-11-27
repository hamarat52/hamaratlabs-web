/* Çalışma adı TEK yerde (tanıtım sayfası ve videoyla aynı). Ad değişirse yalnız bu satır değişir.
   Her ekranda "working name" etiketi kalır; adın çakışma kontrolü yapılmadı. */
window.CALISMA_ADI = 'Swapline';
document.querySelectorAll('[data-ad]').forEach(function (e) {
  e.textContent = e.dataset.ad === 'kucuk' ? window.CALISMA_ADI.toLowerCase()
    : e.dataset.ad === 'buyuk' ? window.CALISMA_ADI.toUpperCase() : window.CALISMA_ADI;
});
document.title = document.title.replace('{ad}', window.CALISMA_ADI);
