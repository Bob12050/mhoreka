// ============================================================
//  型定義
// ============================================================

export type Element = '火' | '水' | '雷' | '龍' | '無';
// 弱点/耐性は属性キー（無は無し）。マップのキーは火/水/雷/龍。
export type EleKey = '火' | '水' | '雷' | '龍';

export interface MonsterType {
  emoji: string;
  name: string;
  hp: number;
  atk: number;
  mats: number;
  interval: number;
  tele: number;
  material: string;
  weak: EleKey;
  resist?: EleKey;
  art?: string; // public/img/monsters/<art>.png（無ければ絵文字）
  // 亜種で付与
  variant?: boolean;
  baseName?: string;
}

// マップ上のモンスター（生成時に座標などが付与される）
export interface Monster extends MonsterType {
  maxHp: number;
  x: number;
  y: number;
  bob: number;
}

export type Cost = Record<string, number>;

export interface Weapon {
  id: string;
  name: string;
  type: string;
  atk: number;
  ele: number;
  element: Element;
  cost: Cost;
}

export type SkillName = '攻撃' | '防御' | '体力増強' | '会心' | '回避性能';

export interface Armor {
  id: string;
  name: string;
  slot: string;
  def: number;
  skills?: Partial<Record<SkillName, number>>;
  cost: Cost;
}

export interface SkillDef {
  max: number;
  per: number;
  val: (l: number) => number;
  desc: (l: number) => string;
}

export interface Area {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  unlockKills: number;
  pool: string[];
}

export interface QuestReward {
  mats?: Record<string, number>;
  maxHp?: number;
}

export interface Quest {
  id: string;
  name: string;
  target: string;
  count: number;
  reward: QuestReward;
}

export interface ElementalHit {
  dmg: number;
  weak: boolean;
  element: Element;
}

export interface PlayerState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  kills: number;
  bestiary: Record<string, number>;
  mats: Record<string, number>;
  owned: Record<string, boolean>;
  weapon: string;
  armor: Record<string, string | null>;
  questActive: string | null;
  questProgress: number;
  questsDone: Record<string, boolean>;
}

export interface BattleState {
  monster: Monster;
  hp: number;
  dodging: boolean;
  dodgePressedAt: number;
  weakActive: boolean;
  counterReady: boolean;
  enraged: boolean;
  attackTimer: ReturnType<typeof setTimeout> | null;
  telegraphTimer: ReturnType<typeof setTimeout> | null;
  weakTimer: ReturnType<typeof setTimeout> | null;
  over: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export type GearKind = 'weapon' | 'armor';
