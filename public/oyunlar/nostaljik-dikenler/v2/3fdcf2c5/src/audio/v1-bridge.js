// Müzik köprüsü motoru: v1 sentez motorunu (v1-engine.gen.js, sketch.js'ten birebir çıkarılmış)
// v2 ses köprüsüne (audio.js attachEngine) bağlar. v2 müziği (çağ stem'leri, §11) Faz D'de bu
// arayüzün (init/update/sfx/onDeath/onReset) arkasına takılır; oyun kodu değişmez.
// Davranış v1 ile aynı: tema 0 deseni, BPM zorluk süresinden (110 -> 145, her 30 sn +5),
// AudioContext saatiyle önden planlama (rAF değil), ölümde müzik kesilir + ölüm sesi.
// v1'den farklı (Faz A kapsamı dışı): tempo-patlaması, çarpan, aşama chime'ı yok.
import * as E from './v1-engine.gen.js';
import { DERIVED } from '../config.js';

const MUSIC_CHANNELS = ['pulse2', 'musicBass', 'musicDrum', 'musicHarm'];

export function getMusicBpm(elapsedS) {
  const steps = Math.min(E.MUSIC_BPM_STEPS, Math.floor(elapsedS / E.MUSIC_BPM_STEP_S));
  return E.MUSIC_BPM_START + steps * E.MUSIC_BPM_STEP;
}

export function createV1Engine() {
  const eng = { ctx: null, chan: null, filter: null, noise: null, nextT: 0, step: 0, voices: [],
                triBusy: 0, noiseBusy: 0, log: [], theme: 0 };

  eng.init = function (ctx, dest) {
    eng.ctx = ctx;
    const sum = ctx.createGain();
    const g = E.buildAudioGraph(ctx, sum);
    eng.chan = g.chan;
    eng.filter = g.musicFilter;
    E.buildMasterChain(ctx, sum, dest);
    eng.noise = E.createNoiseBuffer(ctx);
    E.setNoiseBuffer(eng.noise);
  };

  function addVoice(v) {
    eng.voices.push(v);
    v.addEventListener('ended', () => { const i = eng.voices.indexOf(v); if (i >= 0) eng.voices.splice(i, 1); });
  }

  // info: { playing, elapsedS, stage, ballY (v2 dünya), difficultyT }
  eng.update = function (info) {
    if (!eng.chan) return;
    if (!info.playing) { eng.nextT = 0; return; }
    const ctx = eng.ctx, now = ctx.currentTime;
    if (eng.nextT < now) eng.nextT = now + 0.05;
    const bpm = getMusicBpm(info.elapsedS || 0);
    const stepS = 60 / bpm / 2;
    const tgt = E.getMusicFilterTargetHz(info.difficultyT || 0, info.stage || 0, 'normal', null);
    eng.filter.frequency.setTargetAtTime(tgt.hz, now, E.MUSIC_FILTER_SMOOTH_S);
    eng.filter.Q.setTargetAtTime(tgt.q, now, E.MUSIC_FILTER_SMOOTH_S);
    // v1 tehlike eşiği (ball.y < 110, v1 koordinatı) v2 dünya y'sine çevrilir.
    const ballYv1 = info.ballY == null ? null : info.ballY / DERIVED.SY;
    let n = 0;
    while (eng.nextT < now + E.MUSIC_LOOKAHEAD_S && n++ < 16) {
      const pattern = E.MUSIC_PATTERNS_BY_THEME[eng.theme];
      const stepInBar = eng.step % E.MUSIC_PATTERN_LEN;
      const barIndex = Math.floor(eng.step / E.MUSIC_PATTERN_LEN) % E.MUSIC_FORM_BARS;
      const rootMidi = E.BASS_ROOTS_BY_THEME[eng.theme][barIndex][stepInBar < 4 ? 0 : 1];
      const intensity = E.getMusicIntensity(eng.step, info.stage || 0, 1, ballYv1, 'normal');
      const r = E.scheduleMusicStep(ctx, eng.chan, eng.noise, {
        t: eng.nextT, stepS, stepInBar, barIndex, pattern, rootMidi, intensity, isBurst: false,
        duckTri: eng.nextT < eng.triBusy, duckNoise: eng.nextT < eng.noiseBusy, stagePitchShift: 0
      });
      for (const v of r.voices) addVoice(v);
      eng.log.push({ t: +eng.nextT.toFixed(3), step: eng.step, bpm, intensity });
      if (eng.log.length > 64) eng.log.shift();
      eng.nextT += stepS;
      eng.step++;
    }
  };

  function play(channel, build) {
    const ctx = eng.ctx;
    const info = build(ctx, eng.chan[channel], ctx.currentTime);
    if (channel === 'triangle') eng.triBusy = Math.max(eng.triBusy, info.gainEnd != null ? info.gainEnd : ctx.currentTime + E.SFX_TRIANGLE_DUCK_FALLBACK_S);
    if (channel === 'noise') eng.noiseBusy = Math.max(eng.noiseBusy, info.gainEnd != null ? info.gainEnd : ctx.currentTime + E.SFX_NOISE_DUCK_FALLBACK_S);
    return info;
  }

  // Olay -> ses eşlemesi (his: her görsel olayın bir sesi var). v1 sentez yapı taşları:
  //  landing: iniş gümü (triangle) | hurt: gürültü patlaması + düşen ıslık (pulse1)
  //  heart: yükselen arpej (pulse1) | record: çağ çanı (pulse1) | respawn: kısa vınlama (pulse1)
  eng.sfx = function (name) {
    if (!eng.chan) return;
    if (name === 'landing') play('triangle', E.buildThud);
    else if (name === 'hurt') {
      play('noise', (c, d, tt) => E.buildNoiseBurst(c, d, tt, eng.noise));
      play('pulse1', E.buildWhiz);
    } else if (name === 'heart') play('pulse1', (c, d, tt) => E.buildArpeggio(c, d, tt, 3));
    else if (name === 'record') play('pulse1', (c, d, tt) => E.buildStageUpChime(c, d, tt, eng.theme, 2));
    else if (name === 'respawn') play('pulse1', E.buildWhoosh);
  };

  eng.onDeath = function () {
    if (!eng.chan) return;
    const t = eng.ctx.currentTime;
    for (const v of eng.voices) { try { v.stop(t); } catch (e) { /* zaten durmuş */ } }
    eng.voices = [];
    for (const name of MUSIC_CHANNELS) { eng.chan[name].gain.cancelScheduledValues(t); eng.chan[name].gain.setValueAtTime(0, t); }
    eng.nextT = 0;
    play('noise', (c, d, tt) => E.buildNoiseBurst(c, d, tt, eng.noise));
    play('triangle', (c, d, tt) => E.buildDeathSting(c, d, tt + 0.03, eng.theme));
  };

  eng.onReset = function () {
    eng.nextT = 0; eng.step = 0; eng.triBusy = 0; eng.noiseBusy = 0;
    if (!eng.ctx || !eng.chan) return;
    const t = eng.ctx.currentTime;
    for (const name of MUSIC_CHANNELS) { eng.chan[name].gain.cancelScheduledValues(t); eng.chan[name].gain.setValueAtTime(E.CH_GAIN[name], t); }
  };
  return eng;
}
