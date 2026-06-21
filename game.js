/* ============================================================
   モホレカ (Mhoreka) — モンハンNow風 位置ゲーム MVP
   - 実GPSは使わず、ゲーム内マップをタップで歩く
   - モンスターに近づくと戦闘 → 攻撃/回避 → 素材ドロップ → 武器強化
   ============================================================ */

// ---- 定数 ----
const TILE = 64;                 // マップの1マスのピクセル
const PLAYER_SPEED = 3.4;        // 1フレームの移動量
const ENCOUNTER_DIST = 36;       // この距離まで近づくと戦闘
const MONSTER_COUNT = 7;         // マップ上の同時出現数
const MONSTER_SPREAD = 360;      // モンスターをばらまく範囲（プレイヤー中心）
const MONSTER_MIN_DIST = 130;    // モンスターが湧く最短距離

// interval=攻撃間隔(ms) / tele=回避受付の長さ(ms)。小さいほど手強い。
const MONSTER_TYPES = [
  { emoji: "🐗", name: "ドスイノシシ", hp: 40,  atk: 8,  mats: 2, interval: 2200, tele: 800 },
  { emoji: "🦖", name: "リオレウス",   hp: 90,  atk: 16, mats: 4, interval: 1800, tele: 650 },
  { emoji: "🐉", name: "古龍",         hp: 140, atk: 22, mats: 6, interval: 2000, tele: 700 },
  { emoji: "🦂", name: "ガミザミ",     hp: 55,  atk: 12, mats: 3, interval: 1500, tele: 560 },
  { emoji: "🦇", name: "ギエナ",       hp: 35,  atk: 10, mats: 2, interval: 1300, tele: 520 },
];

// ---- 戦闘バランス ----
const DODGE_INVULN = 600;   // 回避の無敵時間(ms)
const JUST_WINDOW  = 300;   // 着弾直前これ以内に回避＝ジャスト回避
const CRIT_MULT    = 2.5;   // 弱点ヒットの会心倍率
const ENRAGE_HP    = 0.4;   // この割合以下で怒り状態
const ENRAGE_SPEED = 0.6;   // 怒り時の攻撃間隔倍率（速くなる）
const ENRAGE_DMG   = 1.4;   // 怒り時の被ダメ倍率

// ---- ゲーム状態 ----
const player = {
  x: 0, y: 0,            // ワールド座標
  hp: 100, maxHp: 100,
  atk: 14,
  weaponLevel: 1,
  materials: 0,
  kills: 0,              // 累計討伐数
};

// ---- セーブ / ロード（localStorage に進行を保存）----
const SAVE_KEY = "mhoreka-save-v1";
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hp: player.hp, maxHp: player.maxHp, atk: player.atk,
      weaponLevel: player.weaponLevel, materials: player.materials,
      kills: player.kills,
    }));
  } catch (e) { /* プライベートモード等は無視 */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    player.maxHp = s.maxHp ?? player.maxHp;
    player.hp = s.hp ?? player.hp;
    player.atk = s.atk ?? player.atk;
    player.weaponLevel = s.weaponLevel ?? player.weaponLevel;
    player.materials = s.materials ?? player.materials;
    player.kills = s.kills ?? player.kills;
  } catch (e) { /* 壊れたデータは無視 */ }
}
function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

let moveTarget = null;   // {x, y} 目的地
let monsters = [];       // マップ上のモンスター
let mode = "map";        // "map" | "battle"
let battle = null;       // 戦闘中の状態

// ---- DOM ----
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const el = {
  weaponLv: document.getElementById("weapon-lv"),
  materials: document.getElementById("materials"),
  kills: document.getElementById("kills"),
  killsItem: document.getElementById("kills-item"),
  playerHpText: document.getElementById("player-hp-text"),
  upgradeBtn: document.getElementById("upgrade-btn"),
  battle: document.getElementById("battle"),
  monsterEmoji: document.getElementById("monster-emoji"),
  monsterName: document.getElementById("monster-name"),
  monsterHp: document.getElementById("monster-hp"),
  monsterTelegraph: document.getElementById("monster-telegraph"),
  weakPoint: document.getElementById("weak-point"),
  battlePlayerHp: document.getElementById("battle-player-hp"),
  hunterEmoji: document.getElementById("hunter-emoji"),
  attackBtn: document.getElementById("attack-btn"),
  dodgeBtn: document.getElementById("dodge-btn"),
  battleLog: document.getElementById("battle-log"),
  toast: document.getElementById("toast"),
};

// ---- 画面サイズ ----
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// ---- モンスター生成 ----
function spawnMonster() {
  const t = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
  const angle = Math.random() * Math.PI * 2;
  const dist = MONSTER_MIN_DIST + Math.random() * MONSTER_SPREAD;
  return {
    ...t,
    maxHp: t.hp,
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    bob: Math.random() * Math.PI * 2,
  };
}
function refillMonsters() {
  while (monsters.length < MONSTER_COUNT) monsters.push(spawnMonster());
}
refillMonsters();

// ---- 入力: タップで移動 ----
function screenToWorld(sx, sy) {
  return {
    x: player.x + (sx - window.innerWidth / 2),
    y: player.y + (sy - window.innerHeight / 2),
  };
}
canvas.addEventListener("pointerdown", (e) => {
  if (mode !== "map") return;
  moveTarget = screenToWorld(e.clientX, e.clientY);
});

// ---- メインループ ----
let lastT = performance.now();
function loop(now) {
  const dt = Math.min((now - lastT) / 16.67, 3); // フレーム正規化
  lastT = now;
  if (mode === "map") updateMap(dt);
  render();
  requestAnimationFrame(loop);
}

function updateMap(dt) {
  // プレイヤー移動
  if (moveTarget) {
    const dx = moveTarget.x - player.x;
    const dy = moveTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      moveTarget = null;
    } else {
      const step = Math.min(PLAYER_SPEED * dt, d);
      player.x += (dx / d) * step;
      player.y += (dy / d) * step;
    }
  }
  // 遭遇判定
  for (const m of monsters) {
    if (Math.hypot(m.x - player.x, m.y - player.y) < ENCOUNTER_DIST) {
      startBattle(m);
      break;
    }
  }
}

// ---- 描画 ----
function render() {
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W / 2, cy = H / 2;

  // 背景（草原）
  ctx.fillStyle = "#2f4a37";
  ctx.fillRect(0, 0, W, H);

  // グリッド（移動感を出す）
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const ox = -(player.x % TILE), oy = -(player.y % TILE);
  for (let x = ox; x < W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = oy; y < H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // 目的地マーカー
  if (moveTarget) {
    const tx = cx + (moveTarget.x - player.x);
    const ty = cy + (moveTarget.y - player.y);
    ctx.strokeStyle = "rgba(232,163,61,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tx, ty, 10, 0, Math.PI * 2); ctx.stroke();
  }

  // モンスター
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const t = performance.now() / 500;
  for (const m of monsters) {
    const mx = cx + (m.x - player.x);
    const my = cy + (m.y - player.y) + Math.sin(t + m.bob) * 4;
    if (mx < -60 || mx > W + 60 || my < -60 || my > H + 60) continue;
    // 索敵リング
    ctx.strokeStyle = "rgba(224,90,74,0.25)";
    ctx.beginPath(); ctx.arc(mx, my, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "40px serif";
    ctx.fillText(m.emoji, mx, my);
  }

  // プレイヤー（常に中央）
  ctx.fillStyle = "rgba(77,184,164,0.3)";
  ctx.beginPath(); ctx.arc(cx, cy, ENCOUNTER_DIST, 0, Math.PI * 2); ctx.fill();
  ctx.font = "42px serif";
  ctx.fillText("🧭", cx, cy);
}

// ============================================================
//  戦闘
// ============================================================
function startBattle(monster) {
  mode = "battle";
  moveTarget = null;
  battle = {
    monster,
    hp: monster.maxHp,
    dodging: false,
    dodgePressedAt: 0,
    weakActive: false,     // 弱点が露出中か
    counterReady: false,   // ジャスト回避後の反撃チャンス
    enraged: false,        // 怒り状態
    attackTimer: null,
    telegraphTimer: null,
    weakTimer: null,
    over: false,
  };
  el.monsterEmoji.textContent = monster.emoji;
  el.monsterEmoji.classList.remove("enraged", "weak");
  el.monsterName.textContent = monster.name;
  el.weakPoint.classList.add("hidden");
  el.battle.classList.remove("hidden");
  el.battleLog.textContent = `${monster.name} が現れた！ 弱点(🎯)を狙え`;
  updateBattleBars();
  scheduleMonsterAttack();
  scheduleWeakPoint();
}

// ---- 弱点露出のサイクル ----
function scheduleWeakPoint() {
  if (!battle || battle.over) return;
  const wait = (battle.enraged ? 1400 : 2600) + Math.random() * 1500;
  battle.weakTimer = setTimeout(() => {
    if (!battle || battle.over) return;
    battle.weakActive = true;
    el.weakPoint.classList.remove("hidden");
    el.monsterEmoji.classList.add("weak");
    // 露出時間（怒り時は長め＝チャンス）
    const dur = battle.enraged ? 2000 : 1500;
    battle.weakTimer = setTimeout(() => {
      if (!battle || battle.over) return;
      hideWeak();
      scheduleWeakPoint();
    }, dur);
  }, wait);
}
function hideWeak() {
  battle.weakActive = false;
  el.weakPoint.classList.add("hidden");
  el.monsterEmoji.classList.remove("weak");
}

// ---- モンスターの攻撃サイクル ----
function scheduleMonsterAttack() {
  if (!battle || battle.over) return;
  let interval = battle.monster.interval + Math.random() * 600;
  if (battle.enraged) interval *= ENRAGE_SPEED;
  battle.attackTimer = setTimeout(() => {
    if (!battle || battle.over) return;
    // 予告（この間に回避する）
    el.monsterTelegraph.classList.remove("hidden");
    battle.telegraphTimer = setTimeout(() => {
      if (!battle || battle.over) return;
      el.monsterTelegraph.classList.add("hidden");
      resolveMonsterHit();
      scheduleMonsterAttack();
    }, battle.monster.tele);
  }, interval);
}

function resolveMonsterHit() {
  const sinceDodge = performance.now() - battle.dodgePressedAt;
  if (battle.dodging && sinceDodge <= JUST_WINDOW) {
    // ジャスト回避！ → 反撃チャンス
    battle.counterReady = true;
    el.battleLog.textContent = "⚡ ジャスト回避！ 反撃チャンス！";
    flash(el.hunterEmoji, "just");
  } else if (battle.dodging) {
    el.battleLog.textContent = "回避成功";
  } else {
    let dmg = battle.monster.atk;
    if (battle.enraged) dmg = Math.round(dmg * ENRAGE_DMG);
    player.hp = Math.max(0, player.hp - dmg);
    el.battleLog.textContent = `${dmg} のダメージを受けた！`;
    flash(el.monsterEmoji);
    updateHud();
    updateBattleBars();
    if (player.hp <= 0) return playerDown();
  }
}

// ---- プレイヤーの攻撃 ----
el.attackBtn.addEventListener("click", () => {
  if (!battle || battle.over) return;
  let dmg = player.atk;
  let label = `${dmg} のダメージ`;
  let crit = false;

  if (battle.counterReady) {            // ジャスト回避からの反撃
    dmg = Math.round(dmg * CRIT_MULT);
    label = `反撃！ ${dmg} の大ダメージ！`;
    crit = true;
    battle.counterReady = false;
  } else if (battle.weakActive) {       // 弱点ヒット＝会心
    dmg = Math.round(dmg * CRIT_MULT);
    label = `会心の一撃！ ${dmg} ダメージ！`;
    crit = true;
    hideWeak();
  }

  battle.hp = Math.max(0, battle.hp - dmg);
  el.battleLog.textContent = label;
  flash(el.monsterEmoji, crit ? "crit" : "hit");
  updateBattleBars();
  maybeEnrage();
  if (battle.hp <= 0) monsterDown();
});

// ---- 回避 ----
el.dodgeBtn.addEventListener("click", () => {
  if (!battle || battle.over) return;
  battle.dodging = true;
  battle.dodgePressedAt = performance.now();
  el.hunterEmoji.classList.add("dodging");
  setTimeout(() => {
    if (!battle) return;
    battle.dodging = false;
    el.hunterEmoji.classList.remove("dodging");
  }, DODGE_INVULN);
});

// ---- 怒り状態への移行 ----
function maybeEnrage() {
  if (battle.enraged) return;
  if (battle.hp / battle.monster.maxHp <= ENRAGE_HP && battle.hp > 0) {
    battle.enraged = true;
    el.monsterEmoji.classList.add("enraged");
    showToast("🔥 怒り状態！\n攻撃が激しくなるが弱点が出やすい");
  }
}

function monsterDown() {
  endBattle();
  player.materials += battle.monster.mats;
  player.kills++;
  // 倒したモンスターをマップから除去 → 補充
  monsters = monsters.filter((m) => m !== battle.monster);
  refillMonsters();
  updateHud();
  save();
  showToast(`🎉 ${battle.monster.name} を討伐！\n素材 🪨 +${battle.monster.mats}`);
  battle = null;
}

function playerDown() {
  endBattle();
  player.hp = player.maxHp; // 力尽きたら全回復してキャンプに帰還
  updateHud();
  save();
  showToast("💤 力尽きた…\nキャンプで回復した");
  battle = null;
}

function endBattle() {
  battle.over = true;
  clearTimeout(battle.attackTimer);
  clearTimeout(battle.telegraphTimer);
  clearTimeout(battle.weakTimer);
  el.monsterTelegraph.classList.add("hidden");
  el.weakPoint.classList.add("hidden");
  el.monsterEmoji.classList.remove("enraged", "weak");
  el.battle.classList.add("hidden");
  mode = "map";
}

function updateBattleBars() {
  el.monsterHp.style.width = (battle.hp / battle.monster.maxHp) * 100 + "%";
  el.battlePlayerHp.style.width = (player.hp / player.maxHp) * 100 + "%";
}

// ============================================================
//  HUD / 強化
// ============================================================
function updateHud() {
  el.weaponLv.textContent = "Lv." + player.weaponLevel;
  el.materials.textContent = player.materials;
  el.kills.textContent = player.kills;
  el.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  el.upgradeBtn.disabled = player.materials < upgradeCost();
  el.upgradeBtn.textContent = `武器強化（🪨${upgradeCost()}）`;
}

function upgradeCost() {
  return player.weaponLevel * 3;
}

el.upgradeBtn.addEventListener("click", () => {
  const cost = upgradeCost();
  if (player.materials < cost) return;
  player.materials -= cost;
  player.weaponLevel++;
  player.atk += 6;
  updateHud();
  save();
  showToast(`⚔️ 武器を強化！ 攻撃力 ${player.atk}`);
});

// ---- 演出ヘルパ ----
function flash(node, cls = "hit") {
  node.classList.remove(cls);
  void node.offsetWidth; // reflow
  node.classList.add(cls);
  setTimeout(() => node.classList.remove(cls), 260);
}

let toastTimer = null;
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.style.whiteSpace = "pre-line";
  el.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 1800);
}

// ---- 開始 ----
load();          // 前回の進行を復元
updateHud();
requestAnimationFrame(loop);

// HUDの討伐数（🏆）を長押しでセーブリセット（確認あり）
let resetPressTimer = null;
el.killsItem.addEventListener("pointerdown", () => {
  resetPressTimer = setTimeout(() => {
    if (confirm("セーブデータをリセットしますか？")) {
      resetSave();
      location.reload();
    }
  }, 1200);
});
el.killsItem.addEventListener("pointerup", () => clearTimeout(resetPressTimer));
el.killsItem.addEventListener("pointerleave", () => clearTimeout(resetPressTimer));

// ---- PWA: Service Worker 登録 ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
