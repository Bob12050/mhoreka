import type { Monster } from '../types';
import { el } from './dom';
import { player, runtime } from '../state';

// ---- 出現中モンスター一覧 ----
export const listState = {
  open: false,
  accum: 0,
};
let listRows: { m: Monster; distEl: HTMLElement }[] = [];

export function distTo(m: { x: number; y: number }): number {
  return Math.hypot(m.x - player.x, m.y - player.y);
}
export function strengthStars(hp: number): string {
  if (hp <= 55) return "★";
  if (hp <= 95) return "★★";
  if (hp <= 150) return "★★★";
  if (hp <= 200) return "★★★★";
  return "★★★★★";
}

export function openList(): void {
  listState.open = true;
  el.monsterList.classList.remove("hidden");
  renderMonsterList();
}
export function closeList(): void {
  listState.open = false;
  el.monsterList.classList.add("hidden");
}

export function renderMonsterList(): void {
  const sorted = runtime.monsters
    .map((m) => ({ m, d: distTo(m) }))
    .sort((a, b) => a.d - b.d);

  el.listBody.innerHTML = "";
  listRows = [];

  if (sorted.length === 0) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "周辺にモンスターがいません";
    el.listBody.appendChild(li);
    return;
  }

  for (const { m, d } of sorted) {
    const li = document.createElement("li");
    li.className = "list-row";

    const emoji = document.createElement("div");
    emoji.className = "list-emoji";
    emoji.textContent = m.emoji;

    const info = document.createElement("div");
    info.className = "list-info";
    const name = document.createElement("div");
    name.className = "list-name";
    name.textContent = m.name;
    const sub = document.createElement("div");
    sub.className = "list-sub";
    sub.textContent = "強さ " + strengthStars(m.maxHp);
    info.append(name, sub);

    const distEl = document.createElement("div");
    distEl.className = "list-dist";
    distEl.textContent = Math.round(d) + "m";

    li.append(emoji, info, distEl);
    li.addEventListener("click", () => {
      runtime.moveTarget = { x: m.x, y: m.y }; // タップで自動移動
      closeList();
    });
    el.listBody.appendChild(li);
    listRows.push({ m, distEl });
  }
}

// 距離だけを定期更新（並び替えはせず、スクロール位置を保つ）
export function updateListDistances(): void {
  for (const r of listRows) {
    r.distEl.textContent = Math.round(distTo(r.m)) + "m";
  }
}
