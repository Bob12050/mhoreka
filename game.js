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
// material=ドロップ素材名 / mats=ドロップ個数 / weak=弱点属性 / resist=耐性属性
const MONSTER_TYPES = [
  // ―― 序盤（始まりの森） ――
  { emoji: "🦎", name: "ドスジャギィ",   hp: 42,  atk: 8,  mats: 2, interval: 2100, tele: 780, material: "ジャギィの皮",   weak: "火" },
  { emoji: "🐗", name: "ドスファンゴ",   hp: 52,  atk: 10, mats: 2, interval: 1900, tele: 720, material: "ファンゴの剛牙", weak: "火" },
  { emoji: "🦕", name: "ドスランポス",   hp: 62,  atk: 12, mats: 3, interval: 1500, tele: 560, material: "ランポスの鱗",   weak: "雷" },
  // ―― 中盤（旧ジャングル） ――
  { emoji: "🦤", name: "イャンクック",   hp: 80,  atk: 15, mats: 3, interval: 1700, tele: 640, material: "クックの耳殻",   weak: "水" },
  { emoji: "🦩", name: "ゲリョス",       hp: 95,  atk: 17, mats: 3, interval: 1600, tele: 600, material: "ゲリョスの皮",   weak: "火" },
  { emoji: "🦅", name: "イャンガルルガ", hp: 115, atk: 20, mats: 4, interval: 1500, tele: 560, material: "黒狼鳥の翼",     weak: "雷", resist: "火" },
  // ―― 終盤（火山帯） ――
  { emoji: "🐉", name: "リオレイア",     hp: 130, atk: 22, mats: 4, interval: 1900, tele: 680, material: "雌火竜の鱗",     weak: "龍", resist: "火" },
  { emoji: "🦖", name: "リオレウス",     hp: 150, atk: 25, mats: 5, interval: 1800, tele: 650, material: "火竜の鱗",       weak: "龍", resist: "火" },
  { emoji: "🐃", name: "ディアブロス",   hp: 175, atk: 28, mats: 5, interval: 2000, tele: 700, material: "角竜の甲殻",     weak: "水", resist: "火" },
  // ―― 最終（龍ノ頂） ――
  { emoji: "🌪️", name: "クシャルダオラ", hp: 200, atk: 31, mats: 6, interval: 1700, tele: 620, material: "鋼龍の翼",       weak: "雷", resist: "龍" },
  { emoji: "🐲", name: "古龍",           hp: 250, atk: 36, mats: 8, interval: 1900, tele: 640, material: "古龍の血",       weak: "龍", resist: "火" },
];
const typeByName = (n) => MONSTER_TYPES.find((t) => t.name === n);

// ---- 属性 ----
const ELE_ICON = { 火: "🔥", 水: "💧", 雷: "⚡", 龍: "🐲" };
const eleIcon = (e) => ELE_ICON[e] || "";
const ELE_WEAK_MULT = 1.6;    // 弱点を突いたときの属性倍率
const ELE_RESIST_MULT = 0.2;  // 耐性のときの属性倍率
const ELE_NEUTRAL_MULT = 0.8; // それ以外

// ============================================================
//  武器・防具（モンハン準拠の生産＆装備）
//  element=武器属性 / ele=属性値（0は無属性）
// ============================================================
const WEAPONS = [
  { id: "w_iron_sns",   name: "鉄の片手剣",   type: "片手剣", atk: 14, ele: 0,  element: "無", cost: {} }, // 初期装備
  { id: "w_bone_gs",    name: "骨の大剣",     type: "大剣",   atk: 22, ele: 0,  element: "無", cost: { "ジャギィの皮": 4, "ファンゴの剛牙": 2 } },
  { id: "w_jaggi_db",   name: "ジャギィ双剣", type: "双剣",   atk: 26, ele: 12, element: "火", cost: { "ジャギィの皮": 5, "ランポスの鱗": 2 } },
  { id: "w_rampos_lance",name:"ランポスの槍", type: "ランス", atk: 30, ele: 13, element: "雷", cost: { "ランポスの鱗": 5, "ファンゴの剛牙": 3 } },
  { id: "w_kutku_hammer",name:"クックハンマー",type:"ハンマー",atk: 34, ele: 15, element: "火", cost: { "クックの耳殻": 5, "ゲリョスの皮": 3 } },
  { id: "w_garuga_bow", name: "黒狼の弓",     type: "弓",     atk: 38, ele: 16, element: "雷", cost: { "黒狼鳥の翼": 5, "クックの耳殻": 3 } },
  { id: "w_aqua_ls",    name: "水流の太刀",   type: "太刀",   atk: 40, ele: 16, element: "水", cost: { "ゲリョスの皮": 4, "角竜の甲殻": 3 } },
  { id: "w_rath_ls",    name: "火竜の太刀",   type: "太刀",   atk: 46, ele: 18, element: "火", cost: { "火竜の鱗": 5, "雌火竜の鱗": 3 } },
  { id: "w_diablos_hammer",name:"角竜の鎚",   type: "ハンマー",atk: 54, ele: 0,  element: "無", cost: { "角竜の甲殻": 5, "火竜の鱗": 3 } },
  { id: "w_kushala_gs", name: "鋼龍剣",       type: "大剣",   atk: 58, ele: 20, element: "龍", cost: { "鋼龍の翼": 4, "火竜の鱗": 3 } },
  { id: "w_elder_hammer",name:"古龍棍",       type: "ハンマー",atk: 70, ele: 24, element: "龍", cost: { "古龍の血": 2, "鋼龍の翼": 3 } },
];
const SLOTS = ["頭", "胴", "腕", "腰", "脚"];
const ARMORS = [
  // レザー装備（序盤・始まりの森）
  { id: "a_leather_head", name: "レザーヘルム",  slot: "頭", def: 2, cost: { "ジャギィの皮": 2 } },
  { id: "a_leather_body", name: "レザーメイル",  slot: "胴", def: 3, cost: { "ジャギィの皮": 3 } },
  { id: "a_leather_arm",  name: "レザーアーム",  slot: "腕", def: 2, cost: { "ファンゴの剛牙": 2 } },
  { id: "a_leather_waist",name: "レザーコイル",  slot: "腰", def: 2, cost: { "ファンゴの剛牙": 2 } },
  { id: "a_leather_leg",  name: "レザーグリーヴ", slot: "脚", def: 2, cost: { "ランポスの鱗": 2 } },
  // クック装備（中盤・旧ジャングル）
  { id: "a_kut_head", name: "クック【兜】", slot: "頭", def: 5, cost: { "クックの耳殻": 3, "ゲリョスの皮": 1 } },
  { id: "a_kut_body", name: "クック【鎧】", slot: "胴", def: 6, cost: { "クックの耳殻": 4, "ゲリョスの皮": 2 } },
  { id: "a_kut_arm",  name: "クック【腕】", slot: "腕", def: 5, cost: { "ゲリョスの皮": 3 } },
  { id: "a_kut_waist",name: "クック【帯】", slot: "腰", def: 5, cost: { "黒狼鳥の翼": 2 } },
  { id: "a_kut_leg",  name: "クック【脚】", slot: "脚", def: 5, cost: { "黒狼鳥の翼": 2, "クックの耳殻": 1 } },
  // 火竜装備（終盤・火山帯）
  { id: "a_rath_head", name: "リオソウル【兜】", slot: "頭", def: 8, cost: { "火竜の鱗": 3, "雌火竜の鱗": 1 } },
  { id: "a_rath_body", name: "リオソウル【鎧】", slot: "胴", def: 9, cost: { "火竜の鱗": 4, "角竜の甲殻": 2 } },
  { id: "a_rath_arm",  name: "リオソウル【腕】", slot: "腕", def: 8, cost: { "火竜の鱗": 3 } },
  { id: "a_rath_waist",name: "リオソウル【帯】", slot: "腰", def: 8, cost: { "角竜の甲殻": 3 } },
  { id: "a_rath_leg",  name: "リオソウル【脚】", slot: "脚", def: 8, cost: { "火竜の鱗": 3, "角竜の甲殻": 1 } },
];
const weaponById = (id) => WEAPONS.find((w) => w.id === id);
const armorById = (id) => ARMORS.find((a) => a.id === id);
const DEF_K = 80;          // 防御の軽減カーブ係数（大きいほど効きにくい）

// ---- エリア（マップ）。unlockKills 体討伐で解放 ----
const AREAS = [
  { id: "forest", name: "始まりの森",   emoji: "🌿", bg: "#2f4a37", unlockKills: 0,
    pool: ["ドスジャギィ", "ドスファンゴ", "ドスランポス"] },
  { id: "jungle", name: "旧ジャングル", emoji: "🌴", bg: "#274a2f", unlockKills: 9,
    pool: ["イャンクック", "ゲリョス", "イャンガルルガ"] },
  { id: "volcano",name: "火山帯",       emoji: "🌋", bg: "#4a2f2f", unlockKills: 20,
    pool: ["リオレイア", "リオレウス", "ディアブロス"] },
  { id: "summit", name: "龍ノ頂",       emoji: "❄️", bg: "#2f3a4a", unlockKills: 32,
    pool: ["クシャルダオラ", "古龍"] },
];
const areaUnlocked = (a) => player.kills >= a.unlockKills;
const monsterArea = (name) => AREAS.find((a) => a.pool.includes(name));

// ---- クエスト（狩猟依頼）----
// target を count 体討伐で達成。reward.mats=素材, reward.maxHp=最大HP増加（初回のみ）
const QUESTS = [
  { id: "q1",  name: "森の害獣駆除",   target: "ドスジャギィ",   count: 2, reward: { mats: { "ジャギィの皮": 3 } } },
  { id: "q2",  name: "猪突猛進",       target: "ドスファンゴ",   count: 2, reward: { mats: { "ファンゴの剛牙": 3 } } },
  { id: "q3",  name: "俊足の群れ",     target: "ドスランポス",   count: 2, reward: { mats: { "ランポスの鱗": 3 }, maxHp: 10 } },
  { id: "q4",  name: "密林の奇怪鳥",   target: "イャンクック",   count: 1, reward: { mats: { "クックの耳殻": 3 } } },
  { id: "q5",  name: "毒怪鳥を狩れ",   target: "ゲリョス",       count: 2, reward: { mats: { "ゲリョスの皮": 4 } } },
  { id: "q6",  name: "黒狼鳥の脅威",   target: "イャンガルルガ", count: 1, reward: { mats: { "黒狼鳥の翼": 3 }, maxHp: 15 } },
  { id: "q7",  name: "火山の女王",     target: "リオレイア",     count: 1, reward: { mats: { "雌火竜の鱗": 3 } } },
  { id: "q8",  name: "火竜討伐",       target: "リオレウス",     count: 1, reward: { mats: { "火竜の鱗": 4 }, maxHp: 20 } },
  { id: "q9",  name: "角竜の暴威",     target: "ディアブロス",   count: 1, reward: { mats: { "角竜の甲殻": 4 } } },
  { id: "q10", name: "鋼の龍を討て",   target: "クシャルダオラ", count: 1, reward: { mats: { "鋼龍の翼": 3 }, maxHp: 25 } },
  { id: "q11", name: "伝説の古龍",     target: "古龍",           count: 1, reward: { mats: { "古龍の血": 3 }, maxHp: 30 } },
];
const questById = (id) => QUESTS.find((q) => q.id === id);

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
  kills: 0,              // 累計討伐数
  bestiary: {},          // 種ごとの討伐数 { モンスター名: 回数 }
  mats: {},              // 所持素材 { 素材名: 個数 }
  owned: { w_iron_sns: true }, // 生産済み装備 { id: true }
  weapon: "w_iron_sns",  // 装備中の武器
  armor: { 頭: null, 胴: null, 腕: null, 腰: null, 脚: null }, // 装備中の防具
  questActive: null,     // 受注中クエストid
  questProgress: 0,      // 受注中の討伐数
  questsDone: {},        // 達成済み { id: true }
};

// ---- 装備の派生値 ----
function getAtk() {
  return (weaponById(player.weapon) || WEAPONS[0]).atk;
}
// 装備中の武器がそのモンスターに与える属性ダメージと、弱点を突いたか
function elementalHit(monster) {
  const w = weaponById(player.weapon) || WEAPONS[0];
  if (!w.ele || w.element === "無") return { dmg: 0, weak: false, element: "無" };
  let mult = ELE_NEUTRAL_MULT;
  let weak = false;
  if (w.element === monster.weak) { mult = ELE_WEAK_MULT; weak = true; }
  else if (w.element === monster.resist) { mult = ELE_RESIST_MULT; }
  return { dmg: Math.round(w.ele * mult), weak, element: w.element };
}
function getDef() {
  let d = 0;
  for (const slot of SLOTS) {
    const id = player.armor[slot];
    if (id) d += (armorById(id)?.def || 0);
  }
  return d;
}
function matCount(name) {
  return player.mats[name] || 0;
}
function totalMats() {
  let n = 0;
  for (const k in player.mats) n += player.mats[k];
  return n;
}
function canCraft(item) {
  for (const m in item.cost) if (matCount(m) < item.cost[m]) return false;
  return true;
}

// ---- セーブ / ロード（localStorage に進行を保存）----
const SAVE_KEY = "mhoreka-save-v1";
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hp: player.hp, maxHp: player.maxHp,
      kills: player.kills, bestiary: player.bestiary,
      mats: player.mats, owned: player.owned,
      weapon: player.weapon, armor: player.armor,
      questActive: player.questActive, questProgress: player.questProgress,
      questsDone: player.questsDone,
      area: currentArea.id,
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
    player.kills = s.kills ?? player.kills;
    player.bestiary = s.bestiary ?? player.bestiary;
    player.mats = s.mats ?? player.mats;
    player.owned = s.owned ?? player.owned;
    player.owned.w_iron_sns = true; // 初期武器は常に所持
    if (s.weapon && weaponById(s.weapon)) player.weapon = s.weapon;
    // 旧バージョンの無効な装備IDは無視（安全に既定へ）
    if (s.armor) for (const slot of SLOTS) {
      player.armor[slot] = armorById(s.armor[slot]) ? s.armor[slot] : null;
    }
    player.questsDone = s.questsDone ?? player.questsDone;
    player.questProgress = s.questProgress ?? 0;
    if (s.questActive && questById(s.questActive)) player.questActive = s.questActive;
    const a = AREAS.find((x) => x.id === s.area);
    if (a) currentArea = a;
  } catch (e) { /* 壊れたデータは無視 */ }
}
function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

let moveTarget = null;   // {x, y} 目的地
let monsters = [];       // マップ上のモンスター
let currentArea = AREAS[0]; // 現在のエリア
let mode = "map";        // "map" | "battle"
let battle = null;       // 戦闘中の状態

// ---- DOM ----
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const el = {
  atkVal: document.getElementById("atk-val"),
  defVal: document.getElementById("def-val"),
  materials: document.getElementById("materials"),
  kills: document.getElementById("kills"),
  killsItem: document.getElementById("kills-item"),
  playerHpText: document.getElementById("player-hp-text"),
  equipBtn: document.getElementById("equip-btn"),
  equipClose: document.getElementById("equip-close"),
  equip: document.getElementById("equip"),
  equipBody: document.getElementById("equip-body"),
  listToggle: document.getElementById("list-toggle"),
  listClose: document.getElementById("list-close"),
  monsterList: document.getElementById("monster-list"),
  listBody: document.getElementById("list-body"),
  dexToggle: document.getElementById("dex-toggle"),
  dexClose: document.getElementById("dex-close"),
  dex: document.getElementById("dex"),
  dexBody: document.getElementById("dex-body"),
  dexRate: document.getElementById("dex-rate"),
  areaBanner: document.getElementById("area-banner"),
  areaEmoji: document.getElementById("area-emoji"),
  areaName: document.getElementById("area-name"),
  areaSelect: document.getElementById("area-select"),
  areaClose: document.getElementById("area-close"),
  areaBody: document.getElementById("area-body"),
  questToggle: document.getElementById("quest-toggle"),
  questBanner: document.getElementById("quest-banner"),
  questClose: document.getElementById("quest-close"),
  quests: document.getElementById("quests"),
  questBody: document.getElementById("quest-body"),
  battle: document.getElementById("battle"),
  monsterEmoji: document.getElementById("monster-emoji"),
  monsterName: document.getElementById("monster-name"),
  monsterWeak: document.getElementById("monster-weak"),
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
  const pool = currentArea.pool;
  const t = typeByName(pool[Math.floor(Math.random() * pool.length)]);
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

// ---- 出現中モンスター一覧 ----
let listOpen = false;
let listRows = [];     // {m, distEl}
let listAccum = 0;

function distTo(m) {
  return Math.hypot(m.x - player.x, m.y - player.y);
}
function strengthStars(hp) {
  if (hp <= 55) return "★";
  if (hp <= 95) return "★★";
  if (hp <= 150) return "★★★";
  if (hp <= 200) return "★★★★";
  return "★★★★★";
}

function openList() {
  listOpen = true;
  el.monsterList.classList.remove("hidden");
  renderMonsterList();
}
function closeList() {
  listOpen = false;
  el.monsterList.classList.add("hidden");
}
el.listToggle.addEventListener("click", () => (listOpen ? closeList() : openList()));
el.listClose.addEventListener("click", closeList);

function renderMonsterList() {
  const sorted = monsters
    .map((m) => ({ m, d: distTo(m) }))
    .sort((a, b) => a.d - b.d);

  el.listBody.innerHTML = "";
  listRows = [];

  if (sorted.length === 0) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "周辺にモンスターがいません";
    el.listBody.appendChild(li);
    return;
  }

  for (const { m, d } of sorted) {
    const li = document.createElement("li");
    li.className = "list-row";

    const emoji = document.createElement("div");
    emoji.className = "list-emoji";
    emoji.textContent = m.emoji;

    const info = document.createElement("div");
    info.className = "list-info";
    const name = document.createElement("div");
    name.className = "list-name";
    name.textContent = m.name;
    const sub = document.createElement("div");
    sub.className = "list-sub";
    sub.textContent = "強さ " + strengthStars(m.maxHp);
    info.append(name, sub);

    const distEl = document.createElement("div");
    distEl.className = "list-dist";
    distEl.textContent = Math.round(d) + "m";

    li.append(emoji, info, distEl);
    li.addEventListener("click", () => {
      moveTarget = { x: m.x, y: m.y }; // タップで自動移動
      closeList();
    });
    el.listBody.appendChild(li);
    listRows.push({ m, distEl });
  }
}

// 距離だけを定期更新（並び替えはせず、スクロール位置を保つ）
function updateListDistances() {
  for (const r of listRows) {
    r.distEl.textContent = Math.round(distTo(r.m)) + "m";
  }
}

// ---- 討伐図鑑 ----
function openDex() {
  renderDex();
  el.dex.classList.remove("hidden");
}
function closeDex() {
  el.dex.classList.add("hidden");
}
el.dexToggle.addEventListener("click", openDex);
el.dexClose.addEventListener("click", closeDex);

function renderDex() {
  const found = MONSTER_TYPES.filter((t) => player.bestiary[t.name]).length;
  el.dexRate.textContent = `（${found}/${MONSTER_TYPES.length}種）`;

  el.dexBody.innerHTML = "";
  for (const t of MONSTER_TYPES) {
    const count = player.bestiary[t.name] || 0;
    const discovered = count > 0;

    const li = document.createElement("li");
    li.className = "dex-card " + (discovered ? "found" : "unknown");

    const emoji = document.createElement("div");
    emoji.className = "dex-emoji";
    emoji.textContent = discovered ? t.emoji : "❓";

    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = discovered ? t.name : "？？？";

    const meta = document.createElement("div");
    meta.className = "dex-meta";
    meta.textContent = discovered
      ? `討伐 ${count}　強さ ${strengthStars(t.hp)}　弱点 ${eleIcon(t.weak)}${t.weak}`
      : "未討伐";

    li.append(emoji, name, meta);
    el.dexBody.appendChild(li);
  }
}

// ---- マップ選択 ----
function openAreaSelect() {
  renderAreaSelect();
  el.areaSelect.classList.remove("hidden");
}
function closeAreaSelect() {
  el.areaSelect.classList.add("hidden");
}
el.areaBanner.addEventListener("click", openAreaSelect);
el.areaClose.addEventListener("click", closeAreaSelect);

function renderAreaSelect() {
  el.areaBody.innerHTML = "";
  for (const a of AREAS) {
    const unlocked = areaUnlocked(a);
    const isCurrent = a === currentArea;

    const li = document.createElement("li");
    li.className = "area-card" + (unlocked ? "" : " locked") + (isCurrent ? " current" : "");

    const emoji = document.createElement("div");
    emoji.className = "area-emoji-lg";
    emoji.textContent = unlocked ? a.emoji : "🔒";

    const info = document.createElement("div");
    info.className = "area-info";
    const title = document.createElement("div");
    title.className = "area-title";
    title.textContent = a.name;
    const mons = document.createElement("div");
    mons.className = "area-mons";
    mons.textContent = a.pool.map((n) => typeByName(n).emoji).join(" ");
    const state = document.createElement("div");
    state.className = "area-state";
    state.textContent = isCurrent
      ? "出撃中"
      : unlocked
      ? "タップして出撃"
      : `討伐 ${a.unlockKills} 体で解放（あと ${a.unlockKills - player.kills} 体）`;
    info.append(title, mons, state);

    li.append(emoji, info);
    if (unlocked && !isCurrent) {
      li.addEventListener("click", () => travelTo(a));
    }
    el.areaBody.appendChild(li);
  }
}

function travelTo(a) {
  currentArea = a;
  moveTarget = null;
  monsters = [];
  refillMonsters();
  updateHud();
  save();
  closeAreaSelect();
  showToast(`${a.emoji} ${a.name} に到着！`);
}

// ============================================================
//  クエスト
// ============================================================
const questAvailable = (q) => {
  const a = monsterArea(q.target);
  return a && areaUnlocked(a);
};

function completeQuest(q) {
  let rewardTxt = "";
  if (q.reward.mats) {
    for (const m in q.reward.mats) player.mats[m] = (player.mats[m] || 0) + q.reward.mats[m];
    rewardTxt = Object.entries(q.reward.mats).map(([m, n]) => `${m}×${n}`).join("　");
  }
  let hpTxt = "";
  if (q.reward.maxHp && !player.questsDone[q.id]) {
    player.maxHp += q.reward.maxHp;
    player.hp = player.maxHp;
    hpTxt = `\n最大HP +${q.reward.maxHp}！`;
  }
  player.questsDone[q.id] = true;
  player.questActive = null;
  player.questProgress = 0;
  return `📜 クエスト達成！「${q.name}」\n報酬 ${rewardTxt}${hpTxt}`;
}

function acceptQuest(q) {
  player.questActive = q.id;
  player.questProgress = 0;
  updateHud();
  save();
  renderQuests();
  closeQuests();
  showToast(`📜 クエストを受注\n「${q.name}」`);
}
function abandonQuest() {
  player.questActive = null;
  player.questProgress = 0;
  updateHud();
  save();
  renderQuests();
}

function openQuests() {
  renderQuests();
  el.quests.classList.remove("hidden");
}
function closeQuests() {
  el.quests.classList.add("hidden");
}
el.questToggle.addEventListener("click", openQuests);
el.questClose.addEventListener("click", closeQuests);
el.questBanner.addEventListener("click", openQuests);

function rewardText(q) {
  const parts = [];
  if (q.reward.mats) for (const m in q.reward.mats) parts.push(`${m}×${q.reward.mats[m]}`);
  if (q.reward.maxHp) parts.push(`最大HP+${q.reward.maxHp}`);
  return parts.join("　");
}

function renderQuests() {
  el.questBody.innerHTML = "";
  for (const q of QUESTS) {
    const t = typeByName(q.target);
    const isActive = player.questActive === q.id;
    const avail = questAvailable(q);
    const done = !!player.questsDone[q.id];

    const card = document.createElement("div");
    card.className = "quest-card" + (isActive ? " active" : "");

    const top = document.createElement("div");
    top.className = "quest-top";
    top.innerHTML =
      `<span class="quest-name">${q.name}</span>` +
      (done ? `<span class="quest-clear">✓クリア済</span>` : "");
    card.appendChild(top);

    const tgt = document.createElement("div");
    tgt.className = "quest-target";
    tgt.textContent = `${t.emoji} ${q.target} を ${q.count}頭討伐`;
    card.appendChild(tgt);

    const rew = document.createElement("div");
    rew.className = "quest-reward";
    rew.textContent = "報酬: " + rewardText(q);
    card.appendChild(rew);

    const actions = document.createElement("div");
    actions.className = "quest-actions";
    if (isActive) {
      const prog = document.createElement("span");
      prog.className = "quest-prog";
      prog.textContent = `進行中 ${player.questProgress}/${q.count}`;
      const ab = document.createElement("button");
      ab.className = "quest-btn abandon";
      ab.textContent = "やめる";
      ab.addEventListener("click", abandonQuest);
      actions.append(prog, ab);
    } else if (!avail) {
      const lock = document.createElement("span");
      lock.className = "quest-lock";
      lock.textContent = "🔒 エリア未解放";
      actions.appendChild(lock);
    } else {
      const b = document.createElement("button");
      b.className = "quest-btn accept";
      b.textContent = "受注する";
      b.disabled = !!player.questActive;
      if (player.questActive) b.textContent = "他を受注中";
      b.addEventListener("click", () => acceptQuest(q));
      actions.appendChild(b);
    }
    card.appendChild(actions);
    el.questBody.appendChild(card);
  }
}

function updateQuestBanner() {
  if (player.questActive) {
    const q = questById(player.questActive);
    const t = typeByName(q.target);
    el.questBanner.textContent = `📜 ${t.emoji}${q.target} ${player.questProgress}/${q.count}`;
    el.questBanner.classList.remove("hidden");
  } else {
    el.questBanner.classList.add("hidden");
  }
}

// ============================================================
//  装備・生産
// ============================================================
let equipTab = "weapon";

function openEquip() {
  el.equip.classList.remove("hidden");
  renderEquip();
}
function closeEquip() {
  el.equip.classList.add("hidden");
}
el.equipBtn.addEventListener("click", openEquip);
el.equipClose.addEventListener("click", closeEquip);
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    equipTab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    renderEquip();
  });
});

// コスト表示（所持/必要、足りない素材は赤）
function costHtml(cost) {
  const keys = Object.keys(cost);
  if (keys.length === 0) return '<span class="ok">素材不要</span>';
  return keys
    .map((m) => {
      const have = matCount(m);
      const need = cost[m];
      const cls = have >= need ? "ok" : "lack";
      return `<span class="${cls}">${m} ${have}/${need}</span>`;
    })
    .join("　");
}

function gearCard(item, kind) {
  const owned = !!player.owned[item.id];
  const equipped =
    kind === "weapon"
      ? player.weapon === item.id
      : player.armor[item.slot] === item.id;

  const card = document.createElement("div");
  card.className = "gear-card" + (equipped ? " equipped" : "");

  const stat =
    kind === "weapon"
      ? `攻撃 ${item.atk}` + (item.ele ? `　${eleIcon(item.element)}${item.ele}` : "")
      : `防御 ${item.def}`;
  const sub = kind === "weapon" ? item.type : item.slot;

  const top = document.createElement("div");
  top.className = "gear-top";
  top.innerHTML =
    `<div><span class="gear-name">${item.name}</span> ` +
    `<span class="gear-type">${sub}</span></div>` +
    `<div class="gear-stat">${stat}</div>`;
  card.appendChild(top);

  if (!owned) {
    const cost = document.createElement("div");
    cost.className = "gear-cost";
    cost.innerHTML = costHtml(item.cost);
    card.appendChild(cost);
  }

  const actions = document.createElement("div");
  actions.className = "gear-actions";
  if (equipped) {
    const tag = document.createElement("span");
    tag.className = "gear-btn owned-tag";
    tag.textContent = "✓ 装備中";
    actions.appendChild(tag);
  } else if (owned) {
    const b = document.createElement("button");
    b.className = "gear-btn equip";
    b.textContent = "装備する";
    b.addEventListener("click", () => equipItem(item, kind));
    actions.appendChild(b);
  } else {
    const b = document.createElement("button");
    b.className = "gear-btn craft";
    b.textContent = "生産する";
    b.disabled = !canCraft(item);
    b.addEventListener("click", () => craftItem(item, kind));
    actions.appendChild(b);
  }
  card.appendChild(actions);
  return card;
}

function craftItem(item, kind) {
  if (!canCraft(item)) return;
  for (const m in item.cost) player.mats[m] -= item.cost[m];
  player.owned[item.id] = true;
  equipItem(item, kind, true); // 生産したら自動装備
  updateHud();
  save();
  showToast(`🛠️ ${item.name} を生産！\nそのまま装備した`);
}

function equipItem(item, kind, silent) {
  if (kind === "weapon") player.weapon = item.id;
  else player.armor[item.slot] = item.id;
  updateHud();
  save();
  renderEquip();
  if (!silent) showToast(`${item.name} を装備した`);
}

function renderEquip() {
  el.equipBody.innerHTML = "";

  if (equipTab === "weapon") {
    for (const w of WEAPONS) el.equipBody.appendChild(gearCard(w, "weapon"));
  } else if (equipTab === "armor") {
    for (const slot of SLOTS) {
      const group = document.createElement("div");
      group.className = "slot-group";
      const label = document.createElement("div");
      label.className = "slot-label";
      label.textContent = `― ${slot} ―`;
      group.appendChild(label);
      for (const a of ARMORS.filter((x) => x.slot === slot)) {
        group.appendChild(gearCard(a, "armor"));
      }
      el.equipBody.appendChild(group);
    }
  } else {
    // 素材一覧
    const names = Object.keys(player.mats).filter((n) => player.mats[n] > 0);
    if (names.length === 0) {
      const e = document.createElement("div");
      e.className = "mat-empty";
      e.textContent = "素材がありません。モンスターを討伐しよう！";
      el.equipBody.appendChild(e);
    } else {
      for (const n of names) {
        const row = document.createElement("div");
        row.className = "mat-row";
        row.innerHTML = `<span>${n}</span><span class="mat-qty">×${player.mats[n]}</span>`;
        el.equipBody.appendChild(row);
      }
    }
  }
}

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
  // 一覧を開いている間は距離をライブ更新（約0.2秒ごと）
  if (listOpen) {
    listAccum += dt;
    if (listAccum > 12) {
      listAccum = 0;
      updateListDistances();
    }
  }
}

// ---- 描画 ----
function render() {
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W / 2, cy = H / 2;

  // 背景（エリアごとの色）
  ctx.fillStyle = currentArea.bg;
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
  closeList();
  closeDex();
  closeAreaSelect();
  closeEquip();
  closeQuests();
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
  el.monsterWeak.textContent =
    `弱点属性 ${eleIcon(monster.weak)}${monster.weak}` +
    (monster.resist ? `　耐性 ${eleIcon(monster.resist)}${monster.resist}` : "");
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
    // 防御で軽減（def/(def+K) の割合カット、最低1ダメージ）
    const def = getDef();
    dmg = Math.max(1, Math.round(dmg * (1 - def / (def + DEF_K))));
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
  let phys = getAtk();
  let crit = false;
  let head = "";

  if (battle.counterReady) {            // ジャスト回避からの反撃
    phys = Math.round(phys * CRIT_MULT);
    head = "反撃！ ";
    crit = true;
    battle.counterReady = false;
  } else if (battle.weakActive) {       // 弱点部位ヒット＝会心
    phys = Math.round(phys * CRIT_MULT);
    head = "会心！ ";
    crit = true;
    hideWeak();
  }

  // 属性ダメージ（弱点属性なら大きく加算）
  const e = elementalHit(battle.monster);
  const dmg = phys + e.dmg;
  let label = `${head}${dmg} のダメージ`;
  if (e.weak) label += `（${eleIcon(e.element)}弱点属性！）`;

  battle.hp = Math.max(0, battle.hp - dmg);
  el.battleLog.textContent = label;
  flash(el.monsterEmoji, crit || e.weak ? "crit" : "hit");
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
  const mon = battle.monster;
  player.kills++;
  // 素材ドロップ（モンスター固有）
  player.mats[mon.material] = (player.mats[mon.material] || 0) + mon.mats;
  // 図鑑に記録（初討伐かどうか判定）
  const firstKill = !player.bestiary[mon.name];
  player.bestiary[mon.name] = (player.bestiary[mon.name] || 0) + 1;
  // クエスト進行
  let questMsg = null;
  if (player.questActive) {
    const q = questById(player.questActive);
    if (q && q.target === mon.name) {
      player.questProgress++;
      if (player.questProgress >= q.count) {
        questMsg = completeQuest(q);
      }
    }
  }
  // 倒したモンスターをマップから除去 → 補充
  monsters = monsters.filter((m) => m !== mon);
  refillMonsters();
  updateHud();
  save();
  const newArea = AREAS.find((a) => a.unlockKills === player.kills);
  if (questMsg) {
    showToast(questMsg);
  } else if (newArea) {
    showToast(`🗺️ 新エリア解放！\n${newArea.emoji} ${newArea.name} へ行けるように`);
  } else if (firstKill) {
    showToast(`✨ 新種発見！\n${mon.emoji} ${mon.name} を図鑑に登録`);
  } else {
    showToast(`🎉 ${mon.name} を討伐！\n${mon.material} ×${mon.mats}`);
  }
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
//  HUD
// ============================================================
function updateHud() {
  el.atkVal.textContent = getAtk();
  el.defVal.textContent = getDef();
  el.materials.textContent = totalMats();
  el.kills.textContent = player.kills;
  el.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  el.areaEmoji.textContent = currentArea.emoji;
  el.areaName.textContent = currentArea.name;
  updateQuestBanner();
}

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
load();          // 前回の進行を復元（エリアもここで確定）
refillMonsters();
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
