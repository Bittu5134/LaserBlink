import type { Mirror, Rect, RectPiece, RoundPlan, Segment, Target, Vec2 } from './types';
import { traceBeam } from './beam';
import { evaluateShot, requiredHitsFor } from './scoring';
import { angleOf, normalize, sub } from './vec';

export const CANVAS = { w: 1000, h: 625 };
export const ARENA: Rect = { x: 44, y: 44, w: 912, h: 537 };
export const TARGET_RADIUS = 32;

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
const MIN_TOLERANCE = 0.02;
const MAX_ATTEMPTS = 80;
const EPS_ARENA = 0.001;

export function targetCount(round: number): number {
  return counts[Math.min(round, counts.length) - 1];
}

export function bounceCap(round: number): number {
  return bounceCaps[Math.min(round, bounceCaps.length) - 1];
}

export function studySeconds(round: number): number {
  return Math.max(2.8, 2.0 + 0.8 * targetCount(round));
}

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Only run ids use browser randomness. Round generation itself is seeded.
export function createRunSeed(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let seed = '';
  for (const byte of bytes) seed += alphabet[byte % alphabet.length];
  return seed;
}

export function seedForRound(runSeed: string, round: number): string {
  return `${runSeed}-${round}`;
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInRect(p: Vec2, r: Rect, pad = 0): boolean {
  return p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
}

function pointInArena(p: Vec2, margin = 0): boolean {
  return (
    p.x >= ARENA.x + margin &&
    p.x <= ARENA.x + ARENA.w - margin &&
    p.y >= ARENA.y + margin &&
    p.y <= ARENA.y + ARENA.h - margin
  );
}

function rectInsideArena(r: Rect, margin = 4): boolean {
  return (
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.w) &&
    Number.isFinite(r.h) &&
    r.w > 0 &&
    r.h > 0 &&
    r.x >= ARENA.x + margin &&
    r.y >= ARENA.y + margin &&
    r.x + r.w <= ARENA.x + ARENA.w - margin &&
    r.y + r.h <= ARENA.y + ARENA.h - margin
  );
}

function rotate(v: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function pathLength(segments: Segment[]): number {
  let total = 0;
  for (const seg of segments) total += dist(seg.a, seg.b);
  return total;
}

function pointAtDistance(segments: Segment[], distance: number): Vec2 | null {
  let left = distance;
  for (const seg of segments) {
    const len = dist(seg.a, seg.b);
    if (left <= len) {
      const t = len === 0 ? 0 : left / len;
      return { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    }
    left -= len;
  }
  return null;
}

function mirrorEndpoints(mirror: Mirror): [Vec2, Vec2] {
  const dx = Math.cos(mirror.angle) * mirror.halfLength;
  const dy = Math.sin(mirror.angle) * mirror.halfLength;
  return [
    { x: mirror.center.x - dx, y: mirror.center.y - dy },
    { x: mirror.center.x + dx, y: mirror.center.y + dy },
  ];
}

function distanceToMirror(p: Vec2, mirror: Mirror): number {
  const [a, b] = mirrorEndpoints(mirror);
  const ab = sub(b, a);
  const len2 = ab.x * ab.x + ab.y * ab.y;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / len2));
  return Math.hypot(p.x - (a.x + ab.x * t), p.y - (a.y + ab.y * t));
}

function placePlayer(rng: () => number): Vec2 {
  for (let i = 0; i < 80; i++) {
    const p = {
      x: ARENA.x + 110 + rng() * (ARENA.w - 220),
      y: ARENA.y + 110 + rng() * (ARENA.h - 220),
    };
    if (pointInArena(p, 100)) return p;
  }
  return { x: ARENA.x + 130, y: ARENA.y + ARENA.h - 130 };
}

function blockOnPath(segments: Segment[], player: Vec2, rng: () => number): Rect | null {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const len = dist(seg.a, seg.b);
    if (len < 230) continue;

    const t = 0.45 + rng() * 0.2;
    const point = { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    if (dist(point, player) < 170) continue;

    const vertical = rng() < 0.5;
    const w = vertical ? 34 + rng() * 12 : 90 + rng() * 55;
    const h = vertical ? 90 + rng() * 55 : 34 + rng() * 12;
    const rect = { x: point.x - w / 2, y: point.y - h / 2, w, h };
    if (!rectInsideArena(rect, 8)) continue;
    return rect;
  }
  return null;
}

function mirrorOnPath(segments: Segment[], player: Vec2, rng: () => number): Mirror | null {
  const usable = segments.filter((seg) => dist(seg.a, seg.b) > 210);
  if (usable.length === 0) return null;

  for (const seg of usable) {
    const len = dist(seg.a, seg.b);
    const t = 0.4 + rng() * 0.2;
    // Point away from both ends and the player.
    const point = { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    if (dist(point, player) < 190) continue;

    const incoming = normalize(sub(seg.b, seg.a));
    const turn = (0.7 + rng() * 1.1) * (rng() < 0.5 ? -1 : 1);
    const outgoing = rotate(incoming, turn);
    const normal = normalize(sub(outgoing, incoming));
    const lineAngle = angleOf(normal) + Math.PI / 2;
    let halfLength = 38 + rng() * 16;
    const mirror: Mirror = { center: point, halfLength, angle: lineAngle };
    let [a, b] = mirrorEndpoints(mirror);

    while (!pointInArena(a, 8) || !pointInArena(b, 8)) {
      halfLength *= 0.75;
      if (halfLength < 18) break;
      mirror.halfLength = halfLength;
      [a, b] = mirrorEndpoints(mirror);
    }

    if (halfLength >= 18 && pointInArena(a, 8) && pointInArena(b, 8) && len > 240) {
      return mirror;
    }
  }
  return null;
}

function absorberOnPath(segments: Segment[], player: Vec2, count: number, rng: () => number): Rect | null {
  const total = pathLength(segments);
  const minBefore = count * 85 + 180;
  if (total < minBefore + 70) return null;

  const distance = Math.min(total - 55, Math.max(minBefore, total * 0.82));
  const point = pointAtDistance(segments, distance);
  if (!point || !pointInArena(point, 55) || dist(point, player) < 220) return null;

  const w = 58 + rng() * 26;
  const h = 24 + rng() * 8;
  const rect = { x: point.x - w / 2, y: point.y - h / 2, w, h };
  if (!rectInsideArena(rect, 12)) return null;
  return rect;
}

function makeTargets(positions: Vec2[]): Target[] {
  return positions.map((pos, index) => ({
    id: index + 1,
    pos,
    radius: TARGET_RADIUS,
    color: PALETTE[index % PALETTE.length],
    spriteIndex: index % 7,
    burnt: false,
  }));
}

function placeTargetsOnPath(
  segments: Segment[],
  count: number,
  player: Vec2,
  obstacles: Rect[],
  mirrors: Mirror[],
  absorbers: Rect[],
): Target[] {
  const total = pathLength(segments);
  if (total < count * 70 + 100) return [];

  const bouncePoints = segments.map((seg) => seg.b);
  const candidates: Vec2[] = [];

  for (let d = 70; d <= total - 40; d += 64) {
    const p = pointAtDistance(segments, d);
    if (!p) continue;
    if (!pointInArena(p, 50)) continue;
    if (dist(p, player) < 125) continue;
    if (obstacles.some((o) => pointInRect(p, o, TARGET_RADIUS + 12))) continue;
    if (absorbers.some((o) => pointInRect(p, o, TARGET_RADIUS + 12))) continue;
    if (mirrors.some((m) => distanceToMirror(p, m) < TARGET_RADIUS + 14)) continue;
    if (bouncePoints.some((b) => dist(p, b) < 62)) continue;
    if (candidates.some((c) => dist(c, p) < 72)) continue;
    candidates.push(p);
  }

  if (candidates.length < count) return [];

  const positions: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const index = count === 1 ? 0 : Math.round((i * (candidates.length - 1)) / (count - 1));
    positions.push(candidates[index]);
  }
  return makeTargets(positions);
}

function toleranceFor(player: Vec2, targets: Target[]): number {
  let nearest = Infinity;
  for (const target of targets) nearest = Math.min(nearest, dist(player, target.pos));
  const raw = Math.atan((TARGET_RADIUS * 0.65) / Math.max(110, nearest));
  return Math.max(MIN_TOLERANCE, Math.min(0.06, raw));
}

function generateCandidate(round: number, rng: () => number, seed: string): RoundPlan | null {
  const count = targetCount(round);
  const maxBounces = bounceCap(round);
  const player = placePlayer(rng);
  const angle = rng() * Math.PI * 2;

  const empty = traceBeam(player, angle, ARENA, [], maxBounces);
  if (pathLength(empty.segments) < 520) return null;

  const obstacles: Rect[] = [];
  if (round >= 3) {
    const block = blockOnPath(empty.segments, player, rng);
    if (!block) return null;
    obstacles.push(block);
  }

  const mirrors: Mirror[] = [];
  if (round >= 5) {
    const beforeMirror = traceBeam(player, angle, ARENA, obstacles, maxBounces);
    const mirror = mirrorOnPath(beforeMirror.segments, player, rng);
    if (!mirror) return null;
    mirrors.push(mirror);
  }

  const absorbers: Rect[] = [];
  if (round >= 7) {
    const beforeAbsorber = traceBeam(player, angle, ARENA, obstacles, maxBounces, mirrors);
    const absorber = absorberOnPath(beforeAbsorber.segments, player, count, rng);
    if (!absorber) return null;
    absorbers.push(absorber);
  }

  const trace = traceBeam(player, angle, ARENA, obstacles, maxBounces, mirrors, absorbers);
  if (round >= 7 && trace.stopped !== 'absorber') return null;

  const targets = placeTargetsOnPath(trace.segments, count, player, obstacles, mirrors, absorbers);
  if (targets.length < count) return null;

  const pieces: RectPiece[] = [
    ...obstacles.map((rect) => ({ rect, kind: 'block' as const })),
    ...absorbers.map((rect) => ({ rect, kind: 'absorber' as const })),
  ];

  const plan: RoundPlan = {
    round,
    targets,
    player,
    obstacles,
    maxBounces,
    studySeconds: studySeconds(round),
    solutionAngle: angle,
    requiredHits: requiredHitsFor(count),
    angTolerance: toleranceFor(player, targets),
    mirrors,
    pieces,
    seed,
  };

  return validateRound(plan).valid ? plan : null;
}

// A plain horizontal route with pieces parked away from it. Used only if every
// seeded attempt fails, so a run can never wedge on a generated page.
function fallbackPlan(round: number, seed: string): RoundPlan {
  const count = targetCount(round);
  const maxBounces = bounceCap(round);
  const player = { x: ARENA.x + 100, y: ARENA.y + ARENA.h * 0.52 };
  const angle = 0;

  const obstacles: Rect[] = [];
  if (round >= 3) obstacles.push({ x: ARENA.x + ARENA.w * 0.52, y: ARENA.y + 26, w: 46, h: 128 });

  const mirrors: Mirror[] = [];
  if (round >= 5) {
    mirrors.push({
      center: { x: ARENA.x + ARENA.w * 0.72, y: ARENA.y + ARENA.h - 28 },
      halfLength: 40,
      angle: 0.5,
    });
  }

  const absorbers: Rect[] = [];
  if (round >= 7) absorbers.push({ x: ARENA.x + ARENA.w - 140, y: ARENA.y + 28, w: 80, h: 24 });

  const trace = traceBeam(player, angle, ARENA, obstacles, maxBounces, mirrors, absorbers);
  let targets = placeTargetsOnPath(trace.segments, count, player, obstacles, mirrors, absorbers);

  if (targets.length < count) {
    // Straight-line targets on the guaranteed horizontal first leg.
    const start = player.x + 130;
    const end = ARENA.x + ARENA.w - 60;
    const step = count === 1 ? 0 : (end - start) / (count - 1);
    const positions = Array.from({ length: count }, (_, i) => ({
      x: count === 1 ? (start + end) / 2 : start + step * i,
      y: player.y,
    }));
    targets = makeTargets(positions);
  }

  const pieces: RectPiece[] = [
    ...obstacles.map((rect) => ({ rect, kind: 'block' as const })),
    ...absorbers.map((rect) => ({ rect, kind: 'absorber' as const })),
  ];

  return {
    round,
    targets,
    player,
    obstacles,
    maxBounces,
    studySeconds: studySeconds(round),
    solutionAngle: angle,
    requiredHits: requiredHitsFor(count),
    angTolerance: toleranceFor(player, targets),
    mirrors,
    pieces,
    seed,
  };
}

export function validateRound(plan: RoundPlan): { valid: boolean; hits: number; tolerance: number } {
  const tolerance = plan.angTolerance;
  let valid =
    Number.isFinite(plan.solutionAngle) &&
    Number.isFinite(plan.maxBounces) &&
    plan.maxBounces >= 0 &&
    plan.targets.length > 0 &&
    plan.requiredHits > 0 &&
    plan.requiredHits <= plan.targets.length &&
    Number.isFinite(tolerance) &&
    tolerance > 0 &&
    pointInArena(plan.player, 0);

  for (const target of plan.targets) {
    if (!pointInArena(target.pos, target.radius * 0.5) || !Number.isFinite(target.radius)) valid = false;
  }

  for (const rect of plan.obstacles) {
    if (!rectInsideArena(rect, 0)) valid = false;
  }

  for (const piece of plan.pieces) {
    if (!rectInsideArena(piece.rect, 0)) valid = false;
    if (piece.kind !== 'block' && piece.kind !== 'absorber') valid = false;
  }

  for (const mirror of plan.mirrors) {
    if (!Number.isFinite(mirror.halfLength) || mirror.halfLength <= 0) valid = false;
    if (!Number.isFinite(mirror.angle)) valid = false;
    const [a, b] = mirrorEndpoints(mirror);
    if (!pointInArena(a, -EPS_ARENA) || !pointInArena(b, -EPS_ARENA)) valid = false;
  }

  const absorbers = plan.pieces.filter((piece) => piece.kind === 'absorber').map((piece) => piece.rect);
  const trace = traceBeam(
    plan.player,
    plan.solutionAngle,
    ARENA,
    plan.obstacles,
    plan.maxBounces,
    plan.mirrors,
    absorbers,
  );
  const hits = evaluateShot(plan.targets, trace.segments).filter((result) => result.hit).length;
  if (hits !== plan.targets.length) valid = false;

  return { valid, hits, tolerance };
}

export function generateRound(round: number, runSeed = 'PLAY'): RoundPlan {
  const safeRound = Math.max(1, Math.floor(round));
  const seed = seedForRound(runSeed, safeRound);
  const rng = mulberry32(hashSeed(seed));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const plan = generateCandidate(safeRound, rng, seed);
    if (plan) return plan;
  }

  return fallbackPlan(safeRound, seed);
}
