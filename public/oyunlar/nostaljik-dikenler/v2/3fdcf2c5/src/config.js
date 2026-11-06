// Düşen Top v2, Faz A: tüm oyun sabitleri tek yerde (TASARIM-v2.md §2.2, §3, §12).
//
// Ölçek yöntemi (§2.2): v1 (400x600) -> 360x640 eksen düzeltmesi (genişlik x0.9, yükseklik
// x1.0667) -> kamera x0.65 (izotropik). §2.2 tablosundaki sabitler BİREBİR alındı; tabloda
// olmayan v1 sabitleri aynı yöntemle türetildi (formül her satırın yanında).
// Fizik/çarpışma HER ZAMAN bu dünya birimleriyle çalışır; x0.5 kamera yalnız çizim ölçeğidir.

export const V1 = Object.freeze({ // karşılaştırma ve türetme için v1 değerleri (sketch.js)
  CANVAS_W: 400, CANVAS_H: 600, BALL_R: 12, MOVE_SPEED: 230, GRAVITY: 1500,
  MAX_FALL_SPEED: 900, BASE_SCROLL_SPEED: 55, ROW_GAP_BASE: 80, PLATFORM_W_MIN: 60,
  PLATFORM_W_MAX: 110
});

const SX = 0.9 * 0.65;      // yatay mesafe çarpanı (v1 -> v2) = 0.585
const SY = (640 / 600) * 0.65; // dikey mesafe çarpanı (v1 -> v2) ≈ 0.6933

// --- Ekran ve kamera ---
export const LOGICAL_W = 360;           // §2.2: mantıksal çözünürlük, tam 9:16
export const LOGICAL_H = 640;
export const PLAY_W = 360;              // dünya genişliği (wrap periyodu bunun üstüne kurulur)
export const PLAY_H = 640;              // düşüş ölüm çizgisi (dünya y), kameradan bağımsız
export const ZOOM_BASE = 0.65;          // fizik sabitlerinin tanımlandığı kamera ölçeği
export const ZOOM_WIDE = 0.5;           // büyük alan kamerası (yalnız çizim)
export const ZOOM_BLEND_S = 0.5;        // §2.2: 0.4-0.6 sn yumuşak geçiş
// x0.5'te ekranda görünen dünya yüksekliği: 640 / (0.5/0.65) = 832. Üretim ufku bunu kapsar ki
// zoom anında satır "patlaması" olmasın; ufuk kameradan BAĞIMSIZ sabittir (üretim deterministik).
export const VIEW_H_WIDE = LOGICAL_H / (ZOOM_WIDE / ZOOM_BASE);

// --- Top ve hareket (§2.2 tablo, birebir) ---
export const BALL_R = 8;
export const MOVE_SPEED = 137;          // px/sn
export const GRAVITY = 1040;            // px/sn²
export const MAX_FALL_SPEED = 624;      // px/sn
export const HURTBOX_R = 5;
export const BALL_START_Y = Math.round(160 * SY); // v1 160 -> 111

// --- Dünya kayması ve zorluk (§3: v1 zaman eğrisi korunur) ---
export const BASE_SCROLL_SPEED = 38;
export const MAX_SCROLL_SPEED = BASE_SCROLL_SPEED * 3; // 114
export const SPEED_INCREASE_INTERVAL = 13000; // ms
export const SPEED_INCREASE_FACTOR = 1.09;
// Skor: v1 ile saniye başına AYNI puan (çağ eşiği 1250 puan v1 puan hızıyla konuşuldu).
// v1: score += 55 px/sn; v2 dünya kayması 38 px/sn -> her dünya px'i 55/38 puan.
export const SCORE_PER_PX = V1.BASE_SCROLL_SPEED / BASE_SCROLL_SPEED;

// --- Platformlar (§2.2 + §5.0; Fikir 28b ve 30 madde 4: TEK ölçü) ---
// Her oynanabilir platform AYNI genişlikte (48 px, x0.65 sahne) ve aynı kalınlıkta. Zorluk
// genişlikle değil aralık (ROW_GAP), dizilim (yatay kayma alt sınırı, desenler) ve türle verilir.
// Eski 35-64 aralığı ve zorlukla daralma (PLATFORM_W_SHRINK) kaldırıldı.
export const PLATFORM_W = 48;
export const PLATFORM_H = 8;            // çarpışma kalınlığı (yalnız üst yüzey çarpışır, §5.0)
export const PLATFORM_VIS_H = 11;       // görsel toplam kalınlık 10-12 (üst yüzey 7 + sarkan 4), Fikir 30
export const ROW_GAP_BASE = 55;
export const ROW_GAP_VARIANCE_MAX = Math.round(35 * SY); // 24
// Dizilim zorluğu (genişlik daralmasının yerine): Tekli satırda yatay kaymanın alt sınırı
// difficultyT ile 0 -> güvenli erimin %55i. Üst sınır yine 0.75 x X_reach (adillik değişmez).
export const OFFSET_MIN_FRAC_MAX = 0.55;    // sütun kuralı erken |kayma|yı büyüttüğü için 0.4 -> 0.55 (fark korunur)
export const EASY_START_ROWS = 3;
export const EASY_START_OFFSET = Math.round(20 * SX);    // ±12 (eski; kolay merdiven aşağıda)
export const EASY_STEP_MIN = 24;                          // = PLATFORM_W / 2: iki adım bir bant genişliği
export const EASY_STEP_MAX = 27;                          // <= 0.3 x X_reach (27.8)
export const SPAWN_HORIZON = Math.ceil(VIEW_H_WIDE) + ROW_GAP_BASE; // 887
export const CULL_Y = -PLATFORM_H - 20;

// --- Aşama kapısı (§3, v1 Faz 6). Faz A: hareketli platform var, kırılgan Faz B'de açılır ---
export const STAGE_THRESHOLDS_S = [0, 40, 85, 130];
export const STAGE_RAMP_S = 15;
export const MOVING_CHANCE_MAX = 0.30;
export const MOVING_AMP_MIN = Math.round(15 * SX); // 9
export const MOVING_AMP_MAX = Math.round(25 * SX); // 15
export const MOVING_PERIOD_MIN_S = 2;
export const MOVING_PERIOD_MAX_S = 3;
export const FRAGILE_CHANCE_MAX = 0;     // Faz B (§5.1) açar: 0.20

// --- Çoklu şerit desenleri ve adil dizilim (§3, v1 Faz 8, rapor §2.4) ---
// Şerit bölgeleri v1'de ekran oranıydı (400 px'in %4-31'i ...). v2'de x0.65 kamera ekranı dünyaya
// göre %54 GENİŞLETTİĞİ için (360 px = 615 v1-px) ekran oranı korunursa şeritler arası mesafe
// X_reach'i aşar ve İkiz Sahanlık geometrik olarak imkânsızlaşır (ölçüldü: 2481 satırda 0 ikiz).
// Bu yüzden bölgeler v1 geometrisinin dünya birimindeki karşılığıdır: v1 ekranı genişliğinde
// (400 x 0.585 = 234 px) bir bant, önceki satırın merkezini izler (ekran içine kırpılır). Tekli
// satırlar tüm genişliği kullanır. Ölçülen desen oranı (40 koşu, 5 aşama): v2 %65/23/7.6/4.9,
// v1 %60/28/6.7/5.3 (Tekli/Çatal/İkiz/Kenar).
export const LANE_ZONES = { L: [0.04, 0.31], C: [0.34, 0.66], R: [0.69, 0.96] };
export const LANE_BAND_W = V1.CANVAS_W * SX;              // 234
export const ROW_PATTERNS = [
  { id: 1, weight: 45, minStage: 0 }, // Tekli Merkez
  { id: 2, weight: 30, minStage: 0 }, // Asimetrik Çatal (ana + Risk Adası)
  { id: 3, weight: 15, minStage: 1 }, // İkiz Sahanlık
  { id: 4, weight: 10, minStage: 2 }  // Kenar Trampleni (wrap ile)
];
export const ROW_PATTERN_DEBT_MAX = 2;
export const ROW_PATTERN_DEBT_ORDER = [3, 4, 2];
export const ANCHOR_REACH_MARGIN = 0.75;  // §3: Δx_eff <= 0.75 * X_reach (DEĞİŞMEZ)
export const EASY_REACH_MARGIN = 0.3;
export const WRAP_SPAN = PLAY_W + 2 * BALL_R;
export const LANE_EPS = 0.5;
export const LANE_MIN_GAP = Math.round(12 * SX); // 7
// Desen genişlikleri artık hep PLATFORM_W; desenler yalnız konum kuralıyla ayrılır.
export const TWIN_GAP_MIN = Math.round(90 * SX);    // 53 (iki platform kenarı arası boşluk)
export const TWIN_GAP_MAX = Math.round(110 * SX);   // 64
export const EDGE_INSET = Math.round(4 * SX);       // 2 (eski; artık SIDE_CLEAR geçerli, aşağıda)
// Kenar şeridi (Organizer, sanat-3 düzeltme): hiçbir platform (hareket genliği dahil) iki kenardan
// SIDE_CLEAR px içeri girmez. Ağaç gövdesi yarısı ekran dışında bu şeride yaslanır, platform asla
// gövdenin üstüne binmez. Dünya kuralıdır (çağdan bağımsız, iki kenarda simetrik): görsel üretimi değiştirmez.
export const SIDE_CLEAR = 10;
// Sütun kuralı (kesin): ardışık 3 satırda aynı x bandında (merkezler COLUMN_BAND_W içinde) platform
// olmaz, aynı bant en fazla 2 ardışık satır. Kolay başlangıçta da geçerli (en yakın serbest noktaya kayar).
// Merdiven tercihi: art arda COLUMN_WINDOW satırın yatay yayılımı (en sağ - en sol merkez) en az
// LADDER_SPAN_MIN olsun; dar bantta zikzak da uzaktan dikey sütun gibi görünür. Tercih, erim
// içinde yer yoksa uygulanmaz (adillik önce gelir).
export const COLUMN_BAND_W = PLATFORM_W;
export const COLUMN_WINDOW = 6;
export const LADDER_SPAN_MIN = 2 * PLATFORM_W;   // 96 px
// Yatay yayılım: Tekli satır kayma YÖNÜ, son satırlarda (azalan ağırlıkla) en az görülen ekran
// çeyreği hedeflenerek seçilir (hedefe SPREAD_TOWARD olasılıkla, varınca SPREAD_DWELL[çeyrek] satır orada).
// |kayma| aralığı ve adillik (0.75 x X_reach) aynı kalır; yalnız yön ve aralık içi konum seçilir.
export const SPREAD_DECAY = 0.97;           // çeyrek sayımı satır başına azalır (etkin pencere ~33 satır)
export const SPREAD_TOWARD = 0.9;
export const SPREAD_DWELL = [5, 1, 1, 5]; // çeyrek başına kalış (kenarda uzun: geçişte uğranmaz)
export const SPREAD_EDGE_W = 0.6;           // kenar çeyreği sayımı hedef seçiminde x0.6 (kenarlar da dolsun)

// --- Tavan dikenleri (§2.2 SPIKE_W; geometri v1 Faz 2 hitbox mantığı birebir) ---
export const SPIKE_W = 14;
export const SPIKE_STRIP_H = Math.round(30 * SY);   // 21
export const SPIKE_COUNT = Math.ceil(PLAY_W / SPIKE_W) + 1;
export const SPIKE_TIP_LETHAL_R = 1.5;              // v1 2 px; öldürme mesafesi/top oranı ~0.81 (v1 0.83)
export const SPIKE_KILL_DIST = HURTBOX_R + SPIKE_TIP_LETHAL_R; // 6.5
export const SPIKE_PUSH_VX = Math.round(120 * SX);  // 70
export const SPIKE_PUSH_VY = Math.round(120 * SY);  // 83
export const SPIKE_PUSH_DECAY = 0.08;
export const SPIKE_CRUSH_TOL = 2 * 0.65;            // 1.3

// --- Ölüm ve yeniden başlatma (v1 Faz 4 hitstop + Faz 21 dokunmatik düzeltmesi) ---
export const HITSTOP_MS = 40;                       // ölüm donması; bu sürede dokunuş yeniden başlatmaz
export const SQUASH_FRAMES = 1;
export const TOUCH_HINT_MS = 3000;
export const TOUCH_HINT_FADE_MS = 1000;
export const DT_CLAMP_MS = 50;                      // v1 ile aynı kare süresi tavanı

// --- Can sistemi (Fikir 30 madde 5, Rapid Roll / NS-Shaft; SENTEZ öneri 6) ---
// 3 canla başla, kalple en çok 5. Tavan dikeni (uç ya da ezilme) ve ekran altına düşme 1 can.
// Can 0 -> oyun biter. Can kaybında kısa donma, sonra en yakın güvenli platformda 1.5 sn yanıp
// sönen dokunulmazlık (yalnız dikenlere karşı; düşme yine can götürür, bkz. SONUC raporu).
export const LIVES_START = 3;
export const LIVES_MAX = 5;
export const HURT_FREEZE_MS = 140;                  // can kaybı donması (top beyaz, sarsıntı başlar)
export const INVULN_MS = 1500;
export const INVULN_BLINK_MS = 100;                 // yanıp sönme yarım periyodu
// Güvenli platform bandı: dokunulmazlık bittikten sonra en az 1 sn tavana taşınamayacak kadar aşağıda,
// altında en az iki satır kalacak kadar yukarıda.
export const RESPAWN_CEIL_LEAD_S = INVULN_MS / 1000 + 1.3; // +1.3: araya bir hız artışı (x1.09) girse de >= 1 sn pay
export const RESPAWN_MAX_Y = PLAY_H - 2 * ROW_GAP_BASE - 10; // 520
// Kalp (nadir): oyun süresiyle 25-40 sn'de bir, ekran altından gelen yeni satırın ana platformunda.
// Can doluyken çıkmaz (zamanlayıcı HEART_RETRY_S sonra yeniden dener).
export const HEART_INTERVAL_MIN_S = 25;
export const HEART_INTERVAL_MAX_S = 40;
export const HEART_RETRY_S = 5;
export const HEART_LIFT = 7;                        // kalp merkezi platform üstünden yukarı (px)
export const HEART_PICK_R = BALL_R + 4;             // top merkezi ile kalp merkezi arası toplama mesafesi

// --- Rekor çizgisi (Fikir 30 madde 6, SENTEZ öneri 7) ---
// Önceki en iyi skorun dünya derinliği; çizgi dünyaya sabit kayar, skor rekoru geçtiği anda
// RECORD_REF_Y (topun başlangıç yüksekliği) hizasındadır.
export const RECORD_REF_Y = BALL_START_Y;

// --- His (SENTEZ öneri 4; Jonasson-Purho 2012, Nijman 2013, Eiserloh GDC 2016) ---
export const LAND_HITSTOP_MS = 20;                  // inişte kısa durma (aç/kapa: ?inisdur=0|1)
export const LAND_HITSTOP_MIN_VY = 180;             // yalnız gerçek düşüşten inişte (küçük sekmede değil)
export const ROLL_FRAMES_FALLBACK = 1;
export const TRAUMA_HURT = 0.65;
export const TRAUMA_DECAY_PER_S = 1.6;
export const SHAKE_MAX_PX = 7;                      // sarsıntı = SHAKE_MAX_PX * trauma^2 * gürültü
export const SHAKE_MIN_PX = 0.2;                    // bunun altı 0 (sarsıntı biter); üstü en az 1 px
export const TRAIL_MIN_VY = 300;                    // hız izi eşiği (px/sn)

// --- Çağlar (§0, yalnız görsel; Faz A+). Eşikler Yusuf kararı (Fikir 27 madde 3): her 1250 puan ---
export const ERA_COUNT = 4;
export const ERA_THRESHOLDS = [1250, 2500, 3750];   // 8-bit -> 16-bit -> 32-bit -> HD (tavan)
export const ERA_BLEND_S = 0.5;                      // geçici çapraz geçiş; Faz D'de kesik geçiş + flaş
export const ERA_LABELS = ['8-BIT', '16-BIT', '32-BIT', 'HD'];

// --- Kayıt (§12.3): tek JSON blob, sürüm alanlı; v1 anahtarına dokunulmaz ---
export const SAVE_KEY = 'dusenTop.v2.save';
export const SAVE_VERSION = 1;
export const V1_BEST_KEY = 'dusenTop.v1.bestScore'; // yalnız referans: OKUNMAZ, YAZILMAZ

// --- HUD ---
export const HUD_SIZE = 18;
export const HUD_SMALL = 11;
export const MUTE_BTN = { x: LOGICAL_W - 26, y: SPIKE_STRIP_H + 6, w: 20, h: 18 };

// --- Renkler (geçici; v1 tema 0 paleti, §6.1 top/diken renkleri sabit) ---
export const PAL = Object.freeze({
  bgLo: '#030305', bgHi: '#0c0c18',
  // top: üretilmiş top_14x14 sprite'ının renkleri (x0.5 kamerada prosedürel top aynı görünsün) + krem halka
  ballShadow: '#873a31', ballMain: '#f38a21', ballLight: '#fdc536', ballOutline: '#361d20', ballRing: '#fff3c4',
  platShadow: '#15151f', platMain: '#2a2a3a', platLight: '#4a4a5e',
  spikeShadow: '#4a0e0e', spikeMain: '#c81d25', spikeTip: '#ff6a3d',
  hud: '#f2ead1', star: '#3a3a55', abyss: '#000000'
});

export const DERIVED = Object.freeze({ SX, SY });
