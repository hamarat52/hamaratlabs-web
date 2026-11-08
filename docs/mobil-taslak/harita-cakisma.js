// Gelişim haritası etiket çakışma ölçümü (tarayıcıda çalışır, sonucu döndürür).
// Her istasyon etiketinin kutusunda 3 birim aralıklı noktalar, tüm hat çizgilerinde isPointInStroke ile denenir;
// etiket kutuları birbiriyle ve viewBox sağ kenarıyla da karşılaştırılır.
(() => {
  const svg = document.querySelector('.dm__svg');
  const W = svg.viewBox.baseVal.width;
  const scale = svg.getScreenCTM().a;
  const rails = [...svg.querySelectorAll('.dm-rail')];
  const labels = [...svg.querySelectorAll('.dm-label')].map(t => ({ t, b: t.getBBox(), s: t.textContent }));
  const pt = svg.createSVGPoint();
  const rail = [], pair = [], edge = [];
  labels.forEach(({ b, s }) => {
    if (b.x + b.width > W) edge.push(s);
    let hit = false;
    for (let x = b.x + 1; x < b.x + b.width - 1 && !hit; x += 3) {
      for (let y = b.y + 2; y < b.y + b.height - 2 && !hit; y += 3) {
        pt.x = x; pt.y = y;
        if (rails.some(r => r.isPointInStroke(pt))) hit = true;
      }
    }
    if (hit) rail.push(s);
  });
  labels.forEach((l, i) => labels.slice(i + 1).forEach(m => {
    const a = l.b, c = m.b;
    if (a.x < c.x + c.width && c.x < a.x + a.width && a.y < c.y + c.height - 2 && c.y < a.y + a.height - 2) pair.push(`${l.s} ~ ${m.s}`);
  }));
  const fs = parseFloat(getComputedStyle(labels[0].t).fontSize);
  return JSON.stringify({ olcek: +scale.toFixed(3), etiketPx: +(fs * scale).toFixed(2), etiket: labels.length, hattaDegen: rail, birbirine: pair, kenardanTasan: edge });
})()
