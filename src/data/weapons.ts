import type { Weapon } from '../types';

// ============================================================
//  武器（モンハン準拠の生産＆装備）
//  element=武器属性 / ele=属性値（0は無属性）
// ============================================================
export const WEAPONS: Weapon[] = [
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
  // 最上位（亜種のレア素材が必要）
  { id: "w_relic_db",   name: "覇玉の双剣",   type: "双剣",   atk: 82, ele: 28, element: "龍", cost: { "竜の宝玉": 3, "古龍の血": 2 } },
  // 覇玉シリーズ（属性違い・亜種狩り用／竜の宝玉が必要）
  { id: "w_relic_ls",   name: "覇玉の太刀",   type: "太刀",   atk: 78, ele: 30, element: "火", cost: { "竜の宝玉": 2, "火竜の鱗": 4 } },
  { id: "w_relic_bow",  name: "覇玉の弓",     type: "弓",     atk: 74, ele: 34, element: "水", cost: { "竜の宝玉": 2, "角竜の甲殻": 4 } },
  { id: "w_relic_hammer",name:"覇玉の鎚",     type: "ハンマー",atk: 84, ele: 30, element: "雷", cost: { "竜の宝玉": 2, "鋼龍の翼": 4 } },
  // 獄炎の溶岩洞の素材で作る最終武器
  { id: "w_teostra_gs", name: "炎王剣",       type: "大剣",   atk: 90, ele: 34, element: "火", cost: { "炎王龍の鬣": 3, "竜の宝玉": 2 } },
  { id: "w_nerg_ls",    name: "滅尽の太刀",   type: "太刀",   atk: 96, ele: 32, element: "龍", cost: { "滅尽龍の角": 3, "竜の宝玉": 2 } },
];

export const weaponById = (id: string): Weapon | undefined =>
  WEAPONS.find((w) => w.id === id);
