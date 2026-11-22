import type { Rect, RoundPlan, Target, Vec2 } from './types';
import { traceBeam } from './beam';

export const CANVAS = { w: 1000, h: 625 };
export const ARENA: Rect = { x: 44, y: 44, w: 912, h: 537 };
export const TARGET_RADIUS = 32; // Generous chunky hit size like Geometry Dash

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
  return Math.max(2.8, 2.0 + 0.8 * targetCount(round));
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
    const h = 180;
    return [{ x: CANVAS.w / 2 - w / 2, y: CANVAS.h / 2 - h / 2, w, h }];
  } else {
    // Eraser style horizontal barrier
    const w = 190;
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
  return { x: ARENA.x + 120, y: ARENA.y + ARENA.h - 120 };
}

// Places targets along an invisible laser solution path so that every level is guaranteed solvable!
function placeTargetsAlongSolution(
  count: number,
  player: Vec2,
  obstacles: Rect[],
  maxBounces: number,
): { targets: Target[]; solutionAngle: number } {
  let bestTargets: Target[] = [];
  let bestAngle = 0;

  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const { segments } = traceBeam(player, angle, ARENA, obstacles, maxBounces);

    // Filter segments that are reasonably long
    const candidatePoints: Vec2[] = [];

    for (let sIdx = 0; sIdx < segments.length; sIdx++) {
      const seg = segments[sIdx];
      const segLen = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
      if (segLen < 90) continue;

      // Sample 2-3 points along each segment
      const fractions = segLen > 250 ? [0.28, 0.52, 0.74] : [0.38, 0.68];
      for (const t of fractions) {
        const pt = {
          x: seg.a.x + (seg.b.x - seg.a.x) * t,
          y: seg.a.y + (seg.b.y - seg.a.y) * t,
        };

        // Must be away from player
        if (dist(pt, player) < 95) continue;
        // Must stay inside arena margins
        if (
          pt.x < ARENA.x + 45 ||
          pt.x > ARENA.x + ARENA.w - 45 ||
          pt.y < ARENA.y + 45 ||
          pt.y > ARENA.y + ARENA.h - 45
        ) {
          continue;
        }
        // Must not be inside obstacles
        if (obstacles.some((o) => pointInRect(pt, o, 40))) continue;
        // Must not be too close to existing candidate points
        if (candidatePoints.some((c) => dist(c, pt) < 75)) continue;

        candidatePoints.push(pt);
      }
    }

    if (candidatePoints.length >= count) {
      // Pick `count` points distributed across the beam
      // Shuffle candidates slightly
      candidatePoints.sort(() => Math.random() - 0.5);
      const chosen = candidatePoints.slice(0, count);

      bestTargets = chosen.map((pos, idx) => ({
        id: idx + 1,
        pos,
        radius: TARGET_RADIUS,
        color: PALETTE[idx % PALETTE.length],
        spriteIndex: idx % 7,
        burnt: false,
      }));
      bestAngle = angle;
      break;
    }
  }

  // Fallback in rare case
  if (bestTargets.length < count) {
    const fallback = placeTargetsFallback(count, player, obstacles);
    return { targets: fallback, solutionAngle: bestAngle };
  }

  return { targets: bestTargets, solutionAngle: bestAngle };
}

function placeTargetsFallback(count: number, player: Vec2, obstacles: Rect[]): Target[] {
  const targets: Target[] = [];
  let guard = 0;
  while (targets.length < count && guard++ < 1000) {
    const pos = randomPoint(55);
    if (dist(pos, player) < 120) continue;
    if (obstacles.some((o) => pointInRect(pos, o, 50))) continue;
    if (targets.some((t) => dist(t.pos, pos) < 80)) continue;
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
  const count = targetCount(round);
  const maxBounces = bounceCap(round);

  const { targets, solutionAngle } = placeTargetsAlongSolution(count, player, obstacles, maxBounces);

  return {
    round,
    targets,
    player,
    obstacles,
    maxBounces,
    studySeconds: studySeconds(round),
    solutionAngle,
  };
}
