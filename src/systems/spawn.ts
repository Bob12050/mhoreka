import type { Monster } from '../types';
import { player, runtime } from '../state';
import {
  typeByName,
  toVariant,
  VARIANT_MIN_KILLS,
  VARIANT_CHANCE,
  MONSTER_COUNT,
  MONSTER_SPREAD,
  MONSTER_MIN_DIST,
  PLAYER_SPEED,
  ENCOUNTER_DIST,
} from '../data/monsters';
import { listState, updateListDistances } from '../ui/list';
import { startBattle } from './combat';

// ---- モンスター生成 ----
export function spawnMonster(): Monster {
  const pool = runtime.currentArea.pool;
  let t = typeByName(pool[Math.floor(Math.random() * pool.length)])!;
  // 一定の進行度から、たまに亜種が出現
  if (player.kills >= VARIANT_MIN_KILLS && Math.random() < VARIANT_CHANCE) {
    t = toVariant(t);
  }
  const angle = Math.random() * Math.PI * 2;
  const dist = MONSTER_MIN_DIST + Math.random() * MONSTER_SPREAD;
  return {
    ...t,
    maxHp: t.hp,
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    bob: Math.random() * Math.PI * 2,
  };
}
export function refillMonsters(): void {
  while (runtime.monsters.length < MONSTER_COUNT) runtime.monsters.push(spawnMonster());
}

// ---- 入力: タップで移動 ----
export function screenToWorld(sx: number, sy: number): { x: number; y: number } {
  return {
    x: player.x + (sx - window.innerWidth / 2),
    y: player.y + (sy - window.innerHeight / 2),
  };
}

export function updateMap(dt: number): void {
  // プレイヤー移動
  if (runtime.moveTarget) {
    const dx = runtime.moveTarget.x - player.x;
    const dy = runtime.moveTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      runtime.moveTarget = null;
    } else {
      const step = Math.min(PLAYER_SPEED * dt, d);
      player.x += (dx / d) * step;
      player.y += (dy / d) * step;
    }
  }
  // 遭遇判定
  for (const m of runtime.monsters) {
    if (Math.hypot(m.x - player.x, m.y - player.y) < ENCOUNTER_DIST) {
      startBattle(m);
      break;
    }
  }
  // 一覧を開いている間は距離をライブ更新（約0.2秒ごと）
  if (listState.open) {
    listState.accum += dt;
    if (listState.accum > 12) {
      listState.accum = 0;
      updateListDistances();
    }
  }
}
