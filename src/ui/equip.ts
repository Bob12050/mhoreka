import type { Weapon, Armor, GearKind, Cost } from '../types';
import { el } from './dom';
import { player, save } from '../state';
import { WEAPONS } from '../data/weapons';
import { ARMORS } from '../data/armors';
import { SKILLS, SLOTS } from '../data/skills';
import { eleIcon } from '../data/monsters';
import {
  matCount,
  canCraft,
  getMaxHp,
  skillPoints,
  skillLevel,
} from '../systems/equipment';
import { updateHud } from './hud';
import { showToast } from './toast';

// ============================================================
//  装備・生産
// ============================================================
export let equipTab = "weapon";

export function openEquip(): void {
  el.equip.classList.remove("hidden");
  renderEquip();
}
export function closeEquip(): void {
  el.equip.classList.add("hidden");
}

export function setEquipTab(tab: string): void {
  equipTab = tab;
  renderEquip();
}

// コスト表示（所持/必要、足りない素材は赤）
function costHtml(cost: Cost): string {
  const keys = Object.keys(cost);
  if (keys.length === 0) return '<span class="ok">素材不要</span>';
  return keys
    .map((m) => {
      const have = matCount(m);
      const need = cost[m];
      const cls = have >= need ? "ok" : "lack";
      return `<span class="${cls}">${m} ${have}/${need}</span>`;
    })
    .join("　");
}

function gearCard(item: Weapon | Armor, kind: GearKind): HTMLElement {
  const owned = !!player.owned[item.id];
  const equipped =
    kind === "weapon"
      ? player.weapon === item.id
      : player.armor[(item as Armor).slot] === item.id;

  const card = document.createElement("div");
  card.className = "gear-card" + (equipped ? " equipped" : "");

  const stat =
    kind === "weapon"
      ? `攻撃 ${(item as Weapon).atk}` + ((item as Weapon).ele ? `　${eleIcon((item as Weapon).element)}${(item as Weapon).ele}` : "")
      : `防御 ${(item as Armor).def}`;
  const sub = kind === "weapon" ? (item as Weapon).type : (item as Armor).slot;

  const top = document.createElement("div");
  top.className = "gear-top";
  top.innerHTML =
    `<div><span class="gear-name">${item.name}</span> ` +
    `<span class="gear-type">${sub}</span></div>` +
    `<div class="gear-stat">${stat}</div>`;
  card.appendChild(top);

  if (kind === "armor" && (item as Armor).skills) {
    const sk = document.createElement("div");
    sk.className = "gear-skill";
    sk.textContent = "スキル " + Object.entries((item as Armor).skills!).map(([s, p]) => `${s}+${p}`).join("　");
    card.appendChild(sk);
  }

  if (!owned) {
    const cost = document.createElement("div");
    cost.className = "gear-cost";
    cost.innerHTML = costHtml(item.cost);
    card.appendChild(cost);
  }

  const actions = document.createElement("div");
  actions.className = "gear-actions";
  if (equipped) {
    const tag = document.createElement("span");
    tag.className = "gear-btn owned-tag";
    tag.textContent = "✓ 装備中";
    actions.appendChild(tag);
  } else if (owned) {
    const b = document.createElement("button");
    b.className = "gear-btn equip";
    b.textContent = "装備する";
    b.addEventListener("click", () => equipItem(item, kind));
    actions.appendChild(b);
  } else {
    const b = document.createElement("button");
    b.className = "gear-btn craft";
    b.textContent = "生産する";
    b.disabled = !canCraft(item);
    b.addEventListener("click", () => craftItem(item, kind));
    actions.appendChild(b);
  }
  card.appendChild(actions);
  return card;
}

export function craftItem(item: Weapon | Armor, kind: GearKind): void {
  if (!canCraft(item)) return;
  for (const m in item.cost) player.mats[m] -= item.cost[m];
  player.owned[item.id] = true;
  equipItem(item, kind, true); // 生産したら自動装備
  updateHud();
  save();
  showToast(`🛠️ ${item.name} を生産！\nそのまま装備した`);
}

export function equipItem(item: Weapon | Armor, kind: GearKind, silent?: boolean): void {
  if (kind === "weapon") player.weapon = item.id;
  else player.armor[(item as Armor).slot] = item.id;
  player.hp = Math.min(player.hp, getMaxHp()); // 体力増強が下がった場合にクランプ
  updateHud();
  save();
  renderEquip();
  if (!silent) showToast(`${item.name} を装備した`);
}

function activeSkillsCard(): HTMLElement {
  const pts = skillPoints();
  const wrap = document.createElement("div");
  wrap.className = "skills-summary";
  const names = Object.keys(SKILLS).filter((s) => skillLevel(s, pts) > 0);
  if (names.length === 0) {
    wrap.innerHTML = `<div class="skills-title">発動スキル</div><div class="skills-none">なし（防具を装備するとスキルが発動）</div>`;
    return wrap;
  }
  const rows = names.map((s) => {
    const lv = skillLevel(s, pts);
    return `<div class="skill-row"><span>${s} Lv${lv}</span><span class="skill-eff">${SKILLS[s as keyof typeof SKILLS].desc(lv)}</span></div>`;
  }).join("");
  wrap.innerHTML = `<div class="skills-title">発動スキル</div>${rows}`;
  return wrap;
}

export function renderEquip(): void {
  el.equipBody.innerHTML = "";
  el.equipBody.appendChild(activeSkillsCard());

  if (equipTab === "weapon") {
    for (const w of WEAPONS) el.equipBody.appendChild(gearCard(w, "weapon"));
  } else if (equipTab === "armor") {
    for (const slot of SLOTS) {
      const group = document.createElement("div");
      group.className = "slot-group";
      const label = document.createElement("div");
      label.className = "slot-label";
      label.textContent = `― ${slot} ―`;
      group.appendChild(label);
      for (const a of ARMORS.filter((x) => x.slot === slot)) {
        group.appendChild(gearCard(a, "armor"));
      }
      el.equipBody.appendChild(group);
    }
  } else {
    // 素材一覧
    const names = Object.keys(player.mats).filter((n) => player.mats[n] > 0);
    if (names.length === 0) {
      const e = document.createElement("div");
      e.className = "mat-empty";
      e.textContent = "素材がありません。モンスターを討伐しよう！";
      el.equipBody.appendChild(e);
    } else {
      for (const n of names) {
        const row = document.createElement("div");
        row.className = "mat-row";
        row.innerHTML = `<span>${n}</span><span class="mat-qty">×${player.mats[n]}</span>`;
        el.equipBody.appendChild(row);
      }
    }
  }
}
