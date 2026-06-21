/* ============================================================
   モホレカ (Mhoreka) — モンハンNow風 位置ゲーム MVP
   - 実GPSは使わず、ゲーム内マップをタップで歩く
   - モンスターに近づくと戦闘 → 攻撃/回避 → 素材ドロップ → 武器強化
   ============================================================ */

// ---- 定数 ----
const TILE = 64;                 // マップの1マスのピクセル
const PLAYER_SPEED = 2.2;        // 1フレームの移動量
const ENCOUNTER_DIST = 36;       // この距離まで近づくと戦闘
const MONSTER_COUNT = 6;         // マップ上の同時出現数
const MONSTER_SPREAD = 900;      // モンスターをばらまく範囲（プレイヤー中心）

const MONSTER_TYPES = [
  { emoji: "🐗", name: "ドスイノシシ", hp: 40,  atk: 8,  mats: 2 },
  { emoji: "🦖", name: "リオレウス",   hp: 90,  atk: 16, mats: 4 },
  { emoji: "🐉", name: "古龍",         hp: 140, atk: 22, mats: 6 },
  { emoji: "🦂", name: "ガミザミ",     hp: 55,  atk: 12, mats: 3 },
  { emoji: "🦇", name: "ギエナ",       hp: 35,  atk: 10, mats: 2 },
];

// ---- ゲーム状態 ----
const player = {
  x: 0, y: 0,            // ワールド座標
  hp: 100, maxHp: 100,
  atk: 14,
  weaponLevel: 1,
  materials: 0,
};

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
  playerHpText: document.getElementById("player-hp-text"),
  upgradeBtn: document.getElementById("upgrade-btn"),
  battle: document.getElementById("battle"),
  monsterEmoji: document.getElementById("monster-emoji"),
  monsterName: document.getElementById("monster-name"),
  monsterHp: document.getElementById("monster-hp"),
  monsterTelegraph: document.getElementById("monster-telegraph"),
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
  const dist = 250 + Math.random() * MONSTER_SPREAD;
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
    attackTimer: null,
    over: false,
  };
  el.monsterEmoji.textContent = monster.emoji;
  el.monsterName.textContent = monster.name;
  el.battle.classList.remove("hidden");
  el.battleLog.textContent = `${monster.name} が現れた！`;
  updateBattleBars();
  scheduleMonsterAttack();
}

function scheduleMonsterAttack() {
  if (!battle || battle.over) return;
  const delay = 1600 + Math.random() * 1200;
  battle.attackTimer = setTimeout(() => {
    if (!battle || battle.over) return;
    // 予告
    el.monsterTelegraph.classList.remove("hidden");
    battle.attackTimer = setTimeout(() => {
      if (!battle || battle.over) return;
      el.monsterTelegraph.classList.add("hidden");
      if (battle.dodging) {
        el.battleLog.textContent = "回避成功！";
      } else {
        player.hp = Math.max(0, player.hp - battle.monster.atk);
        el.battleLog.textContent = `${battle.monster.atk} のダメージを受けた！`;
        flash(el.monsterEmoji);
        updateHud();
        updateBattleBars();
        if (player.hp <= 0) return playerDown();
      }
      scheduleMonsterAttack();
    }, 650); // 回避受付ウィンドウ
  }, delay);
}

el.attackBtn.addEventListener("click", () => {
  if (!battle || battle.over) return;
  battle.hp = Math.max(0, battle.hp - player.atk);
  el.battleLog.textContent = `${player.atk} のダメージを与えた！`;
  flash(el.monsterEmoji, "hit");
  updateBattleBars();
  if (battle.hp <= 0) monsterDown();
});

el.dodgeBtn.addEventListener("click", () => {
  if (!battle || battle.over) return;
  battle.dodging = true;
  el.hunterEmoji.classList.add("dodging");
  setTimeout(() => {
    battle.dodging = false;
    el.hunterEmoji.classList.remove("dodging");
  }, 500);
});

function monsterDown() {
  endBattle();
  player.materials += battle.monster.mats;
  // 倒したモンスターをマップから除去 → 補充
  monsters = monsters.filter((m) => m !== battle.monster);
  refillMonsters();
  updateHud();
  showToast(`🎉 ${battle.monster.name} を討伐！\n素材 🪨 +${battle.monster.mats}`);
  battle = null;
}

function playerDown() {
  endBattle();
  player.hp = player.maxHp; // 力尽きたら全回復してキャンプに帰還
  updateHud();
  showToast("💤 力尽きた…\nキャンプで回復した");
  battle = null;
}

function endBattle() {
  battle.over = true;
  clearTimeout(battle.attackTimer);
  el.monsterTelegraph.classList.add("hidden");
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
updateHud();
requestAnimationFrame(loop);

// ---- PWA: Service Worker 登録 ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
