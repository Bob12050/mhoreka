import type { Monster } from '../types';
import { el } from '../ui/dom';
import { player, runtime, save } from '../state';
import { AREAS } from '../data/areas';
import { RARE_MAT, eleIcon, ENCOUNTER_DIST } from '../data/monsters';
import { questById } from '../data/quests';
import {
  getAtk,
  getDef,
  getMaxHp,
  getJustWindow,
  elementalHit,
  skillVal,
  DEF_K,
} from './equipment';
import {
  DODGE_INVULN,
  JUST_WINDOW,
  CRIT_MULT,
  ENRAGE_HP,
  ENRAGE_SPEED,
  ENRAGE_DMG,
} from '../data/balance';
import { refillMonsters } from './spawn';
import { sfx } from './audio';
import { damageNumber, shake, burst } from './fx';
import { updateHud } from '../ui/hud';
import { flash, showToast } from '../ui/toast';
import { closeList } from '../ui/list';
import { closeDex } from '../ui/dex';
import { closeAreaSelect } from '../ui/area';
import { closeEquip } from '../ui/equip';
import { closeQuests, completeQuest } from '../ui/quests';

// ---- 戦闘バランス（定数は data/balance に集約）----
export { DODGE_INVULN, JUST_WINDOW, CRIT_MULT, ENRAGE_HP, ENRAGE_SPEED, ENRAGE_DMG };

// ============================================================
//  戦闘
// ============================================================
export function startBattle(monster: Monster): void {
  runtime.mode = "battle";
  runtime.moveTarget = null;
  closeList();
  closeDex();
  closeAreaSelect();
  closeEquip();
  closeQuests();
  runtime.battle = {
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
function scheduleWeakPoint(): void {
  const battle = runtime.battle;
  if (!battle || battle.over) return;
  const wait = (battle.enraged ? 1400 : 2600) + Math.random() * 1500;
  battle.weakTimer = setTimeout(() => {
    const battle = runtime.battle;
    if (!battle || battle.over) return;
    battle.weakActive = true;
    el.weakPoint.classList.remove("hidden");
    el.monsterEmoji.classList.add("weak");
    sfx.weak();
    // 露出時間（怒り時は長め＝チャンス）
    const dur = battle.enraged ? 2000 : 1500;
    battle.weakTimer = setTimeout(() => {
      const battle = runtime.battle;
      if (!battle || battle.over) return;
      hideWeak();
      scheduleWeakPoint();
    }, dur);
  }, wait);
}
function hideWeak(): void {
  const battle = runtime.battle!;
  battle.weakActive = false;
  el.weakPoint.classList.add("hidden");
  el.monsterEmoji.classList.remove("weak");
}

// ---- モンスターの攻撃サイクル ----
function scheduleMonsterAttack(): void {
  const battle = runtime.battle;
  if (!battle || battle.over) return;
  let interval = battle.monster.interval + Math.random() * 600;
  if (battle.enraged) interval *= ENRAGE_SPEED;
  battle.attackTimer = setTimeout(() => {
    const battle = runtime.battle;
    if (!battle || battle.over) return;
    // 予告（この間に回避する）
    el.monsterTelegraph.classList.remove("hidden");
    sfx.telegraph();
    battle.telegraphTimer = setTimeout(() => {
      const battle = runtime.battle;
      if (!battle || battle.over) return;
      el.monsterTelegraph.classList.add("hidden");
      resolveMonsterHit();
      scheduleMonsterAttack();
    }, battle.monster.tele);
  }, interval);
}

function resolveMonsterHit(): void {
  const battle = runtime.battle!;
  const sinceDodge = performance.now() - battle.dodgePressedAt;
  if (battle.dodging && sinceDodge <= getJustWindow()) {
    // ジャスト回避！ → 反撃チャンス
    battle.counterReady = true;
    el.battleLog.textContent = "⚡ ジャスト回避！ 反撃チャンス！";
    flash(el.hunterEmoji, "just");
    sfx.just();
  } else if (battle.dodging) {
    el.battleLog.textContent = "回避成功";
    sfx.dodge();
  } else {
    let dmg = battle.monster.atk;
    if (battle.enraged) dmg = Math.round(dmg * ENRAGE_DMG);
    // 防御で軽減（def/(def+K) の割合カット、最低1ダメージ）
    const def = getDef();
    dmg = Math.max(1, Math.round(dmg * (1 - def / (def + DEF_K))));
    player.hp = Math.max(0, player.hp - dmg);
    el.battleLog.textContent = `${dmg} のダメージを受けた！`;
    flash(el.monsterEmoji);
    sfx.hurt();
    damageNumber(dmg, { player: true });
    shake(true);
    updateHud();
    updateBattleBars();
    if (player.hp <= 0) return playerDown();
  }
}

// ---- プレイヤーの攻撃 ----
export function playerAttack(): void {
  const battle = runtime.battle;
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
  } else if (Math.random() * 100 < skillVal("会心")) { // 会心スキル発動
    phys = Math.round(phys * CRIT_MULT);
    head = "会心！ ";
    crit = true;
  }

  // 属性ダメージ（弱点属性なら大きく加算）
  const e = elementalHit(battle.monster);
  const dmg = phys + e.dmg;
  let label = `${head}${dmg} のダメージ`;
  if (e.weak) label += `（${eleIcon(e.element)}弱点属性！）`;

  battle.hp = Math.max(0, battle.hp - dmg);
  el.battleLog.textContent = label;
  const big = crit || e.weak;
  flash(el.monsterEmoji, big ? "crit" : "hit");
  damageNumber(dmg, { crit, element: e.weak });
  burst(big);
  shake(big);
  if (big) sfx.crit(); else sfx.attack();
  updateBattleBars();
  maybeEnrage();
  if (battle.hp <= 0) monsterDown();
}

// ---- 回避 ----
export function playerDodge(): void {
  const battle = runtime.battle;
  if (!battle || battle.over) return;
  battle.dodging = true;
  battle.dodgePressedAt = performance.now();
  el.hunterEmoji.classList.add("dodging");
  setTimeout(() => {
    const battle = runtime.battle;
    if (!battle) return;
    battle.dodging = false;
    el.hunterEmoji.classList.remove("dodging");
  }, DODGE_INVULN);
}

// ---- 怒り状態への移行 ----
function maybeEnrage(): void {
  const battle = runtime.battle!;
  if (battle.enraged) return;
  if (battle.hp / battle.monster.maxHp <= ENRAGE_HP && battle.hp > 0) {
    battle.enraged = true;
    el.monsterEmoji.classList.add("enraged");
    showToast("🔥 怒り状態！\n攻撃が激しくなるが弱点が出やすい");
  }
}

function monsterDown(): void {
  endBattle();
  sfx.victory();
  const mon = runtime.battle!.monster;
  player.kills++;
  // 素材ドロップ（モンスター固有）
  player.mats[mon.material] = (player.mats[mon.material] || 0) + mon.mats;
  // 亜種はレア素材を追加ドロップ
  if (mon.variant) player.mats[RARE_MAT] = (player.mats[RARE_MAT] || 0) + 1;
  // 図鑑に記録（初討伐かどうか判定）
  const firstKill = !player.bestiary[mon.name];
  player.bestiary[mon.name] = (player.bestiary[mon.name] || 0) + 1;
  // クエスト進行
  let questMsg: string | null = null;
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
  runtime.monsters = runtime.monsters.filter((m) => m !== mon);
  refillMonsters();
  updateHud();
  save();
  const newArea = AREAS.find((a) => a.unlockKills === player.kills);
  if (questMsg) {
    showToast(questMsg);
  } else if (newArea) {
    showToast(`🗺️ 新エリア解放！\n${newArea.emoji} ${newArea.name} へ行けるように`);
  } else if (mon.variant) {
    showToast(`✨ 亜種を討伐！\n${mon.material}×${mon.mats}　${RARE_MAT}×1`);
  } else if (firstKill) {
    showToast(`✨ 新種発見！\n${mon.emoji} ${mon.name} を図鑑に登録`);
  } else {
    showToast(`🎉 ${mon.name} を討伐！\n${mon.material} ×${mon.mats}`);
  }
  runtime.battle = null;
}

function playerDown(): void {
  const mon = runtime.battle!.monster;
  endBattle();
  sfx.down();
  escapeFrom(mon);           // モンスターから離れて即再戦を防ぐ
  player.hp = getMaxHp();    // 力尽きたら全回復してキャンプに帰還
  updateHud();
  save();
  showToast("💤 力尽きた…\nキャンプで回復した");
  runtime.battle = null;
}

// ---- リタイア（戦闘から離脱）----
export function playerRetreat(): void {
  const battle = runtime.battle;
  if (!battle || battle.over) return;
  const mon = battle.monster;
  endBattle();
  sfx.ui();
  escapeFrom(mon);
  player.hp = getMaxHp();    // キャンプへ撤退して回復
  updateHud();
  save();
  showToast("🏳️ 戦闘から離脱した\nキャンプで回復した");
  runtime.battle = null;
}

// 戦ったモンスターから安全距離まで離れた位置にプレイヤーを戻す
function escapeFrom(mon: Monster): void {
  const dx = player.x - mon.x;
  const dy = player.y - mon.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 0.001 ? dx / d : 1;
  const uy = d > 0.001 ? dy / d : 0;
  const safe = ENCOUNTER_DIST + 120;
  player.x = mon.x + ux * safe;
  player.y = mon.y + uy * safe;
  runtime.moveTarget = null;
}

function endBattle(): void {
  const battle = runtime.battle!;
  battle.over = true;
  if (battle.attackTimer) clearTimeout(battle.attackTimer);
  if (battle.telegraphTimer) clearTimeout(battle.telegraphTimer);
  if (battle.weakTimer) clearTimeout(battle.weakTimer);
  el.monsterTelegraph.classList.add("hidden");
  el.weakPoint.classList.add("hidden");
  el.monsterEmoji.classList.remove("enraged", "weak");
  el.battle.classList.add("hidden");
  runtime.mode = "map";
}

function updateBattleBars(): void {
  const battle = runtime.battle!;
  el.monsterHp.style.width = (battle.hp / battle.monster.maxHp) * 100 + "%";
  el.battlePlayerHp.style.width = (player.hp / getMaxHp()) * 100 + "%";
}
