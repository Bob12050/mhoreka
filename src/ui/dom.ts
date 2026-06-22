// ---- DOM 参照（game.js の el オブジェクト相当）----
const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

export const canvas = $("map") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export const el = {
  atkVal: $("atk-val"),
  defVal: $("def-val"),
  materials: $("materials"),
  kills: $("kills"),
  killsItem: $("kills-item"),
  playerHpText: $("player-hp-text"),
  equipBtn: $("equip-btn"),
  equipClose: $("equip-close"),
  equip: $("equip"),
  equipBody: $("equip-body"),
  listToggle: $("list-toggle"),
  listClose: $("list-close"),
  monsterList: $("monster-list"),
  listBody: $("list-body"),
  dexToggle: $("dex-toggle"),
  dexClose: $("dex-close"),
  dex: $("dex"),
  dexBody: $("dex-body"),
  dexRate: $("dex-rate"),
  areaBanner: $("area-banner"),
  areaEmoji: $("area-emoji"),
  areaName: $("area-name"),
  areaSelect: $("area-select"),
  areaClose: $("area-close"),
  areaBody: $("area-body"),
  questToggle: $("quest-toggle"),
  questBanner: $("quest-banner"),
  questClose: $("quest-close"),
  quests: $("quests"),
  questBody: $("quest-body"),
  battle: $("battle"),
  monsterEmoji: $("monster-emoji"),
  monsterName: $("monster-name"),
  monsterWeak: $("monster-weak"),
  monsterHp: $("monster-hp"),
  monsterTelegraph: $("monster-telegraph"),
  weakPoint: $("weak-point"),
  battlePlayerHp: $("battle-player-hp"),
  hunterEmoji: $("hunter-emoji"),
  attackBtn: $("attack-btn"),
  dodgeBtn: $("dodge-btn"),
  battleLog: $("battle-log"),
  toast: $("toast"),
};

// ---- 画面サイズ ----
export function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
