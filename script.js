// ===== 음식 룰렛 (오늘 뭐 먹지?) =====
"use strict";

// ---- 프리셋 데이터 ----
const PRESETS = {
  korean: ["김치찌개", "된장찌개", "비빔밥", "불고기", "삼겹살", "제육볶음", "순두부찌개", "냉면"],
  chinese: ["짜장면", "짬뽕", "탕수육", "마라탕", "볶음밥", "깐풍기", "양장피", "마파두부"],
  japanese: ["초밥", "라멘", "우동", "돈카츠", "규동", "텐동", "오니기리", "소바"],
  western: ["파스타", "피자", "스테이크", "햄버거", "리조또", "샐러드", "오믈렛", "감바스"],
  snack: ["떡볶이", "김밥", "순대", "튀김", "라면", "쫄면", "어묵", "만두"],
  any: ["치킨", "피자", "초밥", "국밥", "샐러드", "버거", "파스타", "마라탕", "쌀국수", "돈카츠"],
};

const MAX_MENUS = 12;
const STORE_KEYS = {
  menus: "food-roulette:menus",
  history: "food-roulette:history",
  sound: "food-roulette:sound",
};

// ---- 상태 ----
let menus = [];
let history = [];
let soundOn = true;
let rotation = 0; // 라디안
let spinning = false;
let lastTickIndex = -1;

// ---- DOM ----
const chipsEl = document.getElementById("chips");
const historyEl = document.getElementById("history");
const inputEl = document.getElementById("menuInput");
const addForm = document.getElementById("addForm");
const spinBtn = document.getElementById("spinBtn");
const soundToggle = document.getElementById("soundToggle");
const resultEl = document.getElementById("result");
const resultMenuEl = document.getElementById("resultMenu");
const respinBtn = document.getElementById("respinBtn");
const findBtn = document.getElementById("findBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// ---- Canvas ----
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const SIZE = canvas.width; // 320
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = SIZE / 2 - 8;

const confettiCanvas = document.getElementById("confetti");
const confettiCtx = confettiCanvas.getContext("2d");

// ===== 저장/복원 =====
function save() {
  try {
    localStorage.setItem(STORE_KEYS.menus, JSON.stringify(menus));
    localStorage.setItem(STORE_KEYS.history, JSON.stringify(history));
    localStorage.setItem(STORE_KEYS.sound, JSON.stringify(soundOn));
  } catch (e) {
    /* 저장 불가(시크릿 모드 등) 무시 */
  }
}

function load() {
  try {
    const m = JSON.parse(localStorage.getItem(STORE_KEYS.menus) || "null");
    const h = JSON.parse(localStorage.getItem(STORE_KEYS.history) || "null");
    const s = JSON.parse(localStorage.getItem(STORE_KEYS.sound) || "null");
    if (Array.isArray(m) && m.length) menus = m;
    if (Array.isArray(h)) history = h;
    if (typeof s === "boolean") soundOn = s;
  } catch (e) {
    /* 무시 */
  }
  if (!menus.length) menus = [...PRESETS.korean];
}

// ===== 렌더링 =====
function renderChips() {
  chipsEl.innerHTML = "";
  if (!menus.length) {
    const span = document.createElement("span");
    span.className = "chips-empty";
    span.textContent = "메뉴가 비어있어요. 프리셋을 누르거나 직접 추가하세요.";
    chipsEl.appendChild(span);
    return;
  }
  menus.forEach((name, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    const label = document.createElement("span");
    label.textContent = name;
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", name + " 삭제");
    del.addEventListener("click", () => removeMenu(i));
    chip.append(label, del);
    chipsEl.appendChild(chip);
  });
}

function renderHistory() {
  historyEl.innerHTML = "";
  if (!history.length) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = "아직 기록이 없어요.";
    historyEl.appendChild(li);
    return;
  }
  history.forEach((h) => {
    const li = document.createElement("li");
    const menu = document.createElement("span");
    menu.className = "h-menu";
    menu.textContent = h.menu;
    const time = document.createElement("span");
    time.className = "h-time";
    time.textContent = h.time;
    li.append(menu, time);
    historyEl.appendChild(li);
  });
}

function updateSpinAvailability() {
  spinBtn.disabled = spinning || menus.length < 2;
  spinBtn.textContent = menus.length < 2 ? "메뉴 2개 이상 필요" : "돌리기 🎯";
}

function renderAll() {
  renderChips();
  renderHistory();
  updateSpinAvailability();
  drawWheel();
}

// ===== 휠 그리기 =====
function truncateLabel(name) {
  return name.length > 6 ? name.slice(0, 6) + "…" : name;
}

function drawWheel() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  const n = menus.length;

  if (n === 0) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#f3ecf3";
    ctx.fill();
    ctx.fillStyle = "#aaa0b2";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("메뉴를 추가하세요", 0, 0);
    ctx.restore();
    return;
  }

  const seg = (Math.PI * 2) / n;
  const labelSize = n > 9 ? 12 : n > 6 ? 13 : 15;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(rotation);
  for (let i = 0; i < n; i++) {
    const start = i * seg;
    const end = start + seg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, RADIUS, start, end);
    ctx.closePath();
    ctx.fillStyle = `hsl(${Math.round((i * 360) / n)} 68% 82%)`;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + seg / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#6b6275";
    ctx.font = `bold ${labelSize}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
    ctx.fillText(truncateLabel(menus[i]), RADIUS - 12, 0);
    ctx.restore();
  }
  ctx.restore();

  // 가운데 허브
  ctx.beginPath();
  ctx.arc(CX, CY, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#f4757f";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// 현재 회전각에서 포인터가 가리키는 섹터 인덱스 (로직은 lib/pointer.js 공용)
function pointerIndex() {
  return RouletteMath.pointerIndex(rotation, menus.length);
}

// ===== 스핀 =====
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spin() {
  if (spinning || menus.length < 2) return;
  spinning = true;
  hideResult();
  updateSpinAvailability();
  ensureAudio();

  const duration = 4000;
  const startRotation = rotation;
  // 5~8바퀴 + 랜덤 오프셋 → 멈추는 위치는 회전 후 계산
  const spinAmount = Math.PI * 2 * (5 + Math.random() * 3) + Math.random() * Math.PI * 2;
  const startTime = performance.now();
  lastTickIndex = pointerIndex();

  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    rotation = startRotation + spinAmount * easeOutCubic(t);
    drawWheel();

    const idx = pointerIndex();
    if (idx !== lastTickIndex) {
      lastTickIndex = idx;
      if (soundOn) playTick();
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      finishSpin();
    }
  }
  requestAnimationFrame(frame);
}

function finishSpin() {
  spinning = false;
  rotation = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); // 정규화
  updateSpinAvailability();

  const idx = pointerIndex();
  const winner = menus[idx];
  showResult(winner);
  addHistory(winner);
  launchConfetti();
  if (soundOn) playFanfare();
}

// ===== 결과 =====
function showResult(menu) {
  resultMenuEl.textContent = menu;
  resultEl.classList.remove("hidden");
  resultEl.dataset.menu = menu;
  // 애니메이션 리트리거
  resultEl.style.animation = "none";
  void resultEl.offsetWidth;
  resultEl.style.animation = "";
}

function hideResult() {
  resultEl.classList.add("hidden");
}

function addHistory(menu) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  history.unshift({ menu, time });
  if (history.length > 20) history.length = 20;
  renderHistory();
  save();
}

// ===== 메뉴 추가/삭제/프리셋 =====
function addMenu(name) {
  name = name.trim();
  if (!name) return;
  if (menus.length >= MAX_MENUS) {
    flashInput(`메뉴는 최대 ${MAX_MENUS}개까지예요`);
    return;
  }
  if (menus.includes(name)) {
    flashInput("이미 있는 메뉴예요");
    return;
  }
  menus.push(name);
  renderAll();
  save();
}

function removeMenu(i) {
  menus.splice(i, 1);
  renderAll();
  save();
}

function applyPreset(category) {
  const set = PRESETS[category];
  if (!set) return;
  menus = [...set];
  hideResult();
  renderAll();
  save();
}

function flashInput(msg) {
  const original = inputEl.placeholder;
  inputEl.value = "";
  inputEl.placeholder = msg;
  inputEl.classList.add("flash");
  setTimeout(() => {
    inputEl.placeholder = original;
    inputEl.classList.remove("flash");
  }, 1400);
}

// ===== 근처 식당 찾기 =====
function findNearby() {
  const menu = resultEl.dataset.menu;
  if (!menu) return;
  const url = "https://map.naver.com/p/search/" + encodeURIComponent(menu);
  window.open(url, "_blank", "noopener");
}

// ===== 사운드 (WebAudio) =====
let audioCtx = null;
function ensureAudio() {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {
    audioCtx = null;
  }
}

function beep(freq, start, dur, type = "sine", vol = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

function playTick() {
  if (!audioCtx) return;
  beep(880, audioCtx.currentTime, 0.05, "square", 0.05);
}

function playFanfare() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    beep(f, t + i * 0.12, 0.22, "triangle", 0.18);
  });
}

// ===== 컨페티 =====
let confettiParticles = [];
let confettiRAF = null;

function launchConfetti() {
  const w = (confettiCanvas.width = window.innerWidth);
  const h = (confettiCanvas.height = window.innerHeight);
  const colors = ["#ffb3c1", "#ffd6a5", "#fdffb6", "#caffbf", "#a0c4ff", "#bdb2ff", "#ffc6ff"];
  confettiParticles = [];
  for (let i = 0; i < 110; i++) {
    confettiParticles.push({
      x: w / 2,
      y: h * 0.32,
      vx: (Math.random() - 0.5) * 11,
      vy: Math.random() * -11 - 3,
      size: 5 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
  animateConfetti();
}

function animateConfetti() {
  const w = confettiCanvas.width;
  const h = confettiCanvas.height;
  confettiCtx.clearRect(0, 0, w, h);
  let alive = false;
  confettiParticles.forEach((p) => {
    p.vy += 0.32; // 중력
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.life -= 0.012;
    if (p.life > 0 && p.y < h + 20) {
      alive = true;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(p.life, 0);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      confettiCtx.restore();
    }
  });
  if (alive) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, w, h);
    confettiRAF = null;
  }
}

// ===== 이벤트 바인딩 =====
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addMenu(inputEl.value);
  inputEl.value = "";
  inputEl.focus();
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.category));
});

spinBtn.addEventListener("click", spin);
respinBtn.addEventListener("click", spin);
findBtn.addEventListener("click", findNearby);

soundToggle.addEventListener("change", () => {
  soundOn = soundToggle.checked;
  if (soundOn) ensureAudio();
  save();
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  renderHistory();
  save();
});

// ===== 초기화 =====
function init() {
  load();
  soundToggle.checked = soundOn;
  renderAll();
}
init();
