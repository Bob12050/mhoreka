import { el } from './dom';
import { player, runtime } from '../state';
import { getAtk, getDef, getMaxHp, totalMats } from '../systems/equipment';
import { updateQuestBanner } from './quests';

// ============================================================
//  HUD
// ============================================================
export function updateHud(): void {
  el.atkVal.textContent = String(getAtk());
  el.defVal.textContent = String(getDef());
  el.materials.textContent = String(totalMats());
  el.kills.textContent = String(player.kills);
  el.playerHpText.textContent = `${player.hp}/${getMaxHp()}`;
  el.areaEmoji.textContent = runtime.currentArea.emoji;
  el.areaName.textContent = runtime.currentArea.name;
  updateQuestBanner();
}
