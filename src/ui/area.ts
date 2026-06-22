import type { Area } from '../types';
import { el } from './dom';
import { player, runtime, save } from '../state';
import { AREAS, areaUnlocked } from '../data/areas';
import { typeByName } from '../data/monsters';
import { refillMonsters } from '../systems/spawn';
import { updateHud } from './hud';
import { showToast } from './toast';

// ---- マップ選択 ----
export function openAreaSelect(): void {
  renderAreaSelect();
  el.areaSelect.classList.remove("hidden");
}
export function closeAreaSelect(): void {
  el.areaSelect.classList.add("hidden");
}

export function renderAreaSelect(): void {
  el.areaBody.innerHTML = "";
  for (const a of AREAS) {
    const unlocked = areaUnlocked(a);
    const isCurrent = a === runtime.currentArea;

    const li = document.createElement("li");
    li.className = "area-card" + (unlocked ? "" : " locked") + (isCurrent ? " current" : "");

    const emoji = document.createElement("div");
    emoji.className = "area-emoji-lg";
    emoji.textContent = unlocked ? a.emoji : "🔒";

    const info = document.createElement("div");
    info.className = "area-info";
    const title = document.createElement("div");
    title.className = "area-title";
    title.textContent = a.name;
    const mons = document.createElement("div");
    mons.className = "area-mons";
    mons.textContent = a.pool.map((n) => typeByName(n)!.emoji).join(" ");
    const state = document.createElement("div");
    state.className = "area-state";
    state.textContent = isCurrent
      ? "出撃中"
      : unlocked
      ? "タップして出撃"
      : `討伐 ${a.unlockKills} 体で解放（あと ${a.unlockKills - player.kills} 体）`;
    info.append(title, mons, state);

    li.append(emoji, info);
    if (unlocked && !isCurrent) {
      li.addEventListener("click", () => travelTo(a));
    }
    el.areaBody.appendChild(li);
  }
}

export function travelTo(a: Area): void {
  runtime.currentArea = a;
  runtime.moveTarget = null;
  runtime.monsters = [];
  refillMonsters();
  updateHud();
  save();
  closeAreaSelect();
  showToast(`${a.emoji} ${a.name} に到着！`);
}
