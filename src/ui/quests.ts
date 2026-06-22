import type { Quest } from '../types';
import { el } from './dom';
import { player } from '../state';
import { QUESTS, questById, questBase, questEmoji } from '../data/quests';
import { monsterArea, areaUnlocked } from '../data/areas';
import { VARIANT_MIN_KILLS } from '../data/monsters';
import { getMaxHp } from '../systems/equipment';
import { updateHud } from './hud';
import { save } from '../state';
import { showToast } from './toast';

// ============================================================
//  クエスト
// ============================================================
export function questAvailable(q: Quest): boolean {
  const a = monsterArea(questBase(q));
  if (!a || !areaUnlocked(a)) return false;
  // 亜種クエストは亜種が出現する進行度から
  if (q.target.endsWith("亜種") && player.kills < VARIANT_MIN_KILLS) return false;
  return true;
}

export function completeQuest(q: Quest): string {
  let rewardTxt = "";
  if (q.reward.mats) {
    for (const m in q.reward.mats) player.mats[m] = (player.mats[m] || 0) + q.reward.mats[m];
    rewardTxt = Object.entries(q.reward.mats).map(([m, n]) => `${m}×${n}`).join("　");
  }
  let hpTxt = "";
  if (q.reward.maxHp && !player.questsDone[q.id]) {
    player.maxHp += q.reward.maxHp;
    player.hp = getMaxHp();
    hpTxt = `\n最大HP +${q.reward.maxHp}！`;
  }
  player.questsDone[q.id] = true;
  player.questActive = null;
  player.questProgress = 0;
  return `📜 クエスト達成！「${q.name}」\n報酬 ${rewardTxt}${hpTxt}`;
}

export function acceptQuest(q: Quest): void {
  player.questActive = q.id;
  player.questProgress = 0;
  updateHud();
  save();
  renderQuests();
  closeQuests();
  showToast(`📜 クエストを受注\n「${q.name}」`);
}
export function abandonQuest(): void {
  player.questActive = null;
  player.questProgress = 0;
  updateHud();
  save();
  renderQuests();
}

export function openQuests(): void {
  renderQuests();
  el.quests.classList.remove("hidden");
}
export function closeQuests(): void {
  el.quests.classList.add("hidden");
}

export function rewardText(q: Quest): string {
  const parts: string[] = [];
  if (q.reward.mats) for (const m in q.reward.mats) parts.push(`${m}×${q.reward.mats[m]}`);
  if (q.reward.maxHp) parts.push(`最大HP+${q.reward.maxHp}`);
  return parts.join("　");
}

export function renderQuests(): void {
  el.questBody.innerHTML = "";
  for (const q of QUESTS) {
    const isActive = player.questActive === q.id;
    const avail = questAvailable(q);
    const done = !!player.questsDone[q.id];

    const card = document.createElement("div");
    card.className = "quest-card" + (isActive ? " active" : "");

    const top = document.createElement("div");
    top.className = "quest-top";
    top.innerHTML =
      `<span class="quest-name">${q.name}</span>` +
      (done ? `<span class="quest-clear">✓クリア済</span>` : "");
    card.appendChild(top);

    const tgt = document.createElement("div");
    tgt.className = "quest-target";
    tgt.textContent = `${questEmoji(q)} ${q.target} を ${q.count}頭討伐`;
    card.appendChild(tgt);

    const rew = document.createElement("div");
    rew.className = "quest-reward";
    rew.textContent = "報酬: " + rewardText(q);
    card.appendChild(rew);

    const actions = document.createElement("div");
    actions.className = "quest-actions";
    if (isActive) {
      const prog = document.createElement("span");
      prog.className = "quest-prog";
      prog.textContent = `進行中 ${player.questProgress}/${q.count}`;
      const ab = document.createElement("button");
      ab.className = "quest-btn abandon";
      ab.textContent = "やめる";
      ab.addEventListener("click", abandonQuest);
      actions.append(prog, ab);
    } else if (!avail) {
      const lock = document.createElement("span");
      lock.className = "quest-lock";
      lock.textContent = "🔒 エリア未解放";
      actions.appendChild(lock);
    } else {
      const b = document.createElement("button");
      b.className = "quest-btn accept";
      b.textContent = "受注する";
      b.disabled = !!player.questActive;
      if (player.questActive) b.textContent = "他を受注中";
      b.addEventListener("click", () => acceptQuest(q));
      actions.appendChild(b);
    }
    card.appendChild(actions);
    el.questBody.appendChild(card);
  }
}

export function updateQuestBanner(): void {
  if (player.questActive) {
    const q = questById(player.questActive)!;
    el.questBanner.textContent = `📜 ${questEmoji(q)}${q.target} ${player.questProgress}/${q.count}`;
    el.questBanner.classList.remove("hidden");
  } else {
    el.questBanner.classList.add("hidden");
  }
}
