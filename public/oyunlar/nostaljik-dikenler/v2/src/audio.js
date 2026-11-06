// Ses köprüsü: AudioContext yaşam döngüsü (autoplay + iOS kilidi), genel ses aç/kapa (kalıcı),
// SFX ve müzik için tek kapı. Müzik/SFX sentezi takılabilir bir "motor"dan gelir (attachEngine);
// motor yoksa oyun sessiz çalışır, aç/kapa ve kilit açma yine çalışır.
// iOS Safari: bağlam ancak bir kullanıcı jestinde (touchend dahil) resume edilebilir; ayrıca ilk
// jestte 1 örneklik sessiz buffer çalınır (eski iOS sürümlerinde kilidi kesin açan yöntem).

const MASTER_VOLUME = 0.5; // v1 SOUND.masterVolume

export function createAudio(save) {
  const au = { ctx: null, master: null, muted: !!save.data.settings.mute, engine: null,
               silentPlayed: false, log: [], unlockCalls: 0 };

  function log(event, data) {
    au.log.push(Object.assign({ event, t: au.ctx ? +au.ctx.currentTime.toFixed(3) : null }, data || {}));
    if (au.log.length > 200) au.log.shift();
  }

  au.unlock = function () {
    au.unlockCalls++;
    if (!au.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return; // Web Audio yok: oyun sessiz devam eder
      au.ctx = new AC();
      au.master = au.ctx.createGain();
      au.master.gain.value = au.muted ? 0 : MASTER_VOLUME;
      au.master.connect(au.ctx.destination);
      if (au.engine) au.engine.init(au.ctx, au.master);
      log('init', { state: au.ctx.state, sampleRate: au.ctx.sampleRate });
    }
    if (!au.silentPlayed) {
      try {
        const b = au.ctx.createBuffer(1, 1, au.ctx.sampleRate);
        const src = au.ctx.createBufferSource();
        src.buffer = b; src.connect(au.ctx.destination); src.start(0);
        au.silentPlayed = true;
      } catch (e) { /* bazı tarayıcılarda gerekmez */ }
    }
    if (au.ctx.state !== 'running') {
      const before = au.ctx.state;
      const pr = au.ctx.resume();
      if (pr && pr.then) pr.then(() => log('resume', { before, state: au.ctx.state }), () => {});
    }
  };

  au.ready = () => (au.ctx && au.ctx.state === 'running' ? au.ctx : null);

  au.setMuted = function (m, source) {
    au.muted = !!m;
    if (au.master) {
      const t = au.ctx.currentTime;
      au.master.gain.cancelScheduledValues(t);
      au.master.gain.setValueAtTime(au.muted ? 0 : MASTER_VOLUME, t);
      au.master.gain.value = au.muted ? 0 : MASTER_VOLUME;
    }
    save.data.settings.mute = au.muted;
    save.write();
    log('mute', { mute: au.muted, source: source || null });
  };
  au.toggleMute = source => au.setMuted(!au.muted, source);
  au.masterGain = () => (au.master ? au.master.gain.value : null);

  au.attachEngine = function (engine) {
    au.engine = engine;
    if (au.ctx) engine.init(au.ctx, au.master);
  };

  // Oyun olayları -> motor. Motor yoksa sessiz (yalnız günlük).
  au.sfx = function (name, data) {
    log('sfx', { name });
    if (au.engine && au.ready()) au.engine.sfx(name, data || {});
  };
  au.update = function (info) { if (au.engine && au.ready()) au.engine.update(info); };
  au.onDeath = function (info) { if (au.engine && au.ready()) au.engine.onDeath(info || {}); };
  au.onReset = function () { if (au.engine) au.engine.onReset(); };
  return au;
}
