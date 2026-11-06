// Kalıcı kayıt (§12.3): tek JSON blob, sürüm alanlı, anahtar 'dusenTop.v2.save'.
// v1 anahtarı ('dusenTop.v1.bestScore') ne okunur ne yazılır. Okuma yalnız açılışta, yazma oyun
// bitince, ayar değişince ve sekme gizlenince (kare döngüsünde depolama erişimi yok, v1 Faz 21).
// localStorage erişilemezse (gizli mod vb.) oyun çalışır, veriler oturumluk kalır.
import { SAVE_KEY, SAVE_VERSION } from './config.js';

function defaults() {
  return { version: SAVE_VERSION, bestScore: 0, settings: { mute: false } };
}

export function createSave(storage) {
  const st = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  const save = { data: defaults(), ok: true, writes: 0 };

  save.load = function () {
    try {
      const raw = st.getItem(SAVE_KEY);
      save.ok = true;
      if (!raw) { save.data = defaults(); return save.data; }
      const d = JSON.parse(raw);
      save.data = migrate(d);
    } catch (e) {
      save.ok = false;
      save.data = defaults();
    }
    return save.data;
  };
  save.write = function () {
    try {
      st.setItem(SAVE_KEY, JSON.stringify(save.data));
      save.ok = true;
      save.writes++;
      return true;
    } catch (e) {
      save.ok = false;
      return false;
    }
  };
  return save;
}

// İleride şema değişirse sürüm bazlı göç burada. Bozuk/eksik alanlar varsayılana düşer.
function migrate(d) {
  const out = defaults();
  if (!d || typeof d !== 'object') return out;
  const best = parseInt(d.bestScore, 10);
  out.bestScore = Number.isFinite(best) && best > 0 ? best : 0;
  if (d.settings && typeof d.settings === 'object') out.settings.mute = !!d.settings.mute;
  return out;
}
