import { ctx } from './ui/dom';
import { player, runtime } from './state';
import { TILE, ENCOUNTER_DIST } from './data/monsters';

// ============================================================
//  マップ描画（エリアごとの雰囲気・地形・環境パーティクル・霧）
// ============================================================

interface Particle {
  color: string;
  glyph?: string;
  dir: 1 | -1; // 1=落下(雪/葉) / -1=上昇(火の粉/胞子)
  size: number;
  count: number;
  drift: number;
  speed: number;
}
interface Theme {
  sky: [string, string]; // 中心→外周のグラデ
  grid: string;
  scenery: string[];
  density: number; // 0..1（多いほど地形物が増える）
  particle: Particle;
  fog: string; // 周縁を暗く落とす色
}

const THEMES: Record<string, Theme> = {
  forest: {
    sky: ["#3a5a44", "#22382a"], grid: "rgba(255,255,255,0.04)",
    scenery: ["🌲", "🌿", "🍄", "🌱"], density: 0.34,
    particle: { color: "rgba(180,230,170,0.8)", glyph: "🍃", dir: 1, size: 14, count: 16, drift: 22, speed: 0.018 },
    fog: "rgba(10,22,14,0.55)",
  },
  jungle: {
    sky: ["#2f4a33", "#1a2e1f"], grid: "rgba(255,255,255,0.035)",
    scenery: ["🌴", "🌿", "🪨", "🍃"], density: 0.4,
    particle: { color: "rgba(150,210,140,0.6)", dir: -1, size: 2.4, count: 22, drift: 10, speed: 0.012 },
    fog: "rgba(8,18,10,0.6)",
  },
  volcano: {
    sky: ["#5a3330", "#2c1715"], grid: "rgba(255,180,120,0.05)",
    scenery: ["🪨", "🌋", "🦴", "🔥"], density: 0.3,
    particle: { color: "rgba(255,150,60,0.9)", dir: -1, size: 2.6, count: 28, drift: 14, speed: 0.03 },
    fog: "rgba(28,10,8,0.6)",
  },
  summit: {
    sky: ["#3a4a5e", "#1d2735"], grid: "rgba(200,225,255,0.06)",
    scenery: ["🪨", "🧊", "🗻", "❄️"], density: 0.3,
    particle: { color: "rgba(255,255,255,0.9)", dir: 1, size: 2.4, count: 34, drift: 18, speed: 0.022 },
    fog: "rgba(12,18,28,0.6)",
  },
  lava: {
    sky: ["#5e2a22", "#26100e"], grid: "rgba(255,140,90,0.06)",
    scenery: ["🌋", "🪨", "🔥", "💀"], density: 0.32,
    particle: { color: "rgba(255,120,40,1)", dir: -1, size: 3, count: 36, drift: 16, speed: 0.04 },
    fog: "rgba(30,8,6,0.66)",
  },
};
const FALLBACK = THEMES.forest;

// 安定したスキャッタ用のハッシュ（0..1）
function hash(ix: number, iy: number): number {
  let h = (ix * 374761393 + iy * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// プレイヤーの向き（移動方向）を追跡
let prevX = player.x, prevY = player.y, heading = 0;

export function render(): void {
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W / 2, cy = H / 2;
  const now = performance.now();
  const theme = THEMES[runtime.currentArea.id] || FALLBACK;

  // 向き更新（微小移動は無視）
  const mdx = player.x - prevX, mdy = player.y - prevY;
  if (Math.hypot(mdx, mdy) > 0.4) heading = Math.atan2(mdy, mdx);
  prevX = player.x; prevY = player.y;

  // ―― 背景（奥行きのある放射グラデ）――
  const sky = ctx.createRadialGradient(cx, cy * 0.8, 30, cx, cy, Math.max(W, H));
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // ―― 薄いグリッド（移動感）――
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  const ox = -(player.x % TILE), oy = -(player.y % TILE);
  for (let x = ox; x < W; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = oy; y < H; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ―― 地形オブジェクト（プレイヤーに追従してスクロール）――
  const CELL = 168;
  const cax = Math.floor((player.x - cx) / CELL) - 1;
  const cay = Math.floor((player.y - cy) / CELL) - 1;
  const cbx = Math.floor((player.x + cx) / CELL) + 1;
  const cby = Math.floor((player.y + cy) / CELL) + 1;
  for (let iy = cay; iy <= cby; iy++) {
    for (let ix = cax; ix <= cbx; ix++) {
      if (hash(ix, iy) > theme.density) continue;
      const wx = ix * CELL + hash(ix * 7 + 1, iy * 13 + 3) * CELL;
      const wy = iy * CELL + hash(ix * 11 + 5, iy * 17 + 9) * CELL;
      const sx = cx + (wx - player.x);
      const sy = cy + (wy - player.y);
      if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;
      const r = hash(ix * 3 + 2, iy * 5 + 4);
      const glyph = theme.scenery[Math.floor(r * theme.scenery.length)];
      const size = 22 + r * 18;
      // 影
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(sx, sy + size * 0.42, size * 0.34, size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      // 本体
      ctx.globalAlpha = 0.45 + r * 0.4;
      ctx.font = `${size}px serif`;
      ctx.fillText(glyph, sx, sy);
    }
  }
  ctx.globalAlpha = 1;

  // ―― 目的地マーカー（脈動）――
  if (runtime.moveTarget) {
    const tx = cx + (runtime.moveTarget.x - player.x);
    const ty = cy + (runtime.moveTarget.y - player.y);
    const pr = 9 + Math.sin(now / 180) * 3;
    ctx.strokeStyle = "rgba(232,163,61,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tx, ty, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(232,163,61,0.9)"; ctx.fill();
  }

  // ―― モンスター ――
  const t = now / 500;
  for (const m of runtime.monsters) {
    const mx = cx + (m.x - player.x);
    const my = cy + (m.y - player.y) + Math.sin(t + m.bob) * 4;
    if (mx < -60 || mx > W + 60 || my < -60 || my > H + 60) continue;
    const dist = Math.hypot(m.x - player.x, m.y - player.y);
    const near = dist < ENCOUNTER_DIST * 2.4; // 接近警告
    // 影
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(mx, my + 22, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // 索敵リング（亜種は金 / 接近時は脈動して赤く）
    const pulse = 30 + (near ? Math.sin(now / 120) * 4 : 0);
    ctx.lineWidth = near ? 2.5 : 1.5;
    ctx.strokeStyle = m.variant
      ? "rgba(255,210,80,0.8)"
      : near ? "rgba(255,90,70,0.85)" : "rgba(224,90,74,0.28)";
    ctx.beginPath(); ctx.arc(mx, my, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "40px serif";
    ctx.fillText(m.emoji, mx, my);
    if (m.variant) { ctx.font = "20px serif"; ctx.fillText("✨", mx + 22, my - 20); }
  }

  // ―― プレイヤー（中央・影・向き・遭遇範囲）――
  // 影
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(cx, cy + 22, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  // 遭遇範囲（脈動）
  const er = ENCOUNTER_DIST + Math.sin(now / 360) * 2;
  ctx.fillStyle = "rgba(77,184,164,0.16)";
  ctx.beginPath(); ctx.arc(cx, cy, er, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(120,220,200,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, er, 0, Math.PI * 2); ctx.stroke();
  // 向きインジケータ
  const hx = cx + Math.cos(heading) * (er + 8);
  const hy = cy + Math.sin(heading) * (er + 8);
  ctx.fillStyle = "rgba(120,220,200,0.85)";
  ctx.beginPath();
  ctx.arc(hx, hy, 4, 0, Math.PI * 2);
  ctx.fill();
  // 本体
  ctx.font = "42px serif";
  ctx.fillText("🧭", cx, cy);

  // ―― 環境パーティクル（前景）――
  drawParticles(theme.particle, W, H, now);

  // ―― 周縁の霧（ヴィネット）――
  const fog = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.32, cx, cy, Math.max(W, H) * 0.72);
  fog.addColorStop(0, "rgba(0,0,0,0)");
  fog.addColorStop(1, theme.fog);
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, W, H);
}

// 環境パーティクル（状態を持たず時間から決定的に算出）
function drawParticles(p: Particle, W: number, H: number, t: number): void {
  const span = H + 60;
  ctx.fillStyle = p.color;
  for (let i = 0; i < p.count; i++) {
    const s1 = hash(i * 131 + 7, 17);
    const s2 = hash(i * 271 + 3, 53);
    const prog = (t * p.speed + s1 * span) % span;
    const y = p.dir === 1 ? prog - 30 : H - prog + 30;
    const x = (s2 * W + Math.sin(t * 0.001 * (1 + s1) + i) * p.drift) % W;
    ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.0015 + i));
    if (p.glyph) {
      ctx.font = `${p.size}px serif`;
      ctx.fillText(p.glyph, (x + W) % W, y);
    } else {
      ctx.beginPath();
      ctx.arc((x + W) % W, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
