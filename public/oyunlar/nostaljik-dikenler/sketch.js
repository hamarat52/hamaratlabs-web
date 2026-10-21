// ============================================================================
// NOSTALJİK DİKENLER - p5.js prototip
// Tamamen siyah-beyaz, tek eksen (yatay) kontrol, dikey hareket otomatik.
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

// --- Oyun durumu (resetGame() içinde dolduruluyor) ---
let ball;
let platforms;
let scrollSpeed;
let score;
let gameState; // 'playing' | 'gameover'
let speedTimer; // son hız artışından bu yana geçen süre (ms)
let lastSpawnY; // en son üretilen satırın y konumu (ekran koordinatı)

function setup() {
  const c = createCanvas(CANVAS_W, CANVAS_H);
  c.parent(document.body);
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
    grounded: true
  };
  platforms = [];
  scrollSpeed = BASE_SCROLL_SPEED;
  score = 0;
  gameState = 'playing';
  speedTimer = 0;

  // İlk platformu topun hemen altına yerleştir (anında düşme olmasın).
  platforms.push({
    x: CANVAS_W / 2 - 50,
    y: ball.y + BALL_R + 2,
    w: 100,
    h: PLATFORM_H
  });
  lastSpawnY = platforms[0].y;

  // Topun altında ekranı dolduracak kadar başlangıç platformu üret,
  // ilk birkaç satırda yatay sapmayı küçük tutarak adil bir başlangıç sağla.
  let prevX = platforms[0].x;
  let prevW = platforms[0].w;
  let rowIndex = 0;
  while (lastSpawnY < CANVAS_H + ROW_GAP_BASE) {
    const easyStart = rowIndex < 3; // ilk satırlarda daha az yatay sapma
    const spawned = spawnRow(prevX, prevW, easyStart);
    prevX = spawned.x;
    prevW = spawned.w;
    rowIndex++;
  }
}

// Bir sonraki platform satırını üretir, fiziksel olarak HER ZAMAN ulaşılabilir
// olacak şekilde (düşüş süresi x yatay hız) yatay sapmayı sınırlar.
function spawnRow(prevX, prevW, easyStart) {
  // Zorluk arttıkça boşluk biraz daha değişken/geniş olabilir.
  const difficultyT = constrain((scrollSpeed - BASE_SCROLL_SPEED) / (MAX_SCROLL_SPEED - BASE_SCROLL_SPEED), 0, 1);
  const rowGap = ROW_GAP_BASE + random(0, ROW_GAP_VARIANCE_MAX * difficultyT);
  const platW = random(PLATFORM_W_MIN, PLATFORM_W_MAX - difficultyT * 20);

  // Serbest düşüşle bu dikey mesafeyi ne kadar sürede aşarız (vy=0'dan başlayarak)?
  const fallTime = Math.sqrt((2 * rowGap) / GRAVITY);
  // Bu sürede yatayda en fazla ne kadar gidebiliriz? + platform genişlikleri toleransı.
  const maxReach = MOVE_SPEED * fallTime + (platW + prevW) / 2;
  // Güvenlik payı bırak (fiziksel sınırın %75'i) - HER ZAMAN geçilebilir boşluk garantisi.
  const safeReach = easyStart ? maxReach * 0.3 : maxReach * 0.75;

  const prevCenter = prevX + prevW / 2;
  const offset = easyStart ? random(-20, 20) : random(-safeReach, safeReach);
  let newCenter = prevCenter + offset;
  let newX = constrain(newCenter - platW / 2, 0, CANVAS_W - platW);

  const newY = lastSpawnY + rowGap;
  platforms.push({ x: newX, y: newY, w: platW, h: PLATFORM_H });
  lastSpawnY = newY;
  return { x: newX, w: platW };
}

function draw() {
  background(0); // tamamen siyah arka plan

  if (gameState === 'playing') {
    updateGame();
  }

  drawWorld();
  drawScore();

  if (gameState === 'gameover') {
    drawGameOver();
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

  // --- Skor: dünyanın toplam yukarı kaydırma mesafesi ---
  score += scrollSpeed * dt;

  // --- Yatay kontrol (SADECE sol/sağ, dikey tamamen otomatik) ---
  let vx = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) vx -= MOVE_SPEED;  // A
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) vx += MOVE_SPEED; // D
  ball.vx = vx;
  ball.x += ball.vx * dt;

  // --- Ekran kenarından wrap (Pac-Man usulü, ani ama basit tek-frame geçiş) ---
  if (ball.x < -BALL_R) ball.x = CANVAS_W + BALL_R;
  if (ball.x > CANVAS_W + BALL_R) ball.x = -BALL_R;

  // --- Tüm platformları yukarı kaydır (dünya kayması) ---
  for (const p of platforms) {
    p.y -= scrollSpeed * dt;
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

    // Platforma iniş kontrolü (sadece düşerken, yukarı hareket ederken değil).
    if (ball.vy >= 0) {
      for (const p of platforms) {
        const ballBottom = ball.y + BALL_R;
        const prevBallBottom = ballBottom - ball.vy * dt;
        const withinX = ball.x + BALL_R > p.x && ball.x - BALL_R < p.x + p.w;
        const crossingTop = prevBallBottom <= p.y && ballBottom >= p.y;
        if (withinX && crossingTop) {
          ball.y = p.y - BALL_R;
          ball.vy = 0;
          ball.grounded = true;
          ball.currentPlatform = p;
          break;
        }
      }
    }
  }

  // --- Eski platformları temizle (ekranın üstünden çıkanlar) ---
  platforms = platforms.filter(p => p.y > -PLATFORM_H - 20);

  // --- Önde yeterli platform olduğundan emin ol (sonsuz, performanslı üretim) ---
  // En son üretilen satırı bul (en büyük y / en alttaki).
  if (platforms.length > 0) {
    let last = platforms[0];
    for (const p of platforms) if (p.y > last.y) last = p;
    while (lastSpawnY < CANVAS_H + ROW_GAP_BASE) {
      spawnRow(last.x, last.w, false);
      last = platforms[platforms.length - 1];
    }
  }

  // --- Kayıp koşulu 1: dikene değme (üstteki sabit diken şeridi) ---
  if (ball.y - BALL_R <= SPIKE_STRIP_H) {
    triggerGameOver();
    return;
  }

  // --- Kayıp koşulu 2: topun merkezi ekranın alt kenarını geçerse ---
  if (ball.y > CANVAS_H) {
    triggerGameOver();
    return;
  }
}

function triggerGameOver() {
  gameState = 'gameover';
}

function drawWorld() {
  noStroke();
  fill(255);

  // Platformlar
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h);
  }

  // Top
  circle(ball.x, ball.y, BALL_R * 2);

  // Üstteki sabit diken şeridi - tepe noktası aşağı bakan üçgenler dizisi.
  const count = Math.ceil(CANVAS_W / SPIKE_W) + 1;
  for (let i = 0; i < count; i++) {
    const x0 = i * SPIKE_W;
    triangle(
      x0, 0,
      x0 + SPIKE_W, 0,
      x0 + SPIKE_W / 2, SPIKE_STRIP_H
    );
  }
}

function drawScore() {
  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  // Sayaç diken şeridinin hemen altında, ekranın üst köşesinde.
  text(Math.floor(score), 10, SPIKE_STRIP_H + 6);
}

function drawGameOver() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 30);
  textSize(20);
  text('SKOR: ' + Math.floor(score), CANVAS_W / 2, CANVAS_H / 2 + 5);
  textSize(14);
  text('Yeniden başlamak için BOŞLUK ya da tıkla', CANVAS_W / 2, CANVAS_H / 2 + 35);
}

function keyPressed() {
  if (gameState === 'gameover' && key === ' ') {
    resetGame();
  }
}

function mousePressed() {
  if (gameState === 'gameover') {
    resetGame();
  }
}
