// Kamera: x0.65 (varsayılan) <-> x0.5 (büyük alan) zoom katmanı. YALNIZ ÇİZİM dönüşümü (§2.2):
// fizik, çarpışma, üretim ve ölüm çizgisi bu modülü hiç okumaz.
// renderScale = zoom / 0.65 (normalde 1.0, büyük alanda ~0.77). Geçiş v1 themeBlendT deseniyle:
// blendT doğrusal 0 -> 1 (ZOOM_BLEND_S), geçiş ortasında yeni hedef gelirse o anki değer
// "from" olur (sıçrama yok); değer smoothstep ile yumuşatılır.
// Çapa: tavan (dünya y=0) ekranın üstünde kalır, yatayda oyun alanı ortalanır; uzaklaşınca
// altta daha çok satır (ileriye bakış), yanlarda arka plan görünür.
import * as K from './config.js';

const smooth = x => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

export function createCamera() {
  const cam = { zoom: K.ZOOM_BASE, from: K.ZOOM_BASE, to: K.ZOOM_BASE, blendT: 1, log: [] };

  cam.setTarget = function (z, reason) {
    if (z === cam.to) return;
    cam.from = cam.zoom; // yarım geçişte o anki değerden devam
    cam.to = z;
    cam.blendT = 0;
    cam.log.push({ to: z, from: +cam.from.toFixed(4), reason: reason || null });
    if (cam.log.length > 64) cam.log.shift();
  };
  cam.toggle = function (reason) {
    cam.setTarget(cam.to === K.ZOOM_BASE ? K.ZOOM_WIDE : K.ZOOM_BASE, reason || 'toggle');
  };
  cam.update = function (dt) {
    if (cam.blendT >= 1) { cam.zoom = cam.to; return; }
    cam.blendT = Math.min(1, cam.blendT + dt / K.ZOOM_BLEND_S);
    cam.zoom = cam.from + (cam.to - cam.from) * smooth(cam.blendT);
  };
  cam.snap = function (z) { cam.zoom = cam.from = cam.to = z; cam.blendT = 1; };
  cam.renderScale = () => cam.zoom / K.ZOOM_BASE;
  // Dünya -> ekran (mantıksal px)
  cam.sx = wx => K.LOGICAL_W / 2 + (wx - K.PLAY_W / 2) * cam.renderScale();
  cam.sy = wy => wy * cam.renderScale();
  // Ekranda görünen dünya dikdörtgeni
  cam.viewRect = function () {
    const r = cam.renderScale();
    const w = K.LOGICAL_W / r, h = K.LOGICAL_H / r;
    return { x0: K.PLAY_W / 2 - w / 2, x1: K.PLAY_W / 2 + w / 2, y0: 0, y1: h };
  };
  // p5 çizim bağlamına dönüşümü uygula (push/pop çağıran tarafta)
  cam.apply = function (p) {
    const r = cam.renderScale();
    p.translate(K.LOGICAL_W / 2, 0);
    p.scale(r);
    p.translate(-K.PLAY_W / 2, 0);
  };
  return cam;
}
