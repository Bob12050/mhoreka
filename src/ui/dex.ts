import { el } from './dom';
import { player } from '../state';
import { MONSTER_TYPES, eleIcon } from '../data/monsters';
import { strengthStars } from './list';

// ---- 討伐図鑑 ----
export function openDex(): void {
  renderDex();
  el.dex.classList.remove("hidden");
}
export function closeDex(): void {
  el.dex.classList.add("hidden");
}

export function renderDex(): void {
  const found = MONSTER_TYPES.filter((t) => player.bestiary[t.name]).length;
  el.dexRate.textContent = `（${found}/${MONSTER_TYPES.length}種）`;

  el.dexBody.innerHTML = "";
  for (const t of MONSTER_TYPES) {
    const count = player.bestiary[t.name] || 0;
    const discovered = count > 0;

    const li = document.createElement("li");
    li.className = "dex-card " + (discovered ? "found" : "unknown");

    const emoji = document.createElement("div");
    emoji.className = "dex-emoji";
    emoji.textContent = discovered ? t.emoji : "❓";

    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = discovered ? t.name : "？？？";

    const meta = document.createElement("div");
    meta.className = "dex-meta";
    meta.textContent = discovered
      ? `討伐 ${count}　強さ ${strengthStars(t.hp)}　弱点 ${eleIcon(t.weak)}${t.weak}`
      : "未討伐";

    li.append(emoji, name, meta);
    el.dexBody.appendChild(li);
  }
}
