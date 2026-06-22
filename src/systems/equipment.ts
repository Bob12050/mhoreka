import type { MonsterType, ElementalHit, SkillName, Weapon, Armor } from '../types';
import { player } from '../state';
import { WEAPONS, weaponById } from '../data/weapons';
import { armorById } from '../data/armors';
import { SKILLS, SLOTS, DEF_K } from '../data/skills';
import {
  ELE_WEAK_MULT,
  ELE_RESIST_MULT,
  ELE_NEUTRAL_MULT,
} from '../data/monsters';
import { JUST_WINDOW } from '../data/balance';

export { JUST_WINDOW };

// ---- 防具スキル ----
export function skillPoints(): Record<string, number> {
  const pts: Record<string, number> = {};
  for (const slot of SLOTS) {
    const a = armorById(player.armor[slot]);
    if (a && a.skills) for (const s in a.skills) pts[s] = (pts[s] || 0) + (a.skills as Record<string, number>)[s];
  }
  return pts;
}
export function skillLevel(name: string, pts?: Record<string, number>): number {
  pts = pts || skillPoints();
  const def = SKILLS[name as SkillName];
  if (!def) return 0;
  return Math.min(def.max, Math.floor((pts[name] || 0) / def.per));
}
export function skillVal(name: string): number {
  const def = SKILLS[name as SkillName];
  return def ? def.val(skillLevel(name)) : 0;
}

// ---- 装備の派生値（武器＋スキル）----
export function getAtk(): number {
  return (weaponById(player.weapon) || WEAPONS[0]).atk + skillVal("攻撃");
}
export function getMaxHp(): number {
  return player.maxHp + skillVal("体力増強");
}
export function getJustWindow(): number {
  return JUST_WINDOW + skillVal("回避性能");
}
// 装備中の武器がそのモンスターに与える属性ダメージと、弱点を突いたか
export function elementalHit(monster: MonsterType): ElementalHit {
  const w = weaponById(player.weapon) || WEAPONS[0];
  if (!w.ele || w.element === "無") return { dmg: 0, weak: false, element: "無" };
  let mult = ELE_NEUTRAL_MULT;
  let weak = false;
  if (w.element === monster.weak) { mult = ELE_WEAK_MULT; weak = true; }
  else if (w.element === monster.resist) { mult = ELE_RESIST_MULT; }
  return { dmg: Math.round(w.ele * mult), weak, element: w.element };
}
export function getDef(): number {
  let d = skillVal("防御");
  for (const slot of SLOTS) {
    const id = player.armor[slot];
    if (id) d += (armorById(id)?.def || 0);
  }
  return d;
}
export function matCount(name: string): number {
  return player.mats[name] || 0;
}
export function totalMats(): number {
  let n = 0;
  for (const k in player.mats) n += player.mats[k];
  return n;
}
export function canCraft(item: Weapon | Armor): boolean {
  for (const m in item.cost) if (matCount(m) < item.cost[m]) return false;
  return true;
}

export { DEF_K };
