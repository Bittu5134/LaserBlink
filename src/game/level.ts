import type { Mirror, Rect, RectPiece, RoundPlan, Segment, Target, Vec2 } from './types';
import { traceBeam } from './beam';
import { evaluateShot, requiredHitsFor } from './scoring';
import { angleOf, normalize, sub } from './vec';

export const CANVAS = { w: 1000, h: 625 };
export const ARENA: Rect = { x: 9, y: 9, w: 982, h: 607 };

// The canvas fills the viewport, so the logical field follows the window shape.
// Geometry is only read while a page is generated, so mutating these in place
// keeps the beam, the renderer and the UI pointed at the same field.
export function setPlayfield(w: number, h: number) {
  const width = Math.max(480, Math.round(w));
  const height = Math.max(480, Math.round(h));
  // A wall band inside the screen, so a bounce is something you can see.
  const wall = 9;
  CANVAS.w = width;
  CANVAS.h = height;
  ARENA.x = wall;
  ARENA.y = wall;
  ARENA.w = width - wall * 2;
  ARENA.h = height - wall * 2;
}
export const TARGET_RADIUS = 32;

const PALETTE = [
  '#60a5fa', // 0: Sky Blue
  '#f87171', // 1: Coral Red
  '#c084fc', // 2: Lavender Purple
  '#3b82f6', // 3: Cobalt Blue
  '#fb923c', // 4: Vibrant Orange
  '#d6bb96', // 5: Kraft Tan
  '#facc15', // 6: Golden Yellow
];

// Reflections carry the difficulty: the page asks you to hold more bounces in
// your head, and targets only creep up a little alongside them.
const counts = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
const bounceCaps = [2, 3, 3, 4, 4, 5, 6, 7, 8, 9];
const MIN_TOLERANCE = 0.02;
const MAX_ATTEMPTS = 80;
const EPS_ARENA = 0.001;

export function targetCount(round: number): number {
  return counts[Math.min(round, counts.length) - 1];
}

function bounceCap(round: number): number {
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

export function seedForRound(runSeed: string, round: number, difficulty = 3): string {
  return `${runSeed}-${round}-d${clampDifficulty(difficulty)}`;
}

export function clampDifficulty(difficulty: number): number {
  const value = Number.isFinite(difficulty) ? difficulty : 3;
  return Math.min(5, Math.max(1, Math.round(value)));
}

// The slider picks how far up the ramp this run is allowed to go. Levels climb
// one rung at a time and stop at that ceiling.
const ceilings = [3, 5, 7, 9, 10];

export function difficultyCeiling(difficulty: number): number {
  return ceilings[clampDifficulty(difficulty) - 1];
}

function curveRound(round: number, difficulty: number): number {
  return Math.max(1, Math.min(round, difficultyCeiling(difficulty)));
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

function segmentProjection(p: Vec2, seg: Segment): { t: number; dist: number } {
  const ab = sub(seg.b, seg.a);
  const len2 = ab.x * ab.x + ab.y * ab.y;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - seg.a.x) * ab.x + (p.y - seg.a.y) * ab.y) / len2));
  return { t, dist: Math.hypot(p.x - (seg.a.x + ab.x * t), p.y - (seg.a.y + ab.y * t)) };
}

function distanceToMirror(p: Vec2, mirror: Mirror): number {
  const [a, b] = mirrorEndpoints(mirror);
  return segmentProjection(p, { a, b }).dist;
}

// How far along the route a point sits, measured from the player.
function distanceAlongPath(segments: Segment[], p: Vec2): number {
  let travelled = 0;
  let best = 0;
  let bestDist = Infinity;

  for (const seg of segments) {
    const len = dist(seg.a, seg.b);
    const projection = segmentProjection(p, seg);
    if (projection.dist < bestDist) {
      bestDist = projection.dist;
      best = travelled + projection.t * len;
    }
    travelled += len;
  }
  return best;
}

function rectCenter(rect: Rect): Vec2 {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  return (
    a.x < b.x + b.w + margin &&
    a.x + a.w + margin > b.x &&
    a.y < b.y + b.h + margin &&
    a.y + a.h + margin > b.y
  );
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

function blockOnPath(segments: Segment[], player: Vec2, placed: Rect[], rng: () => number): Rect | null {
  const floor =
    placed.length === 0 ? 0 : Math.max(...placed.map((rect) => distanceAlongPath(segments, rectCenter(rect)))) + 90;
  let travelled = 0;

  for (const seg of segments) {
    const len = dist(seg.a, seg.b);
    if (len < 230) {
      travelled += len;
      continue;
    }

    const t = 0.45 + rng() * 0.2;
    const along = travelled + t * len;
    travelled += len;
    if (along < floor) continue;

    const point = { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    if (dist(point, player) < 170) continue;

    const vertical = rng() < 0.5;
    const w = vertical ? 34 + rng() * 12 : 90 + rng() * 55;
    const h = vertical ? 90 + rng() * 55 : 34 + rng() * 12;
    const rect = { x: point.x - w / 2, y: point.y - h / 2, w, h };
    if (!rectInsideArena(rect, 8)) continue;
    if (placed.some((other) => rectsOverlap(rect, other, 24))) continue;
    return rect;
  }
  return null;
}

function mirrorOnPath(
  segments: Segment[],
  player: Vec2,
  obstacles: Rect[],
  placed: Mirror[],
  rng: () => number,
): Mirror | null {
  // A second panel has to sit further along the route than the first, so it
  // cannot cut the beam off before the earlier reflection happens.
  const floor =
    placed.length === 0 ? 0 : Math.max(...placed.map((mirror) => distanceAlongPath(segments, mirror.center))) + 70;
  let travelled = 0;

  for (const seg of segments) {
    const len = dist(seg.a, seg.b);
    if (len < 240) {
      travelled += len;
      continue;
    }

    const t = 0.4 + rng() * 0.2;
    const along = travelled + t * len;
    travelled += len;
    if (along < floor) continue;

    // Point away from both ends and the player.
    const point = { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    if (dist(point, player) < 190) continue;
    if (placed.some((other) => dist(point, other.center) < 175)) continue;

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

    if (halfLength < 18 || !pointInArena(a, 8) || !pointInArena(b, 8)) continue;
    // Keep the panel clear of blocks so it never hides inside one.
    if (obstacles.some((rect) => pointInRect(mirror.center, rect, Math.max(70, halfLength + 16)))) continue;
    return mirror;
  }
  return null;
}

// A dead zone that sits nowhere near the intended route: a bad shot dies in it.
function absorberOffPath(
  segments: Segment[],
  targets: Target[],
  player: Vec2,
  obstacles: Rect[],
  mirrors: Mirror[],
  rng: () => number,
): Rect | null {
  for (let i = 0; i < 40; i++) {
    const w = 62 + rng() * 54;
    const h = 30 + rng() * 24;
    const rect: Rect = {
      x: ARENA.x + 28 + rng() * Math.max(1, ARENA.w - w - 56),
      y: ARENA.y + 28 + rng() * Math.max(1, ARENA.h - h - 56),
      w,
      h,
    };

    if (!rectInsideArena(rect, 14)) continue;
    if (!pathClearOfRect(segments, rect, 70)) continue;

    const center = { x: rect.x + w / 2, y: rect.y + h / 2 };
    if (dist(center, player) < 150) continue;
    if (targets.some((target) => pointInRect(target.pos, rect, target.radius + 26))) continue;
    if (obstacles.some((block) => rectsOverlap(rect, block, 26))) continue;
    if (mirrors.some((mirror) => rectNearMirror(rect, mirror, 30))) continue;
    return rect;
  }
  return null;
}

function rectNearMirror(rect: Rect, mirror: Mirror, pad: number): boolean {
  const [a, b] = mirrorEndpoints(mirror);
  const along = Math.max(2, Math.ceil((Math.hypot(b.x - a.x, b.y - a.y) / 8)));
  for (let i = 0; i <= along; i++) {
    const t = i / along;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (x > rect.x - pad && x < rect.x + rect.w + pad && y > rect.y - pad && y < rect.y + rect.h + pad) {
      return true;
    }
  }
  return false;
}

// True when no point of the route comes within pad of the rect.
function pathClearOfRect(segments: Segment[], rect: Rect, pad: number): boolean {
  for (const seg of segments) {
    const len = dist(seg.a, seg.b);
    const steps = Math.max(2, Math.ceil(len / 9));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = seg.a.x + (seg.b.x - seg.a.x) * t;
      const y = seg.a.y + (seg.b.y - seg.a.y) * t;
      if (x > rect.x - pad && x < rect.x + rect.w + pad && y > rect.y - pad && y < rect.y + rect.h + pad) {
        return false;
      }
    }
  }
  return true;
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

// Most pages carry one panel; late rounds lean on two. Round four previews one.
function rollMirrorCount(round: number, rng: () => number): number {
  if (round < 4) return 0;
  if (round === 4) return rng() < 0.2 ? 1 : 0;

  const [zero, one] = round < 8 ? [0.18, 0.62] : [0.05, 0.5];
  const roll = rng();
  if (roll < zero) return 0;
  if (roll < zero + one) return 1;
  return 2;
}

function rollObstacleCount(round: number, rng: () => number): number {
  if (round < 3) return 0;
  if (round < 8) return 1;
  return rng() < 0.35 ? 2 : 1;
}

function generateCandidate(
  page: number,
  curve: number,
  rng: () => number,
  seed: string,
  mirrorCount: number,
  obstacleCount: number,
): RoundPlan | null {
  const count = targetCount(curve);
  const maxBounces = bounceCap(curve);
  const player = placePlayer(rng);
  const angle = rng() * Math.PI * 2;

  const empty = traceBeam(player, angle, ARENA, [], maxBounces);
  if (pathLength(empty.segments) < 520) return null;

  const obstacles: Rect[] = [];
  for (let i = 0; i < obstacleCount; i++) {
    const trace = traceBeam(player, angle, ARENA, obstacles, maxBounces);
    const block = blockOnPath(trace.segments, player, obstacles, rng);
    if (!block) return null;
    obstacles.push(block);
  }

  const mirrors: Mirror[] = [];
  for (let i = 0; i < mirrorCount; i++) {
    const trace = traceBeam(player, angle, ARENA, obstacles, maxBounces, mirrors);
    const mirror = mirrorOnPath(trace.segments, player, obstacles, mirrors, rng);
    if (!mirror) return null;
    mirrors.push(mirror);
  }

  const trace = traceBeam(player, angle, ARENA, obstacles, maxBounces, mirrors);

  const targets = placeTargetsOnPath(trace.segments, count, player, obstacles, mirrors, []);
  if (targets.length < count) return null;

  const absorbers: Rect[] = [];
  if (curve >= 7) {
    // A hazard parked away from the solved route. It only catches bad shots.
    const absorber = absorberOffPath(trace.segments, targets, player, obstacles, mirrors, rng);
    if (!absorber) return null;
    absorbers.push(absorber);
  }

  const pieces: RectPiece[] = [
    ...obstacles.map((rect) => ({ rect, kind: 'block' as const })),
    ...absorbers.map((rect) => ({ rect, kind: 'absorber' as const })),
  ];

  const plan: RoundPlan = {
    round: page,
    targets,
    player,
    obstacles,
    maxBounces,
    studySeconds: studySeconds(curve),
    solutionAngle: angle,
    requiredHits: requiredHitsFor(count),
    requiredBounces: maxBounces,
    angTolerance: toleranceFor(player, targets),
    mirrors,
    pieces,
    seed,
  };

  return validateRound(plan).valid ? plan : null;
}

// A plain horizontal route with pieces parked away from it. Used only if every
// seeded attempt fails, so a run can never wedge on a generated page.
function fallbackPlan(
  page: number,
  curve: number,
  seed: string,
  mirrorCount: number,
  obstacleCount: number,
): RoundPlan {
  const count = targetCount(curve);
  const maxBounces = bounceCap(curve);
  const player = { x: ARENA.x + 100, y: ARENA.y + ARENA.h * 0.52 };
  const angle = 0;

  const obstacles: Rect[] = [];
  if (obstacleCount >= 1) obstacles.push({ x: ARENA.x + ARENA.w * 0.52, y: ARENA.y + 26, w: 46, h: 128 });
  if (obstacleCount >= 2) obstacles.push({ x: ARENA.x + ARENA.w * 0.3, y: ARENA.y + ARENA.h - 96, w: 120, h: 46 });

  const mirrors: Mirror[] = [];
  if (mirrorCount >= 1) {
    mirrors.push({
      center: { x: ARENA.x + ARENA.w * 0.72, y: ARENA.y + ARENA.h - 28 },
      halfLength: 40,
      angle: 0.5,
    });
  }
  if (mirrorCount >= 2) {
    mirrors.push({ center: { x: ARENA.x + ARENA.w * 0.25, y: ARENA.y + 90 }, halfLength: 36, angle: 1.1 });
  }

  const absorbers: Rect[] = [];
  if (curve >= 7) {
    // Parked above the horizontal fallback route, never on it.
    absorbers.push({ x: ARENA.x + ARENA.w * 0.58, y: ARENA.y + 26, w: 92, h: 34 });
  }

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
    round: page,
    targets,
    player,
    obstacles,
    maxBounces,
    studySeconds: studySeconds(curve),
    solutionAngle: angle,
    requiredHits: requiredHitsFor(count),
    requiredBounces: maxBounces,
    angTolerance: toleranceFor(player, targets),
    mirrors,
    pieces,
    seed,
  };
}

export function absorberRects(plan: RoundPlan): Rect[] {
  return plan.pieces.filter((piece) => piece.kind === 'absorber').map((piece) => piece.rect);
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

  const absorbers = absorberRects(plan);
  const trace = traceBeam(
    plan.player,
    plan.solutionAngle,
    ARENA,
    plan.obstacles,
    plan.maxBounces,
    plan.mirrors,
    absorbers,
  );

  // The intended route never touches a dead zone, and it survives the whole field.
  if (trace.stopped === 'absorber') valid = false;
  if (trace.bounces.length < plan.requiredBounces) valid = false;
  for (const absorber of absorbers) {
    if (!pathClearOfRect(trace.segments, absorber, 30)) valid = false;
  }

  const hits = evaluateShot(plan.targets, trace.segments).filter((result) => result.hit).length;
  if (hits !== plan.targets.length) valid = false;

  return { valid, hits, tolerance };
}

export function generateRound(round: number, runSeed = 'PLAY', difficulty = 3): RoundPlan {
  const page = Math.max(1, Math.floor(round));
  const curve = curveRound(page, difficulty);
  const seed = seedForRound(runSeed, page, difficulty);
  const rng = mulberry32(hashSeed(seed));
  const mirrorCount = rollMirrorCount(curve, rng);
  const obstacleCount = rollObstacleCount(curve, rng);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const plan = generateCandidate(page, curve, rng, seed, mirrorCount, obstacleCount);
    if (plan) return plan;
  }

  return fallbackPlan(page, curve, seed, mirrorCount, obstacleCount);
}
