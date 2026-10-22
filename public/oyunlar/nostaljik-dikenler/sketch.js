// ============================================================================
// NOSTALJİK DİKENLER - p5.js prototip
// Küçük "ramp" paleti (Faz 6, TASARIM.md §9.1), tek eksen (yatay) kontrol, dikey hareket otomatik.
// Tasarım kararları için TASARIM.md dosyasına bakınız.
// ============================================================================

// --- Sabitler (canvas / görsel) ---
const CANVAS_W = 400;
const CANVAS_H = 600;
const SPIKE_STRIP_H = 30;   // üstteki sabit diken şeridinin yüksekliği
const SPIKE_W = 25;         // tek bir diken üçgeninin genişliği

// --- Sabitler (oynanış / fizik) ---
const BALL_R = 12;
const MOVE_SPEED = 230;        // yatay hareket hızı (px/sn)
const GRAVITY = 1500;          // yerçekimi ivmesi (px/sn^2)
const MAX_FALL_SPEED = 900;    // düşüş hızı tavanı (px/sn)

const BASE_SCROLL_SPEED = 55;      // başlangıç dünya kaydırma hızı (px/sn)
const MAX_SCROLL_SPEED = BASE_SCROLL_SPEED * 3; // zorluk tavanı
const SPEED_INCREASE_INTERVAL = 13000; // ms - her bu kadar sürede hız artar
const SPEED_INCREASE_FACTOR = 1.09;    // her artışta %9 hızlanma

const PLATFORM_H = 12;
const ROW_GAP_BASE = 80;     // satırlar arası temel dikey boşluk
const ROW_GAP_VARIANCE_MAX = 35; // zorlukla birlikte eklenebilecek ekstra dikey boşluk
const PLATFORM_W_MIN = 60;
const PLATFORM_W_MAX = 110;

// --- Sabitler (Faz 2: hitbox adilliği + momentum çarpanı, rapor §5.3 / §7.3) ---
// Hurtbox görselden küçük (rapor oranı 8/12). Platform teması BALL_R ile kalır,
// diken çarpışmaları (uç + gövde) bu küçültülmüş yarıçapla yapılır.
const HURTBOX_R = BALL_R * (8 / 12); // = 8
const SPIKE_COUNT = Math.ceil(CANVAS_W / SPIKE_W) + 1; // drawWorld() ile aynı dizi
// Sadece üçgenin en uçtaki ~3x3 px tepe noktası ölümcül: hurtbox + 2px.
const SPIKE_TIP_LETHAL_R = 2;
const SPIKE_KILL_DIST = HURTBOX_R + SPIKE_TIP_LETHAL_R; // = 10
// Gövdeye (yan yüze) değme: öldürmez, hafifçe iter.
const SPIKE_PUSH_VX = 120;      // yatay itme darbesi (px/sn), hızla söner
const SPIKE_PUSH_VY = 120;      // havadayken aşağı itme darbesi (px/sn)
const SPIKE_PUSH_DECAY = 0.08;  // yatay darbenin sönme zaman sabiti (sn)
// Platform topu iki diken arasındaki V'ye sıkıştırırsa (yana kaçamazsa) ezilir.
const SPIKE_CRUSH_TOL = 2;      // çözülemeyen gövde batması bu px'i aşarsa ölüm
// Kıl payı: tepe noktasına en yakın geçiş (SPIKE_KILL_DIST, HURTBOX_R + 8] aralığında.
const NEAR_MISS_MAX_DIST = HURTBOX_R + 8;              // = 16
const NEAR_MISS_EXIT_DIST = NEAR_MISS_MAX_DIST + 4;    // geçiş bitişi (histerezis)
const MAX_MULTIPLIER = 5;

// --- Sabitler (Faz 3: Bayer dither arkaplan, rapor §7.3 Kural 1 / §2.3; Faz 6: 2 renkli) ---
// 4x4 Bayer eşik matrisi (TASARIM.md §8 karar #2, birebir).
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DITHER_LV_MIN = 0.25; // başlangıç arkaplan yoğunluğu (açık ton #251c42 piksel oranı)
const DITHER_LV_MAX = 0.50; // zorluk tavanındaki yoğunluk
// Faz 6: enforceOneBit() eşikleme pası kaldırıldı (renkli palet); noSmooth() kalıyor.
let ditherCache = new Map(); // Math.ceil(lv*16) -> önceden üretilmiş tam ekran p5.Image
let patternCache = new Map(); // 'lv|hex' -> şeffaf zeminli Bayer desen (telegraph gölgesi)

// --- Sabitler (Faz 6: renk paleti, TASARIM.md §9.1 — hex değerleri BİREBİR) ---
// Ramp: gölge maviye/mora, parlak sarıya/turuncuya kayar. Toplam 12 renk.
const PAL = {
  bgLo: '#140f24',        // arkaplan dither biti 0 (gölge)
  bgHi: '#251c42',        // arkaplan dither biti 1 (orta)
  ballShadow: '#8a6a1f',  // top gölge
  ballMain: '#f2c14e',    // top ana
  ballLight: '#fff3c4',   // top parlak
  platShadow: '#2b3350',  // platform gölge
  platMain: '#4e5b82',    // platform ana
  platLight: '#8fa1c7',   // platform parlak
  spikeShadow: '#4a0e0e', // diken gövdesi gölge
  spikeMain: '#c81d25',   // diken gövdesi ana
  spikeTip: '#ff6a3d',    // diken UCU (ölümcül, en parlak/en sıcak)
  hud: '#f2ead1'          // HUD/skor metni
};
// Diken ucu: tepe noktasının hemen üstünde 3x3 px blok (Faz 2 ölümcül bölgesi:
// tepe noktasına <= SPIKE_TIP_LETHAL_R px). Gövdenin ana kırmızısı uçtan
// SPIKE_NECK_PX önce biter; arada gölge (#4a0e0e) "boyun" kalır -> uç, kendisinden
// daha koyu tonlarla çevrili tek parlak nokta olarak okunur.
const SPIKE_TIP_PX = 3;
const SPIKE_NECK_PX = 6;
const SPIKE_MAIN_INSET = 1.5; // ana kırmızı üçgenin yan yüzlerden içeri payı (gölge kenar)

// --- Sabitler (Faz 6: "stage gate" aşama sistemi, TASARIM.md §9.2) ---
// Eşikler getDifficultyElapsedS() üzerinden (ayrı zamanlayıcı yok). Her yeniden başlamada
// aşama 0'a döner (resetGame), kalıcı değil.
const STAGE_THRESHOLDS_S = [0, 40, 85, 130]; // aşama 0, 1, 2, 3 başlangıçları
const STAGE_RAMP_S = 15;              // yeni platform tipinin spawn şansı bu sürede 0 -> tavan
const MOVING_CHANCE_MAX = 0.30;       // aşama 1+: hareketli platform şansı tavanı
const MOVING_AMP_MIN = 15;            // yatay salınım genliği (px)
const MOVING_AMP_MAX = 25;
const MOVING_PERIOD_MIN_S = 2;        // salınım periyodu (sn)
const MOVING_PERIOD_MAX_S = 3;
const FRAGILE_CHANCE_MAX = 0.20;      // aşama 2+: kırılgan platform şansı tavanı (varsayım, §9.2'de oran yok)
const FRAGILE_BREAK_S = 0.4;          // ilk temastan kırılmaya kadar
const PULSE_INTERVAL_MIN_S = 8;       // aşama 3: inen diken pulse aralığı (sn)
const PULSE_INTERVAL_MAX_S = 12;
const PULSE_TELEGRAPH_S = 0.3;        // uyarı: dither toz + 1px geri çekilme + ratchet sesi
const PULSE_TELEGRAPH_RETRACT_PX = 1;
const PULSE_DROP_S = 0.08;            // fırlama (iniş)
const PULSE_HOLD_S = 0.15;
const PULSE_RETRACT_S = 0.3;          // geri çekilme
const PULSE_DROP_PX = 30;             // uç bu kadar aşağı uzar (şerit 30px -> 60px)
const PULSE_SEG_MIN = 2;              // şeridin pulse yapan kısa bölümü (diken sayısı)
const PULSE_SEG_MAX = 3;
const PULSE_DUST_EVERY_S = 0.05;      // telegraph tozu üretim aralığı
const STAGEUP_FLASH_FRAMES = 12;      // ~200ms @60Hz, sönen açık ton (ölüm: 2 kare tam invert)
const STAGEUP_FLASH_ALPHA = 0.35;
const MECH_LOG_MAX = 400;

// --- Sabitler (Faz 4: juice paketi, rapor §4.3 tablosu / TASARIM.md §8.2) ---
// Her efekt bağımsız aç/kapa: konsoldan örn. JUICE.shake = false;
const JUICE = {
  hitstop: true,     // ölüm + kıl payı: dünya donar
  shake: true,       // iniş 2px dikey, ölüm 6px çok yönlü
  invertFlash: true, // ölüm anı renk tersi
  debris: true,      // iniş: temas noktasından sağa/sola piksel parçacık
  ghosting: true,    // kıl payı / yüksek hız düşüş: önceki 2 pozisyon %50 dither
  squash: true,      // her platform teması: 1 karelik yaylanma (karar #1)
  hudGrow: true,     // momentum çarpanı skor yazısını büyütür/kalınlaştırır (karar #3)
  stageUp: true,     // Faz 6: aşama girişi - sönen açık ton flaşı (ölüm invert flaşından ayrı)
  skipBonus: true    // Faz 7: altın ghost izi + skip flaşı/sarsıntısı/hitstop'u (puan/çarpan bundan bağımsız)
};
// Donma kare sınırında biter: gerçek süre = HITSTOP_MS'i ilk aşan kare toplamı.
// 40ms -> 60Hz'de 3 kare (~50ms), 120Hz'de 5 kare (~42ms), 144Hz'de 6 kare (~42ms):
// hepsi 30-65ms aralığında. (50ms seçilseydi 60Hz jitter'ında 4 kare = 66.7ms olabilirdi.)
const HITSTOP_MS = 40;
const SHAKE_DECAY_S = 0.15;       // genlik bu sürede doğrusal olarak 0'a iner
const SHAKE_LANDING_PX = 2;       // iniş: sadece dikey
const SHAKE_DEATH_PX = 6;         // ölüm: çok yönlü
const INVERT_FLASH_FRAMES = 2;    // 2 kare (~33ms @60Hz)
const DEBRIS_MIN = 4;             // 4-8 parçacık
const DEBRIS_MAX = 8;
const DEBRIS_SIZE = 2;            // px, kare
const DEBRIS_LIFE_S = 0.25;
const GHOST_COUNT = 2;            // önceki 2 pozisyon
const GHOST_DITHER_LV = 0.5;      // %50 Bayer
const GHOST_NEAR_MISS_MS = 150;   // kıl payından sonra iz süresi (shake decay ile aynı)
const GHOST_FALL_VY = MAX_FALL_SPEED * 0.6; // "yüksek hız" eşiği = 540 px/sn (> ~1.2 satır serbest düşüş)
const SQUASH_FRAMES = 1;          // 1 kare (16.6ms)
const SQUASH_X = 1.25;            // yatay genişleme
const SQUASH_Y = 0.75;            // dikey basılma (alt kenar platformda kalır)
const HUD_BASE_SIZE = 20;         // x1 (Faz 1-3 ile aynı)
const HUD_SIZE_PER_STEP = 3;      // her çarpan adımı +3px -> x5 = 32px
const HUD_STROKE_PER_STEP = 0.5;  // her adım +0.5px kontur -> x5 = 2px ("parlama": daha çok beyaz piksel)

// --- Sabitler (Faz 5: ses, TASARIM.md §8.2 Faz 5 tablosu / rapor §6.3, NES-tarzı 4 kanal) ---
// Web Audio API doğrudan (p5.sound yok, ses dosyası yok; her şey sentez).
// 4 bağımsız rol/kanal, her biri kendi GainNode'u (literal donanım kanalı değil):
//   pulse1   (OscillatorNode 'square')   : kıl payı "whiz" + çarpan arpeji (SFX)
//   pulse2   (OscillatorNode 'square')   : arkaplan müziği
//   triangle (OscillatorNode 'triangle') : platforma iniş "thud"
//   noise    (AudioBufferSourceNode, beyaz gürültü buffer'ı): ölüm patlaması
// Tablodaki "diken uyarısı" satırı Faz 6'da (aşama 3 pulse telegraph'ı) uygulandı:
// noise kanalı, bant geçiren beyaz gürültü "ratchet click" dizisi.
// Faz 6 "stageUp" chime: triangle kanalı, 3 nota yükselen majör üçlü (ayrı olay/etiket).
// Her kategori bağımsız aç/kapa: konsoldan örn. SOUND.music = false;
// genel: SOUND.mute (M tuşu) / SOUND.masterVolume (0..1). Bunlar TASARIM.md'de yok (kullanılabilirlik).
const SOUND = {
  landing: true,     // iniş thud (triangle)
  nearMiss: true,    // kıl payı whiz (pulse1)
  multiplier: true,  // çarpan arpeji (pulse1)
  death: true,       // ölüm gürültü patlaması + müzik kesme (noise)
  music: true,       // arkaplan müziği (pulse2)
  stageUp: true,     // Faz 6: aşama girişi chime (triangle)
  spikeWarn: true,   // Faz 6: inen diken telegraph ratchet (noise)
  skip: true,        // Faz 7: whoosh (triangle) + dolgun iniş (triangle) + skip cue (pulse1)
  mute: false,
  masterVolume: 0.5,
  debugLog: false    // true: her ses olayı konsola da yazılır (soundLog dizisi her zaman dolar)
};
const CH_GAIN = { pulse1: 0.22, pulse2: 0.10, triangle: 0.9, noise: 0.45 }; // kanal karışım seviyeleri
// İniş "thud" (triangle): 60Hz -> 30Hz üstel pitch drop
const THUD_F0 = 60;
const THUD_F1 = 30;
const THUD_DROP_S = 0.12;
const THUD_ATTACK_S = 0.004;
const THUD_DECAY_S = 0.16;
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
const MUSIC_PATTERN_MIDI = [45, 52, 57, 52, 48, 55, 60, 55]; // A2 E3 A3 E3 C3 G3 C4 G3 (sekizlik)
const MUSIC_NOTE_FRAC = 0.55;  // nota uzunluğu = adımın %55'i (8-bit staccato)
const MUSIC_LOOKAHEAD_S = 0.12;
// Faz 6 stageUp chime (triangle): A4 C#5 E5 majör üçlü, yükselen. Çarpan arpejinden farkı:
// dalga (triangle vs square), nota uzunluğu (0.12sn vs 0.04sn staccato), uzun çınlama kuyruğu.
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

// --- Sabitler (Faz 7: platform atlama / skip bonus, TASARIM.md §10.1 — sayılar BİREBİR) ---
// Rapor §1.4 "Momentum Bank / Grace Landing". 0 pas = Faz 2 kuralı (near-miss yoksa 1x) değişmez.
const SKIP_BONUS_BASE = [0, 50, 150, 400]; // kademe (1, 2, 3+) -> taban puan; bonus = taban x çarpan
const SKIP_BIG_REWARD_STAGE = 2;   // 2+ pas ödülleri aşama 2'den (85sn+) itibaren; öncesi 1-pas gibi
const SKIP_HITSTOP_FRAMES = 2;     // 2 pas: 2 kare hitstop (kare sayılı, ms değil)
const SKIP_FLASH_FRAMES = 3;       // 3+ pas: 3 kare altın invert flaş (PAL.ballLight #fff3c4)
const SKIP_SHAKE_PX = 6;           // 3+ pas: 6px sarsıntı (dikey; ölümün omni sarsıntısından ayrı)
const SKIP_GHOST_MS = 250;         // satır geçince ghost izi bu süre altın (#f2c14e)
const SKIP_SPARK_COUNT = 6;        // 2+ pas (aşama 2+): satır başına beyaz-ton parçacık (debris dizisi)
const SKIP_ROW_TOL = PLATFORM_H;   // aynı y'de (±) iki platform = tek satır (Faz 8 çoklu şerit hazırlığı)
// Ses (mevcut 4 kanal, yeni kanal yok):
//   whoosh   (triangle): satır geçerken 120Hz -> 350Hz glissando, 80ms
//   skipThud (triangle): pas'lı inişte normal thud yerine dolgun sub-bass 45Hz -> 20Hz + waveshaper
//   skipCue  (pulse1)  : inişte kademe kadar nota (1 pas: 2 nota "hafif" ... 3+ pas: 4 nota)
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
const SKIP_LOG_MAX = 200;

// --- Faz 8: çoklu şerit desenleri (rapor §2.3/§2.4, TASARIM.md §10.2) ---
// Bölgeler = platform MERKEZİ aralıkları (CANVAS_W oranı); ayrıca platform hep ekran içinde kalır.
const LANE_ZONES = { L: [0.04, 0.31], C: [0.34, 0.66], R: [0.69, 0.96] };
// Ağırlıklı havuz (toplam 100). Kapıya takılan desen Desen 1'e düşer (bkz. pickRowPattern).
const ROW_PATTERNS = [
  { id: 1, weight: 45, minStage: 0 }, // Tekli Merkez (Breathing Row) = Faz 1-7 spawn birebir
  { id: 2, weight: 30, minStage: 0 }, // Asimetrik Çatal (ana + Risk Adası)
  { id: 3, weight: 15, minStage: 1 }, // İkiz Sahanlık
  { id: 4, weight: 10, minStage: 2 }  // Kenar Trampleni (mevcut screen-wrap ile)
];
const ROW_PATTERN_DEBT_MAX = 2;            // ertelenen desen en çok kaç satır borcu biriktirir
const ROW_PATTERN_DEBT_ORDER = [3, 4, 2];  // borç ödeme sırası: geometrisi en dar olan önce
const ANCHOR_REACH_MARGIN = 0.75;  // §2.4 "İnsani Adillik Marjı": anchor Δx_eff <= 0.75 * X_reach
const WRAP_SPAN = CANVAS_W + 2 * BALL_R; // top x<-BALL_R -> CANVAS_W+BALL_R sarar: periyot
const LANE_EPS = 0.5;              // sınırlardan içeri pay (px), kayan nokta güvenliği
const LANE_MIN_GAP = 12;           // aynı satırdaki iki platform arası en az kenar boşluğu (px)
const FORK_MAIN_W_MIN = 70;
const FORK_MAIN_W_MAX = 85;
const RISK_W_MIN = 35;
const RISK_W_MAX = 45;
const TWIN_W_MIN = 50;
const TWIN_W_MAX = 60;
const TWIN_GAP_MIN = 90;           // ikizler arası kenar boşluğu ~100px
const TWIN_GAP_MAX = 110;
const EDGE_INSET = 4;              // Kenar Trampleni: ekran kenarından x≈4
const EDGE_W_MIN = 45;
const EDGE_W_MAX = 60;

// --- Faz 4 juice durumu (resetJuice() ile sıfırlanır; çekirdek durumdan bağımsız) ---
let hitstopMs = 0;        // kalan donma süresi (ms)
let shakeAmp = 0;         // başlangıç genliği (px); 0 = sarsıntı yok
let shakeT = 0;           // sarsıntı başlangıcından beri geçen süre (sn)
let shakeMode = null;     // 'vertical' | 'omni'
let shakeDir = 1;         // dikey sarsıntıda kareden kareye işaret değişimi
let shakeOffset = { x: 0, y: 0 }; // bu karede uygulanan tam sayı ofset (test/debug için okunur)
let flashFramesLeft = 0;
let debris = [];          // {x, y, vx, vy, life}
let ghostHist = [];       // [şimdiki, önceki, önceki-önceki] top merkezleri
let ghostNearMissMs = 0;
let squashFramesLeft = 0;
let stageFlashFramesLeft = 0; // Faz 6 stageUp flaşı
let hitstopFramesLeft = 0;    // Faz 7: kare sayılı hitstop (2 pas)
let skipFlashFramesLeft = 0;  // Faz 7: 3+ pas altın invert flaşı (ölüm flaşından ayrı sayaç)
let skipGhostMs = 0;          // Faz 7: >0 iken ghost izi açık ve altın renkte

// --- Faz 5 ses durumu (AudioContext ilk kullanıcı etkileşiminde kurulur: autoplay politikası) ---
let audioCtx = null;
let masterGain = null;
let chan = null;            // { pulse1, pulse2, triangle, noise } -> GainNode
let noiseBuffer = null;     // tek seferlik beyaz gürültü buffer'ı (her olayda yeni kaynak, aynı buffer)
let appliedMasterGain = -1; // masterGain'e en son yazılan değer
let musicNextTime = 0;      // bir sonraki müzik notasının audioCtx zamanı (0 = yeniden hizala)
let musicStep = 0;
let musicVoices = [];       // planlanmış/çalan müzik osilatörleri (ölümde anında durdurulur)
let soundLog = [];          // ses olay günlüğü (test/debug)
let musicLog = [];          // müzik notası günlüğü (test/debug)
let lastSoundNodes = {};    // olay -> son oluşturulan kaynak node (test/debug)

// --- Oyun durumu (resetGame() içinde dolduruluyor) ---
let ball;
let platforms;
let scrollSpeed;
let score;
let gameState; // 'playing' | 'gameover'
let speedTimer; // son hız artışından bu yana geçen süre (ms)
let lastSpawnY; // en son üretilen satırın y konumu (ekran koordinatı)
let multiplier;           // momentum çarpanı (1..MAX_MULTIPLIER)
let nearMissSinceLanding; // son inişten beri en az bir kıl payı oldu mu?
let nearMissCount;        // oturumdaki toplam kıl payı (debug/test için)
let spikePasses;          // diken indeksi -> o geçişteki en yakın mesafe (geçiş başına tek sayım)
let deathCause;           // 'spike_tip' | 'spike_crush' | 'fell' | null
// Faz 6 aşama durumu (resetGame() -> resetStages() ile sıfırlanır)
let stage;                // 0..3, son cue verilen aşama
let pulse;                // { phase: 'idle'|'telegraph'|'drop'|'hold'|'retract', t, start, len, nextInS, dustT }
let mechStats;            // bu koşudaki spawn sayaçları { static, moving, fragile, breaks, pulses }
let mechLog = [];         // aşama/platform/pulse olay günlüğü (test/debug, koşular arası korunur)
let mechDebugLog = false; // true: mechLog olayları konsola da yazılır
// Faz 7 platform atlama durumu (resetGame() -> resetAirtimeTracker() ile sıfırlanır)
let airtimeTracker = {
  active: false,                 // top havada ve takip ediliyor
  startY: null,                  // havalanma anındaki ball.y
  skippedCount: 0,               // temas etmeden geçilen platform SATIRI sayısı
  passedPlatformIds: new Set(),  // geçildiği sayılan platform id'leri
  ignoredPlatformIds: new Set()  // havalanmada zaten üstte kalanlar (ayrılınan platform dahil) + temas edilenler
};
let nextPlatformId = 1;   // makePlatform() her platforma benzersiz id verir
let lastSkipResult = null; // son pas'lı/pas'sız inişin özeti (test/debug)
let skipLog = [];          // skipRow / skipLanding olay günlüğü (test/debug, koşular arası korunur)
let skipDebugLog = false;  // true: skipLog olayları konsola da yazılır
// Faz 8: desen sayaçları (resetGame() -> resetRowPatternStats(); test/debug)
let rowPatternStats = null; // { requested: [_,1..4], actual: [_,1..4], fallbacks }
// Mobil dokunmatik: ekranın sol yarısı = sola, sağ yarısı = sağa (basılı tuttukça).
// Çoklu dokunuş: EN SON basılan ve hâlâ basılı olan parmak kazanır (sağa geçerken
// sol parmak henüz kalkmamış olsa bile top durmaz; o parmak kalkınca öncekine döner).
let touchOrder = [];      // aktif dokunuş id'leri, basılma sırasına göre (sonuncusu kazanır)
let touchDir = 0;         // -1 sol, 0 yok, +1 sağ (updateGame klavyeye ek olarak okur)
let touchHintMs = 0;      // ipucunun kalan görünme süresi (her koşu başında yeniden başlar)
const TOUCH_HINT_MS = 3000;     // ipucu toplam süresi
const TOUCH_HINT_FADE_MS = 1000; // son 1 sn'de söner
const IS_TOUCH_DEVICE = typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

function setup() {
  // 1 canvas pikseli = 1 dither hücresi (retina'da da). Ekrana büyütmeyi CSS
  // image-rendering: pixelated (index.html) keskin yapar.
  pixelDensity(1);
  const c = createCanvas(CANVAS_W, CANVAS_H);
  c.parent(document.body);
  // Not: Canvas2D'de noSmooth() sadece resim ölçeklemeyi (imageSmoothingEnabled)
  // kapatır (dither deseni bulanmaz). Faz 6: renkli palette 1-bit eşikleme pası
  // (enforceOneBit) kaldırıldı; şekiller kendi ramp renginde dolu/kenarsız çizilir.
  noSmooth();
  textFont('monospace');
  resetGame();
}

// Oyunu/ilk durumu kurar - hem ilk açılışta hem restart'ta kullanılır.
function resetGame() {
  ball = {
    x: CANVAS_W / 2,
    y: 160,
    vx: 0,
    vy: 0,
    pushVx: 0, // diken gövdesinden gelen, sönen yatay itme
    grounded: true
  };
  platforms = [];
  scrollSpeed = BASE_SCROLL_SPEED;
  score = 0;
  gameState = 'playing';
  speedTimer = 0;
  multiplier = 1;
  nearMissSinceLanding = false;
  nearMissCount = 0;
  resetSound(); // Faz 5: ölümde kesilen müzik kanalını geri aç
  spikePasses = new Map();
  deathCause = null;
  resetJuice();
  resetStages(); // Faz 6: her koşu aşama 0'dan başlar (kalıcı değil)
  resetAirtimeTracker(); // Faz 7
  lastSkipResult = null;
  resetRowPatternStats(); // Faz 8
  touchHintMs = IS_TOUCH_DEVICE ? TOUCH_HINT_MS : 0; // mobil: her koşu başında kısa ipucu

  // İlk platformu topun hemen altına yerleştir (anında düşme olmasın).
  const firstPlatform = makePlatform(CANVAS_W / 2 - 50, ball.y + BALL_R + 2, 100, 'static', null);
  platforms.push(firstPlatform);
  // grounded=true ile başlayan top, üzerinde durduğu platformu bilmeli;
  // yoksa updateGame() ilk karede "!p" yüzünden topu düşürür.
  ball.currentPlatform = firstPlatform;
  lastSpawnY = firstPlatform.y;

  // Topun altında ekranı dolduracak kadar başlangıç platformu üret,
  // ilk birkaç satırda yatay sapmayı küçük tutarak adil bir başlangıç sağla.
  let prevX = platforms[0].x;
  let prevW = platforms[0].w;
  let prevPlat = platforms[0];
  let rowIndex = 0;
  while (lastSpawnY < CANVAS_H + ROW_GAP_BASE) {
    const easyStart = rowIndex < 3; // ilk satırlarda daha az yatay sapma
    const spawned = spawnRow(prevX, prevW, easyStart, prevPlat);
    prevX = spawned.baseX;
    prevW = spawned.w;
    prevPlat = spawned;
    rowIndex++;
  }
}

// Faz 6: platform nesnesi. kind: 'static' | 'moving' | 'fragile'.
// baseX = salınım merkezi (static/fragile için x ile aynı, hiç değişmez).
function makePlatform(x, y, w, kind, motion) {
  // Faz 7: id yalnızca airtimeTracker için (sayaç, random() çağrısı yok -> üretim dizisi aynı).
  const p = { id: nextPlatformId++, x: x, y: y, w: w, h: PLATFORM_H, kind: kind, baseX: x,
              amp: 0, period: 0, phase: 0, t: 0, crackT: null, broken: false };
  if (kind === 'moving' && motion) {
    p.amp = motion.amp; p.period = motion.period; p.phase = motion.phase;
    p.x = movingPlatformX(p);
  }
  if (kind === 'fragile') {
    // Kozmetik çatlak konumları (platform genişliğine göre 2-3 çatlak).
    const n = w > 85 ? 3 : 2;
    p.cracks = [];
    for (let k = 0; k < n; k++) p.cracks.push(Math.round(w * (k + 1) / (n + 1) + (Math.random() * 8 - 4)));
  }
  return p;
}

function movingPlatformX(p) {
  return p.baseX + p.amp * Math.sin((2 * Math.PI * p.t) / p.period + p.phase);
}

// Bir sonraki platform satırını üretir, fiziksel olarak HER ZAMAN ulaşılabilir
// olacak şekilde (düşüş süresi x yatay hız) yatay sapmayı sınırlar.
// Faz 6: prev = önceki satırın platform nesnesi (salınım genliği için). Hareketli
// platformlarda izin verilen merkez sapması iki salınım genliği kadar daraltılır:
// en kötü anda (ikisi zıt uçlarda) bile merkezler arası mesafe eski güvenli sınırda kalır.
//
// Faz 8 (rapor §2.3/§2.4): satır artık bir DESEN'dir (1-4) ve 1+ platform içerebilir.
// Satırdaki tüm platformlar AYNI y'de (airtimeTracker satırı tek sayar). Dönüş değeri her
// zaman satırın ANCHOR platformudur (isAnchor=true): Δx_eff <= 0.75*X_reach garantili ve bir
// sonraki satırın prev'i olur. Desen 1 (Tekli Merkez) Faz 1-7 kodunun birebir aynısıdır;
// istenen desen aşama kapısına takılır ya da garantiyi sağlayamazsa Desen 1'e düşülür.
function spawnRow(prevX, prevW, easyStart, prev) {
  // Zorluk arttıkça boşluk biraz daha değişken/geniş olabilir.
  const difficultyT = getDifficultyT();
  const rowGap = ROW_GAP_BASE + random(0, ROW_GAP_VARIANCE_MAX * difficultyT);

  // easyStart (rowIndex < 3): desen zarı hiç atılmaz -> açılış birebir Faz 1-7.
  const stage = easyStart ? 0 : getStage();
  const requested = easyStart ? 1 : pickRowPattern(stage);
  let anchor = null;
  if (!easyStart && rowPatternStats) {
    // Zar 2/3/4 dediyse bir "borç" yazılır; geometri bu satırda izin vermezse (garanti
    // sağlanamıyorsa) borç ROW_PATTERN_DEBT_MAX'a kadar bekler ve ilk uygun satırda ödenir.
    // Böylece nadir/geometrisi dar desenler (ikiz, kenar) nominal orana yaklaşır; kalan pay Desen 1.
    const debt = rowPatternStats.debt;
    if (requested !== 1) debt[requested] = Math.min(ROW_PATTERN_DEBT_MAX, debt[requested] + 1);
    for (const id of ROW_PATTERN_DEBT_ORDER) {
      if (debt[id] <= 0) continue;
      switch (id) {
        case 2: anchor = spawnForkRow(rowGap, prevX, prevW, prev); break;
        case 3: anchor = spawnTwinRow(rowGap, prevX, prevW, prev); break;
        case 4: anchor = spawnEdgeRow(rowGap, prevX, prevW, prev); break;
      }
      if (anchor) { debt[id]--; break; }
    }
  }
  if (!anchor) {
    anchor = spawnSingleRow(rowGap, difficultyT, prevX, prevW, easyStart, prev);
    anchor.isAnchor = true;
    anchor.rowPattern = 1;
  }
  if (rowPatternStats) {
    rowPatternStats.requested[requested]++;
    rowPatternStats.actual[anchor.rowPattern]++;
    if (anchor.rowPattern !== requested) rowPatternStats.fallbacks++;
  }
  return anchor;
}

// --- Faz 8 yardımcıları ---

function resetRowPatternStats() {
  rowPatternStats = { requested: [0, 0, 0, 0, 0], actual: [0, 0, 0, 0, 0], fallbacks: 0,
                      debt: [0, 0, 0, 0, 0] };
}

// Ağırlıklı desen zarı (p5 random()). Aşama kapısına takılan desen (3: stage<1, 4: stage<2)
// Desen 1'e düşer -> 2/3/4 nominal oranlarını korur, kalan pay "nefes" satırı olur.
function pickRowPattern(stage) {
  let total = 0;
  for (const p of ROW_PATTERNS) total += p.weight;
  let r = random(0, total);
  for (const p of ROW_PATTERNS) {
    if (r < p.weight) return stage >= p.minStage ? p.id : 1;
    r -= p.weight;
  }
  return 1;
}

// Wrap dahil etkin yatay mesafe (merkezler arası): min(doğrudan, ekran çevresinden).
function wrapDx(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, Math.max(0, WRAP_SPAN - d));
}

// X_reach: spawnRow'un mevcut maxReach formülü (düşüş süresi x yatay hız + genişlik toleransı).
function rowMaxReach(rowGap, w, prevW) {
  return MOVE_SPEED * Math.sqrt((2 * rowGap) / GRAVITY) + (w + prevW) / 2;
}

// Bölge (merkez aralığı, CANVAS_W oranı) ∩ ekran içi (salınım dahil).
function zoneCenterRange(zone, w, amp) {
  const z = LANE_ZONES[zone];
  return [Math.max(CANVAS_W * z[0], w / 2 + amp), Math.min(CANVAS_W * z[1], CANVAS_W - w / 2 - amp)];
}

// [lo,hi] içinde dMin <= wrapDx(c, prevCenter) <= dMax olan merkezlerin aralık listesi.
// LANE_EPS kadar içeri çekilir (kayan nokta sınırında asla ihlal olmasın).
function laneCenterIntervals(range, prevCenter, dMin, dMax) {
  const lo = range[0], hi = range[1];
  const d1 = Math.max(0, dMin + LANE_EPS), d2 = dMax - LANE_EPS;
  if (lo > hi || d2 < d1) return [];
  const out = [];
  for (const band of [[d1, d2], [WRAP_SPAN - d2, WRAP_SPAN - d1]]) { // doğrudan, wrap
    for (const iv of [[prevCenter + band[0], prevCenter + band[1]], [prevCenter - band[1], prevCenter - band[0]]]) {
      const s = Math.max(iv[0], lo), e = Math.min(iv[1], hi);
      if (e >= s) out.push([s, e]);
    }
  }
  return out;
}

function intersectIntervals(A, B) {
  const out = [];
  for (const a of A) for (const b of B) {
    const s = Math.max(a[0], b[0]), e = Math.min(a[1], b[1]);
    if (e >= s) out.push([s, e]);
  }
  return out;
}

// Aralık listesinden [a,b] bölgesini çıkarır (aynı satırda üst üste binmeyi önlemek için).
function excludeInterval(list, a, b) {
  const out = [];
  for (const iv of list) {
    if (iv[1] < a || iv[0] > b) { out.push(iv); continue; }
    if (iv[0] < a) out.push([iv[0], a]);
    if (iv[1] > b) out.push([b, iv[1]]);
  }
  return out;
}

// Aralık listesinden uzunlukla orantılı tek düzgün örnek (boşsa null).
function pickInIntervals(list) {
  if (list.length === 0) return null;
  let total = 0;
  for (const iv of list) total += iv[1] - iv[0];
  let r = random(0, total);
  for (const iv of list) {
    if (r <= iv[1] - iv[0]) return iv[0] + r;
    r -= iv[1] - iv[0];
  }
  return list[list.length - 1][1];
}

// Anchor platform tipi: Faz 6 pickPlatformKind (kırılgan art arda gelmez, aşama kapısı aynı).
function pickLaneKind(prev, allowMoving) {
  let kind = pickPlatformKind(prev);
  if (kind === 'moving' && !allowMoving) kind = 'static';
  let motion = null;
  if (kind === 'moving') {
    motion = { amp: random(MOVING_AMP_MIN, MOVING_AMP_MAX),
               period: random(MOVING_PERIOD_MIN_S, MOVING_PERIOD_MAX_S),
               phase: random(0, Math.PI * 2) };
  }
  return { kind: kind, motion: motion, amp: motion ? motion.amp : 0 };
}

// Planlanan satırı makePlatform() ile AYNI y'de üretir; anchor önce eklenir. Anchor'ı döndürür.
function commitLaneRow(rowGap, pattern, specs) {
  const newY = lastSpawnY + rowGap;
  let anchor = null;
  for (const s of specs) {
    const plat = makePlatform(s.center - s.w / 2, newY, s.w, s.kind, s.motion);
    plat.rowPattern = pattern;
    plat.isAnchor = !!s.isAnchor;
    if (s.isRiskSpot) plat.isRiskSpot = true; // Faz 9 yer tutucu (eşya yok)
    platforms.push(plat);
    if (s.isAnchor) anchor = plat;
    if (mechStats) {
      mechStats[s.kind]++;
      if (s.kind !== 'static') {
        logMech(s.kind + 'Spawn', { amp: +(s.motion ? s.motion.amp : 0).toFixed(1),
                                   period: s.motion ? +s.motion.period.toFixed(2) : null,
                                   x: +plat.baseX.toFixed(1), y: +newY.toFixed(1) });
      }
    }
  }
  lastSpawnY = newY;
  return anchor;
}

function shuffledCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(0, i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Desen 2 — Asimetrik Çatal: ana platform (anchor, 70-85px) C veya L/R'de, 0.75*X_reach
// içinde; Risk Adası (35-45px, statik) karşı kanatta, 0.75 marjının DIŞINDA ama X_reach içinde.
function spawnForkRow(rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const mainW = random(FORK_MAIN_W_MIN, FORK_MAIN_W_MAX);
  const riskW = random(RISK_W_MIN, RISK_W_MAX);
  const k = pickLaneKind(prev, true);
  const mainSafe = Math.max(0, rowMaxReach(rowGap, mainW, prevW) * ANCHOR_REACH_MARGIN - k.amp - prevAmp);
  const riskReach = rowMaxReach(rowGap, riskW, prevW);
  const riskMin = riskReach * ANCHOR_REACH_MARGIN;           // bunun altı = "güvenli", risk değil
  const riskMax = riskReach - prevAmp;                       // mutlak sınır (en kötü salınım dahil)
  const configs = shuffledCopy([['C', ['L', 'R']], ['L', ['R']], ['R', ['L']]]);
  for (const cfg of configs) {
    const mainIv = laneCenterIntervals(zoneCenterRange(cfg[0], mainW, k.amp), prevCenter, 0, mainSafe);
    const mainC = pickInIntervals(mainIv);
    if (mainC === null) continue;
    const half = (mainW + riskW) / 2 + k.amp + LANE_MIN_GAP;
    for (const rz of shuffledCopy(cfg[1])) {
      let riskIv = laneCenterIntervals(zoneCenterRange(rz, riskW, 0), prevCenter, riskMin, riskMax);
      riskIv = excludeInterval(riskIv, mainC - half, mainC + half);
      const riskC = pickInIntervals(riskIv);
      if (riskC === null) continue;
      return commitLaneRow(rowGap, 2, [
        { center: mainC, w: mainW, kind: k.kind, motion: k.motion, isAnchor: true },
        { center: riskC, w: riskW, kind: 'static', motion: null, isRiskSpot: true }
      ]);
    }
  }
  return null;
}

// Desen 3 — İkiz Sahanlık (aşama 1+): L ve R'de iki 50-60px platform, arada ~100px; İKİSİ DE
// ayrı ayrı 0.75*X_reach içinde. Anchor (zincir) rastgele biri; diğeri statik.
function spawnTwinRow(rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const wL = random(TWIN_W_MIN, TWIN_W_MAX);
  const wR = random(TWIN_W_MIN, TWIN_W_MAX);
  const anchorLeft = random() < 0.5;
  const k = pickLaneKind(prev, true);
  const ampL = anchorLeft ? k.amp : 0, ampR = anchorLeft ? 0 : k.amp;
  const safeL = Math.max(0, rowMaxReach(rowGap, wL, prevW) * ANCHOR_REACH_MARGIN - ampL - prevAmp);
  const safeR = Math.max(0, rowMaxReach(rowGap, wR, prevW) * ANCHOR_REACH_MARGIN - ampR - prevAmp);
  const ivL = laneCenterIntervals(zoneCenterRange('L', wL, ampL), prevCenter, 0, safeL);
  const ivR = laneCenterIntervals(zoneCenterRange('R', wR, ampR), prevCenter, 0, safeR);
  // Merkezler arası s: kenar boşluğu TWIN_GAP_MIN..MAX (salınımlı olan için genlik kadar pay).
  const sMin = (wL + wR) / 2 + Math.max(TWIN_GAP_MIN, LANE_MIN_GAP + 2 * k.amp);
  const sMax = (wL + wR) / 2 + TWIN_GAP_MAX;
  if (sMax < sMin) return null;
  const shifted = ivR.map(iv => [iv[0] - sMax, iv[1] - sMin]);
  const cL = pickInIntervals(intersectIntervals(ivL, shifted));
  if (cL === null) return null;
  const cR = pickInIntervals(intersectIntervals(ivR, [[cL + sMin, cL + sMax]]));
  if (cR === null) return null;
  const left = { center: cL, w: wL, kind: 'static', motion: null, isAnchor: false };
  const right = { center: cR, w: wR, kind: 'static', motion: null, isAnchor: false };
  const a = anchorLeft ? left : right;
  a.kind = k.kind; a.motion = k.motion; a.isAnchor = true;
  return commitLaneRow(rowGap, 3, anchorLeft ? [left, right] : [right, left]);
}

// Desen 4 — Kenar Trampleni (aşama 2+): x≈EDGE_INSET ve ayna konumu; mevcut screen-wrap
// (updateGame) ile ikisi tek bir "dikiş" platformu gibi davranır. Hareketli olamaz (kenara yapışık).
// Anchor = 0.75 kuralını sağlayan (ikisi de sağlıyorsa rastgele); diğeri X_reach'i aşarsa desen iptal.
function spawnEdgeRow(rowGap, prevX, prevW, prev) {
  const prevCenter = prevX + prevW / 2;
  const prevAmp = prev && prev.amp ? prev.amp : 0;
  const w = random(EDGE_W_MIN, EDGE_W_MAX);
  const k = pickLaneKind(prev, false);
  const reach = rowMaxReach(rowGap, w, prevW);
  const safe = reach * ANCHOR_REACH_MARGIN - prevAmp - LANE_EPS;
  const cL = EDGE_INSET + w / 2;
  const cR = CANVAS_W - EDGE_INSET - w / 2;
  const dL = wrapDx(cL, prevCenter), dR = wrapDx(cR, prevCenter);
  const okL = dL <= safe, okR = dR <= safe;
  if (!okL && !okR) return null;
  const anchorLeft = okL && okR ? random() < 0.5 : okL;
  if ((anchorLeft ? dR : dL) > reach - prevAmp - LANE_EPS) return null; // ikincil imkansız olmasın
  const left = { center: cL, w: w, kind: anchorLeft ? k.kind : 'static', motion: null, isAnchor: anchorLeft };
  const right = { center: cR, w: w, kind: anchorLeft ? 'static' : k.kind, motion: null, isAnchor: !anchorLeft };
  return commitLaneRow(rowGap, 4, anchorLeft ? [left, right] : [right, left]);
}

// Desen 1 — Tekli Merkez: Faz 1-7 spawnRow gövdesinin BİREBİR aynısı (yalnızca rowGap/difficultyT
// spawnRow'dan parametre olarak gelir).
function spawnSingleRow(rowGap, difficultyT, prevX, prevW, easyStart, prev) {
  const platW = random(PLATFORM_W_MIN, PLATFORM_W_MAX - difficultyT * 20);

  // Faz 6: platform tipi (aşama 0'da random() hiç çağrılmaz -> Faz 1-5 dizisi birebir).
  const kind = easyStart ? 'static' : pickPlatformKind(prev);
  let motion = null;
  if (kind === 'moving') {
    motion = { amp: random(MOVING_AMP_MIN, MOVING_AMP_MAX),
               period: random(MOVING_PERIOD_MIN_S, MOVING_PERIOD_MAX_S),
               phase: random(0, Math.PI * 2) };
  }
  const amp = motion ? motion.amp : 0;
  const prevAmp = prev && prev.amp ? prev.amp : 0;

  // Serbest düşüşle bu dikey mesafeyi ne kadar sürede aşarız (vy=0'dan başlayarak)?
  const fallTime = Math.sqrt((2 * rowGap) / GRAVITY);
  // Bu sürede yatayda en fazla ne kadar gidebiliriz? + platform genişlikleri toleransı.
  const maxReach = MOVE_SPEED * fallTime + (platW + prevW) / 2;
  // Güvenlik payı bırak (fiziksel sınırın %75'i) - HER ZAMAN geçilebilir boşluk garantisi.
  const safeReach = Math.max(0, (easyStart ? maxReach * 0.3 : maxReach * 0.75) - amp - prevAmp);

  const prevCenter = prevX + prevW / 2;
  const offset = easyStart ? random(-20, 20) : random(-safeReach, safeReach);
  let newCenter = prevCenter + offset;
  // Salınım ekran dışına taşmasın: merkez [amp, CANVAS_W - platW - amp] içinde.
  let newX = constrain(newCenter - platW / 2, amp, CANVAS_W - platW - amp);

  const newY = lastSpawnY + rowGap;
  const plat = makePlatform(newX, newY, platW, kind, motion);
  platforms.push(plat);
  if (mechStats) {
    mechStats[kind]++;
    if (kind !== 'static') {
      logMech(kind + 'Spawn', { amp: +amp.toFixed(1), period: motion ? +motion.period.toFixed(2) : null,
                               x: +newX.toFixed(1), y: +newY.toFixed(1) });
    }
  }
  lastSpawnY = newY;
  return plat;
}

// Zorluk ilerlemesi 0..1 (BASE -> MAX kaydırma hızı). spawnRow ve dither ortak kullanır.
function getDifficultyT() {
  return constrain((scrollSpeed - BASE_SCROLL_SPEED) / (MAX_SCROLL_SPEED - BASE_SCROLL_SPEED), 0, 1);
}

// ---------------------------------------------------------------------------
// Faz 6: "stage gate" aşama sistemi (TASARIM.md §9.2)
// Aşama, zorluk eğrisinin KENDİ durumundan (getDifficultyElapsedS) türetilir: ayrı
// zamanlayıcı yok. `stage` değişkeni yalnızca "cue zaten verildi mi" kenar tespiti içindir.
// Eski mekanikler kaybolmaz: aşama 2'de hareketli + kırılgan, aşama 3'te + pulse.
// ---------------------------------------------------------------------------
function resetStages() {
  stage = 0;
  stageFlashFramesLeft = 0;
  pulse = { phase: 'idle', t: 0, start: 0, len: 0, nextInS: null, dustT: 0 };
  mechStats = { static: 0, moving: 0, fragile: 0, breaks: 0, pulses: 0 };
  logMech('reset', { stage: 0 });
}

function logMech(event, data) {
  const entry = Object.assign({ event: event, stage: stage,
                                elapsedS: scrollSpeed ? +getDifficultyElapsedS().toFixed(3) : 0 }, data);
  mechLog.push(entry);
  if (mechLog.length > MECH_LOG_MAX) mechLog.shift();
  if (mechDebugLog) console.log('[mekanik]', JSON.stringify(entry));
}

function getStageForElapsed(s) {
  let st = 0;
  for (let k = 1; k < STAGE_THRESHOLDS_S.length; k++) {
    if (s >= STAGE_THRESHOLDS_S[k]) st = k;
  }
  return st;
}

function getStage() {
  return getStageForElapsed(getDifficultyElapsedS());
}

// Aşamaya girişten itibaren 0 -> 1, STAGE_RAMP_S içinde doğrusal (ani değil).
function stageRamp(elapsedS, stageIndex) {
  return constrain((elapsedS - STAGE_THRESHOLDS_S[stageIndex]) / STAGE_RAMP_S, 0, 1);
}

// Mevcut aşamadaki yeni platform tipi şansları.
function getPlatformChances() {
  const e = getDifficultyElapsedS();
  const st = getStageForElapsed(e);
  return {
    stage: st,
    moving: st >= 1 ? MOVING_CHANCE_MAX * stageRamp(e, 1) : 0,
    fragile: st >= 2 ? FRAGILE_CHANCE_MAX * stageRamp(e, 2) : 0
  };
}

// Aşama 0'da (şanslar 0) random() çağrılmaz. Arka arkaya iki kırılgan satır yok:
// her kırılgan platformun altında mutlaka sağlam (sabit/hareketli) bir satır olur.
function pickPlatformKind(prev) {
  const c = getPlatformChances();
  const fragileOk = !(prev && prev.kind === 'fragile');
  const pf = fragileOk ? c.fragile : 0;
  if (pf + c.moving <= 0) return 'static';
  const r = random();
  if (r < pf) return 'fragile';
  if (r < pf + c.moving) return 'moving';
  return 'static';
}

// updateGame() her karede çağırır: aşama yükseldiyse TEK seferlik cue.
function updateStage() {
  const e = getDifficultyElapsedS();
  const s = getStageForElapsed(e);
  if (s > stage) {
    const from = stage;
    stage = s;
    onStageUp(from, s, e);
  }
}

function onStageUp(from, to, elapsedS) {
  logMech('stageUp', { from: from, to: to, elapsedS: +elapsedS.toFixed(3) });
  if (to >= 3 && pulse.nextInS === null) pulse.nextInS = random(PULSE_INTERVAL_MIN_S, PULSE_INTERVAL_MAX_S);
  juiceOnStageUp();
}

// --- Hareketli + kırılgan platform güncellemesi (updateGame, dünya kaymasıyla aynı döngü) ---
// Hareketli platform üstündeki top platformla birlikte taşınır (yoksa altından kayardı).
function updateMovingPlatform(p, dt) {
  p.t += dt;
  const nx = movingPlatformX(p);
  const dx = nx - p.x;
  p.x = nx;
  if (ball.grounded && ball.currentPlatform === p) ball.x += dx;
}

// İlk temas (iniş) -> sayaç başlar; FRAGILE_BREAK_S sonra kırılır ve kaybolur.
function onPlatformContact(p) {
  if (p.kind === 'fragile' && p.crackT === null) {
    p.crackT = 0;
    logMech('fragileTouch', { x: +p.x.toFixed(1), y: +p.y.toFixed(1) });
  }
}

function updateFragilePlatforms(dt) {
  for (const p of platforms) {
    if (p.kind !== 'fragile' || p.crackT === null || p.broken) continue;
    p.crackT += dt;
    if (p.crackT >= FRAGILE_BREAK_S) breakPlatform(p);
  }
}

function breakPlatform(p) {
  p.broken = true;
  mechStats.breaks++;
  const ballWasOn = ball.currentPlatform === p;
  if (ballWasOn) {
    ball.grounded = false;
    ball.currentPlatform = null;
  }
  logMech('fragileBreak', { afterS: +p.crackT.toFixed(3), ballWasOn: ballWasOn });
  // Kozmetik: kırık parçaları (debris dizisi, platform gölge/ana tonlarında).
  if (JUICE.debris) {
    for (let k = 0; k < 8; k++) {
      debris.push({ x: p.x + Math.random() * p.w, y: p.y + Math.random() * p.h,
                    vx: (Math.random() - 0.5) * 80, vy: Math.random() * 40,
                    life: DEBRIS_LIFE_S * 1.6, col: k % 2 ? PAL.platShadow : PAL.platMain });
    }
  }
}

// --- Aşama 3: inen diken "pulse" (nadir, sınırlı olay; sabit şerit ana davranış) ---
// idle -> telegraph (0.3sn: 1px geri çekilme + dither toz + ratchet) -> drop -> hold -> retract -> idle
function updatePulse(dt) {
  if (stage < 3) return;
  if (pulse.phase === 'idle') {
    if (pulse.nextInS === null) pulse.nextInS = random(PULSE_INTERVAL_MIN_S, PULSE_INTERVAL_MAX_S);
    pulse.nextInS -= dt;
    if (pulse.nextInS <= 0) startPulse();
    return;
  }
  pulse.t += dt;
  if (pulse.phase === 'telegraph') {
    pulse.dustT -= dt;
    if (pulse.dustT <= 0) { spawnPulseDust(); pulse.dustT = PULSE_DUST_EVERY_S; }
    if (pulse.t >= PULSE_TELEGRAPH_S) setPulsePhase('drop');
  } else if (pulse.phase === 'drop') {
    if (pulse.t >= PULSE_DROP_S) setPulsePhase('hold');
  } else if (pulse.phase === 'hold') {
    if (pulse.t >= PULSE_HOLD_S) setPulsePhase('retract');
  } else if (pulse.phase === 'retract') {
    if (pulse.t >= PULSE_RETRACT_S) {
      setPulsePhase('idle');
      pulse.nextInS = random(PULSE_INTERVAL_MIN_S, PULSE_INTERVAL_MAX_S);
    }
  }
}

function startPulse() {
  pulse.len = Math.floor(random(PULSE_SEG_MIN, PULSE_SEG_MAX + 1));
  pulse.start = Math.floor(random(0, SPIKE_COUNT - pulse.len + 1));
  pulse.dustT = 0;
  mechStats.pulses++;
  setPulsePhase('telegraph');
  sfxSpikeWarn();
}

function setPulsePhase(phase) {
  const prev = pulse.phase;
  pulse.phase = phase;
  pulse.t = 0;
  logMech('pulse:' + phase, { from: prev, start: pulse.start, len: pulse.len,
                              nextInS: phase === 'idle' ? null : undefined });
}

function pulseCovers(i) {
  return pulse && pulse.phase !== 'idle' && i >= pulse.start && i < pulse.start + pulse.len;
}

// Dikenin ucunun sabit şeride göre ek inişi (px). Pulse dışı: 0 -> Faz 2 geometrisi birebir.
function spikeDrop(i) {
  if (!pulseCovers(i)) return 0;
  switch (pulse.phase) {
    case 'telegraph': return -PULSE_TELEGRAPH_RETRACT_PX;
    case 'drop': { const u = Math.min(1, pulse.t / PULSE_DROP_S); return PULSE_DROP_PX * (1 - (1 - u) * (1 - u)); }
    case 'hold': return PULSE_DROP_PX;
    case 'retract': return PULSE_DROP_PX * Math.max(0, 1 - pulse.t / PULSE_RETRACT_S);
  }
  return 0;
}

// Telegraph tozu: pulse yapacak bölümün uçlarından dökülen küçük parçacıklar (debris dizisi).
function spawnPulseDust() {
  for (let i = pulse.start; i < pulse.start + pulse.len; i++) {
    debris.push({ x: spikeTipX(i) + (Math.random() - 0.5) * SPIKE_W * 0.6, y: SPIKE_STRIP_H - 4,
                  vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 40,
                  life: 0.3, col: Math.random() < 0.5 ? PAL.spikeMain : PAL.spikeShadow, noScroll: true });
  }
}

function draw() {
  // Faz 4 hitstop: donukken çekirdek simülasyon (updateGame) ve dünya-içi juice
  // (debris, ghost geçmişi) ilerlemez; ekran efektleri (shake, flash) sürer.
  const frozen = consumeHitstop();
  if (gameState === 'playing' && !frozen) {
    updateGame();
  }
  if (!frozen) {
    updateWorldJuice();
  }
  updateAudio(); // Faz 5: master volume + müzik (BPM zorluktan, audioCtx.currentTime lookahead)

  // Katman sırası (Faz 4, Faz 6'da renklendi):
  //  1) koyu zemin #140f24 (background - transform'dan etkilenmez)
  //  2) [shake translate, tam sayı px] Bayer dither arkaplan (#140f24 / #251c42)
  //  3) dither ghost izleri (gölge disk + %50 Bayer top gölgesi, topun ARKASINDA)
  //  4) düz renk şekiller (platform, top[squash], diken gövde+uç) + debris
  //  5) [translate biter] HUD (sarsılmaz, okunabilirlik) + GAME OVER
  //  6) stageUp flaşı (Faz 6, sönen açık ton) / ölüm invert flash'ı (DIFFERENCE)
  shakeOffset = getShakeOffset();
  background(PAL.bgLo);
  push();
  translate(shakeOffset.x, shakeOffset.y);
  drawDitherBackground(getDitherLevel());
  drawGhosts();
  drawWorld();
  drawDebris();
  pop();
  drawScore();
  drawTouchHint();

  // Ölüm hitstop'u boyunca kare donuk kalsın; GAME OVER yazısı donma bitince gelir.
  if (gameState === 'gameover' && !frozen && hitstopMs <= 0) {
    drawGameOver();
  }

  applyStageFlash();
  applySkipFlash();   // Faz 7: 3+ pas altın invert (ölüm flaşından ayrı)
  applyInvertFlash();
  advanceScreenJuice();
}

// ---------------------------------------------------------------------------
// Faz 4: juice paketi (kozmetik katman; çekirdek fizik/çarpışma/skor okunur, yazılmaz)
// Olay kancaları: onLanding() -> juiceOnLanding(), onNearMiss() -> juiceOnNearMiss(),
// triggerGameOver() -> juiceOnDeath().
// ---------------------------------------------------------------------------
function resetJuice() {
  hitstopMs = 0;
  shakeAmp = 0; shakeT = 0; shakeMode = null; shakeDir = 1;
  shakeOffset = { x: 0, y: 0 };
  flashFramesLeft = 0;
  debris = [];
  ghostHist = [];
  ghostNearMissMs = 0;
  squashFramesLeft = 0;
  stageFlashFramesLeft = 0;
  hitstopFramesLeft = 0;
  skipFlashFramesLeft = 0;
  skipGhostMs = 0;
}

// Faz 7: skips > 0 ise normal thud yerine dolgun sub-bass iniş (görsel iniş juice'u aynı).
function juiceOnLanding(skips) {
  const cx = ball.x, cy = ball.y + BALL_R; // temas noktası: topun alt ucu = platform üstü
  if (JUICE.shake) startShake(SHAKE_LANDING_PX, 'vertical');
  if (JUICE.debris) spawnDebris(cx, cy);
  if (JUICE.squash) squashFramesLeft = SQUASH_FRAMES;
  if (skips > 0 && SOUND.skip) sfxSkipLanding(); // Faz 7: dolgun triangle darbe
  else sfxLanding(); // Faz 5: triangle thud
}

function juiceOnNearMiss() {
  if (JUICE.hitstop) startHitstop();
  if (JUICE.ghosting) ghostNearMissMs = GHOST_NEAR_MISS_MS;
  sfxNearMiss(); // Faz 5: pulse whiz
}

function juiceOnDeath() {
  if (JUICE.hitstop) startHitstop();
  if (JUICE.shake) startShake(SHAKE_DEATH_PX, 'omni');
  if (JUICE.invertFlash) flashFramesLeft = INVERT_FLASH_FRAMES;
  sfxDeath(); // Faz 5: noise patlaması + ani bas kesme
}

// Faz 6: aşama girişi cue'su. Ölümden (hitstop + omni shake + 2 kare tam invert + noise)
// ve çarpandan (square staccato arpej) ayrı: hitstop/shake YOK, 12 karede sönen
// yarı saydam açık ton (#fff3c4) + triangle majör üçlü chime.
function juiceOnStageUp() {
  if (JUICE.stageUp) stageFlashFramesLeft = STAGEUP_FLASH_FRAMES;
  sfxStageUp();
}

function applyStageFlash() {
  if (stageFlashFramesLeft <= 0) return;
  const a = STAGEUP_FLASH_ALPHA * (stageFlashFramesLeft / STAGEUP_FLASH_FRAMES);
  push();
  noStroke();
  const c = color(PAL.ballLight);
  c.setAlpha(Math.round(a * 255));
  fill(c);
  rect(0, 0, CANVAS_W, CANVAS_H);
  pop();
}

// Faz 7: 3+ pas iniş flaşı. Ölüm flaşından (applyInvertFlash: DIFFERENCE + beyaz, 2 kare,
// flashFramesLeft) AYRI fonksiyon ve sayaç: DIFFERENCE + altın #fff3c4 (PAL.ballLight), 3 kare
// -> palet sıcak tonlu tersine döner, ölümün nötr tam tersinden ayırt edilir.
function applySkipFlash() {
  if (skipFlashFramesLeft <= 0) return;
  push();
  blendMode(DIFFERENCE);
  noStroke();
  fill(PAL.ballLight);
  rect(0, 0, CANVAS_W, CANVAS_H);
  pop();
}

// --- Hitstop ---
function startHitstop() {
  hitstopMs = Math.max(hitstopMs, HITSTOP_MS);
}

// true -> bu kare dünya donuk. Kalan süre gerçek kare süresi (deltaTime) kadar azalır.
// Faz 7: kare sayılı hitstop (hitstopFramesLeft) ms'den bağımsız; ikisi birlikte de çalışır.
function consumeHitstop() {
  if (hitstopFramesLeft > 0) {
    hitstopFramesLeft--;
    if (hitstopMs > 0) hitstopMs -= deltaTime;
    return true;
  }
  if (hitstopMs <= 0) return false;
  hitstopMs -= deltaTime;
  return true;
}

// --- Yönlü screen shake ---
function startShake(amp, mode) {
  // Devam eden daha güçlü sarsıntıyı (ör. ölüm) zayıf bir iniş ezmesin.
  if (shakeAmp > 0 && currentShakeAmp() > amp) return;
  shakeAmp = amp; shakeT = 0; shakeMode = mode; shakeDir = 1;
}

function currentShakeAmp() {
  if (shakeAmp <= 0) return 0;
  return shakeAmp * Math.max(0, 1 - shakeT / SHAKE_DECAY_S);
}

// Tam sayı ofset: kesirli translate dither desenini griye bulandırırdı.
function getShakeOffset() {
  const a = currentShakeAmp();
  if (a <= 0) return { x: 0, y: 0 };
  if (shakeMode === 'vertical') {
    return { x: 0, y: Math.round(a) * shakeDir };
  }
  const ang = Math.random() * Math.PI * 2; // çekirdek random() dizisini bozmamak için Math.random
  return { x: Math.round(a * Math.cos(ang)), y: Math.round(a * Math.sin(ang)) };
}

// --- Invert flash ---
function applyInvertFlash() {
  if (flashFramesLeft <= 0) return;
  // Faz 6: renkli karede DIFFERENCE beyazla -> her rengin tümleyeni (palet tersine döner).
  push();
  blendMode(DIFFERENCE);
  noStroke();
  fill(255);
  rect(0, 0, CANVAS_W, CANVAS_H);
  pop();
}

// --- Piksel debris ---
function spawnDebris(cx, cy) {
  const n = DEBRIS_MIN + Math.floor(Math.random() * (DEBRIS_MAX - DEBRIS_MIN + 1));
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1; // yarısı sola, yarısı sağa
    debris.push({
      x: cx + side * Math.random() * BALL_R * 0.5,
      y: cy - DEBRIS_SIZE,
      vx: side * (40 + Math.random() * 100),
      vy: -(60 + Math.random() * 100),
      life: DEBRIS_LIFE_S
    });
  }
}

function drawDebris() {
  if (!JUICE.debris) return;
  noStroke();
  // Faz 6: iniş tozu top parlak tonunda; kırık platform/pulse tozu kendi rengini taşır (d.col).
  for (const d of debris) {
    fill(d.col || PAL.ballLight);
    rect(Math.round(d.x), Math.round(d.y), DEBRIS_SIZE, DEBRIS_SIZE);
  }
}

// --- Dither ghosting ---
function ghostingActive() {
  if (!JUICE.ghosting || gameState !== 'playing') return false;
  return ghostNearMissMs > 0 || skipGhostMs > 0 || (!ball.grounded && ball.vy >= GHOST_FALL_VY);
}

// Faz 7: satır geçildikten sonra SKIP_GHOST_MS boyunca iz altın (#f2c14e = PAL.ballMain).
function ghostColor() {
  return skipGhostMs > 0 ? PAL.ballMain : PAL.ballShadow;
}

function drawGhosts() {
  if (!ghostingActive()) return;
  const gCol = ghostColor();
  for (let k = GHOST_COUNT; k >= 1; k--) {
    const g = ghostHist[k];
    if (!g) continue;
    const d = Math.hypot(g.x - ball.x, g.y - ball.y);
    if (d < 1 || d > CANVAS_W / 2) continue; // hareketsiz ya da ekran-kenarı wrap'i
    // Gölge disk + mevcut Bayer formülünden %50 desen (top gölge tonu, şeffaf zeminli).
    // Desen 1px kaydırılır: %50 arkaplanda bile faz farkıyla seçilebilir kalır.
    noStroke();
    fill(PAL.bgLo);
    circle(g.x, g.y, BALL_R * 2);
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(g.x, g.y, BALL_R, 0, Math.PI * 2);
    drawingContext.clip();
    image(getPatternImage(GHOST_DITHER_LV, gCol), 1, 0);
    drawingContext.restore();
  }
}

// --- Squash/stretch: topu çizer (drawWorld içinden) ---
// Faz 6 ramp: gölge (tam disk) -> ana (sol-üste kaydırılmış küçük disk) -> parlak (küçük nokta).
// Tüm katmanlar aynı squash dönüşümünü kullanır; dış silüet Faz 4 ile birebir.
function drawBall() {
  let cx = ball.x, cy = ball.y, rx = BALL_R, ry = BALL_R;
  if (JUICE.squash && squashFramesLeft > 0) {
    // Alt kenar sabit (platform yüzeyi), top yatayda yayılır, dikeyde basılır.
    ry = BALL_R * SQUASH_Y;
    rx = BALL_R * SQUASH_X;
    cy = ball.y + BALL_R - ry;
  }
  noStroke();
  fill(PAL.ballShadow);
  ellipse(cx, cy, rx * 2, ry * 2);
  fill(PAL.ballMain);
  ellipse(cx - rx * 0.15, cy - ry * 0.15, rx * 1.6, ry * 1.6);
  fill(PAL.ballLight);
  ellipse(cx - rx * 0.4, cy - ry * 0.4, rx * 0.55, ry * 0.55);
}

// Hitstop'ta DONAN dünya-içi juice: debris hareketi, ghost geçmişi, ghost süresi.
function updateWorldJuice() {
  const dt = Math.min(deltaTime, 50) / 1000;
  for (const d of debris) {
    d.vy += GRAVITY * 0.5 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (gameState === 'playing' && !d.noScroll) d.y -= scrollSpeed * dt; // platformla birlikte kayar
    d.life -= dt;
  }
  debris = debris.filter(d => d.life > 0);

  if (gameState === 'playing') {
    ghostHist.unshift({ x: ball.x, y: ball.y });
    if (ghostHist.length > GHOST_COUNT + 1) ghostHist.length = GHOST_COUNT + 1;
  }
  if (ghostNearMissMs > 0) ghostNearMissMs -= deltaTime;
  if (skipGhostMs > 0) skipGhostMs -= deltaTime;
}

// Hitstop'ta da SÜREN ekran efektleri: kare sonunda ilerler.
function advanceScreenJuice() {
  if (shakeAmp > 0) {
    shakeT += deltaTime / 1000;
    shakeDir = -shakeDir;
    if (shakeT >= SHAKE_DECAY_S) { shakeAmp = 0; shakeMode = null; }
  }
  if (flashFramesLeft > 0) flashFramesLeft--;
  if (stageFlashFramesLeft > 0) stageFlashFramesLeft--;
  if (skipFlashFramesLeft > 0) skipFlashFramesLeft--;
  if (squashFramesLeft > 0) squashFramesLeft--;
}

// ---------------------------------------------------------------------------
// Faz 3: Bayer dither (Faz 6: 0/1 bitleri #140f24 / #251c42 tonlarına eşlenir)
// ---------------------------------------------------------------------------
function bay(x, y, lv) {
  return lv * 16 > BAY[((y & 3) << 2) | (x & 3)];
}

// Arkaplan yoğunluğu: zorlukla %25 -> %50.
function getDitherLevel() {
  return DITHER_LV_MIN + (DITHER_LV_MAX - DITHER_LV_MIN) * getDifficultyT();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// bay() eşikleri tam sayı (0..15) olduğundan desen yalnızca ceil(lv*16)'ya bağlı;
// %25..%50 aralığında en fazla 5 farklı desen var. Her biri bir kez bay() ile
// üretilip önbelleğe alınır, her kare tek bir image() çağrısıyla basılır.
// Faz 6: bit 1 -> PAL.bgHi, bit 0 -> PAL.bgLo (yalnız renk eşlemesi değişti).
function getDitherImage(lv) {
  const key = Math.ceil(lv * 16);
  let img = ditherCache.get(key);
  if (!img) {
    const hi = hexToRgb(PAL.bgHi), lo = hexToRgb(PAL.bgLo);
    img = createImage(CANVAS_W, CANVAS_H);
    img.loadPixels();
    const px = img.pixels;
    for (let y = 0; y < CANVAS_H; y++) {
      for (let x = 0; x < CANVAS_W; x++) {
        const c = bay(x, y, lv) ? hi : lo;
        const i = (y * CANVAS_W + x) * 4;
        px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
      }
    }
    img.updatePixels();
    ditherCache.set(key, img);
  }
  return img;
}

// Aynı bay() formülüyle şeffaf zeminli tek renk desen (ghost izi vb. için).
function getPatternImage(lv, hex) {
  const key = Math.ceil(lv * 16) + '|' + hex;
  let img = patternCache.get(key);
  if (!img) {
    const c = hexToRgb(hex);
    img = createImage(CANVAS_W, CANVAS_H);
    img.loadPixels();
    const px = img.pixels;
    for (let y = 0; y < CANVAS_H; y++) {
      for (let x = 0; x < CANVAS_W; x++) {
        const i = (y * CANVAS_W + x) * 4;
        if (bay(x, y, lv)) { px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; }
        else px[i + 3] = 0;
      }
    }
    img.updatePixels();
    patternCache.set(key, img);
  }
  return img;
}

function drawDitherBackground(lv) {
  image(getDitherImage(lv), 0, 0);
}

// ---------------------------------------------------------------------------
// Faz 5: ses (Web Audio API doğrudan; TASARIM.md §8.2 Faz 5 tablosu, karar #3 arpej ödülü §8.1.2)
// Graf: kaynak -> zarf GainNode -> kanal GainNode (pulse1/pulse2/triangle/noise)
//       -> mixAnalyser -> masterGain (mute/volume) -> outAnalyser -> destination
// Analyser'lar geçirgendir (sinyali değiştirmez); test/debug ölçümü içindir.
// Olay kancaları: juiceOnLanding() -> sfxLanding(), juiceOnNearMiss() -> sfxNearMiss(),
// onNearMiss() çarpan arttıysa -> sfxMultiplier(), juiceOnDeath() -> sfxDeath(),
// draw() -> updateAudio() (müzik sıralayıcısı + master volume).
// build*() fonksiyonları (ctx, hedef, zaman) alır: aynı sentez OfflineAudioContext'te de
// çalıştırılıp ölçülebilir.
// ---------------------------------------------------------------------------
let mixAnalyser = null;
let outAnalyser = null;

// Autoplay politikası: AudioContext ilk kullanıcı etkileşiminde (keyPressed/mousePressed)
// kurulur ve resume() edilir. Etkileşimden önce hiçbir ses node'u oluşturulmaz.
function unlockAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // Web Audio yok: oyun sessiz devam eder
    audioCtx = new AC();
    mixAnalyser = audioCtx.createAnalyser();
    mixAnalyser.fftSize = 2048;
    masterGain = audioCtx.createGain();
    outAnalyser = audioCtx.createAnalyser();
    outAnalyser.fftSize = 2048;
    mixAnalyser.connect(masterGain);
    masterGain.connect(outAnalyser);
    outAnalyser.connect(audioCtx.destination);
    chan = {};
    for (const name of Object.keys(CH_GAIN)) {
      const g = audioCtx.createGain();
      g.gain.value = CH_GAIN[name];
      g.connect(mixAnalyser);
      chan[name] = g;
    }
    noiseBuffer = createNoiseBuffer(audioCtx);
    appliedMasterGain = -1;
    applyMasterVolume();
    logSound('init', { state: audioCtx.state, sampleRate: audioCtx.sampleRate });
  }
  if (audioCtx.state !== 'running') {
    const before = audioCtx.state;
    audioCtx.resume().then(() => logSound('resume', { before: before, state: audioCtx.state }));
  }
}

// Ses çalınabilir mi? (bağlam kurulu + çalışıyor). Askıdayken node planlamak, resume'da
// birikmiş seslerin topluca çalmasına yol açardı.
function audioReady() {
  return audioCtx && audioCtx.state === 'running' ? audioCtx : null;
}

function getMasterTarget() {
  return SOUND.mute ? 0 : constrain(SOUND.masterVolume, 0, 1);
}

// Mute/volume masterGain'e yazılır; kaynaklar yine tetiklenir, sadece çıkış kısılır.
function applyMasterVolume() {
  if (!audioCtx) return;
  const target = getMasterTarget();
  if (target === appliedMasterGain) return;
  const t = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(target, t);
  masterGain.gain.value = target;
  appliedMasterGain = target;
  logSound('master', { gain: target, mute: SOUND.mute, volume: SOUND.masterVolume });
}

function toggleMute() {
  SOUND.mute = !SOUND.mute;
  applyMasterVolume();
}

// Beyaz gürültü: [-1, 1) düzgün dağılımlı rastgele örnekler, tek seferlik üretilir.
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
function buildThud(ctx, dest, t) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(THUD_F0, t);
  osc.frequency.exponentialRampToValueAtTime(THUD_F1, t + THUD_DROP_S);
  const env = ctx.createGain();
  const end = envelopeAD(env.gain, t, 1, THUD_ATTACK_S, THUD_DECAY_S);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, freqStart: THUD_F0, freqEnd: THUD_F1, rampEnd: t + THUD_DROP_S,
           gainStart: t, gainPeakAt: t + THUD_ATTACK_S, gainEnd: end, stopAt: end + 0.01 };
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

// Faz 6 stageUp chime: triangle, 3 nota yükselen majör üçlü (A4 C#5 E5), legato + uzun sönüm.
// Çarpan arpejinden ayrı: square değil triangle, 0.04sn staccato değil 0.12sn adım, son nota çınlar.
function buildStageUpChime(ctx, dest, t) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  const freqs = [];
  for (let i = 0; i < STAGEUP_MIDI.length; i++) {
    const ns = t + i * STAGEUP_STEP_S;
    const f = midiToHz(STAGEUP_MIDI[i]);
    freqs.push(+f.toFixed(2));
    osc.frequency.setValueAtTime(f, ns);
    env.gain.setValueAtTime(STAGEUP_PEAK * 0.6, ns);
    env.gain.linearRampToValueAtTime(STAGEUP_PEAK, ns + 0.01);
  }
  const lastStart = t + (STAGEUP_MIDI.length - 1) * STAGEUP_STEP_S;
  const end = lastStart + STAGEUP_TAIL_S;
  env.gain.setValueAtTime(STAGEUP_PEAK, lastStart + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, end);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(end + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return { node: osc, type: osc.type, notes: STAGEUP_MIDI.length, freqs: freqs,
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
function buildSkipThud(ctx, dest, t) {
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

// Müzik notası: square, sekizlik adımın %55'i kadar çalar (staccato).
function buildMusicNote(ctx, dest, t, freq, durS) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + 0.003);
  env.gain.setValueAtTime(1, t + durS - 0.005);
  env.gain.linearRampToValueAtTime(0, t + durS);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(t + durS + 0.01);
  cleanupOnEnded(osc, [osc, env]);
  return osc;
}

function logSound(event, data) {
  const entry = Object.assign({ event: event, t: audioCtx ? +audioCtx.currentTime.toFixed(4) : null,
                                master: appliedMasterGain }, data);
  for (const k of Object.keys(entry)) {
    if (typeof entry[k] === 'number') entry[k] = +entry[k].toFixed(4);
  }
  soundLog.push(entry);
  if (soundLog.length > SOUND_LOG_MAX) soundLog.shift();
  if (SOUND.debugLog) console.log('[ses]', JSON.stringify(entry));
}

// Kanal adı + build sonucu -> günlük (node nesnesi günlüğe yazılmaz, lastSoundNodes'ta tutulur).
function playSfx(event, channel, build) {
  const ctx = audioReady();
  if (!ctx) return null;
  const info = build(ctx, chan[channel], ctx.currentTime);
  lastSoundNodes[event] = info.node;
  const data = Object.assign({ channel: channel }, info);
  delete data.node;
  logSound(event, data);
  return info;
}

function sfxLanding() {
  if (!SOUND.landing) return;
  playSfx('landing', 'triangle', buildThud);
}

function sfxNearMiss() {
  if (!SOUND.nearMiss) return;
  playSfx('nearMiss', 'pulse1', buildWhiz);
}

// Whiz bittikten sonra başlar (aynı olay, ayrı ses; üst üste binmez).
function sfxMultiplier(mult) {
  if (!SOUND.multiplier) return;
  playSfx('multiplier', 'pulse1', (ctx, dest, t) => buildArpeggio(ctx, dest, t + WHIZ_S, mult));
}

function sfxDeath() {
  const ctx = audioReady();
  if (!ctx) return;
  // "Ani bas kesme": müzik (bas hattı, pulse2) rampasız, aynı anda kesilir.
  cutMusicNow(ctx.currentTime);
  if (!SOUND.death) return;
  playSfx('death', 'noise', (c, dest, t) => buildNoiseBurst(c, dest, t, noiseBuffer));
}

// Faz 6: aşama girişi (ayrı olay adı 'stageUp', ayrı fonksiyon; ölüm/çarpanla paylaşılan kod yok).
function sfxStageUp() {
  if (!SOUND.stageUp) return;
  playSfx('stageUp', 'triangle', buildStageUpChime);
}

function sfxSpikeWarn() {
  if (!SOUND.spikeWarn) return;
  playSfx('spikeWarn', 'noise', (c, dest, t) => buildRatchet(c, dest, t, noiseBuffer));
}

// Faz 7 (ayrı olay adları: 'skipWhoosh' / 'skipLanding' / 'skipCue').
function sfxSkipWhoosh() {
  if (!SOUND.skip) return;
  playSfx('skipWhoosh', 'triangle', buildWhoosh);
}

function sfxSkipLanding() {
  if (!SOUND.skip) return;
  playSfx('skipLanding', 'triangle', buildSkipThud);
}

function sfxSkipCue(tier) {
  if (!SOUND.skip) return;
  playSfx('skipCue', 'pulse1', (ctx, dest, t) => buildSkipCue(ctx, dest, t, tier));
}

function cutMusicNow(t) {
  const stopped = musicVoices.length;
  for (const v of musicVoices) {
    try { v.stop(t); } catch (e) { /* zaten durmuş */ }
  }
  musicVoices = [];
  chan.pulse2.gain.cancelScheduledValues(t);
  chan.pulse2.gain.setValueAtTime(0, t);
  musicNextTime = 0;
  logSound('bassCut', { channel: 'pulse2', voicesStopped: stopped, gainAfter: 0 });
}

// resetGame(): müzik kanalı ölümde kesilmişti, seviyesini geri getir.
function resetSound() {
  musicNextTime = 0;
  musicStep = 0;
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  chan.pulse2.gain.cancelScheduledValues(t);
  chan.pulse2.gain.setValueAtTime(CH_GAIN.pulse2, t);
}

// Müzik temposu zorluk eğrisinin KENDİ durumundan türetilir (ayrı zamanlayıcı yok, DRY).
// Tablo birebir: 110 BPM başlangıç, her 30sn +5 BPM, tavan 145 BPM.
// Koşu süresi, zorluk eğrisinin durumundan geri hesaplanır: scrollSpeed şimdiye kadar kaç
// kez xSPEED_INCREASE_FACTOR ile arttıysa o kadar SPEED_INCREASE_INTERVAL geçmiştir, artı
// son artıştan beri speedTimer. (MAX hızda speedTimer sıfırlanmaz, saymaya devam eder.)
// Not: hız tavanı 13 adımda (~169sn) gelir, müzik tavanı 7x30 = 210sn'de -> MAX hızda 135 BPM,
// 145 BPM'e MAX hızdan ~41sn sonra ulaşılır.
function getDifficultyElapsedS() {
  const speedSteps = Math.round(Math.log(scrollSpeed / BASE_SCROLL_SPEED) / Math.log(SPEED_INCREASE_FACTOR));
  return (speedSteps * SPEED_INCREASE_INTERVAL + speedTimer) / 1000;
}

function getMusicBpm() {
  const steps = Math.min(MUSIC_BPM_STEPS, Math.floor(getDifficultyElapsedS() / MUSIC_BPM_STEP_S));
  return MUSIC_BPM_START + steps * MUSIC_BPM_STEP;
}

// draw() her karede çağırır: master volume + müzik notalarını audioCtx.currentTime ile
// MUSIC_LOOKAHEAD_S önden planlar (kare hızından bağımsız, kesintisiz ritim).
function updateAudio() {
  if (!audioCtx) return;
  applyMasterVolume();
  if (audioCtx.state !== 'running') return;
  if (gameState !== 'playing' || !SOUND.music) {
    musicNextTime = 0;
    return;
  }
  const now = audioCtx.currentTime;
  if (musicNextTime < now) musicNextTime = now + 0.05; // ilk başlangıç / sekme dönüşü hizalaması
  const bpm = getMusicBpm();
  const stepS = 60 / bpm / 2; // sekizlik nota
  while (musicNextTime < now + MUSIC_LOOKAHEAD_S) {
    const midi = MUSIC_PATTERN_MIDI[musicStep % MUSIC_PATTERN_MIDI.length];
    const osc = buildMusicNote(audioCtx, chan.pulse2, musicNextTime, midiToHz(midi), stepS * MUSIC_NOTE_FRAC);
    musicVoices.push(osc);
    osc.addEventListener('ended', () => {
      const i = musicVoices.indexOf(osc);
      if (i >= 0) musicVoices.splice(i, 1);
    });
    musicLog.push({ t: +musicNextTime.toFixed(4), bpm: bpm, step: musicStep, midi: midi,
                    scrollSpeed: +scrollSpeed.toFixed(2) });
    if (musicLog.length > MUSIC_LOG_MAX) musicLog.shift();
    musicNextTime += stepS;
    musicStep++;
  }
}

function updateGame() {
  // dt saniye cinsinden, ani kasma/lag sıçramalarına karşı sınırlandırılmış.
  const dt = Math.min(deltaTime, 50) / 1000;

  // --- Zorluk eğrisi: kademeli hızlanma, bir tavanda sabitlenir ---
  speedTimer += deltaTime;
  if (speedTimer >= SPEED_INCREASE_INTERVAL && scrollSpeed < MAX_SCROLL_SPEED) {
    scrollSpeed = Math.min(scrollSpeed * SPEED_INCREASE_FACTOR, MAX_SCROLL_SPEED);
    speedTimer = 0;
  }
  updateStage(); // Faz 6: eşik geçildiyse tek seferlik stageUp cue
  // --- Skor: dünyanın toplam yukarı kaydırma mesafesi x momentum çarpanı ---
  score += scrollSpeed * dt * multiplier;

  // --- Yatay kontrol (SADECE sol/sağ, dikey tamamen otomatik) ---
  let vx = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) vx -= MOVE_SPEED;  // A
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) vx += MOVE_SPEED; // D
  if (vx === 0) vx = touchDir * MOVE_SPEED; // mobil dokunmatik (klavyeye ek)
  ball.vx = vx;
  // Diken gövdesinden gelen itme darbesi kısa sürede söner.
  ball.x += (ball.vx + ball.pushVx) * dt;
  ball.pushVx *= Math.exp(-dt / SPIKE_PUSH_DECAY);
  if (Math.abs(ball.pushVx) < 1) ball.pushVx = 0;

  // --- Ekran kenarından wrap (Pac-Man usulü, ani ama basit tek-frame geçiş) ---
  if (ball.x < -BALL_R) ball.x = CANVAS_W + BALL_R;
  if (ball.x > CANVAS_W + BALL_R) ball.x = -BALL_R;

  // --- Tüm platformları yukarı kaydır (dünya kayması) ---
  for (const p of platforms) {
    p.y -= scrollSpeed * dt;
    if (p.kind === 'moving') updateMovingPlatform(p, dt); // Faz 6: yatay salınım (+ üstündeki top)
  }
  lastSpawnY -= scrollSpeed * dt;

  // --- Dikey hareket: yerçekimi + platform teması ---
  if (ball.grounded) {
    // Platformla birlikte yukarı taşın (dünya ile aynı hızda).
    ball.y -= scrollSpeed * dt;
    ball.vy = 0;

    // Hâlâ platformun üzerinde mi? (yatayda kaymış olabilir)
    const p = ball.currentPlatform;
    if (!p || ball.x + BALL_R < p.x || ball.x - BALL_R > p.x + p.w) {
      ball.grounded = false;
      ball.currentPlatform = null;
    }
  } else {
    // Serbest düşüş.
    ball.vy = Math.min(ball.vy + GRAVITY * dt, MAX_FALL_SPEED);
    ball.y += ball.vy * dt;

    // Faz 7: geçilen satırları iniş kontrolünden ÖNCE say (aynı karede pas + iniş olursa kaçmasın).
    updateAirtimeAndSkips();

    // Platforma iniş kontrolü (sadece düşerken, yukarı hareket ederken değil).
    if (ball.vy >= 0) {
      for (const p of platforms) {
        const ballBottom = ball.y + BALL_R;
        const prevBallBottom = ballBottom - ball.vy * dt;
        // Platformlar bu karede zaten yukarı kaydırıldı; önceki karedeki tepe
        // konumuyla karşılaştır, yoksa top platformun içinden geçebilir (tünelleme).
        const prevPlatformTop = p.y + scrollSpeed * dt;
        const withinX = ball.x + BALL_R > p.x && ball.x - BALL_R < p.x + p.w;
        const crossingTop = prevBallBottom <= prevPlatformTop && ballBottom >= p.y;
        if (withinX && crossingTop) {
          ball.y = p.y - BALL_R;
          ball.vy = 0;
          ball.grounded = true;
          ball.currentPlatform = p;
          onPlatformContact(p); // Faz 6: kırılgan platform sayacı
          onLanding();
          break;
        }
      }
    }
  }

  // --- Faz 6: kırılgan platformlar (ilk temastan FRAGILE_BREAK_S sonra kaybolur) ---
  updateFragilePlatforms(dt);

  // --- Eski platformları temizle (ekranın üstünden çıkanlar + kırılanlar) ---
  platforms = platforms.filter(p => p.y > -PLATFORM_H - 20 && !p.broken);

  // --- Önde yeterli platform olduğundan emin ol (sonsuz, performanslı üretim) ---
  // En son üretilen satırı bul (en büyük y / en alttaki).
  if (platforms.length > 0) {
    let last = platforms[0];
    for (const p of platforms) {
      // Faz 8: aynı (en alt) satırda birden çok platform olabilir -> zincir anchor'dan sürer.
      if (p.y > last.y || (p.y === last.y && p.isAnchor && !last.isAnchor)) last = p;
    }
    while (lastSpawnY < CANVAS_H + ROW_GAP_BASE) {
      last = spawnRow(last.baseX, last.w, false, last);
    }
  }

  // --- Faz 6 aşama 3: inen diken pulse (pulse yapan uçların konumu hitbox'a da yansır) ---
  updatePulse(dt);

  // --- Kayıp koşulu 1: diken UCU (ya da V arasında ezilme); gövde sadece iter ---
  if (handleSpikes()) {
    return;
  }

  // --- Kıl payı takibi (ölmediysek) ---
  trackNearMisses();

  // --- Kayıp koşulu 2: topun merkezi ekranın alt kenarını geçerse ---
  if (ball.y > CANVAS_H) {
    triggerGameOver('fell');
    return;
  }
}

function triggerGameOver(cause) {
  deathCause = cause || null;
  gameState = 'gameover';
  juiceOnDeath(); // Faz 4: kozmetik
}

// ---------------------------------------------------------------------------
// Faz 2: diken geometrisi (drawWorld() ile birebir aynı üçgenler)
// Üçgen i: taban (i*SPIKE_W, 0)-((i+1)*SPIKE_W, 0), uç (i*SPIKE_W + SPIKE_W/2, spikeTipY(i))
// Faz 6: spikeTipY(i) = SPIKE_STRIP_H + spikeDrop(i); pulse dışında spikeDrop = 0, yani
// sabit şerit geometrisi/hitbox'ı birebir aynı. Pulse yapan uç uzar, ölümcül nokta onunla iner.
// ---------------------------------------------------------------------------
function spikeTipX(i) {
  return i * SPIKE_W + SPIKE_W / 2;
}

function spikeTipY(i) {
  return SPIKE_STRIP_H + spikeDrop(i);
}

function distToTip(i) {
  return Math.hypot(ball.x - spikeTipX(i), ball.y - spikeTipY(i));
}

// Topun (hurtbox) diken gövdeleriyle temaslarını döndürür: [{pen, nx, ny}]
// nx/ny = topu dışarı iten birim normal. Uç noktası bölgesi burada sayılmaz
// (onu ölümcül uç kontrolü ele alır).
function spikeBodyContacts() {
  const contacts = [];
  for (let i = 0; i < SPIKE_COUNT; i++) {
    const tx = spikeTipX(i);
    const ty = spikeTipY(i);
    if (Math.abs(ball.x - tx) > SPIKE_W / 2 + HURTBOX_R) continue;
    if (ball.y - HURTBOX_R > ty) continue;
    const faces = [
      { px: i * SPIKE_W, py: 0 },            // sol yüz: sol taban köşesi -> uç
      { px: (i + 1) * SPIKE_W, py: 0 }       // sağ yüz: sağ taban köşesi -> uç
    ];
    for (const f of faces) {
      const ux = tx - f.px, uy = ty - f.py;
      const len = Math.hypot(ux, uy);
      const dx = ball.x - f.px, dy = ball.y - f.py;
      const t = (dx * ux + dy * uy) / (len * len);
      if (t < 0 || t >= 1) continue; // uç (t>=1) ölümcül uç kontrolünün işi
      // Yüzün dışa bakan normali (aşağı ve dışarı doğru).
      let nx = uy / len, ny = -ux / len;
      if (nx * (f.px - tx) < 0) { nx = -nx; ny = -ny; }
      const s = dx * nx + dy * ny; // işaretli mesafe (dışarı +)
      if (s < HURTBOX_R && s > -SPIKE_W) {
        // s<0: merkez üçgenin içine girmiş; yine aynı yüzden dışarı it.
        contacts.push({ pen: HURTBOX_R - s, nx, ny, spike: i });
      }
    }
  }
  return contacts;
}

// true dönerse oyun bitti.
function handleSpikes() {
  // 1) Ölümcül uç: sadece tepe noktası (HURTBOX_R + ~2px).
  for (let i = 0; i < SPIKE_COUNT; i++) {
    if (distToTip(i) <= SPIKE_KILL_DIST) {
      triggerGameOver('spike_tip');
      return true;
    }
  }

  // 2) Gövdeye değme: öldürmez, hafifçe iter.
  let contacts = spikeBodyContacts();
  if (contacts.length === 0) return false;

  if (ball.grounded) {
    // Altta platform var, aşağı itilemez: penetrasyonu YATAY olarak çöz.
    for (let iter = 0; iter < 3 && contacts.length > 0; iter++) {
      const c = contacts[0];
      const ax = Math.max(Math.abs(c.nx), 0.3);
      ball.x += Math.sign(c.nx) * (c.pen / ax);
      ball.pushVx = Math.sign(c.nx) * SPIKE_PUSH_VX;
      contacts = spikeBodyContacts();
    }
    // İki diken arasındaki V'ye sıkışıp çözülemiyorsa platform topu ezer.
    const residual = contacts.reduce((m, c) => Math.max(m, c.pen), 0);
    if (residual > SPIKE_CRUSH_TOL) {
      triggerGameOver('spike_crush');
      return true;
    }
  } else {
    // Havada: yüz normali boyunca dışarı (aşağı + yana) it, küçük darbe ver.
    for (const c of contacts) {
      ball.x += c.nx * c.pen;
      ball.y += c.ny * c.pen;
      ball.pushVx = Math.sign(c.nx) * SPIKE_PUSH_VX;
    }
    ball.vy = Math.max(ball.vy, SPIKE_PUSH_VY);
  }

  // İtme topu bir uca taşıdıysa yine ölümcül.
  for (let i = 0; i < SPIKE_COUNT; i++) {
    if (distToTip(i) <= SPIKE_KILL_DIST) {
      triggerGameOver('spike_tip');
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Faz 2: kıl payı (near-miss) + momentum çarpanı (sayısal çekirdek)
// Bir diken "menzilde" = top hurtbox'ı yatayda üçgenin tabanıyla çakışıyor ve
// uca NEAR_MISS_EXIT_DIST'ten yakın. Geçiş boyunca en yakın mesafe tutulur;
// menzilden çıkınca (kaçış anı) bir kez değerlendirilir -> diken başına tek sayım.
// ---------------------------------------------------------------------------
function trackNearMisses() {
  for (let i = 0; i < SPIKE_COUNT; i++) {
    const inRange = Math.abs(ball.x - spikeTipX(i)) < SPIKE_W / 2 + HURTBOX_R;
    const d = distToTip(i);
    if (inRange && d <= NEAR_MISS_EXIT_DIST) {
      const prev = spikePasses.get(i);
      spikePasses.set(i, prev === undefined ? d : Math.min(prev, d));
    } else if (spikePasses.has(i)) {
      const minD = spikePasses.get(i);
      spikePasses.delete(i);
      if (minD > SPIKE_KILL_DIST && minD <= NEAR_MISS_MAX_DIST) {
        onNearMiss(i, minD);
      }
    }
  }
}

// Faz 4 (görsel) / Faz 5 (ses) bu olaya bağlanacak.
function onNearMiss(spikeIndex, minDist) {
  nearMissCount++;
  nearMissSinceLanding = true;
  const prevMultiplier = multiplier;
  multiplier = Math.min(multiplier + 1, MAX_MULTIPLIER);
  juiceOnNearMiss(); // Faz 4: kozmetik (+ Faz 5 whiz)
  // Faz 5: skor katlanması -> çarpan gerçekten arttıysa (tavanda değil) pentatonik arpej.
  if (multiplier > prevMultiplier) sfxMultiplier(multiplier);
}

// Platforma iniş: son inişten beri kıl payı yoksa "rahat iniş" -> çarpan 1x.
// Faz 7: havadayken satır atlandıysa (skippedCount >= 1) bu sıfırlama YERİNE skip bonusu.
// skippedCount === 0 yolu Faz 2 ile birebir aynı.
function onLanding() {
  const skips = airtimeTracker.skippedCount;
  if (skips > 0) {
    applySkipBonus(skips);
  } else {
    if (!nearMissSinceLanding) {
      multiplier = 1;
    }
    lastSkipResult = { skips: 0, tier: 0, bonus: 0, multiplier: multiplier };
  }
  nearMissSinceLanding = false;
  resetAirtimeTracker();
  juiceOnLanding(skips); // Faz 4: kozmetik (Faz 7: pas varsa dolgun darbe sesi)
  if (skips > 0) juiceOnSkipLanding(lastSkipResult.tier);
}

// ---------------------------------------------------------------------------
// Faz 7: platform atlama (skip bonus) — TASARIM.md §10.1, rapor §1.4 / §6.3
// Satır "atlandı" = havalanmada topun ALTINDA olan bir platformun alt kenarını topun üst
// kenarı temas etmeden geçti (ball.y - BALL_R > p.y + p.h). Ayrılınan platform ve havalanmada
// zaten yukarıda kalanlar sayılmaz (ignoredPlatformIds); top bir platformun dikdörtgenine
// değerse (yan geçiş) o platform da sayılmaz. Aynı y'deki platformlar tek satır.
// ---------------------------------------------------------------------------
function resetAirtimeTracker() {
  airtimeTracker.active = false;
  airtimeTracker.startY = null;
  airtimeTracker.skippedCount = 0;
  airtimeTracker.passedPlatformIds.clear();
  airtimeTracker.ignoredPlatformIds.clear();
}

function logSkip(event, data) {
  const entry = Object.assign({ event: event, stage: getStage(), elapsedS: +getDifficultyElapsedS().toFixed(3) }, data);
  skipLog.push(entry);
  if (skipLog.length > SKIP_LOG_MAX) skipLog.shift();
  if (skipDebugLog) console.log('[skip]', JSON.stringify(entry));
}

function circleTouchesRect(cx, cy, r, p) {
  const nx = Math.max(p.x, Math.min(cx, p.x + p.w));
  const ny = Math.max(p.y, Math.min(cy, p.y + p.h));
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) <= r * r;
}

// updateGame() serbest düşüş dalında, iniş kontrolünden önce her kare çağrılır.
function updateAirtimeAndSkips() {
  const t = airtimeTracker;
  if (ball.grounded) {
    if (t.active || t.skippedCount > 0) resetAirtimeTracker();
    return;
  }
  if (!t.active) {
    // Havalanma: o an topun ayak hizasında/üstünde kalan platformlar (ayrılınan dahil) sayılmaz.
    t.active = true;
    t.startY = ball.y;
    for (const p of platforms) {
      if (p.y <= ball.y + BALL_R + 1) t.ignoredPlatformIds.add(p.id);
    }
  }
  for (const p of platforms) {
    if (p.broken || t.ignoredPlatformIds.has(p.id) || t.passedPlatformIds.has(p.id)) continue;
    if (ball.y - BALL_R > p.y + p.h) {
      // Aynı satırda (±SKIP_ROW_TOL) zaten sayılmış başka platform varsa satır bir kez sayılır.
      let sameRow = false;
      for (const q of platforms) {
        if (q !== p && t.passedPlatformIds.has(q.id) && Math.abs(q.y - p.y) <= SKIP_ROW_TOL) { sameRow = true; break; }
      }
      t.passedPlatformIds.add(p.id);
      if (!sameRow) {
        t.skippedCount++;
        onSkipRow(t.skippedCount, p);
      }
    } else if (circleTouchesRect(ball.x, ball.y, BALL_R, p)) {
      t.ignoredPlatformIds.add(p.id); // yandan değdi: temas var, pas sayılmaz
    }
  }
}

// Kazanılacak kademe: 1, 2, 3 (3+). Aşama < SKIP_BIG_REWARD_STAGE iken 2+ pas da 1-pas gibi.
function getSkipTier(skips) {
  if (skips <= 0) return 0;
  const raw = Math.min(skips, 3);
  return getStage() >= SKIP_BIG_REWARD_STAGE ? raw : 1;
}

// Havadayken satır geçildiği an: whoosh + altın ghost izi; 2+ kademe açıksa beyaz-ton parçacık.
function onSkipRow(count, p) {
  logSkip('skipRow', { count: count, platformId: p.id, ballY: +ball.y.toFixed(1), platY: +p.y.toFixed(1) });
  sfxSkipWhoosh();
  if (JUICE.skipBonus && JUICE.ghosting) skipGhostMs = SKIP_GHOST_MS;
  if (JUICE.skipBonus && JUICE.debris && getSkipTier(count) >= 2) {
    for (let k = 0; k < SKIP_SPARK_COUNT; k++) {
      debris.push({ x: ball.x + (Math.random() - 0.5) * BALL_R * 2, y: ball.y + (Math.random() - 0.5) * BALL_R,
                    vx: (Math.random() - 0.5) * 60, vy: -(80 + Math.random() * 80),
                    life: DEBRIS_LIFE_S, col: PAL.hud });
    }
  }
}

// Sayısal çekirdek (puan + çarpan). Kozmetik ayrı: juiceOnSkipLanding().
function applySkipBonus(skips) {
  const tier = getSkipTier(skips);
  const multBefore = multiplier;
  if (tier === 2) multiplier = Math.min(multiplier + 1, MAX_MULTIPLIER);
  else if (tier === 3) multiplier = MAX_MULTIPLIER;
  // tier 1: çarpan KORUNUR (düşürülmez)
  const bonus = SKIP_BONUS_BASE[tier] * multiplier;
  score += bonus;
  lastSkipResult = { skips: skips, tier: tier, bonus: bonus, multBefore: multBefore, multiplier: multiplier };
  logSkip('skipLanding', lastSkipResult);
  return lastSkipResult;
}

function juiceOnSkipLanding(tier) {
  sfxSkipCue(tier);
  if (!JUICE.skipBonus) return;
  if (tier === 2 && JUICE.hitstop) hitstopFramesLeft = Math.max(hitstopFramesLeft, SKIP_HITSTOP_FRAMES);
  if (tier === 3) {
    if (JUICE.invertFlash) skipFlashFramesLeft = SKIP_FLASH_FRAMES;
    if (JUICE.shake) startShake(SKIP_SHAKE_PX, 'vertical'); // 6px > iniş 2px: startShake ezer
  }
}

function drawWorld() {
  noStroke();

  // Platformlar (Faz 6 ramp: gövde ana, üst kenar parlak, alt kenar gölge)
  for (const p of platforms) drawPlatform(p);

  // Top (Faz 4: squash/stretch drawBall içinde)
  drawBall();

  // Üstteki sabit diken şeridi - tepe noktası aşağı bakan üçgenler dizisi.
  drawPulseTelegraph();
  for (let i = 0; i < SPIKE_COUNT; i++) drawSpike(i);
}

// Diken i: gölge (#4a0e0e) tam üçgen = Faz 2 gövde geometrisi; ana kırmızı (#c81d25)
// yan yüzlerden SPIKE_MAIN_INSET içeride ve uçtan SPIKE_NECK_PX önce biten iç üçgen;
// uç (#ff6a3d) tepe noktasındaki 3x3 px tam sayı blok = Faz 2 ölümcül bölge
// (tepe noktasına <= SPIKE_TIP_LETHAL_R). Uç bloğu daima en son (en üstte) çizilir.
function drawSpike(i) {
  const x0 = i * SPIKE_W;
  const tx = spikeTipX(i);
  const ty = spikeTipY(i);
  fill(PAL.spikeShadow);
  triangle(x0, 0, x0 + SPIKE_W, 0, tx, ty);
  fill(PAL.spikeMain);
  triangle(x0 + SPIKE_MAIN_INSET, 0, x0 + SPIKE_W - SPIKE_MAIN_INSET, 0, tx, ty - SPIKE_NECK_PX);
  fill(PAL.spikeTip);
  rect(Math.floor(tx) - 1, Math.round(ty) - SPIKE_TIP_PX, SPIKE_TIP_PX, SPIKE_TIP_PX);
}

// Pulse telegraph'ı: inecek bölümün altına (iniş mesafesi kadar) %25 Bayer kırmızı gölge.
// Mevcut bay() formülü + şeffaf desen; uçların 1px geri çekilmesi ve toz ayrıca var.
function drawPulseTelegraph() {
  if (!pulse || pulse.phase !== 'telegraph') return;
  const x = pulse.start * SPIKE_W, w = pulse.len * SPIKE_W;
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, SPIKE_STRIP_H, w, PULSE_DROP_PX);
  drawingContext.clip();
  image(getPatternImage(DITHER_LV_MIN, PAL.spikeShadow), 0, 0);
  drawingContext.restore();
}

function drawPlatform(p) {
  const x = Math.round(p.x), y = Math.round(p.y), w = Math.round(p.w), h = p.h;
  if (p.kind === 'fragile') {
    // Ayırt edici gölgeleme: gövde GÖLGE tonu (sağlamlar ana ton), üst kenar ana ton,
    // koyu çatlak çizgileri. Temastan sonra 1px titrer ve çatlaklar uzar.
    const jx = p.crackT !== null ? (Math.floor(p.crackT * 30) % 2 ? 1 : -1) : 0;
    fill(PAL.platShadow);
    rect(x + jx, y, w, h);
    fill(PAL.platMain);
    rect(x + jx, y, w, 2);
    fill(PAL.bgLo);
    const grow = p.crackT !== null ? Math.min(1, p.crackT / FRAGILE_BREAK_S) : 0;
    for (const cx of p.cracks) {
      const len = Math.round(5 + grow * (h - 5));
      rect(x + jx + cx, y, 1, len);
      rect(x + jx + cx + 1, y + Math.min(h - 1, len - 1), 2, 1);
    }
    return;
  }
  fill(PAL.platMain);
  rect(x, y, w, h);
  fill(PAL.platLight);
  rect(x, y, w, 2);
  fill(PAL.platShadow);
  rect(x, y + h - 2, w, 2);
  if (p.kind === 'moving') {
    // Hareketli: iki uçta parlak "ray" işaretleri (<> okunur), sabitlerden ayrışır.
    fill(PAL.platLight);
    rect(x + 3, y + 4, 2, 4);
    rect(x + w - 5, y + 4, 2, 4);
  }
}

// Faz 4 (karar #3, §8.1.2): çarpan büyüdükçe yazı büyür + kontur kalınlaşır
// ("parlama" = daha fazla dolu piksel). x1'de Faz 1-3 ile birebir aynı. Faz 6: #f2ead1.
function getHudStyle() {
  const step = JUICE.hudGrow ? Math.max(0, multiplier - 1) : 0;
  return {
    size: HUD_BASE_SIZE + step * HUD_SIZE_PER_STEP,
    stroke: step * HUD_STROKE_PER_STEP
  };
}

function drawScore() {
  const hud = getHudStyle();
  fill(PAL.hud);
  if (hud.stroke > 0) {
    stroke(PAL.hud);
    strokeWeight(hud.stroke);
  } else {
    noStroke();
  }
  textSize(hud.size);
  textAlign(LEFT, TOP);
  // Sayaç diken şeridinin hemen altında, ekranın üst köşesinde.
  text(Math.floor(score) + '  x' + multiplier, 10, SPIKE_STRIP_H + 6);
  noStroke();
}

function drawGameOver() {
  fill(PAL.hud);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 30);
  textSize(20);
  text('SKOR: ' + Math.floor(score), CANVAS_W / 2, CANVAS_H / 2 + 5);
  textSize(14);
  text(IS_TOUCH_DEVICE ? 'Yeniden başlamak için dokun' : 'Yeniden başlamak için BOŞLUK ya da tıkla',
       CANVAS_W / 2, CANVAS_H / 2 + 35);
}

// --- Mobil dokunmatik ipucu ---
// Her koşunun ilk 3 sn'si: alt yarıda sol/sağ bölgeyi ayıran kesikli soluk çizgi +
// iki yanda küçük piksel ok. Son 1 sn'de kademeli (retro, 4 basamak) söner.
function drawTouchHint() {
  if (touchHintMs <= 0) return;
  if (gameState === 'playing') touchHintMs -= deltaTime; // gerçek süre (düşük FPS'te de 3 sn)
  const t = Math.min(1, Math.max(0, touchHintMs) / TOUCH_HINT_FADE_MS); // 1 -> 0
  const a = Math.ceil(t * 4) / 4 * 90; // en fazla ~%35 opaklık, 4 basamakta söner
  if (a <= 0) return;
  const c = color(PAL.hud);
  c.setAlpha(a);
  noStroke();
  fill(c);
  // Kesikli orta çizgi (alt yarı): 2px genişlik, 6 dolu / 6 boş
  const x0 = CANVAS_W / 2 - 1;
  for (let y = CANVAS_H / 2; y < CANVAS_H - 12; y += 12) rect(x0, y, 2, 6);
  // Piksel oklar: her bölgenin ortasında, 2px basamaklı üçgen
  const ay = Math.round(CANVAS_H * 0.78);
  for (let i = 0; i < 6; i++) {
    const h = 2 + i * 4; // sütun yüksekliği uca doğru azalır
    rect(CANVAS_W * 0.25 - 6 + i * 2, ay - h / 2, 2, h);         // ◀ (uç solda)
    rect(CANVAS_W * 0.75 + 4 - i * 2, ay - h / 2, 2, h);         // ▶ (uç sağda)
  }
  textAlign(CENTER, TOP);
  textSize(11);
  text('BASILI TUT', CANVAS_W * 0.25, ay + 18);
  text('BASILI TUT', CANVAS_W * 0.75, ay + 18);
}

// --- Mobil dokunmatik kontrol ---
// Yön, ekranın (pencerenin) sol/sağ yarısına göre belirlenir; canvas ortalandığı için
// orta çizgi canvas ortasıyla çakışır, canvas dışı siyah kenarlar da dokunma alanıdır.
// En son basılan ve hâlâ basılı olan parmak kazanır (touchOrder'ın sonu).
function touchSide(clientX) {
  return clientX < window.innerWidth / 2 ? -1 : 1;
}

function updateTouchDir(e) {
  const live = new Map();
  if (e && e.touches) {
    for (const t of e.touches) live.set(t.identifier, t.clientX);
  }
  touchOrder = touchOrder.filter(id => live.has(id));
  touchDir = touchOrder.length ? touchSide(live.get(touchOrder[touchOrder.length - 1])) : 0;
}

function touchStarted(e) {
  unlockAudio(); // Faz 5 autoplay (Chrome); iOS için touchEnded'de de çağrılır
  if (gameState === 'gameover') {
    // GAME OVER yazısı göründükten sonra dokunuş yeniden başlatır. Bu parmak yöne
    // sayılmaz (yeni koşu, bırakılana kadar topu kendiliğinden sürüklemesin).
    if (hitstopMs <= 0) resetGame();
    updateTouchDir(e);
    return false;
  }
  if (e && e.changedTouches) {
    for (const t of e.changedTouches) {
      if (!touchOrder.includes(t.identifier)) touchOrder.push(t.identifier);
    }
  }
  updateTouchDir(e);
  return false; // preventDefault: scroll/zoom/taklit mouse olayları olmasın
}

function touchMoved(e) {
  updateTouchDir(e); // parmak orta çizgiyi geçerse yön değişir
  return false;
}

function touchEnded(e) {
  unlockAudio(); // iOS Safari: AudioContext ancak touchend gibi bir jestte açılır
  updateTouchDir(e);
  return false;
}

// p5 touchcancel dinlemiyor; sistem jesti/odak kaybında yön takılı kalmasın.
if (typeof window !== 'undefined') {
  window.addEventListener('touchcancel', e => updateTouchDir(e));
  window.addEventListener('blur', () => { touchOrder = []; touchDir = 0; });
}

function keyPressed() {
  unlockAudio(); // Faz 5: autoplay politikası - ilk etkileşimde AudioContext kur/resume
  if (key === 'm' || key === 'M') toggleMute(); // Faz 5: genel ses kapat/aç
  if (gameState === 'gameover' && key === ' ') {
    resetGame();
  }
}

function mousePressed() {
  unlockAudio(); // Faz 5: autoplay politikası
  if (gameState === 'gameover') {
    resetGame();
  }
}
