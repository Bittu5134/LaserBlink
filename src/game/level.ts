import type { Rect, RoundPlan, Target, Vec2 } from './types';

export const ARENA: Rect = { x: 30, y: 30, w: 940, h: 565 };
export const CANVAS = { w: 1000, h: 625 };
export const TARGET_RADIUS = 24;
export const PALETTE = ['#fde047', '#86efac', '#c4b5fd', '#38bdf8', '#ffb199'];

const counts = [2, 2, 3, 3, 4, 4, 5, 5];
const bounceCaps = [3, 3, 3, 3, 4, 4, 5, 5];

export function targetCount(round: number): number {
  return counts[Math.min(round, counts.length) - 1];
}

export function bounceCap(round: number): number {
  return bounceCaps[Math.min(round, bounceCaps.length) - 1];
}

export function studySeconds(round: number): number {
  return 2 + 1.2 * targetCount(round);
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
  if (round < 7) return [];
  const vertical = round % 2 === 1;
  const w = vertical ? 64 : 168;
  const h = vertical ? 168 : 64;
  return [{ x: CANVAS.w / 2 - w / 2, y: CANVAS.h / 2 - h / 2, w, h }];
}

function placePlayer(obstacles: Rect[]): Vec2 {
  for (let i = 0; i < 200; i++) {
    const p = randomPoint(110);
    if (obstacles.some((o) => pointInRect(p, o, 70))) continue;
    return p;
  }
  return { x: ARENA.x + 120, y: ARENA.y + ARENA.h - 120 };
}

function placeTargets(count: number, player: Vec2, obstacles: Rect[]): Target[] {
  const targets: Target[] = [];
  let guard = 0;

  while (targets.length < count && guard++ < 3000) {
    const pos = randomPoint(64);
    if (dist(pos, player) < 150) continue;
    if (obstacles.some((o) => pointInRect(pos, o, 44))) continue;
    if (targets.some((t) => dist(t.pos, pos) < 92)) continue;
    targets.push({
      id: targets.length + 1,
      pos,
      radius: TARGET_RADIUS,
      color: PALETTE[targets.length % PALETTE.length],
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

export function ringRadii(radius: number): number[] {
  return [radius, radius * 2, radius * 3];
}
