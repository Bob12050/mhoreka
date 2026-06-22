import type { PlayerState, Monster, Area, BattleState, Point } from './types';
import { AREAS } from './data/areas';
import { SLOTS } from './data/skills';
import { weaponById } from './data/weapons';
import { armorById } from './data/armors';
import { questById } from './data/quests';

// ---- ゲーム状態 ----
export const player: PlayerState = {
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

// ---- ランタイム状態（複数モジュールから読み書き）----
// 再代入が必要な値はゲッタ／セッタ経由で共有する。
export const runtime = {
  moveTarget: null as Point | null, // {x, y} 目的地
  monsters: [] as Monster[],        // マップ上のモンスター
  currentArea: AREAS[0] as Area,    // 現在のエリア
  mode: "map" as "map" | "battle",  // "map" | "battle"
  battle: null as BattleState | null, // 戦闘中の状態
};

// ---- セーブ / ロード（localStorage に進行を保存）----
const SAVE_KEY = "mhoreka-save-v1";
export function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hp: player.hp, maxHp: player.maxHp,
      kills: player.kills, bestiary: player.bestiary,
      mats: player.mats, owned: player.owned,
      weapon: player.weapon, armor: player.armor,
      questActive: player.questActive, questProgress: player.questProgress,
      questsDone: player.questsDone,
      area: runtime.currentArea.id,
    }));
  } catch (e) { /* プライベートモード等は無視 */ }
}
export function load(): void {
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
    if (a) runtime.currentArea = a;
  } catch (e) { /* 壊れたデータは無視 */ }
}
export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
