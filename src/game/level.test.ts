import { describe, expect, it } from 'vitest';
import { ARENA, createRunSeed, generateRound, seedForRound, targetCount, validateRound } from './level';
import { traceBeam } from './beam';
import { evaluateShot, requiredHitsFor } from './scoring';

const RUN_SEEDS = Array.from({ length: 40 }, (_, i) => `BATCH${i.toString(36).toUpperCase()}`);

describe('seeds', () => {
  it('derives page seeds from a run seed', () => {
    expect(seedForRound('ABCDEF', 1)).toBe('ABCDEF-1');
    expect(seedForRound('ABCDEF', 10)).toBe('ABCDEF-10');
    expect(seedForRound('ABCDEF', 1)).not.toBe(seedForRound('ABCDEF', 2));
  });

  it('creates shareable run ids', () => {
    const seed = createRunSeed();
    expect(seed).toMatch(/^[A-Z2-9]{6}$/);
    expect(createRunSeed()).not.toBe('PLAY');
  });
});

describe('generateRound', () => {
  it('is reproducible for the same run seed and page', () => {
    for (const round of [1, 3, 5, 7, 10]) {
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

  it('introduces blockers, mirrors and absorbers on schedule', () => {
    for (let round = 1; round <= 10; round++) {
      const plan = generateRound(round, 'SCHEDULE');
      if (round < 3) expect(plan.obstacles).toHaveLength(0);
      if (round >= 3) expect(plan.obstacles.length).toBeGreaterThan(0);
      if (round < 5) expect(plan.mirrors).toHaveLength(0);
      if (round >= 5) expect(plan.mirrors.length).toBeGreaterThan(0);
      if (round < 7) expect(plan.pieces.some((p) => p.kind === 'absorber')).toBe(false);
      if (round >= 7) expect(plan.pieces.some((p) => p.kind === 'absorber')).toBe(true);
    }
  });

  it('keeps mirrors finite and inside the arena', () => {
    for (const round of [5, 6, 7, 8, 9, 10]) {
      const plan = generateRound(round, 'MIRROR');
      for (const mirror of plan.mirrors) {
        expect(mirror.halfLength).toBeGreaterThan(0);
        expect(Number.isFinite(mirror.angle)).toBe(true);
        const dx = Math.cos(mirror.angle) * mirror.halfLength;
        const dy = Math.sin(mirror.angle) * mirror.halfLength;
        expect(mirror.center.x - dx).toBeGreaterThanOrEqual(ARENA.x);
        expect(mirror.center.x + dx).toBeLessThanOrEqual(ARENA.x + ARENA.w);
        expect(mirror.center.y - dy).toBeGreaterThanOrEqual(ARENA.y);
        expect(mirror.center.y + dy).toBeLessThanOrEqual(ARENA.y + ARENA.h);
      }
    }
  });

  it('stops late-page beams on their absorber', () => {
    for (const round of [7, 8, 9, 10]) {
      const plan = generateRound(round, 'ABSORB');
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
      expect(traced.stopped).toBe('absorber');
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
    const mirrorPlan = generateRound(5, 'BADMIRROR');
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
      const plan = generateRound(round, 'SPACING');
      for (let i = 0; i < plan.targets.length; i++) {
        for (let j = i + 1; j < plan.targets.length; j++) {
          const a = plan.targets[i].pos;
          const b = plan.targets[j].pos;
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(60);
        }
      }
    }
  });
});
