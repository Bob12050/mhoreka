import type { MonsterType, EleKey, Element } from '../types';

// ---- 定数（マップ/移動/出現）----
export const TILE = 64; // マップの1マスのピクセル
export const PLAYER_SPEED = 3.4; // 1フレームの移動量
export const ENCOUNTER_DIST = 36; // この距離まで近づくと戦闘
export const MONSTER_COUNT = 7; // マップ上の同時出現数
export const MONSTER_SPREAD = 360; // モンスターをばらまく範囲（プレイヤー中心）
export const MONSTER_MIN_DIST = 130; // モンスターが湧く最短距離

// interval=攻撃間隔(ms) / tele=回避受付の長さ(ms)。小さいほど手強い。
// material=ドロップ素材名 / mats=ドロップ個数 / weak=弱点属性 / resist=耐性属性
export const MONSTER_TYPES: MonsterType[] = [
  // ―― 序盤（始まりの森） ――
  { emoji: "🦎", name: "ドスジャギィ",   hp: 420,  atk: 30, mats: 2, interval: 2100, tele: 780, material: "ジャギィの皮",   weak: "火", art: "jaggi" },
  { emoji: "🐗", name: "ドスファンゴ",   hp: 500,  atk: 34, mats: 2, interval: 1900, tele: 720, material: "ファンゴの剛牙", weak: "火", art: "fango" },
  { emoji: "🦕", name: "ドスランポス",   hp: 560,  atk: 38, mats: 3, interval: 1500, tele: 560, material: "ランポスの鱗",   weak: "雷", art: "rampos" },
  // ―― 中盤（旧ジャングル） ――
  { emoji: "🦤", name: "イャンクック",   hp: 780,  atk: 40, mats: 3, interval: 1700, tele: 640, material: "クックの耳殻",   weak: "水", art: "kut" },
  { emoji: "🦩", name: "ゲリョス",       hp: 900,  atk: 44, mats: 3, interval: 1600, tele: 600, material: "ゲリョスの皮",   weak: "火", art: "geryos" },
  { emoji: "🦅", name: "イャンガルルガ", hp: 1050, atk: 50, mats: 4, interval: 1500, tele: 560, material: "黒狼鳥の翼",     weak: "雷", resist: "火", art: "garuga" },
  // ―― 終盤（火山帯） ――
  { emoji: "🐉", name: "リオレイア",     hp: 1200, atk: 56, mats: 4, interval: 1900, tele: 680, material: "雌火竜の鱗",     weak: "龍", resist: "火", art: "rathian" },
  { emoji: "🦖", name: "リオレウス",     hp: 1400, atk: 62, mats: 5, interval: 1800, tele: 650, material: "火竜の鱗",       weak: "龍", resist: "火", art: "rathalos" },
  { emoji: "🐃", name: "ディアブロス",   hp: 1650, atk: 70, mats: 5, interval: 2000, tele: 700, material: "角竜の甲殻",     weak: "水", resist: "火", art: "diablos" },
  // ―― 最終（龍ノ頂） ――
  { emoji: "🌪️", name: "クシャルダオラ", hp: 2200, atk: 76, mats: 6, interval: 1700, tele: 620, material: "鋼龍の翼",       weak: "雷", resist: "龍", art: "kushala" },
  { emoji: "🐲", name: "古龍",           hp: 3400, atk: 90, mats: 8, interval: 1900, tele: 640, material: "古龍の血",       weak: "龍", resist: "火", art: "koryu" },
  // ―― 極限（獄炎の溶岩洞） ――
  { emoji: "🔥", name: "テオ・テスカトル", hp: 3800, atk: 95,  mats: 8, interval: 1800, tele: 620, material: "炎王龍の鬣", weak: "水", resist: "火", art: "teostra" },
  { emoji: "🦔", name: "ネルギガンテ",     hp: 4400, atk: 105, mats: 9, interval: 1700, tele: 600, material: "滅尽龍の角", weak: "龍", art: "nergigante" },
];
export const typeByName = (n: string): MonsterType | undefined =>
  MONSTER_TYPES.find((t) => t.name === n);

// ---- 亜種（強化変異個体）----
export const RARE_MAT = "竜の宝玉"; // 亜種が落とすレア素材
export const VARIANT_CHANCE = 0.16; // 出現抽選
export const VARIANT_MIN_KILLS = 9; // 旧ジャングル解放後から出現
export const VARIANT_WEAK_SHIFT: Record<EleKey, EleKey> = {
  火: "水",
  水: "火",
  雷: "龍",
  龍: "雷",
};
export function toVariant(t: MonsterType): MonsterType {
  return {
    ...t,
    variant: true,
    name: t.name + "亜種",
    baseName: t.name,
    hp: Math.round(t.hp * 1.7),
    atk: Math.round(t.atk * 1.35),
    mats: t.mats + 2,
    weak: VARIANT_WEAK_SHIFT[t.weak] || t.weak, // 弱点が変化
    resist: t.weak, // 元の弱点が耐性に
  };
}

// ---- 属性 ----
export const ELE_ICON: Record<EleKey, string> = { 火: "🔥", 水: "💧", 雷: "⚡", 龍: "🐲" };
export const eleIcon = (e: Element | EleKey | undefined): string =>
  e ? (ELE_ICON as Record<string, string>)[e] || "" : "";
export const ELE_WEAK_MULT = 1.6; // 弱点を突いたときの属性倍率
export const ELE_RESIST_MULT = 0.2; // 耐性のときの属性倍率
export const ELE_NEUTRAL_MULT = 0.8; // それ以外
