// OTOMATİK ÜRETİLDİ: tools/v2-audio/extract_v1_engine.py (elle düzenleme; betiği yeniden çalıştır).
// Kaynak: sketch.js (v1, son değişiklik 7ce1a8c) satır 256-504, 520-531, 2397-3180.
// v1 sentez motoru (NES tarzı kanal grafiği, müzik adım planlayıcı, SFX kurucuları) birebir.
/* eslint-disable */
const constrain = (v, a, b) => Math.min(Math.max(v, a), b); // p5 global yerine
// v1 global gürültü buffer'ı (buildThud/buildSkipThud tıklama katmanı okur): köprü atar.
let noiseBuffer = null;
export function setNoiseBuffer(b) { noiseBuffer = b; }

const SOUND = {
  landing: true,     // iniş thud (triangle)
  nearMiss: true,    // kıl payı whiz (pulse1)
  multiplier: true,  // çarpan arpeji (pulse1)
  death: true,       // ölüm gürültü patlaması + müzik kesme (noise)
  music: true,       // arkaplan müziği (pulse2)
  stageUp: true,     // Faz 6: aşama girişi chime (triangle)
  spikeWarn: true,   // Faz 6: inen diken telegraph ratchet (noise)
  skip: true,        // Faz 7: whoosh (triangle) + dolgun iniş (triangle) + skip cue (pulse1)
  pickup: true,      // Faz 9: toplama arpeji (pulse1) + bitiş tik'i (pulse1) + kalkan kırılması (triangle)
  tempoBurst: true,  // Faz 17: tempo-patlaması telegraph sesi (pulse1)
  mute: false,
  masterVolume: 0.5,
  debugLog: false    // true: her ses olayı konsola da yazılır (soundLog dizisi her zaman dolar)
};
// Fix/müzik-mix-ve-dinamik-aranjman: ses-muhendisligi-sonuc.txt Bölüm 2/6 Adım 1 tam tablosu.
// Önceki dal (fix/muzik-bas-davul-armoni) ölçümü: 20-800Hz bandı toplam enerjinin %93.9'u
// (lead -14.5dB/28x daha zayıf). Burada lead öne alınır, bas/kick kısılır -> hedef ~%55
// bas / %30 orta / %15 tiz (bkz. tools/audio-render/analyze_spectrum.py doğrulaması).
const CH_GAIN = { pulse1: 0.22, pulse2: 0.30, triangle: 0.9, noise: 0.45,
                  musicBass: 0.12, musicDrum: 0.24, musicHarm: 0.20 }; // kanal karışım seviyeleri
// İniş "thud" (triangle): 60Hz -> 30Hz üstel pitch drop
const THUD_F0 = 60;
const THUD_F1 = 30;
const THUD_DROP_S = 0.12;
const THUD_ATTACK_S = 0.004;
const THUD_DECAY_S = 0.12;         // Faz 10: 0.16 -> 0.12 (enerji 30-60Hz kuyruktan duyulur banda kaydı)
// Faz 10 (TASARIM.md §11.2): thud "daha dolgun/belirgin" — ölçüme dayalı tasarım (OfflineAudioContext,
// 0.3sn, 44.1kHz, ham build çıkışı):
//  * Eski thud ham peak 0.986; brief'teki tepe 1.4/1.5/1.6 aynı yapıda peak 1.38/1.48/1.58 = CLIPPING.
//  * §11.2: thud ile skipThud arasındaki RMS/peak farkı DARALMAMALI. skipThud RMS 0.193 > thud 0.113;
//    thud'ın tam bant RMS'ini artırmak farkı doğrudan daraltır. Bu yüzden tam bant RMS ve peak ÖNCE
//    değerlerinin ALTINDA tutuldu; yükseklik, enerjinin küçük hoparlörde (telefon/laptop, ~150Hz altı
//    neredeyse sessiz) duyulmayan 30-60Hz triangle kuyruğundan, duyulan banda (220->110Hz sine body)
//    kaydırılmasıyla kazanıldı: HP150 bandı RMS 0.027 -> 0.061 (~+7 dB).
//  * skipThud'dan ayrışma: waveshaper YOK, body frekansı skip'in (45->20Hz) ~5 katı, süre kısa.
const THUD_PEAK = 0.6;             // triangle zarf tepesi (eski 1; body ile toplam peak 0.88)
const THUD_HOLD_S = 0.01;          // tepe tutma (dolgunluk)
const THUD_BODY_F0 = 220;          // sine body: küçük hoparlörde duyulan alt-orta "tok" katman
const THUD_BODY_F1 = 110;
const THUD_BODY_PEAK = 0.7;
const THUD_BODY_ATTACK_S = 0.002;
const THUD_BODY_DECAY_S = 0.09;
// Faz 13 (TASARIM.md §14.2-14.3): iniş "vurma" transienti — bant geçiren gürültü click (buildRatchet deseni)
const LANDING_CLICK_HZ = 1200;
const LANDING_CLICK_Q = 1.1;
const LANDING_CLICK_S = 0.01;
const LANDING_CLICK_PEAK = [0.5, 0.5, 0.68, 0.88]; // index: 0=normal iniş, 1/2/3=skip tier
// Kıl payı "whiz" (square, yüksek frekansa hızlı yukarı süpürme)
const WHIZ_F0 = 1400;
const WHIZ_F1 = 2800;
const WHIZ_S = 0.09;
// Çarpan arpeji (square): majör pentatonik, yükselen staccato. Nota sayısı = yeni çarpan + 1
// (x2 -> 3 nota ... x5 -> 6 nota). Whiz bittikten SONRA başlar: iki ses karışmaz.
const ARP_SCALE_MIDI = [72, 74, 76, 79, 81, 84]; // C5 D5 E5 G5 A5 C6
const ARP_NOTE_S = 0.04;  // nota süresi (staccato)
const ARP_STEP_S = 0.055; // nota başlangıçları arası
// Ölüm: şiddetli beyaz gürültü patlaması (noise) + müziğin (pulse2) rampasız, anında kesilmesi
const DEATH_NOISE_ATTACK_S = 0.002;
const DEATH_NOISE_DECAY_S = 0.45;
const NOISE_BUFFER_S = 1;
// Müzik (pulse2): 110 BPM başlangıç, +5 BPM adımlar, tavan 145 BPM. Ayrı zamanlayıcı YOK:
// BPM zorluk eğrisinin durumundan (scrollSpeed adım sayısı + speedTimer) türetilir, notalar draw() içinden
// audioCtx.currentTime ile önden (lookahead) planlanır.
const MUSIC_BPM_START = 110;
const MUSIC_BPM_STEP = 5;
const MUSIC_BPM_STEP_S = 30;   // her 30sn +5 BPM
const MUSIC_BPM_MAX = 145;
const MUSIC_BPM_STEPS = (MUSIC_BPM_MAX - MUSIC_BPM_START) / MUSIC_BPM_STEP; // 7
// Faz 17: tema başına bir pattern (index = themeIndex). Format/uzunluk eskisiyle aynı (8 sekizlik);
// stepS, MUSIC_NOTE_FRAC, square/pulse2 değişmez. Tema 2 = Faz 5-16'nın tek pattern'i (birebir).
// Geçiş: themeIndex değişince pattern bir sonraki 8'lik döngü başında (musicStep % 8 === 0) değişir.
const MUSIC_PATTERNS_BY_THEME = [
  [45, 48, 52, 48, 45, 50, 52, 50], // 0 Karanlık: A2 C3 E3 C3 A2 D3 E3 D3 (dar, düşük, minör)
  [48, 52, 55, 52, 57, 55, 52, 50], // 1 Gündüz:   C3 E3 G3 E3 A3 G3 E3 D3 (majör, parlak)
  [45, 52, 57, 52, 48, 55, 60, 55], // 2 Gece:     A2 E3 A3 E3 C3 G3 C4 G3 (MEVCUT pattern)
  [45, 46, 52, 46, 45, 51, 52, 51], // 3 Lav:      A2 Bb2 E3 Bb2 A2 Eb3 E3 Eb3 (m2 + tritone)
  [45, 52, 59, 52, 45, 50, 59, 50]  // 4 Buz:      A2 E3 B3 E3 A2 D3 B3 D3 (geniş atlama)
];
const MUSIC_PATTERN_LEN = 8;
const MUSIC_NOTE_FRAC = 0.55;  // nota uzunluğu = adımın %55'i (8-bit staccato)
const MUSIC_NOTE_FRAC_LEGATO = 0.85; // Bar 3 (B kesiti): daha bağlı/legato çalım
const MUSIC_LOOKAHEAD_S = 0.12;

// --- Fix/müzik-bas-davul-armoni: bas+davul+armoni "orkestra" katmanları ---------------------
// Melodi notalarına (MUSIC_PATTERNS_BY_THEME) DOKUNULMAZ; üstüne katman eklenir. 8 adımlık
// melodi döngüsü aynı kalırken form 32 adıma (4 bar: A-A'-B-C) bas/davul/armoni akor
// değişimiyle genişler (araştırma raporu: muzik-arastirma-sonuc.txt, ADIM 1-6).
const MUSIC_FORM_BARS = 4;              // 4 bar x 8 adım = 32 adımlık form
const MUSIC_LEAD_OCTAVE_SHIFT = 12;     // lead (pulse2) +1 oktav: bas hattıyla çakışma sıfırlanır

// ADIM 1: her temanın her barı için [ilk yarı kökü, ikinci yarı kökü] (MIDI, triangle bas).
const BASS_ROOTS_BY_THEME = [
  [[33, 38], [33, 36], [41, 38], [33, 40]], // 0 Karanlık (Am -> Dm/A)
  [[36, 45], [36, 43], [41, 43], [36, 43]], // 1 Gündüz   (C -> Am/G)
  [[33, 36], [41, 43], [33, 36], [38, 40]], // 2 Gece     (Am -> C)
  [[33, 34], [33, 39], [34, 33], [39, 40]], // 3 Lav      (Frigyen/Locrian, m2+tritone)
  [[33, 38], [40, 38], [36, 38], [40, 33]]  // 4 Buz      (Dorian/Sus2)
];

// ADIM 3: bas hattı (triangle, oktav pompa ritmi: çift adım kök, tek adım +12 oktav üstü).
const BASS_EVEN_FRAC = 0.62;   // vuruş başı (kök) kapı süresi oranı (nefes boşluğu açıldı)
const BASS_ODD_FRAC = 0.42;    // off-beat (oktav) kapı süresi oranı
const BASS_PLUCK_S = 0.018;    // pluck/slap: freq*1.15 -> freq üstel ramp süresi
const BASS_PLUCK_MULT = 1.15;
const BASS_ATTACK_S = 0.004;
const BASS_RELEASE_S = 0.015;
const BASS_PEAK = 1.0;

// ADIM 4: davul (noise + triangle gövde, zaman paylaşımlı tek "kanal"). Değerler
// ses-muhendisligi-sonuc.txt Bölüm 6 Adım 1 tam tablosundan BİREBİR.
const KICK_F0 = 115, KICK_F1 = 45, KICK_DROP_S = 0.042, KICK_ATTACK_S = 0.002, KICK_PEAK = 0.68;
// Adım 5: kick "beater click" (8ms bandpass @2800Hz) - tiz transient, kick küçük hoparlörde de duyulsun.
const KICK_CLICK_HZ = 2800, KICK_CLICK_Q = 1.5, KICK_CLICK_S = 0.008, KICK_CLICK_PEAK = 0.25;
const SNARE_BODY_F0 = 190, SNARE_BODY_F1 = 85, SNARE_BODY_S = 0.035, SNARE_BODY_ATTACK_S = 0.002,
      SNARE_BODY_PEAK = 0.45;
const SNARE_NOISE_HZ = 2200, SNARE_NOISE_FILL_HZ = 2800, SNARE_NOISE_Q = 0.65,
      SNARE_NOISE_ATTACK_S = 0.002, SNARE_NOISE_DECAY_S = 0.110, SNARE_NOISE_PEAK = 1.10;
const HIHAT_HZ = 5200, HIHAT_Q = 0.8, HIHAT_ATTACK_S = 0.001, HIHAT_DECAY_S = 0.048,
      HIHAT_DECAY_OPEN_S = 0.095, HIHAT_PEAK = 0.85;

// ADIM 5: ikinci pulse armoni/arpej katmanı (hızlı chip-arpej: midi -> nextMidi -> midi).
const HARM_SEG_S = 0.035;
const HARM_PEAK = 0.8;

// --- Fix/müzik-mix-ve-dinamik-aranjman: ses mühendisliği (EQ/sentez/master) sabitleri ------
// (ses-muhendisligi-sonuc.txt Bölüm 3/4/5/6, Adım 2-7)
// ADIM 3: %25/%12.5 duty cycle PeriodicWave (NES 2A03 pulse kanalı tınısı). Lead = %25 (sıcak,
// obua benzeri), Armoni = %12.5 (parlak, kristal arpej). 32 harmonik, b_n = (2/nπ)sin(nπD).
const PULSE_WAVE_HARMONICS = 32;
const PULSE_LEAD_DUTY = 0.25;
const PULSE_HARM_DUTY = 0.125;
// ADIM 4: lead unison detune (±5 cent) - iki pulse25 osilatör, faz girişimiyle "canlı/geniş" tını.
const LEAD_DETUNE_CENTS = [-5, 5];
const LEAD_DETUNE_GAIN = 0.65;         // her unison osc'un karışım kazancı
const LEAD_PLUCK_OVERSHOOT = 1.2;      // ilk ~12ms parlaklık zarfı (pluck transienti)
const LEAD_PLUCK_SUSTAIN = 0.85;       // sustain seviyesi
const LEAD_PLUCK_ATTACK_S = 0.012;
const LEAD_PLUCK_DECAY_S = 0.045;
// ADIM 6: kanal bazlı BiquadFilterNode EQ zinciri frekansları (setupChannelStrip).
const EQ_BASS_HPF_HZ = 45, EQ_BASS_HPF_Q = 0.707;
const EQ_BASS_PEAK_HZ = 110, EQ_BASS_PEAK_GAIN = -3.5, EQ_BASS_PEAK_Q = 1.2;
const EQ_BASS_LPF_HZ = 650, EQ_BASS_LPF_Q = 0.707;
const EQ_LEAD_HPF_HZ = 250, EQ_LEAD_HPF_Q = 0.707;
const EQ_LEAD_PEAK_HZ = 380, EQ_LEAD_PEAK_GAIN = -4.0, EQ_LEAD_PEAK_Q = 1.4;
const EQ_LEAD_SHELF_HZ = 2200, EQ_LEAD_SHELF_GAIN = 9.0;
const EQ_LEAD_LPF_HZ = 11000, EQ_LEAD_LPF_Q = 0.707;
const EQ_HARM_HPF_HZ = 420, EQ_HARM_HPF_Q = 0.707;
const EQ_HARM_SHELF_HZ = 3200, EQ_HARM_SHELF_GAIN = 5.0;
const EQ_DRUM_HPF_HZ = 45, EQ_DRUM_HPF_Q = 0.707;
const EQ_DRUM_PEAK_HZ = 220, EQ_DRUM_PEAK_GAIN = -3.5, EQ_DRUM_PEAK_Q = 1.2;
const EQ_DRUM_SHELF_HZ = 4500, EQ_DRUM_SHELF_GAIN = 4.5;
// ADIM 7: master bus - kısa oda reverb'ü (ConvolverNode, sentetik IR) + glue compressor + tilt EQ.
const REVERB_IR_S = 0.30;          // sentetik oda IR süresi
const REVERB_IR_DECAY = 6;         // e^{-t*DECAY} üstel sönüm
const REVERB_SEND_GAIN = 0.15;     // lead + armoni'den reverb'e gönderim seviyesi
const REVERB_SEND_HPF_HZ = 600, REVERB_SEND_LPF_HZ = 5500; // basları reverb'e göndermez
const MASTER_TILT_LOW_HZ = 180, MASTER_TILT_LOW_GAIN = -2.5;
const MASTER_TILT_HIGH_HZ = 3200, MASTER_TILT_HIGH_GAIN = 3.5;
const MASTER_COMP_THRESHOLD = -16, MASTER_COMP_KNEE = 12, MASTER_COMP_RATIO = 3.5,
      MASTER_COMP_ATTACK = 0.015, MASTER_COMP_RELEASE = 0.12;
const MASTER_SOFTCLIP_DRIVE = 1.6;   // tanh(k*x)/tanh(k) yumuşak kırpma

// --- Fix/müzik-mix-ve-dinamik-aranjman: dinamik aranjman sabitleri -------------------------
// (muzik-aranjman-dinamik-sonuc.txt Bölüm 7, Adım 1-7)
// ADIM 1: getMusicIntensity() durum makinesi eşikleri.
const INTENSITY_INTRO_STEPS = 8;       // musicStep < 8: yoğunluk 0 (nefes/intro)
const INTENSITY_MULTIPLIER_BOOST = 4;  // multiplier >= 4 -> yoğunluk +1
const INTENSITY_DANGER_BALL_Y = 110;   // ball.y < 110 (diken şeridine yakın) -> yoğunluk +1
// ADIM 3: bar bazlı gerilim-çözülme eğrisi (getStepDynamics -> barGain çarpanı).
const BAR0_ACCENT_GAIN = 1.12, BAR0_REST_GAIN = 0.88;   // A - çözülme ("The One" vurgulu)
const BAR1_GAIN = 0.94;                                  // A' - hareketlenme
const BAR2_GAIN = 1.05;                                  // B - genişleme (legato)
const BAR3_GAIN_START = 0.90, BAR3_GAIN_END = 1.20;      // C - gerilim crescendo
// ADIM 4: groove (swing + ghost velocity).
const SWING_OFFSET_FRAC = 0.018;        // off-beat mikro-gecikme (stepS oranı)
const HIHAT_GHOST_WEAK = 0.60;          // stepInBar 1,3
const HIHAT_GHOST_MED = 0.75;           // stepInBar 5
const HIHAT_GHOST_STRONG = 0.95;        // stepInBar 7
// ADIM 5: dinamik master müzik filtresi (lowpass sweep) - SADECE müzik kanalları.
const MUSIC_FILTER_BASE_HZ = 2600, MUSIC_FILTER_RANGE_HZ = 4400, MUSIC_FILTER_STAGE_STEP_HZ = 800;
const MUSIC_FILTER_BURST_HZ = 4600, MUSIC_FILTER_BURST_Q = 0.85;
const MUSIC_FILTER_TELE_START_HZ = 1800, MUSIC_FILTER_TELE_END_HZ = 10000;
const MUSIC_FILTER_SMOOTH_S = 0.08;
// ADIM 6: tonaliteye uygun death sting (4 nota: 3 hızlı iniş + 1 çöken son nota).
const DEATH_STING_NOTE_S = 0.09;
const DEATH_STING_LAST_S = 0.32;
const DEATH_STING_PITCH_DROP_ST = -2;
const DEATH_STING_BY_THEME = [
  [64, 60, 57, 56], // 0 Karanlık (Am): E4 C4 A3 G#3
  [67, 64, 63, 60], // 1 Gündüz (C):   G4 E4 Eb4 C4
  [69, 64, 60, 57], // 2 Gece:         A4 E4 C4 A3
  [64, 63, 58, 57], // 3 Volkanik:     E4 Eb4 Bb3 A3
  [71, 64, 59, 57]  // 4 Buz/Kış:      B4 E4 B3 A3
];
// ADIM 7: stage geçişi - tonaliteye uygun, stage'e göre büyüyen fanfar akorları + "vites atlama".
const STAGEUP_CHORDS_BY_THEME = [
  [69, 72, 76, 81, 83], // 0 Karanlık (Am): A4 C5 E5 A5 B5
  [60, 64, 67, 72, 76], // 1 Gündüz (C):    C4 E4 G4 C5 E5
  [69, 72, 76, 81, 84], // 2 Gece (Am):     A4 C5 E5 A5 C6
  [57, 61, 64, 69, 73], // 3 Volkanik:      A3 C#4 E4 A4 C#5
  [57, 60, 64, 69, 74]  // 4 Buz (Dorian):  A3 C4 E4 A4 D5
];
const STAGEUP_PITCH_SHIFT_SEMITONES = 2; // stage>=3: tüm müzik katmanları +2 yarı ton ("vites atlama")
const STAGEUP_PITCH_SHIFT_STEPS = 8;     // yeni stage girişinden sonraki ilk 8 adım boyunca

// ADIM 6: SFX ducking - triangle/noise SFX çalarken o pencerede bas/davul katmanı atlanır
// (iniş thud, diken uyarısı, çarpan vb. %100 net duyulmaya devam eder, regresyon olmaz).
const SFX_TRIANGLE_DUCK_FALLBACK_S = 0.14;
const SFX_NOISE_DUCK_FALLBACK_S = 0.20;
let sfxTriangleBusyUntil = 0;
let sfxNoiseBusyUntil = 0;
// Faz 17: tempo-patlaması -> hız-patlaması. Zamanlama getDifficultyElapsedS()'ten (ayrı zamanlayıcı
// YOK, deterministik): ilk patlama zorluk-zamanı 20sn, sonra her 30sn (20, 50, 80, ...).
// Patlamadan TEMPO_BURST_TELEGRAPH_S önce uyarı (ses + HUD). BPM çarpanı yalnız updateAudio()'da,
// hız çarpanı yalnız getEffectiveScrollSpeed()'de uygulanır; getMusicBpm() ve kalıcı scrollSpeed
// state'i patlamadan ETKİLENMEZ.
const TEMPO_BURST_FIRST_S = 20;
const TEMPO_BURST_INTERVAL_S = 30;
const TEMPO_BURST_TELEGRAPH_S = 1.2;   // patlamadan ÖNCE uyarı penceresi
const TEMPO_BURST_DURATION_S = 4.0;    // patlama süresi
const TEMPO_BURST_BPM_MULT = 1.35;     // BPM x1.35
const TEMPO_BURST_SPEED_MULT = 1.4;    // scrollSpeed x1.4 (geçici) — 1.15 hissedilmiyordu (Yusuf geri bildirimi)
const TEMPO_BURST_RAMP_S = 0.3;        // hız çarpanı bu sürede yumuşak (smoothstep) girer/çıkar
const TEMPO_BURST_LOG_MAX = 32;
// Telegraph sesi (pulse1): sawtooth, 3 nota, her nota kendi içinde +2 yarım ton yukarı kayar ve
// aralar kısalır (0.14 -> 0.10sn) -> "hızlanma geliyor". Ratchet (noise tıkırtı) ve square
// arpejlerden (skipCue/pickup/çarpan) dalga + glide + hızlanan ritimle ayrışır. Toplam ~0.31sn.
const TEMPO_TELE_MIDI = [64, 67, 71];        // E4 G4 B4
const TEMPO_TELE_ONSETS_S = [0, 0.14, 0.24]; // hızlanan aralıklar
const TEMPO_TELE_NOTE_S = 0.07;
const TEMPO_TELE_GLIDE_ST = 2;               // nota içi yukarı kayma (yarım ton)
const TEMPO_TELE_PEAK = 0.6;
// Faz 6 stageUp chime (triangle), yükselen. Çarpan arpejinden farkı: dalga (triangle vs
// square), nota uzunluğu (0.12sn vs 0.04sn staccato), uzun çınlama kuyruğu. Fix/müzik-mix-ve-
// dinamik-aranjman ADIM7: akor artık STAGEUP_CHORDS_BY_THEME'den (tonaliteye uygun, stage'e göre
// büyüyen) geliyor; STAGEUP_MIDI sabit La Majör üçlüsü sadece tema0 fallback referansı olarak kalır.
const STAGEUP_MIDI = [69, 73, 76];
const STAGEUP_STEP_S = 0.12;
const STAGEUP_TAIL_S = 0.4;   // son nota sönümü -> toplam ~0.64sn
const STAGEUP_PEAK = 0.45;
// Faz 6 diken uyarısı (noise): bant geçiren (metalik) gürültü tıkırtıları, telegraph içinde biter.
const RATCHET_CLICKS = 3;
const RATCHET_STEP_S = 0.07;
const RATCHET_CLICK_S = 0.018;
const RATCHET_BP_HZ = 3500;
const RATCHET_BP_Q = 9;
const SOUND_LOG_MAX = 200;
const MUSIC_LOG_MAX = 64;

const WHOOSH_F0 = 120;
const WHOOSH_F1 = 350;
const WHOOSH_S = 0.08;
const WHOOSH_PEAK = 0.55;
const SKIP_THUD_F0 = 45;
const SKIP_THUD_F1 = 20;
const SKIP_THUD_DROP_S = 0.16;
const SKIP_THUD_DECAY_S = 0.26;
const SKIP_THUD_DRIVE = 3;         // waveshaper sürüşü ("bas distorsiyonu": küçük hoparlörde de duyulur)
const SKIP_CUE_MIDI = [79, 84, 88, 91]; // G5 C6 E6 G6
const SKIP_CUE_NOTE_S = 0.035;
const SKIP_CUE_STEP_S = 0.05;

function createNoiseBuffer(ctx) {
  const len = Math.floor(ctx.sampleRate * NOISE_BUFFER_S);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// Basit AD zarfı: 0 -> peak (attack, doğrusal) -> ~0 (decay, üstel). Bitiş zamanını döndürür.
function envelopeAD(param, t, peak, attackS, decayS) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attackS);
  param.exponentialRampToValueAtTime(0.0001, t + attackS + decayS);
  return t + attackS + decayS;
}

function cleanupOnEnded(src, nodes) {
  src.onended = () => { for (const n of nodes) n.disconnect(); };
}

// İniş "thud": triangle, 60Hz -> 30Hz üstel pitch drop.
// Faz 10: triangle zarfı attack -> HOLD -> üstel decay (tepe THUD_PEAK) + paralel sine body
// katmanı (220 -> 110Hz, kısa AD). Waveshaper yok (skipThud'ın karakteri değil).
function buildThud(ctx, dest, t) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(THUD_F0, t);
  osc.frequency.exponentialRampToValueAtTime(THUD_F1, t + THUD_DROP_S);
  const env = ctx.createGain();
  const peakAt = t + THUD_ATTACK_S;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(THUD_PEAK, peakAt);
  env.gain.setValueAtTime(THUD_PEAK, peakAt + THUD_HOLD_S);
  const end = peakAt + THUD_HOLD_S + THUD_DECAY_S;
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);

  const body = ctx.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(THUD_BODY_F0, t);
  body.frequency.exponentialRampToValueAtTime(THUD_BODY_F1, t + THUD_BODY_DECAY_S);
  const bodyEnv = ctx.createGain();
  const bodyEnd = envelopeAD(bodyEnv.gain, t, THUD_BODY_PEAK, THUD_BODY_ATTACK_S, THUD_BODY_DECAY_S);
  body.connect(bodyEnv).connect(dest);
  body.start(t);
  body.stop(bodyEnd + 0.01);
  cleanupOnEnded(body, [body, bodyEnv]);

  // Faz 13 (§14.2): kısa bant geçiren gürültü "click" — tonal katmanlara vurma transienti
  const tierIndex = 0;
  const clickSrc = ctx.createBufferSource();
  clickSrc.buffer = noiseBuffer;
  const clickBp = ctx.createBiquadFilter();
  clickBp.type = 'bandpass';
  clickBp.frequency.setValueAtTime(LANDING_CLICK_HZ, t);
  clickBp.Q.setValueAtTime(LANDING_CLICK_Q, t);
  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(LANDING_CLICK_PEAK[tierIndex], t);
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, t + LANDING_CLICK_S);
  clickSrc.connect(clickBp).connect(clickEnv).connect(dest);
  clickSrc.start(t);
  clickSrc.stop(t + LANDING_CLICK_S + 0.005);
  cleanupOnEnded(clickSrc, [clickSrc, clickBp, clickEnv]);

  return { node: osc, type: osc.type, freqStart: THUD_F0, freqEnd: THUD_F1, rampEnd: t + THUD_DROP_S,
           gainStart: t, gainPeakAt: peakAt, gainPeak: THUD_PEAK, holdEnd: peakAt + THUD_HOLD_S,
           gainEnd: end, stopAt: end + 0.01,
           bodyType: body.type, bodyFreqStart: THUD_BODY_F0, bodyFreqEnd: THUD_BODY_F1,
           bodyPeak: THUD_BODY_PEAK, bodyEnd: bodyEnd };
}

// Kıl payı "whiz": square, 1400Hz -> 2800Hz hızlı yukarı süpürme.
function buildWhiz(ctx, dest, t) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(WHIZ_F0, t);
  osc.frequency.exponentialRampToValueAtTime(WHIZ_F1, t + WHIZ_S);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, 1, 0.003, WHIZ_S - 0.003);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, freqStart: WHIZ_F0, freqEnd: WHIZ_F1, rampEnd: t + WHIZ_S,
           gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Çarpan arpeji: square, majör pentatonik yükselen staccato. Yeni çarpan m için m+1 nota
// (x2: C5 D5 E5 ... x5: C5 D5 E5 G5 A5 C6) -> çarpan büyüdükçe arpej uzar ve tizleşir.
// Tek osilatör, frekans nota başına basamaklı (setValueAtTime), kapı zarfı nota başına.
function buildArpeggio(ctx, dest, t, mult) {
  const count = constrain(mult + 1, 2, ARP_SCALE_MIDI.length);
  const osc = ctx.createOscillator();
  osc.type = 'square';
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const freqs = [];
  for (let i = 0; i < count; i++) {
    const ns = t + i * ARP_STEP_S;
    const f = midiToHz(ARP_SCALE_MIDI[i]);
    freqs.push(+f.toFixed(2));
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(0, ns);
    env.gain.linearRampToValueAtTime(1, ns + 0.002);
    env.gain.setValueAtTime(1, ns + ARP_NOTE_S - 0.004);
    env.gain.linearRampToValueAtTime(0, ns + ARP_NOTE_S);
  }
  const end = t + (count - 1) * ARP_STEP_S + ARP_NOTE_S;
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, notes: count, freqs: freqs, gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Ölüm patlaması: beyaz gürültü buffer'ı, sert atak + 0.45sn üstel sönüm.
function buildNoiseBurst(ctx, dest, t, buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, 1, DEATH_NOISE_ATTACK_S, DEATH_NOISE_DECAY_S);
  src.connect(env).connect(dest);
  src.start(t);
  src.stop(end + 0.01);
  cleanupOnEnded(src, [src, env]);
  return { node: src, type: 'noise-buffer', bufferLen: buffer.length, gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// ADIM6 (aranjman): tonaliteye uygun "death sting" - 3 hızlı alçalan nota (0.09sn adım) + 1
// uzayan/çöken son nota (0.32sn, sonunda -2 yarı ton aşağı pitch-bend). cutMusicNow() sonrası
// müzikal cümleyi havada bırakmamak için gürültü patlamasının hemen arkasına eklenir.
function buildDeathSting(ctx, dest, t, themeIndex) {
  const notes = DEATH_STING_BY_THEME[themeIndex || 0] || DEATH_STING_BY_THEME[0];
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const freqs = [];
  for (let i = 0; i < 3; i++) {
    const ns = t + i * DEATH_STING_NOTE_S;
    const f = midiToHz(notes[i]);
    freqs.push(+f.toFixed(2));
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(0.7, ns);
    env.gain.linearRampToValueAtTime(0, ns + DEATH_STING_NOTE_S * 0.9);
  }
  const lastStart = t + 3 * DEATH_STING_NOTE_S;
  const f0 = midiToHz(notes[3]);
  const f1 = midiToHz(notes[3] + DEATH_STING_PITCH_DROP_ST);
  osc.frequency.setValueAtTime(f0, lastStart);
  osc.frequency.exponentialRampToValueAtTime(f1, lastStart + DEATH_STING_LAST_S);
  const end = lastStart + DEATH_STING_LAST_S;
  env.gain.setValueAtTime(0.7, lastStart);
  env.gain.exponentialRampToValueAtTime(0.001, end);
  freqs.push(+f0.toFixed(2));
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, notes: notes.length, freqs: freqs,
           gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Faz 6 stageUp chime: triangle, tonaliteye uygun (musicThemeIndex) + stage'e göre büyüyen
// fanfar akoru (stage1: 3 nota, stage2: 4, stage3: 5), legato + uzun sönüm (ADIM7, aranjman).
// Çarpan arpejinden ayrı: square değil triangle, 0.04sn staccato değil 0.12sn adım, son nota çınlar.
function buildStageUpChime(ctx, dest, t, themeIndex, stageVal) {
  const chordsAll = STAGEUP_CHORDS_BY_THEME[themeIndex || 0] || STAGEUP_CHORDS_BY_THEME[0];
  const count = constrain((stageVal || 1) + 2, 3, chordsAll.length);
  const midis = chordsAll.slice(0, count);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const freqs = [];
  for (let i = 0; i < midis.length; i++) {
    const ns = t + i * STAGEUP_STEP_S;
    const f = midiToHz(midis[i]);
    freqs.push(+f.toFixed(2));
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(STAGEUP_PEAK * 0.6, ns);
    env.gain.linearRampToValueAtTime(STAGEUP_PEAK, ns + 0.01);
  }
  const lastStart = t + (midis.length - 1) * STAGEUP_STEP_S;
  const end = lastStart + STAGEUP_TAIL_S;
  env.gain.setValueAtTime(STAGEUP_PEAK, lastStart + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, end);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, notes: midis.length, freqs: freqs,
           gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Faz 6 diken uyarısı: bant geçiren gürültü "ratchet" tıkırtıları (telegraph 0.3sn içinde biter).
function buildRatchet(ctx, dest, t, buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(RATCHET_BP_HZ, t);
  bp.Q.setValueAtTime(RATCHET_BP_Q, t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  for (let i = 0; i < RATCHET_CLICKS; i++) {
    const ns = t + i * RATCHET_STEP_S;
    env.gain.setValueAtTime(1, ns);
    env.gain.linearRampToValueAtTime(0, ns + RATCHET_CLICK_S);
  }
  const end = t + (RATCHET_CLICKS - 1) * RATCHET_STEP_S + RATCHET_CLICK_S;
  src.connect(bp).connect(env).connect(dest);
  src.start(t);
  src.stop(end + 0.01);
  cleanupOnEnded(src, [src, bp, env]);
  return { node: src, type: 'noise-bandpass', clicks: RATCHET_CLICKS, bpHz: RATCHET_BP_HZ,
           gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Faz 7 whoosh: triangle, 120Hz -> 350Hz yukarı glissando (80ms). Satır geçme anı.
function buildWhoosh(ctx, dest, t) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(WHOOSH_F0, t);
  osc.frequency.exponentialRampToValueAtTime(WHOOSH_F1, t + WHOOSH_S);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, WHOOSH_PEAK, 0.01, WHOOSH_S - 0.01);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, freqStart: WHOOSH_F0, freqEnd: WHOOSH_F1, rampEnd: t + WHOOSH_S,
           gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Faz 7 pas'lı iniş: normal thud'tan (60->30Hz, 0.16sn) daha dolgun/tok -> 45->20Hz, 0.26sn sönüm,
// waveshaper (tanh) ile hafif bas distorsiyonu (üst harmonikler: küçük hoparlörde de duyulur).
// Faz 13 (§14.3): tier (1/2/3) verilirse LANDING_CLICK_PEAK[tier] şiddetinde click eklenir; tier'sız
// çağrı (sfxAegisBreak) eski sesi aynen üretir.
function buildSkipThud(ctx, dest, t, tier) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(SKIP_THUD_F0, t);
  osc.frequency.exponentialRampToValueAtTime(SKIP_THUD_F1, t + SKIP_THUD_DROP_S);
  const shaper = ctx.createWaveShaper();
  const n = 256, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(SKIP_THUD_DRIVE * x) / Math.tanh(SKIP_THUD_DRIVE);
  }
  shaper.curve = curve;
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, 1, THUD_ATTACK_S, SKIP_THUD_DECAY_S);
  osc.connect(shaper).connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, shaper, env]);
  if (tier >= 1 && tier <= 3) {
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = noiseBuffer;
    const clickBp = ctx.createBiquadFilter();
    clickBp.type = 'bandpass';
    clickBp.frequency.setValueAtTime(LANDING_CLICK_HZ, t);
    clickBp.Q.setValueAtTime(LANDING_CLICK_Q, t);
    const clickEnv = ctx.createGain();
    clickEnv.gain.setValueAtTime(LANDING_CLICK_PEAK[tier], t);
    clickEnv.gain.exponentialRampToValueAtTime(0.0001, t + LANDING_CLICK_S);
    clickSrc.connect(clickBp).connect(clickEnv).connect(dest);
    clickSrc.start(t);
    clickSrc.stop(t + LANDING_CLICK_S + 0.005);
    cleanupOnEnded(clickSrc, [clickSrc, clickBp, clickEnv]);
  }
  return { node: osc, type: osc.type, freqStart: SKIP_THUD_F0, freqEnd: SKIP_THUD_F1,
           rampEnd: t + SKIP_THUD_DROP_S, drive: SKIP_THUD_DRIVE, gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// Faz 7 skip cue: square, kademe 1 -> 2 nota (hafif), 2 -> 3, 3+ -> 4 nota (G5 C6 E6 G6).
function buildSkipCue(ctx, dest, t, tier) {
  const count = constrain(tier + 1, 2, SKIP_CUE_MIDI.length);
  const osc = ctx.createOscillator();
  osc.type = 'square';
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const freqs = [];
  for (let i = 0; i < count; i++) {
    const ns = t + i * SKIP_CUE_STEP_S;
    const f = midiToHz(SKIP_CUE_MIDI[i]);
    freqs.push(+f.toFixed(2));
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(0, ns);
    env.gain.linearRampToValueAtTime(tier === 1 ? 0.6 : 1, ns + 0.002);
    env.gain.setValueAtTime(tier === 1 ? 0.6 : 1, ns + SKIP_CUE_NOTE_S - 0.004);
    env.gain.linearRampToValueAtTime(0, ns + SKIP_CUE_NOTE_S);
  }
  const end = t + (count - 1) * SKIP_CUE_STEP_S + SKIP_CUE_NOTE_S;
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, tier: tier, notes: count, freqs: freqs, gainStart: t, gainEnd: end, stopAt: end + 0.01 };
}

// --- Fix/müzik-mix-ve-dinamik-aranjman: PeriodicWave (%25/%12.5 duty, NES 2A03 tınısı) -------
// ADIM 3 (ses mühendisliği): b_n = (2/nπ)sin(nπD) - ctx başına bir kez üretilip WeakMap'te
// önbelleklenir (OfflineAudioContext her render'da yeni nesne olduğu için ctx -> set eşlemesi).
let pulseWaveCache = new WeakMap();
function makePulseWave(ctx, duty) {
  const n = PULSE_WAVE_HARMONICS;
  const real = new Float32Array(n + 1);
  const imag = new Float32Array(n + 1);
  for (let k = 1; k <= n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}
function getPulseWaveSet(ctx) {
  let set = pulseWaveCache.get(ctx);
  if (!set) {
    set = { lead: makePulseWave(ctx, PULSE_LEAD_DUTY), harm: makePulseWave(ctx, PULSE_HARM_DUTY) };
    pulseWaveCache.set(ctx, set);
  }
  return set;
}

// Birden fazla osilatörü (unison) TEK bir "voice" gibi .stop()/.addEventListener('ended') ile
// kontrol etmek için ince sarmalayıcı (cutMusicNow hepsini aynı anda durdurabilsin diye).
function makeVoiceGroup(primary, stoppables) {
  return {
    stop(t) { for (const n of stoppables) { try { n.stop(t); } catch (e) { /* zaten durmuş */ } } },
    addEventListener(type, cb) { primary.addEventListener(type, cb); }
  };
}

// --- Fix/müzik-mix-ve-dinamik-aranjman: kanal EQ zinciri + reverb + master bus zinciri -------
// (ses-muhendisligi-sonuc.txt Bölüm 3/5/6, Adım 6-7). Yalnız müzik kanalları (pulse2, musicBass,
// musicDrum, musicHarm) EQ'dan geçer; SFX kanalları (pulse1, triangle, noise) DOKUNULMADAN
// (regresyon riski sıfır) doğrudan sum bus'a bağlanır.
function buildChannelEQ(ctx, name) {
  const nodes = [];
  const mk = (type, freq, q, gain) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q != null) f.Q.value = q;
    if (gain != null) f.gain.value = gain;
    nodes.push(f);
    return f;
  };
  if (name === 'musicBass') {
    mk('highpass', EQ_BASS_HPF_HZ, EQ_BASS_HPF_Q);
    mk('peaking', EQ_BASS_PEAK_HZ, EQ_BASS_PEAK_Q, EQ_BASS_PEAK_GAIN);
    mk('lowpass', EQ_BASS_LPF_HZ, EQ_BASS_LPF_Q);
  } else if (name === 'pulse2') {
    mk('highpass', EQ_LEAD_HPF_HZ, EQ_LEAD_HPF_Q);
    mk('peaking', EQ_LEAD_PEAK_HZ, EQ_LEAD_PEAK_Q, EQ_LEAD_PEAK_GAIN);
    mk('highshelf', EQ_LEAD_SHELF_HZ, null, EQ_LEAD_SHELF_GAIN);
    mk('lowpass', EQ_LEAD_LPF_HZ, EQ_LEAD_LPF_Q);
  } else if (name === 'musicHarm') {
    mk('highpass', EQ_HARM_HPF_HZ, EQ_HARM_HPF_Q);
    mk('highshelf', EQ_HARM_SHELF_HZ, null, EQ_HARM_SHELF_GAIN);
  } else if (name === 'musicDrum') {
    mk('highpass', EQ_DRUM_HPF_HZ, EQ_DRUM_HPF_Q);
    mk('peaking', EQ_DRUM_PEAK_HZ, EQ_DRUM_PEAK_Q, EQ_DRUM_PEAK_GAIN);
    mk('highshelf', EQ_DRUM_SHELF_HZ, null, EQ_DRUM_SHELF_GAIN);
  } else {
    return null; // SFX kanalı: EQ yok
  }
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return { input: nodes[0], output: nodes[nodes.length - 1] };
}

// Sentetik kısa oda reverb'ü: 0.30sn üstel sönümlü (e^{-t*6}) beyaz gürültü IR.
function createReverbImpulse(ctx) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * REVERB_IR_S));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const tt = i / ctx.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.exp(-tt * REVERB_IR_DECAY);
  }
  return buf;
}

// Tüm CH_GAIN kanallarını kurar: müzik kanalları EQ -> musicSum -> musicFilter (dinamik lowpass,
// ADIM5) -> sumNode; lead+armoni ayrıca kısa oda reverb'üne gönderilir. SFX kanalları direkt
// sumNode'a bağlanır. unlockAudio() (live) VE renderMusicOfflineWav() (offline) AYNI fonksiyonu
// çağırır -> mix gerçek prodüksiyon grafiğidir, kopya/parafraz değildir.
function buildAudioGraph(ctx, sumNode) {
  const chanObj = {};
  const musicSum = ctx.createGain();
  musicSum.gain.value = 1;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = MUSIC_FILTER_BASE_HZ;
  filter.Q.value = 0.707;
  musicSum.connect(filter);
  filter.connect(sumNode);

  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx);
  const reverbHpf = ctx.createBiquadFilter();
  reverbHpf.type = 'highpass';
  reverbHpf.frequency.value = REVERB_SEND_HPF_HZ;
  const reverbLpf = ctx.createBiquadFilter();
  reverbLpf.type = 'lowpass';
  reverbLpf.frequency.value = REVERB_SEND_LPF_HZ;
  reverbHpf.connect(reverbLpf).connect(convolver).connect(sumNode);

  for (const name of Object.keys(CH_GAIN)) {
    const g = ctx.createGain();
    g.gain.value = CH_GAIN[name];
    const eq = buildChannelEQ(ctx, name);
    if (eq) {
      g.connect(eq.input);
      eq.output.connect(musicSum);
      if (name === 'pulse2' || name === 'musicHarm') {
        const send = ctx.createGain();
        send.gain.value = REVERB_SEND_GAIN;
        eq.output.connect(send);
        send.connect(reverbHpf);
      }
    } else {
      g.connect(sumNode);
    }
    chanObj[name] = g;
  }
  return { chan: chanObj, musicFilter: filter };
}

// Master bus: tilt EQ (low shelf -2.5dB/180Hz + high shelf +3.5dB/3200Hz) -> yumuşak
// (tanh) soft-clip -> glue compressor (threshold -16dB, ratio 3.5, attack 15ms, release 120ms).
function buildMasterChain(ctx, src, dest) {
  const tiltLow = ctx.createBiquadFilter();
  tiltLow.type = 'lowshelf';
  tiltLow.frequency.value = MASTER_TILT_LOW_HZ;
  tiltLow.gain.value = MASTER_TILT_LOW_GAIN;
  const tiltHigh = ctx.createBiquadFilter();
  tiltHigh.type = 'highshelf';
  tiltHigh.frequency.value = MASTER_TILT_HIGH_HZ;
  tiltHigh.gain.value = MASTER_TILT_HIGH_GAIN;
  const shaper = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(MASTER_SOFTCLIP_DRIVE * x) / Math.tanh(MASTER_SOFTCLIP_DRIVE);
  }
  shaper.curve = curve;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = MASTER_COMP_THRESHOLD;
  comp.knee.value = MASTER_COMP_KNEE;
  comp.ratio.value = MASTER_COMP_RATIO;
  comp.attack.value = MASTER_COMP_ATTACK;
  comp.release.value = MASTER_COMP_RELEASE;
  src.connect(tiltLow).connect(tiltHigh).connect(shaper).connect(comp).connect(dest);
  return comp;
}

// Dinamik müzik filtresi hedef kesim frekansı (ADIM5): zorluk/stage arttıkça açılır, tempo-burst
// telegraph'ında riser gibi yukarı süpürülür, burst anında rezonanslı tepeye çıkar.
function getMusicFilterTargetHz(difficultyT, stageVal, tempoPhase, teleLocal) {
  if (tempoPhase === 'burst') return { hz: MUSIC_FILTER_BURST_HZ, q: MUSIC_FILTER_BURST_Q };
  if (tempoPhase === 'telegraph' && teleLocal != null) {
    const span = TEMPO_BURST_TELEGRAPH_S;
    const prog = constrain(1 - (-teleLocal) / span, 0, 1); // -span..0 -> 0..1
    const hz = MUSIC_FILTER_TELE_START_HZ + prog * (MUSIC_FILTER_TELE_END_HZ - MUSIC_FILTER_TELE_START_HZ);
    return { hz: hz, q: 0.9 };
  }
  const hz = MUSIC_FILTER_BASE_HZ + difficultyT * MUSIC_FILTER_RANGE_HZ + stageVal * MUSIC_FILTER_STAGE_STEP_HZ;
  return { hz: hz, q: 0.707 };
}

// Müzik notası (lead, pulse2): %25 duty PeriodicWave, ±5 cent unison detune (2 osilatör, faz
// girişimi -> "canlı/geniş" tını) + pluck zarfı (hızlı parlaklık overshoot -> sustain).
function buildMusicNote(ctx, dest, t, freq, durS, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const waves = getPulseWaveSet(ctx);
  const attackS = Math.min(LEAD_PLUCK_ATTACK_S, durS * 0.3);
  const decayS = Math.min(LEAD_PLUCK_DECAY_S, durS * 0.3);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(LEAD_PLUCK_OVERSHOOT * scale, t + attackS);
  env.gain.linearRampToValueAtTime(LEAD_PLUCK_SUSTAIN * scale, t + attackS + decayS);
  const sustainEnd = Math.max(t + attackS + decayS, t + durS - 0.01);
  env.gain.setValueAtTime(LEAD_PLUCK_SUSTAIN * scale, sustainEnd);
  env.gain.linearRampToValueAtTime(0, t + durS);
  const stopAt = t + durS + 0.02;
  const oscs = [];
  for (let i = 0; i < LEAD_DETUNE_CENTS.length; i++) {
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(waves.lead);
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(LEAD_DETUNE_CENTS[i], t);
    const g = ctx.createGain();
    g.gain.value = LEAD_DETUNE_GAIN;
    osc.connect(g).connect(env);
    osc.start(t);
    osc.stop(stopAt);
    cleanupOnEnded(osc, [osc, g]);
    oscs.push(osc);
  }
  env.connect(dest);
  return makeVoiceGroup(oscs[0], oscs);
}

// --- Fix/müzik-bas-davul-armoni (+ mix-ve-dinamik-aranjman): bas + davul + armoni katmanları --

// ADIM 3: bas hattı (triangle). Çift adımlarda kök, tek adımlarda +1 oktav ("oktav pompa").
// Vuruş başlarında (çift adım) pluck/slap etkisi: freq*1.15 -> freq üstel ramp (0.018sn).
function buildBassNote(ctx, dest, t, rootMidi, stepInBar, stepS, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const isDown = stepInBar % 2 === 0;
  const midi = isDown ? rootMidi : rootMidi + 12;
  const freq = midiToHz(midi);
  const durS = stepS * (isDown ? BASS_EVEN_FRAC : BASS_ODD_FRAC);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  if (isDown) {
    osc.frequency.setValueAtTime(freq * BASS_PLUCK_MULT, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + BASS_PLUCK_S);
  } else {
    osc.frequency.setValueAtTime(freq, t);
  }
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(BASS_PEAK * scale, t + BASS_ATTACK_S);
  const releaseAt = Math.max(t + BASS_ATTACK_S, t + durS - BASS_RELEASE_S);
  env.gain.setValueAtTime(BASS_PEAK * scale, releaseAt);
  env.gain.linearRampToValueAtTime(0, t + durS);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(t + durS + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return osc;
}

// ADIM 4/5: davul bileşenleri (tek noise buffer'ı zaman paylaşımlı kullanır, bkz. scheduleDrumStep).
function buildKick(ctx, dest, t, buffer, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(KICK_F0, t);
  osc.frequency.exponentialRampToValueAtTime(KICK_F1, t + KICK_DROP_S);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, KICK_PEAK * scale, KICK_ATTACK_S, KICK_DROP_S);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  if (!buffer) return osc;
  // ADIM5: 8ms "beater click" (bandpass @2800Hz) - kick küçük hoparlörde de duyulsun.
  const clickSrc = ctx.createBufferSource();
  clickSrc.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(KICK_CLICK_HZ, t);
  bp.Q.setValueAtTime(KICK_CLICK_Q, t);
  const clickEnv = ctx.createGain();
  const clickEnd = envelopeAD(clickEnv.gain, t, KICK_CLICK_PEAK * scale, 0.001, KICK_CLICK_S);
  clickSrc.connect(bp).connect(clickEnv).connect(dest);
  clickSrc.start(t);
  clickSrc.stop(clickEnd + 0.005);
  cleanupOnEnded(clickSrc, [clickSrc, bp, clickEnv]);
  return makeVoiceGroup(osc, [osc, clickSrc]);
}

function buildSnareBody(ctx, dest, t, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(SNARE_BODY_F0, t);
  osc.frequency.exponentialRampToValueAtTime(SNARE_BODY_F1, t + SNARE_BODY_S);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, SNARE_BODY_PEAK * scale, SNARE_BODY_ATTACK_S, SNARE_BODY_S);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return osc;
}

// hz: bandpass merkez frekansı (varsayılan SNARE_NOISE_HZ; dolgu/roll vuruşları kendi hz'ini verir).
function buildSnareNoise(ctx, dest, t, buffer, hz, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const freq = hz == null ? SNARE_NOISE_HZ : hz;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(SNARE_NOISE_Q, t);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, SNARE_NOISE_PEAK * scale, SNARE_NOISE_ATTACK_S, SNARE_NOISE_DECAY_S);
  src.connect(bp).connect(env).connect(dest);
  src.start(t);
  src.stop(end + 0.01);
  cleanupOnEnded(src, [src, bp, env]);
  return src;
}

function buildHiHat(ctx, dest, t, buffer, open, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(HIHAT_HZ, t);
  hp.Q.setValueAtTime(HIHAT_Q, t);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, HIHAT_PEAK * scale, HIHAT_ATTACK_S, open ? HIHAT_DECAY_OPEN_S : HIHAT_DECAY_S);
  src.connect(hp).connect(env).connect(dest);
  src.start(t);
  src.stop(end + 0.01);
  cleanupOnEnded(src, [src, hp, env]);
  return src;
}

// ADIM2.3 + ADIM4 (aranjman): davul vertical layering (intensity 0..4) + groove (senkop/
// velocity/swing/gerçek 16'lık snare roll). duckTri/duckNoise: SFX ducking (regresyon yok).
function scheduleDrumStep(ctx, dest, t, swingT, stepInBar, barIndex, buffer, duckTri, duckNoise,
                           intensity, isBurst, stepS) {
  const nodes = [];
  const isFillBar = barIndex === MUSIC_FORM_BARS - 1; // Bar 3 (C kesiti)
  if (isFillBar && (stepInBar === 6 || stepInBar === 7) && intensity >= 1) {
    if (stepInBar === 6) {
      // ADIM4.3: gerçek 16'lık snare roll - 4 vuruş (t, t+0.5, t+1.0, t+1.5 step), crescendo.
      const gains = [0.55, 0.72, 0.90, 1.15];
      const hzs = [SNARE_NOISE_HZ, 1300, 1700, SNARE_NOISE_FILL_HZ];
      for (let i = 0; i < 4; i++) {
        const rt = t + stepS * 0.5 * i;
        if (!duckTri) nodes.push(buildSnareBody(ctx, dest, rt, gains[i]));
        if (!duckNoise) nodes.push(buildSnareNoise(ctx, dest, rt, buffer, hzs[i], gains[i]));
      }
    }
    return nodes;
  }
  if (intensity === 0) {
    // ADIM2.3 intensity 0: yalnız adım 0'da yumuşak kick, snare/hi-hat kapalı.
    if (stepInBar === 0 && !duckTri) nodes.push(buildKick(ctx, dest, t, buffer, 0.6));
    return nodes;
  }
  // ADIM4.2 senkop: barIndex 1/2'de (A'/B) ve intensity>=2'de kick 0,3,5'e kayar ("tresillo").
  let kickSteps = [0, 4];
  if (intensity >= 2 && (barIndex === 1 || barIndex === 2)) kickSteps = [0, 3, 5];
  const isKick = kickSteps.indexOf(stepInBar) >= 0;
  const isSnare = stepInBar === 2 || stepInBar === 6;
  if (isKick) {
    if (!duckTri) nodes.push(buildKick(ctx, dest, t, buffer, 1));
  } else if (isSnare) {
    if (!duckTri) nodes.push(buildSnareBody(ctx, dest, t, 1));
    if (!duckNoise) nodes.push(buildSnareNoise(ctx, dest, t, buffer, SNARE_NOISE_HZ, 1));
  } else {
    // intensity===1: hi-hat yalnız Bar2/Bar3'te (Bar0/1'de ferahlık); intensity>=2: her zaman.
    const hatAllowed = intensity >= 2 || (intensity === 1 && (barIndex === 2 || barIndex === 3));
    if (hatAllowed && !duckNoise) {
      // ADIM4.1/4.2: ghost velocity (vurgu farkı) + swing (mikro-gecikme) + Bar2'de açık hi-hat.
      let vel = 1;
      if (stepInBar === 1 || stepInBar === 3) vel = HIHAT_GHOST_WEAK;
      else if (stepInBar === 5) vel = HIHAT_GHOST_MED;
      else if (stepInBar === 7) vel = HIHAT_GHOST_STRONG;
      const open = isBurst || (barIndex === 2 && (stepInBar === 3 || stepInBar === 7));
      nodes.push(buildHiHat(ctx, dest, swingT, buffer, open, vel));
    }
  }
  return nodes;
}

// ADIM 5: armoni/arpej katmanı — tek osilatörde hızlı 2 nota chip-arpej (midi -> nextMidi ->
// midi), 35ms segmentler, %12.5 duty PeriodicWave (parlak/kristal arpej tınısı).
function buildHarmonyNote(ctx, dest, t, midi, nextMidi, gainScale) {
  const scale = gainScale == null ? 1 : gainScale;
  const waves = getPulseWaveSet(ctx);
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(waves.harm);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const segs = [midi, nextMidi, midi];
  for (let i = 0; i < segs.length; i++) {
    const ns = t + i * HARM_SEG_S;
    const f = midiToHz(segs[i]);
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(0, ns);
    env.gain.linearRampToValueAtTime(HARM_PEAK * scale, ns + 0.003);
    env.gain.setValueAtTime(HARM_PEAK * scale, ns + HARM_SEG_S - 0.004);
    env.gain.linearRampToValueAtTime(0, ns + HARM_SEG_S);
  }
  const end = t + segs.length * HARM_SEG_S;
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return osc;
}

// --- Fix/müzik-mix-ve-dinamik-aranjman: dinamik aranjman pure fonksiyonları (test edilebilir) -
// (muzik-aranjman-dinamik-sonuc.txt Bölüm 7, Adım 1/3)
// ADIM 1: getMusicIntensity() durum makinesi. Globale dokunmaz (parametre alır) -> hem
// updateAudio() (canlı state) hem renderMusicOfflineWav() (sentetik state) ile test edilebilir.
function getMusicIntensity(musicStepVal, stageVal, multiplierVal, ballY, tempoPhase) {
  if (musicStepVal < INTENSITY_INTRO_STEPS) return 0;
  if (tempoPhase === 'burst') return 4;
  if (tempoPhase === 'telegraph') return 3;
  let base = Math.min(3, stageVal + 1);
  if (multiplierVal >= INTENSITY_MULTIPLIER_BOOST || (ballY != null && ballY < INTENSITY_DANGER_BALL_Y)) {
    base = Math.min(4, base + 1);
  }
  return base;
}

// ADIM 3: bar bazlı gerilim-çözülme eğrisi (barGain çarpanı).
function getStepDynamics(barIndex, stepInBar) {
  if (barIndex === 0) return stepInBar === 0 ? BAR0_ACCENT_GAIN : BAR0_REST_GAIN;
  if (barIndex === 1) return BAR1_GAIN;
  if (barIndex === 2) return BAR2_GAIN;
  return BAR3_GAIN_START + (stepInBar / (MUSIC_PATTERN_LEN - 1)) * (BAR3_GAIN_END - BAR3_GAIN_START);
}

// ADIM 2.4: armoni katmanı aktiflik kuralı (vertical layering tablosu).
function isHarmonyActiveFor(intensity, barIndex, stepInBar) {
  if (intensity <= 1) return barIndex === 2 && stepInBar % 2 === 0;
  if (intensity === 2) return barIndex >= 1 && stepInBar % 2 === 0;
  if (intensity === 3) return stepInBar % 2 === 0 || barIndex === 2;
  return true; // intensity === 4: her barda her adımda
}

// ADIM 2 + ADIM 3 + ADIM 4: TEK bir adımın TÜM müzik katmanlarını (lead/bas/davul/armoni)
// vertical layering + bar gerilim eğrisi + groove ile planlar/üretir. Live (updateAudio) ve
// offline (renderMusicOfflineWav) TAMAMEN AYNI bu fonksiyonu çağırır (tek doğruluk kaynağı,
// kopya/parafraz yok). p: { t, stepS, stepInBar, barIndex, pattern, rootMidi, intensity,
// isBurst, duckTri, duckNoise, stagePitchShift }.
function scheduleMusicStep(ctx, chanObj, buffer, p) {
  const voices = [];
  const barGain = getStepDynamics(p.barIndex, p.stepInBar);
  // ADIM2.1: Bar3 sonu (adım 31) - bas+armoni TAMAMEN susar (1 sekizlik nefes boşluğu/micro-drop).
  const isCadenceDrop = p.barIndex === MUSIC_FORM_BARS - 1 && p.stepInBar === 7 && p.intensity >= 1;
  const pitchShift = p.stagePitchShift || 0;
  const midi = p.pattern[p.stepInBar] + pitchShift;
  const nextMidi = p.pattern[(p.stepInBar + 1) % MUSIC_PATTERN_LEN] + pitchShift;
  const noteFrac = p.barIndex === 2 ? MUSIC_NOTE_FRAC_LEGATO : MUSIC_NOTE_FRAC;
  const swingT = p.t + (p.stepInBar % 2 === 1 ? p.stepS * SWING_OFFSET_FRAC : 0);

  // LEAD (pulse2): her zaman çalar; intro'da sakin (%85), Bar2'de crescendo, zirvede
  // (intensity 4, Bar3 2. yarısı) oktav sıçraması.
  let leadGain = barGain;
  if (p.intensity === 0) leadGain *= 0.85;
  if (p.barIndex === 2) leadGain *= (0.90 + 0.20 * (p.stepInBar / 7));
  let leadMidi = midi + MUSIC_LEAD_OCTAVE_SHIFT;
  if (p.intensity >= 4 && p.barIndex === 3 && p.stepInBar >= 4) leadMidi += 12;
  voices.push(buildMusicNote(ctx, chanObj.pulse2, p.t, midiToHz(leadMidi), p.stepS * noteFrac, leadGain));

  // BASS (musicBass): intensity 0'da yalnız çift adım, Bar1'de beşli geçiş notası, cadence'ta susar.
  if (!p.duckTri && !isCadenceDrop) {
    const skipOffBeat = p.intensity === 0 && p.stepInBar % 2 === 1;
    if (!skipOffBeat) {
      let rootMidi = p.rootMidi + pitchShift;
      const usePassing = p.intensity >= 1 && p.barIndex === 1 && (p.stepInBar === 3 || p.stepInBar === 7);
      if (usePassing) rootMidi += 7;
      const bassGain = barGain * (p.intensity === 0 ? 0.7 : 1);
      voices.push(buildBassNote(ctx, chanObj.musicBass, p.t, rootMidi, p.stepInBar, p.stepS, bassGain));
    }
  }

  // DAVUL (musicDrum): vertical layering + groove (bkz. scheduleDrumStep).
  const drumNodes = scheduleDrumStep(ctx, chanObj.musicDrum, p.t, swingT, p.stepInBar, p.barIndex,
                                      buffer, p.duckTri, p.duckNoise, p.intensity, p.isBurst, p.stepS);
  for (const dn of drumNodes) voices.push(dn);

  // ARMONİ (musicHarm): ADIM2 oktav bug'ı burada düzeltildi (+MUSIC_LEAD_OCTAVE_SHIFT eklendi -
  // önceki dalda 110-261Hz "bas" bandına çamur basıyordu, şimdi 220-523Hz'e taşındı).
  const harmonyActive = !isCadenceDrop && isHarmonyActiveFor(p.intensity, p.barIndex, p.stepInBar);
  if (harmonyActive) {
    const harmGain = barGain * (p.barIndex === 2 ? 1.1 : 1);
    voices.push(buildHarmonyNote(ctx, chanObj.musicHarm, swingT,
      midi + MUSIC_LEAD_OCTAVE_SHIFT, nextMidi + MUSIC_LEAD_OCTAVE_SHIFT, harmGain));
  }

  return { voices: voices, harmonyActive: harmonyActive, barGain: barGain, isCadenceDrop: isCadenceDrop };
}


export {
  SOUND,
  CH_GAIN,
  THUD_F0,
  THUD_F1,
  THUD_DROP_S,
  THUD_ATTACK_S,
  THUD_DECAY_S,
  THUD_PEAK,
  THUD_HOLD_S,
  THUD_BODY_F0,
  THUD_BODY_F1,
  THUD_BODY_PEAK,
  THUD_BODY_ATTACK_S,
  THUD_BODY_DECAY_S,
  LANDING_CLICK_HZ,
  LANDING_CLICK_Q,
  LANDING_CLICK_S,
  LANDING_CLICK_PEAK,
  WHIZ_F0,
  WHIZ_F1,
  WHIZ_S,
  ARP_SCALE_MIDI,
  ARP_NOTE_S,
  ARP_STEP_S,
  DEATH_NOISE_ATTACK_S,
  DEATH_NOISE_DECAY_S,
  NOISE_BUFFER_S,
  MUSIC_BPM_START,
  MUSIC_BPM_STEP,
  MUSIC_BPM_STEP_S,
  MUSIC_BPM_MAX,
  MUSIC_BPM_STEPS,
  MUSIC_PATTERNS_BY_THEME,
  MUSIC_PATTERN_LEN,
  MUSIC_NOTE_FRAC,
  MUSIC_NOTE_FRAC_LEGATO,
  MUSIC_LOOKAHEAD_S,
  MUSIC_FORM_BARS,
  MUSIC_LEAD_OCTAVE_SHIFT,
  BASS_ROOTS_BY_THEME,
  BASS_EVEN_FRAC,
  BASS_ODD_FRAC,
  BASS_PLUCK_S,
  BASS_PLUCK_MULT,
  BASS_ATTACK_S,
  BASS_RELEASE_S,
  BASS_PEAK,
  KICK_F0,
  KICK_CLICK_HZ,
  SNARE_BODY_F0,
  SNARE_NOISE_HZ,
  HIHAT_HZ,
  HARM_SEG_S,
  HARM_PEAK,
  PULSE_WAVE_HARMONICS,
  PULSE_LEAD_DUTY,
  PULSE_HARM_DUTY,
  LEAD_DETUNE_CENTS,
  LEAD_DETUNE_GAIN,
  LEAD_PLUCK_OVERSHOOT,
  LEAD_PLUCK_SUSTAIN,
  LEAD_PLUCK_ATTACK_S,
  LEAD_PLUCK_DECAY_S,
  EQ_BASS_HPF_HZ,
  EQ_BASS_PEAK_HZ,
  EQ_BASS_LPF_HZ,
  EQ_LEAD_HPF_HZ,
  EQ_LEAD_PEAK_HZ,
  EQ_LEAD_SHELF_HZ,
  EQ_LEAD_LPF_HZ,
  EQ_HARM_HPF_HZ,
  EQ_HARM_SHELF_HZ,
  EQ_DRUM_HPF_HZ,
  EQ_DRUM_PEAK_HZ,
  EQ_DRUM_SHELF_HZ,
  REVERB_IR_S,
  REVERB_IR_DECAY,
  REVERB_SEND_GAIN,
  REVERB_SEND_HPF_HZ,
  MASTER_TILT_LOW_HZ,
  MASTER_TILT_HIGH_HZ,
  MASTER_COMP_THRESHOLD,
  MASTER_SOFTCLIP_DRIVE,
  INTENSITY_INTRO_STEPS,
  INTENSITY_MULTIPLIER_BOOST,
  INTENSITY_DANGER_BALL_Y,
  BAR0_ACCENT_GAIN,
  BAR1_GAIN,
  BAR2_GAIN,
  BAR3_GAIN_START,
  SWING_OFFSET_FRAC,
  HIHAT_GHOST_WEAK,
  HIHAT_GHOST_MED,
  HIHAT_GHOST_STRONG,
  MUSIC_FILTER_BASE_HZ,
  MUSIC_FILTER_BURST_HZ,
  MUSIC_FILTER_TELE_START_HZ,
  MUSIC_FILTER_SMOOTH_S,
  DEATH_STING_NOTE_S,
  DEATH_STING_LAST_S,
  DEATH_STING_PITCH_DROP_ST,
  DEATH_STING_BY_THEME,
  STAGEUP_CHORDS_BY_THEME,
  STAGEUP_PITCH_SHIFT_SEMITONES,
  STAGEUP_PITCH_SHIFT_STEPS,
  SFX_TRIANGLE_DUCK_FALLBACK_S,
  SFX_NOISE_DUCK_FALLBACK_S,
  sfxTriangleBusyUntil,
  sfxNoiseBusyUntil,
  TEMPO_BURST_FIRST_S,
  TEMPO_BURST_INTERVAL_S,
  TEMPO_BURST_TELEGRAPH_S,
  TEMPO_BURST_DURATION_S,
  TEMPO_BURST_BPM_MULT,
  TEMPO_BURST_SPEED_MULT,
  TEMPO_BURST_RAMP_S,
  TEMPO_BURST_LOG_MAX,
  TEMPO_TELE_MIDI,
  TEMPO_TELE_ONSETS_S,
  TEMPO_TELE_NOTE_S,
  TEMPO_TELE_GLIDE_ST,
  TEMPO_TELE_PEAK,
  STAGEUP_MIDI,
  STAGEUP_STEP_S,
  STAGEUP_TAIL_S,
  STAGEUP_PEAK,
  RATCHET_CLICKS,
  RATCHET_STEP_S,
  RATCHET_CLICK_S,
  RATCHET_BP_HZ,
  RATCHET_BP_Q,
  SOUND_LOG_MAX,
  MUSIC_LOG_MAX,
  WHOOSH_F0,
  WHOOSH_F1,
  WHOOSH_S,
  WHOOSH_PEAK,
  SKIP_THUD_F0,
  SKIP_THUD_F1,
  SKIP_THUD_DROP_S,
  SKIP_THUD_DECAY_S,
  SKIP_THUD_DRIVE,
  SKIP_CUE_MIDI,
  SKIP_CUE_NOTE_S,
  SKIP_CUE_STEP_S,
  createNoiseBuffer,
  midiToHz,
  envelopeAD,
  cleanupOnEnded,
  buildThud,
  buildWhiz,
  buildArpeggio,
  buildNoiseBurst,
  buildDeathSting,
  buildStageUpChime,
  buildRatchet,
  buildWhoosh,
  buildSkipThud,
  buildSkipCue,
  pulseWaveCache,
  makePulseWave,
  getPulseWaveSet,
  makeVoiceGroup,
  buildChannelEQ,
  createReverbImpulse,
  buildAudioGraph,
  buildMasterChain,
  getMusicFilterTargetHz,
  buildMusicNote,
  buildBassNote,
  buildKick,
  buildSnareBody,
  buildSnareNoise,
  buildHiHat,
  scheduleDrumStep,
  buildHarmonyNote,
  getMusicIntensity,
  getStepDynamics,
  isHarmonyActiveFor,
  scheduleMusicStep
};
