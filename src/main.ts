import './style.css';
import { registerSW } from 'virtual:pwa-register';

import { canvas, el, resize } from './ui/dom';
import { runtime, load, resetSave } from './state';
import { refillMonsters, updateMap, screenToWorld } from './systems/spawn';
import { render } from './render';
import { updateHud } from './ui/hud';
import { listState, openList, closeList } from './ui/list';
import { openDex, closeDex } from './ui/dex';
import { openAreaSelect, closeAreaSelect } from './ui/area';
import { openEquip, closeEquip, setEquipTab } from './ui/equip';
import { openQuests, closeQuests } from './ui/quests';
import { playerAttack, playerDodge } from './systems/combat';

// ---- 画面サイズ ----
window.addEventListener("resize", resize);
resize();

// ---- 入力: タップで移動 ----
canvas.addEventListener("pointerdown", (e) => {
  if (runtime.mode !== "map") return;
  runtime.moveTarget = screenToWorld(e.clientX, e.clientY);
});

// ---- 出現中モンスター一覧 ----
el.listToggle.addEventListener("click", () => (listState.open ? closeList() : openList()));
el.listClose.addEventListener("click", closeList);

// ---- 討伐図鑑 ----
el.dexToggle.addEventListener("click", openDex);
el.dexClose.addEventListener("click", closeDex);

// ---- マップ選択 ----
el.areaBanner.addEventListener("click", openAreaSelect);
el.areaClose.addEventListener("click", closeAreaSelect);

// ---- クエスト ----
el.questToggle.addEventListener("click", openQuests);
el.questClose.addEventListener("click", closeQuests);
el.questBanner.addEventListener("click", openQuests);

// ---- 装備・生産 ----
el.equipBtn.addEventListener("click", openEquip);
el.equipClose.addEventListener("click", closeEquip);
document.querySelectorAll<HTMLElement>(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    setEquipTab(btn.dataset.tab as string);
  });
});

// ---- 戦闘の入力 ----
el.attackBtn.addEventListener("click", playerAttack);
el.dodgeBtn.addEventListener("click", playerDodge);

// ---- メインループ ----
let lastT = performance.now();
function loop(now: number): void {
  const dt = Math.min((now - lastT) / 16.67, 3); // フレーム正規化
  lastT = now;
  if (runtime.mode === "map") updateMap(dt);
  render();
  requestAnimationFrame(loop);
}

// ---- 開始 ----
load();          // 前回の進行を復元（エリアもここで確定）
refillMonsters();
updateHud();
requestAnimationFrame(loop);

// HUDの討伐数（🏆）を長押しでセーブリセット（確認あり）
let resetPressTimer: ReturnType<typeof setTimeout> | null = null;
el.killsItem.addEventListener("pointerdown", () => {
  resetPressTimer = setTimeout(() => {
    if (confirm("セーブデータをリセットしますか？")) {
      resetSave();
      location.reload();
    }
  }, 1200);
});
el.killsItem.addEventListener("pointerup", () => { if (resetPressTimer) clearTimeout(resetPressTimer); });
el.killsItem.addEventListener("pointerleave", () => { if (resetPressTimer) clearTimeout(resetPressTimer); });

// ---- PWA: Service Worker 登録（vite-plugin-pwa が自動更新）----
registerSW({ immediate: true });
