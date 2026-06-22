// ============================================================
//  戦闘エフェクト（ダメージ数字・画面シェイク・ヒット粒子）
//  すべて #battle オーバーレイ上のDOMで完結。画像素材は不要。
// ============================================================
import { el } from '../ui/dom';

type DmgOpts = { crit?: boolean; player?: boolean; element?: boolean };

// 浮かび上がるダメージ数字
export function damageNumber(text: string | number, opts: DmgOpts = {}): void {
  const n = document.createElement("div");
  n.className =
    "dmg-num" +
    (opts.crit ? " crit" : "") +
    (opts.player ? " ply" : "") +
    (opts.element ? " ele" : "");
  n.textContent = String(text);
  const jitter = Math.random() * 50 - 25;
  n.style.left = `calc(50% + ${jitter}px)`;
  n.style.top = opts.player ? "64%" : "28%";
  el.battle.appendChild(n);
  setTimeout(() => n.remove(), 950);
}

// 画面シェイク
export function shake(big = false): void {
  const cls = big ? "shake-b" : "shake-s";
  el.battle.classList.remove("shake-s", "shake-b");
  void el.battle.offsetWidth; // reflow でアニメ再start
  el.battle.classList.add(cls);
  setTimeout(() => el.battle.classList.remove(cls), 420);
}

// モンスター中心からヒット粒子を飛ばす
export function burst(crit = false): void {
  const r = el.monsterEmoji.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const count = crit ? 16 : 9;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle" + (crit ? " crit" : "");
    const ang = Math.random() * Math.PI * 2;
    const dist = (crit ? 40 : 24) + Math.random() * (crit ? 80 : 46);
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
    el.battle.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }
}
