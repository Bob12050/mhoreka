import type { SkillDef, SkillName } from '../types';

export const SLOTS = ["頭", "胴", "腕", "腰", "脚"];

// 防具スキル: per=1Lvに必要なポイント / max=最大Lv / val=Lvあたりの効果量
export const SKILLS: Record<SkillName, SkillDef> = {
  "攻撃":     { max: 5, per: 2, val: (l) => l * 3,  desc: (l) => `攻撃力 +${l * 3}` },
  "防御":     { max: 5, per: 2, val: (l) => l * 5,  desc: (l) => `防御力 +${l * 5}` },
  "体力増強": { max: 5, per: 2, val: (l) => l * 15, desc: (l) => `最大HP +${l * 15}` },
  "会心":     { max: 3, per: 3, val: (l) => l * 15, desc: (l) => `会心率 +${l * 15}%` },
  "回避性能": { max: 3, per: 3, val: (l) => l * 60, desc: (l) => `ジャスト回避猶予 +${l * 60}ms` },
};

export const DEF_K = 80; // 防御の軽減カーブ係数（大きいほど効きにくい）
