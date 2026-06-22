import { ctx } from './ui/dom';
import { player, runtime } from './state';
import { TILE, ENCOUNTER_DIST } from './data/monsters';

// ---- 描画 ----
export function render(): void {
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W / 2, cy = H / 2;

  // 背景（エリアごとの色）
  ctx.fillStyle = runtime.currentArea.bg;
  ctx.fillRect(0, 0, W, H);

  // グリッド（移動感を出す）
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const ox = -(player.x % TILE), oy = -(player.y % TILE);
  for (let x = ox; x < W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = oy; y < H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // 目的地マーカー
  if (runtime.moveTarget) {
    const tx = cx + (runtime.moveTarget.x - player.x);
    const ty = cy + (runtime.moveTarget.y - player.y);
    ctx.strokeStyle = "rgba(232,163,61,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tx, ty, 10, 0, Math.PI * 2); ctx.stroke();
  }

  // モンスター
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const t = performance.now() / 500;
  for (const m of runtime.monsters) {
    const mx = cx + (m.x - player.x);
    const my = cy + (m.y - player.y) + Math.sin(t + m.bob) * 4;
    if (mx < -60 || mx > W + 60 || my < -60 || my > H + 60) continue;
    // 索敵リング（亜種は金色）
    ctx.strokeStyle = m.variant ? "rgba(255,210,80,0.7)" : "rgba(224,90,74,0.25)";
    ctx.beginPath(); ctx.arc(mx, my, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "40px serif";
    ctx.fillText(m.emoji, mx, my);
    if (m.variant) {
      ctx.font = "20px serif";
      ctx.fillText("✨", mx + 22, my - 20);
    }
  }

  // プレイヤー（常に中央）
  ctx.fillStyle = "rgba(77,184,164,0.3)";
  ctx.beginPath(); ctx.arc(cx, cy, ENCOUNTER_DIST, 0, Math.PI * 2); ctx.fill();
  ctx.font = "42px serif";
  ctx.fillText("🧭", cx, cy);
}
