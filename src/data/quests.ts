import type { Quest } from '../types';
import { typeByName } from './monsters';

// ---- クエスト（狩猟依頼）----
// target を count 体討伐で達成。reward.mats=素材, reward.maxHp=最大HP増加（初回のみ）
export const QUESTS: Quest[] = [
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
  // 亜種クエスト（レア素材が狙える）
  { id: "qv1", name: "蒼炎の悪魔",     target: "リオレウス亜種", count: 1, reward: { mats: { "竜の宝玉": 1 } } },
  { id: "qv2", name: "黒き宝玉",       target: "古龍亜種",       count: 1, reward: { mats: { "竜の宝玉": 2 }, maxHp: 30 } },
];

export const questById = (id: string | null): Quest | undefined =>
  QUESTS.find((q) => q.id === id);
export const questBase = (q: Quest): string =>
  q.target.endsWith("亜種") ? q.target.slice(0, -2) : q.target;
export const questEmoji = (q: Quest): string => {
  const t = typeByName(questBase(q));
  return t ? t.emoji : "❓";
};
