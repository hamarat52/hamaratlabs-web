/* Cast geçişi (drafts/C/c.js'ten). Aynı karakter ([data-ortak]) iki slayt arasında uçar (FLIP); yeni slaytın
   zemini karakterin durduğu yerden daire olarak açılır; eski öğeler söner, yeniler çıkartma gibi yapışır.
   Dönüş transform yerine `translate`/`scale` ile yapılır ki öğelerin CSS rotate'i (çıkartma açısı) bozulmasın. */
window.YON = {
  gecis: function (o) {
    var kok = getComputedStyle(document.documentElement);
    var ucus = kok.getPropertyValue('--egri-ucus').trim() || o.egri;
    var s = o.olcek;
    var sr = o.sahne.getBoundingClientRect();
    var anim = [];
    var merkez = { x: 960, y: 540 };

    var ucan = [];
    o.yeni.querySelectorAll('[data-ortak]').forEach(function (yb) {
      var ea = o.eski.querySelector('[data-ortak="' + yb.dataset.ortak + '"]');
      if (!ea) return;
      ucan.push(yb);
      var r1 = ea.getBoundingClientRect(), r2 = yb.getBoundingClientRect();
      var dx = (r1.left - r2.left) / s, dy = (r1.top - r2.top) / s, k = r1.width / r2.width;
      if (yb.dataset.ortak === 'kit' || !anim.length) merkez = { x: (r1.left + r1.width / 2 - sr.left) / s, y: (r1.top + r1.height / 2 - sr.top) / s };
      yb.style.transformOrigin = '0 0';
      anim.push(yb.animate(
        [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')' }, { transform: 'none' }],
        { duration: o.sure, easing: ucus, fill: 'both' }));
      anim.push(ea.animate([{ opacity: 0 }, { opacity: 0 }], { duration: o.sure, fill: 'both' }));
    });

    var yer = merkez.x + 'px ' + merkez.y + 'px';
    var zemin = o.yeni.querySelector('.zemin');
    anim.push(zemin.animate(
      [{ clipPath: 'circle(0px at ' + yer + ')' }, { clipPath: 'circle(2300px at ' + yer + ')' }],
      { duration: o.sure * 0.75, easing: o.egri, fill: 'both' }));

    [].slice.call(o.eski.children).forEach(function (el) {
      if (el.classList.contains('zemin') || el.hasAttribute('data-ortak')) return;
      anim.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: o.sure * 0.25, easing: 'ease-out', fill: 'both' }));
    });
    var i = 0;
    var gir = function (el) {
      if (el.classList.contains('zemin') || ucan.indexOf(el) > -1 || el.hasAttribute('data-adim')) return;
      if (ucan.some(function (u) { return el.contains(u); })) {
        /* uçan karakteri içeren kap (ör. raf): kabın kendisi durur, öbür çocukları girer */
        [].slice.call(el.children).forEach(gir);
        return;
      }
      var kare = el.classList.contains('cik') ? [{ opacity: 0, scale: '1.25' }, { opacity: 1, scale: '1' }]
        : [{ opacity: 0, translate: '0 40px' }, { opacity: 1, translate: '0 0' }];
      anim.push(el.animate(kare,
        { duration: o.sure * 0.45, delay: o.sure * 0.5 + i++ * 55, easing: 'cubic-bezier(.34,1.4,.55,1)', fill: 'both' }));
    };
    [].slice.call(o.yeni.children).forEach(gir);
    return anim;
  }
};
