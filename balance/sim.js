// balance/sim.js
// game.js の実データ・実計算式を使って戦闘バランスを自動検証する解析ツール。
//   実行: node balance/sim.js
// 各モンスターを「その段階で持っていそうな装備」で評価し、
//   ・1撃あたり平均ダメージ（属性・会心込み）
//   ・撃破に必要なヒット数(HTK)
//   ・被弾ダメージ(通常/怒り)・耐えられる回数
//   ・危険度（想定被ダメ ÷ 最大HP）
//   ・武器属性との相性
// を表で出力し、簡単すぎ/難しすぎを自動でフラグする。

const { loadGame } = require("./harness");
const G = loadGame();

// ===== プレイヤー挙動の仮定（ここを変えると評価の前提が変わる）=====
const PLAYER_TAP_MS = 500;  // 攻撃タップ間隔
const P_DODGE = 0.55;       // モンスター攻撃を回避できる確率（基準）
const WEAK_UPTIME = 0.18;   // 弱点部位を突いて会心になる割合
const ENRAGE_PORTION = 0.35; // 戦闘後半（怒り）の割合の概算

// ===== 段階ごとの想定ビルド =====
const LEATHER = ["a_leather_head", "a_leather_body", "a_leather_arm", "a_leather_waist", "a_leather_leg"];
const KUT = ["a_kut_head", "a_kut_body", "a_kut_arm", "a_kut_waist", "a_kut_leg"];
const RATH = ["a_rath_head", "a_rath_body", "a_rath_arm", "a_rath_waist", "a_rath_leg"];
const RELIC_MIX = ["a_relic_head", "a_relic_body", "a_rath_arm", "a_rath_waist", "a_relic_leg"];

const STAGE_BUILD = {
  forest:  { name: "序盤装備",   w: "w_jaggi_db",     a: LEATHER },
  jungle:  { name: "中盤装備",   w: "w_garuga_bow",   a: KUT },
  volcano: { name: "終盤装備",   w: "w_rath_ls",      a: RATH },
  summit:  { name: "龍ノ頂装備", w: "w_elder_hammer", a: RATH },
};
const ENDGAME_BUILD = { name: "最上位装備", w: "w_relic_db", a: RELIC_MIX };

function setBuild(build) {
  G.player.maxHp = 100;
  G.player.hp = 100;
  G.player.weapon = build.w;
  for (const slot of G.SLOTS) G.player.armor[slot] = null;
  for (const id of build.a) {
    const a = G.armorById(id);
    if (a) G.player.armor[a.slot] = id;
  }
}

function eleRel(weapon, m) {
  if (!weapon.ele || weapon.element === "無") return "—";
  if (weapon.element === m.weak) return "弱点!";
  if (weapon.element === m.resist) return "不利";
  return "通常";
}

// そのビルドで monster と戦ったときの指標
function evaluate(monster) {
  const atk = G.getAtk();
  const def = G.getDef();
  const maxHp = G.getMaxHp();
  const weapon = G.weaponById(G.player.weapon);

  // 1撃あたり平均ダメージ（物理＋属性、会心込み）
  const ele = G.elementalHit(monster).dmg;
  const skillCrit = G.skillVal("会心") / 100;
  const critProb = WEAK_UPTIME + (1 - WEAK_UPTIME) * skillCrit;
  const avgPhys = atk * (1 + critProb * (G.CRIT_MULT - 1));
  const avgHit = Math.round(avgPhys + ele);

  // 撃破に必要なヒット数
  const htk = Math.max(1, Math.ceil(monster.hp / avgHit));

  // 被弾ダメージ（防御で軽減）
  const mitig = (raw) => Math.max(1, Math.round(raw * (1 - def / (def + G.DEF_K))));
  const normalDmg = mitig(monster.atk);
  const enrageDmg = mitig(Math.round(monster.atk * G.ENRAGE_DMG));
  const survive = Math.floor(maxHp / normalDmg);

  // 想定被ダメ（戦闘の長さ × 被弾率）
  const cycleMs = monster.interval + 300 + monster.tele;
  const hitsPerCycle = cycleMs / PLAYER_TAP_MS;
  const cycles = htk / hitsPerCycle;             // モンスターの攻撃回数 ≒ サイクル数
  const justBonus = (G.getJustWindow() - G.JUST_WINDOW) / 2000; // 回避性能でちょい上昇
  const pDodge = Math.min(0.85, P_DODGE + justBonus);
  const hitsTaken = cycles * (1 - pDodge);
  const avgMonHit = normalDmg * (1 - ENRAGE_PORTION) + enrageDmg * ENRAGE_PORTION;
  const dmgTaken = hitsTaken * avgMonHit;
  const risk = Math.round((dmgTaken / maxHp) * 100);

  return { atk, def, maxHp, avgHit, htk, normalDmg, enrageDmg, survive, risk, rel: eleRel(weapon, monster) };
}

function flags(m) {
  const f = [];
  if (m.htk <= 2) f.push("⚠簡単");
  if (m.htk >= 14) f.push("⚠硬い");
  if (m.risk >= 110) f.push("⚠危険");
  if (m.risk <= 12) f.push("ぬるい");
  return f.join(" ");
}

function pad(s, n) {
  s = String(s);
  // 全角を2幅として概算
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2000 ? 2 : 1;
  return s + " ".repeat(Math.max(0, n - w));
}

function row(label, m) {
  return [
    pad(label, 16),
    pad("HP" + (m.maxHp ?? ""), 0),
  ];
}

function printMonster(label, m) {
  console.log(
    pad("  " + label, 18) +
    pad("攻" + m.atk, 7) +
    pad("守" + m.def, 7) +
    pad("撃" + m.avgHit, 7) +
    pad("HTK" + m.htk, 7) +
    pad("被" + m.normalDmg + "/" + m.enrageDmg, 10) +
    pad("耐" + m.survive, 7) +
    pad("危" + m.risk + "%", 8) +
    pad(m.rel, 7) +
    flags(m)
  );
}

console.log("=== モホレカ バランス解析 ===");
console.log(`前提: 攻撃間隔${PLAYER_TAP_MS}ms / 回避成功${Math.round(P_DODGE*100)}% / 弱点会心${Math.round(WEAK_UPTIME*100)}%`);
console.log("凡例: 攻=攻撃力 守=防御 撃=平均1撃 HTK=撃破必要ヒット 被=被弾(通常/怒) 耐=耐久回数 危=危険度");
console.log("");

for (const area of G.AREAS) {
  console.log(`■ ${area.emoji} ${area.name}（解放: 討伐${area.unlockKills}体）  想定ビルド: ${STAGE_BUILD[area.id].name}`);
  setBuild(STAGE_BUILD[area.id]);
  for (const name of area.pool) {
    const t = G.typeByName(name);
    printMonster(`${t.emoji}${name}(HP${t.hp})`, evaluate(t));
  }
  console.log("");
}

// 亜種＆ラスボスを最上位装備で
console.log("■ ✨亜種 / ラスボス（最上位装備）");
setBuild(ENDGAME_BUILD);
const variantTargets = ["イャンガルルガ", "リオレウス", "ディアブロス", "クシャルダオラ", "古龍"];
for (const name of variantTargets) {
  const v = G.toVariant(G.typeByName(name));
  printMonster(`${v.emoji}${v.name}(HP${v.hp})`, evaluate(v));
}
console.log("");

// 発動スキルの確認（最上位ビルド）
setBuild(ENDGAME_BUILD);
const active = Object.keys(G.SKILLS).filter((s) => G.skillLevel(s) > 0)
  .map((s) => `${s}Lv${G.skillLevel(s)}`).join(" / ");
console.log("最上位ビルドの発動スキル: " + (active || "なし"));
console.log(`最上位ビルド: 攻撃${G.getAtk()} 防御${G.getDef()} 最大HP${G.getMaxHp()}`);
