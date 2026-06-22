import type { Area } from '../types';
import { player } from '../state';

// ---- エリア（マップ）。unlockKills 体討伐で解放 ----
export const AREAS: Area[] = [
  { id: "forest", name: "始まりの森",   emoji: "🌿", bg: "#2f4a37", unlockKills: 0,
    pool: ["ドスジャギィ", "ドスファンゴ", "ドスランポス"] },
  { id: "jungle", name: "旧ジャングル", emoji: "🌴", bg: "#274a2f", unlockKills: 9,
    pool: ["イャンクック", "ゲリョス", "イャンガルルガ"] },
  { id: "volcano",name: "火山帯",       emoji: "🌋", bg: "#4a2f2f", unlockKills: 20,
    pool: ["リオレイア", "リオレウス", "ディアブロス"] },
  { id: "summit", name: "龍ノ頂",       emoji: "❄️", bg: "#2f3a4a", unlockKills: 32,
    pool: ["クシャルダオラ", "古龍"] },
  { id: "lava",   name: "獄炎の溶岩洞", emoji: "🔥", bg: "#2a1518", unlockKills: 44,
    pool: ["テオ・テスカトル", "ネルギガンテ"] },
];

export const areaUnlocked = (a: Area): boolean => player.kills >= a.unlockKills;
export const monsterArea = (name: string): Area | undefined =>
  AREAS.find((a) => a.pool.includes(name));
