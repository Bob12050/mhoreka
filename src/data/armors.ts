import type { Armor } from '../types';

export const ARMORS: Armor[] = [
  // レザー装備（序盤・始まりの森）
  { id: "a_leather_head", name: "レザーヘルム",  slot: "頭", def: 2, skills: { "体力増強": 1 }, cost: { "ジャギィの皮": 2 } },
  { id: "a_leather_body", name: "レザーメイル",  slot: "胴", def: 3, skills: { "防御": 2 },     cost: { "ジャギィの皮": 3 } },
  { id: "a_leather_arm",  name: "レザーアーム",  slot: "腕", def: 2, skills: { "攻撃": 1 },     cost: { "ファンゴの剛牙": 2 } },
  { id: "a_leather_waist",name: "レザーコイル",  slot: "腰", def: 2, skills: { "体力増強": 1 }, cost: { "ファンゴの剛牙": 2 } },
  { id: "a_leather_leg",  name: "レザーグリーヴ", slot: "脚", def: 2, skills: { "回避性能": 1 }, cost: { "ランポスの鱗": 2 } },
  // クック装備（中盤・旧ジャングル）
  { id: "a_kut_head", name: "クック【兜】", slot: "頭", def: 5, skills: { "攻撃": 2 },     cost: { "クックの耳殻": 3, "ゲリョスの皮": 1 } },
  { id: "a_kut_body", name: "クック【鎧】", slot: "胴", def: 6, skills: { "体力増強": 2 }, cost: { "クックの耳殻": 4, "ゲリョスの皮": 2 } },
  { id: "a_kut_arm",  name: "クック【腕】", slot: "腕", def: 5, skills: { "攻撃": 2 },     cost: { "ゲリョスの皮": 3 } },
  { id: "a_kut_waist",name: "クック【帯】", slot: "腰", def: 5, skills: { "回避性能": 2 }, cost: { "黒狼鳥の翼": 2 } },
  { id: "a_kut_leg",  name: "クック【脚】", slot: "脚", def: 5, skills: { "会心": 2 },     cost: { "黒狼鳥の翼": 2, "クックの耳殻": 1 } },
  // 火竜装備（終盤・火山帯）攻撃寄り
  { id: "a_rath_head", name: "リオソウル【兜】", slot: "頭", def: 8, skills: { "攻撃": 3 },     cost: { "火竜の鱗": 3, "雌火竜の鱗": 1 } },
  { id: "a_rath_body", name: "リオソウル【鎧】", slot: "胴", def: 9, skills: { "攻撃": 3 },     cost: { "火竜の鱗": 4, "角竜の甲殻": 2 } },
  { id: "a_rath_arm",  name: "リオソウル【腕】", slot: "腕", def: 8, skills: { "会心": 2 },     cost: { "火竜の鱗": 3 } },
  { id: "a_rath_waist",name: "リオソウル【帯】", slot: "腰", def: 8, skills: { "体力増強": 2 }, cost: { "角竜の甲殻": 3 } },
  { id: "a_rath_leg",  name: "リオソウル【脚】", slot: "脚", def: 8, skills: { "攻撃": 2 },     cost: { "火竜の鱗": 3, "角竜の甲殻": 1 } },
  // 覇玉装備（最上位・亜種のレア素材が必要）
  { id: "a_relic_head", name: "覇玉ノ兜", slot: "頭", def: 12, skills: { "会心": 3 }, cost: { "竜の宝玉": 2 } },
  { id: "a_relic_body", name: "覇玉ノ鎧", slot: "胴", def: 14, skills: { "攻撃": 4 }, cost: { "竜の宝玉": 2, "古龍の血": 2 } },
  { id: "a_relic_leg",  name: "覇玉ノ脚", slot: "脚", def: 12, skills: { "回避性能": 3 }, cost: { "竜の宝玉": 2 } },
];

export const armorById = (id: string | null | undefined): Armor | undefined =>
  ARMORS.find((a) => a.id === id);
