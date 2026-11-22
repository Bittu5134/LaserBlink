import { describe, expect, it } from 'vitest';
import { ARENA, TARGET_RADIUS, createRunSeed, generateRound, seedForRound, targetCount, validateRound } from './level';
import { traceBeam } from './beam';
import { evaluateShot, requiredHitsFor } from './scoring';
import type { Mirror, Rect, RoundPlan, Vec2 } from './types';

const RUN_SEEDS = Array.from({ length: 40 }, (_, i) => `BATCH${i.toString(36).toUpperCase()}`);
const DIST_SEEDS = Array.from({ length: 200 }, (_, i) => `DIST${i.toString(36).toUpperCase()}`);

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
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

function distanceToRect(p: Vec2, rect: Rect): number {
  const dx = Math.max(rect.x - p.x, 0, p.x - (rect.x + rect.w));
  const dy = Math.max(rect.y - p.y, 0, p.y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

function planWithMirror(round: number): RoundPlan {
  for (let i = 0; i < 40; i++) {
    const plan = generateRound(round, `MIRROR${i}`);
    if (plan.mirrors.length > 0) return plan;
  }
  throw new Error('expected at least one page with a mirror');
}

describe('seeds', () => {
  it('derives page seeds from a run seed and difficulty', () => {
    expect(seedForRound('ABCDEF', 1)).toBe('ABCDEF-1-d3');
    expect(seedForRound('ABCDEF', 10)).toBe('ABCDEF-10-d3');
    expect(seedForRound('ABCDEF', 1)).not.toBe(seedForRound('ABCDEF', 2));
    expect(seedForRound('ABCDEF', 1, 1)).not.toBe(seedForRound('ABCDEF', 1, 5));
  });

  it('moves the tuning curve with difficulty', () => {
    const calm = generateRound(5, 'DIFF', 1);
    const normal = generateRound(5, 'DIFF', 3);
    const wild = generateRound(5, 'DIFF', 5);

    expect(calm.targets.length).toBeLessThan(normal.targets.length);
    expect(wild.targets.length).toBeGreaterThan(normal.targets.length);
    expect(wild.studySeconds).toBeGreaterThan(normal.studySeconds);
    expect(calm.mirrors.length).toBe(0);
    expect(wild.mirrors.length + wild.obstacles.length).toBeGreaterThan(0);
  });

  it('creates shareable run ids', () => {
    const seed = createRunSeed();
    expect(seed).toMatch(/^[A-Z2-9]{6}$/);
    expect(createRunSeed()).not.toBe('PLAY');
  });
});

describe('generateRound', () => {
  it('is reproducible for the same run seed and page', () => {
    for (const round of [1, 3, 4, 5, 7, 10]) {
      const a = generateRound(round, 'REPEAT');
      const b = generateRound(round, 'REPEAT');
      expect(a.seed).toBe(b.seed);
      expect(a).toEqual(b);
    }
  });

  it('defaults to the deterministic PLAY run', () => {
    expect(generateRound(4)).toEqual(generateRound(4, 'PLAY'));
  });

  it('produces different pages for different run seeds', () => {
    const a = generateRound(6, 'ONESEED');
    const b = generateRound(6, 'TWOSEED');
    expect(a).not.toEqual(b);
  });

  it('builds designed, solvable pages across all ten difficulties', () => {
    for (let round = 1; round <= 10; round++) {
      const count = targetCount(round);
      for (const runSeed of RUN_SEEDS) {
        const plan = generateRound(round, runSeed);
        const check = validateRound(plan);

        expect(check.valid, `round ${round} seed ${runSeed}`).toBe(true);
        expect(check.hits, `round ${round} seed ${runSeed}`).toBe(count);
        expect(plan.targets).toHaveLength(count);
        expect(plan.requiredHits).toBe(requiredHitsFor(count));
        expect(plan.angTolerance).toBeGreaterThanOrEqual(0.02);
        expect(plan.solutionAngle).toBeTypeOf('number');
        expect(Number.isFinite(plan.solutionAngle)).toBe(true);

        // The stored angle has to work through the gameplay tracer, not just on paper.
        const absorbers = plan.pieces.filter((p) => p.kind === 'absorber').map((p) => p.rect);
        const traced = traceBeam(
          plan.player,
          plan.solutionAngle,
          ARENA,
          plan.obstacles,
          plan.maxBounces,
          plan.mirrors,
          absorbers,
        );
        const hits = evaluateShot(plan.targets, traced.segments).filter((r) => r.hit).length;
        expect(hits, `traced round ${round} seed ${runSeed}`).toBe(count);
      }
    }
  });

  it('requires the solved route to thread its reflections', () => {
    for (const runSeed of ['BOUNCE', 'DEPTH', 'WALLS']) {
      for (let round = 1; round <= 10; round++) {
        const plan = generateRound(round, runSeed);
        const absorbers = plan.pieces.filter((p) => p.kind === 'absorber').map((p) => p.rect);
        const traced = traceBeam(
          plan.player,
          plan.solutionAngle,
          ARENA,
          plan.obstacles,
          plan.maxBounces,
          plan.mirrors,
          absorbers,
        );
        expect(plan.requiredBounces).toBe(plan.maxBounces);
        expect(traced.bounces.length, `round ${round} seed ${runSeed}`).toBeGreaterThanOrEqual(
          plan.requiredBounces,
        );
      }
    }
  });

  it('raises the reflection count before the target count', () => {
    for (const round of [2, 5, 9]) {
      const calm = generateRound(round, 'AXIS', 1);
      const normal = generateRound(round, 'AXIS', 3);
      const wild = generateRound(round, 'AXIS', 5);
      expect(wild.maxBounces).toBeGreaterThan(normal.maxBounces);
      expect(normal.maxBounces).toBeGreaterThan(calm.maxBounces);
      // Targets climb far more slowly than reflections do.
      expect(wild.targets.length - calm.targets.length).toBeLessThanOrEqual(3);
    }
  });

  it('introduces blockers, absorbers and mirror counts on schedule', () => {
    for (let round = 1; round <= 10; round++) {
      const plan = generateRound(round, 'SCHEDULE');
      if (round < 3) expect(plan.obstacles).toHaveLength(0);
      else expect(plan.obstacles.length).toBeGreaterThan(0);
      expect(plan.obstacles.length).toBeLessThanOrEqual(round >= 8 ? 2 : 1);
      expect(plan.mirrors.length).toBeLessThanOrEqual(round < 4 ? 0 : 2);
      const absorbers = plan.pieces.filter((p) => p.kind === 'absorber');
      if (round < 7) expect(absorbers).toHaveLength(0);
      else expect(absorbers).toHaveLength(1);
    }
  });

  it('keeps rounds one to three mirror free', () => {
    for (let round = 1; round <= 3; round++) {
      for (const runSeed of RUN_SEEDS) {
        expect(generateRound(round, runSeed).mirrors, `round ${round} seed ${runSeed}`).toHaveLength(0);
      }
    }
  });

  it('previews a mirror on some round four pages', () => {
    const counts = DIST_SEEDS.slice(0, 80).map((runSeed) => generateRound(4, runSeed).mirrors.length);
    for (const n of counts) expect(n).toBeLessThanOrEqual(1);
    expect(counts).toContain(0);
    expect(counts).toContain(1);
  });

  it('randomizes mirror counts by page', () => {
    const rounds = [5, 6, 8, 10];
    const counts = new Map(rounds.map((round) => [round, [] as number[]]));

    for (const runSeed of DIST_SEEDS) {
      for (const round of rounds) counts.get(round)!.push(generateRound(round, runSeed).mirrors.length);
    }

    const share = (round: number, n: number) =>
      counts.get(round)!.filter((count) => count === n).length / DIST_SEEDS.length;

    for (const round of rounds) {
      for (const count of counts.get(round)!) {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(2);
      }
      expect(share(round, 0), `round ${round} never rolled zero`).toBeGreaterThan(0);
      expect(share(round, 1), `round ${round} never rolled one`).toBeGreaterThan(0);
      expect(share(round, 2), `round ${round} never rolled two`).toBeGreaterThan(0);
    }

    // Rounds 5-6 weigh 20% two and 18% zero, late rounds lean harder on two.
    expect(share(6, 2)).toBeGreaterThanOrEqual(0.15);
    expect(share(6, 0)).toBeGreaterThanOrEqual(0.1);
    expect(share(10, 2)).toBeGreaterThan(share(6, 2));
  });

  it('keeps mirrors finite, inside the arena and off the player', () => {
    let seen = 0;
    for (const runSeed of RUN_SEEDS) {
      for (const round of [5, 6, 7, 8, 9, 10]) {
        const plan = generateRound(round, runSeed);
        for (let i = 0; i < plan.mirrors.length; i++) {
          const mirror = plan.mirrors[i];
          seen += 1;
          expect(mirror.halfLength).toBeGreaterThan(0);
          expect(Number.isFinite(mirror.angle)).toBe(true);

          const [a, b] = mirrorEndpoints(mirror);
          expect(a.x).toBeGreaterThanOrEqual(ARENA.x);
          expect(a.y).toBeGreaterThanOrEqual(ARENA.y);
          expect(b.x).toBeLessThanOrEqual(ARENA.x + ARENA.w);
          expect(b.y).toBeLessThanOrEqual(ARENA.y + ARENA.h);
          expect(Math.hypot(mirror.center.x - plan.player.x, mirror.center.y - plan.player.y)).toBeGreaterThan(150);

          for (const target of plan.targets) {
            expect(distanceToMirror(target.pos, mirror)).toBeGreaterThan(TARGET_RADIUS + 8);
          }
          for (const block of plan.obstacles) {
            const dx = Math.max(block.x - mirror.center.x, 0, mirror.center.x - (block.x + block.w));
            const dy = Math.max(block.y - mirror.center.y, 0, mirror.center.y - (block.y + block.h));
            expect(Math.hypot(dx, dy)).toBeGreaterThan(mirror.halfLength);
          }
          for (const piece of plan.pieces) {
            if (piece.kind !== 'absorber') continue;
            const center = { x: piece.rect.x + piece.rect.w / 2, y: piece.rect.y + piece.rect.h / 2 };
            expect(distanceToMirror(center, mirror)).toBeGreaterThan(60);
          }

          for (let j = i + 1; j < plan.mirrors.length; j++) {
            const other = plan.mirrors[j];
            expect(Math.hypot(mirror.center.x - other.center.x, mirror.center.y - other.center.y)).toBeGreaterThan(
              150,
            );
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('keeps absorbers off the solved route', () => {
    for (const runSeed of RUN_SEEDS) {
      for (const round of [7, 8, 9, 10]) {
        const plan = generateRound(round, runSeed);
        const absorbers = plan.pieces.filter((p) => p.kind === 'absorber').map((p) => p.rect);
        const traced = traceBeam(
          plan.player,
          plan.solutionAngle,
          ARENA,
          plan.obstacles,
          plan.maxBounces,
          plan.mirrors,
          absorbers,
        );

        expect(traced.stopped, `round ${round} seed ${runSeed}`).toBeUndefined();

        for (const absorber of absorbers) {
          for (const seg of traced.segments) {
            expect(distanceToRect(seg.a, absorber)).toBeGreaterThan(30);
            expect(distanceToRect(seg.b, absorber)).toBeGreaterThan(30);
          }
          for (const target of plan.targets) {
            expect(
              distanceToRect(target.pos, absorber),
              `round ${round} seed ${runSeed} target clear of the dead zone`,
            ).toBeGreaterThan(TARGET_RADIUS);
          }
        }
      }
    }
  });

  it('keeps generating valid pages past the notebook length', () => {
    for (const page of [11, 14, 20, 33]) {
      const plan = generateRound(page, 'ENDLESS');
      const check = validateRound(plan);
      expect(check.valid, `endless page ${page}`).toBe(true);
      expect(plan.round).toBe(page);
      expect(plan.targets.length).toBeGreaterThan(0);
    }
  });

  it('reports invalid plans instead of pretending they solve', () => {
    const plan = generateRound(1, 'CHECK');
    plan.solutionAngle += Math.PI / 2;
    const check = validateRound(plan);
    expect(check.valid).toBe(false);
    expect(check.hits).toBeLessThan(plan.targets.length);
  });

  it('rejects non-finite mirrors and absorbers', () => {
    const mirrorPlan = planWithMirror(5);
    mirrorPlan.mirrors[0].halfLength = Number.NaN;
    expect(validateRound(mirrorPlan).valid).toBe(false);

    const absorberPlan = generateRound(7, 'BADABSORB');
    const absorber = absorberPlan.pieces.find((piece) => piece.kind === 'absorber');
    expect(absorber).toBeDefined();
    if (absorber) absorber.rect.w = Number.NaN;
    expect(validateRound(absorberPlan).valid).toBe(false);
  });

  it('keeps targets apart along the solved path', () => {
    for (const round of [1, 5, 10]) {
      for (const runSeed of RUN_SEEDS.slice(0, 12)) {
        const plan = generateRound(round, runSeed);
        for (let i = 0; i < plan.targets.length; i++) {
          for (let j = i + 1; j < plan.targets.length; j++) {
            const a = plan.targets[i].pos;
            const b = plan.targets[j].pos;
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(60);
          }
        }
      }
    }
  });
});
