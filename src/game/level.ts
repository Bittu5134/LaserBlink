import type { Rect, RoundPlan, Target, Vec2 } from './types';

export const CANVAS = { w: 1000, h: 625 };
export const ARENA: Rect = { x: 44, y: 44, w: 912, h: 537 };
export const TARGET_RADIUS = 30; // Generous chunky hit size like Geometry Dash

export const PALETTE = [
  '#60a5fa', // 0: Sky Blue
  '#f87171', // 1: Coral Red
  '#c084fc', // 2: Lavender Purple
  '#3b82f6', // 3: Cobalt Blue
  '#fb923c', // 4: Vibrant Orange
  '#d6bb96', // 5: Kraft Tan
  '#facc15', // 6: Golden Yellow
];

const counts = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7];
const bounceCaps = [3, 3, 4, 4, 5, 5, 6, 6, 6, 7];

export function targetCount(round: number): number {
  return counts[Math.min(round, counts.length) - 1];
}

export function bounceCap(round: number): number {
  return bounceCaps[Math.min(round, bounceCaps.length) - 1];
}

export function studySeconds(round: number): number {
  return Math.max(2.4, 1.8 + 0.7 * targetCount(round));
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInRect(p: Vec2, r: Rect, pad = 0): boolean {
  return p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
}

function randomPoint(margin: number): Vec2 {
  return {
    x: ARENA.x + margin + Math.random() * (ARENA.w - margin * 2),
    y: ARENA.y + margin + Math.random() * (ARENA.h - margin * 2),
  };
}

function makeObstacles(round: number): Rect[] {
  if (round < 5) return [];
  if (round % 2 === 1) {
    // Wooden ruler style vertical barrier
    const w = 48;
    const h = 170;
    return [{ x: CANVAS.w / 2 - w / 2, y: CANVAS.h / 2 - h / 2, w, h }];
  } else {
    // Eraser style horizontal barrier
    const w = 180;
    const h = 48;
    return [{ x: CANVAS.w / 2 - w / 2, y: CANVAS.h / 2 - h / 2, w, h }];
  }
}

function placePlayer(obstacles: Rect[]): Vec2 {
  for (let i = 0; i < 200; i++) {
    const p = randomPoint(100);
    if (obstacles.some((o) => pointInRect(p, o, 80))) continue;
    return p;
  }
  return { x: ARENA.x + 100, y: ARENA.y + ARENA.h - 100 };
}

function placeTargets(count: number, player: Vec2, obstacles: Rect[]): Target[] {
  const targets: Target[] = [];
  let guard = 0;

  while (targets.length < count && guard++ < 3000) {
    const pos = randomPoint(50);
    if (dist(pos, player) < 140) continue;
    if (obstacles.some((o) => pointInRect(pos, o, 55))) continue;
    if (targets.some((t) => dist(t.pos, pos) < 85)) continue;

    const spriteIndex = targets.length % 7;
    targets.push({
      id: targets.length + 1,
      pos,
      radius: TARGET_RADIUS,
      color: PALETTE[spriteIndex],
      spriteIndex,
      burnt: false,
    });
  }

  return targets;
}

export function generateRound(round: number): RoundPlan {
  const obstacles = makeObstacles(round);
  const player = placePlayer(obstacles);
  const targets = placeTargets(targetCount(round), player, obstacles);

  return {
    round,
    targets,
    player,
    obstacles,
    maxBounces: bounceCap(round),
    studySeconds: studySeconds(round),
  };
}
