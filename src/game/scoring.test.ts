import { describe, expect, it } from 'vitest';
import type { Segment, Target, TargetResult } from './types';
import { accuracyFor, evaluateShot, gradeRound, requiredHitsFor, scoreRound } from './scoring';

function target(id: number, x: number): Target {
  return { id, pos: { x, y: 100 }, radius: 32, color: '#fff', spriteIndex: 0 };
}

function path(length: number): Segment[] {
  return [{ a: { x: 0, y: 100 }, b: { x: length, y: 100 } }];
}

function bouncedPath(): Segment[] {
  return [
    { a: { x: 0, y: 100 }, b: { x: 200, y: 100 } },
    { a: { x: 200, y: 100 }, b: { x: 100, y: 100 } },
  ];
}

function fakeResult(hit: boolean, accuracy: number): TargetResult {
  return {
    target: target(1, 0),
    hit,
    accuracy,
    closest: { x: 0, y: 0 },
    distance: hit ? 0 : 100,
  };
}

describe('requiredHitsFor', () => {
  it('uses a 60 percent ceiling quota', () => {
    expect(requiredHitsFor(2)).toBe(2);
    expect(requiredHitsFor(3)).toBe(2);
    expect(requiredHitsFor(4)).toBe(3);
    expect(requiredHitsFor(5)).toBe(3);
    expect(requiredHitsFor(7)).toBe(5);
  });

  it('stays finite for empty input', () => {
    expect(requiredHitsFor(0)).toBe(1);
  });
});

describe('accuracyFor and evaluateShot', () => {
  it('scores a direct center hit as perfect', () => {
    const result = accuracyFor(target(1, 50), path(100));
    expect(result.hit).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.distance).toBe(0);
  });

  it('applies a generous hit window but lower accuracy nearby', () => {
    const result = accuracyFor(target(1, 50), [{ a: { x: 0, y: 148 }, b: { x: 100, y: 148 } }]);
    expect(result.distance).toBe(48);
    expect(result.hit).toBe(false);
  });

  it('evaluates every target', () => {
    const results = evaluateShot([target(1, 50), target(2, 150)], path(100));
    expect(results).toHaveLength(2);
    expect(results[0].hit).toBe(true);
    expect(results[1].hit).toBe(false);
  });
});

describe('scoreRound', () => {
  it('reports quota, pass state, grade and stars', () => {
    const results = [fakeResult(true, 1), fakeResult(true, 0.8), fakeResult(false, 0)];
    const scored = scoreRound(results, 4, path(100), 0);
    expect(scored.hits).toBe(2);
    expect(scored.total).toBe(3);
    expect(scored.requiredHits).toBe(2);
    expect(scored.passed).toBe(true);
    expect(scored.stars).toBe(2);
    expect(scored.grade).toBe('SCORCHED!');
    expect(scored.score).toBeGreaterThan(0);
    expect(Number.isFinite(scored.score)).toBe(true);
  });

  it('gives a clean round three stars and the perfect flag', () => {
    const scored = scoreRound([fakeResult(true, 1), fakeResult(true, 1)], 1, path(100), 0);
    expect(scored.perfect).toBe(true);
    expect(scored.stars).toBe(3);
    expect(scored.passed).toBe(true);
  });

  it('uses fewer-bounce and unused-ink bonuses', () => {
    const results = [fakeResult(true, 1)];
    const clean = scoreRound(results, 1, path(100), 0);
    const bouncy = scoreRound(results, 1, bouncedPath(), 0);
    const inky = scoreRound(results, 1, path(100), 3);

    expect(clean.bounces).toBe(0);
    expect(bouncy.bounces).toBe(1);
    expect(clean.score - bouncy.score).toBe(80);
    expect(clean.score - inky.score).toBe(450);
    expect(inky.inkUsed).toBe(3);
  });

  it('keeps scores finite and bounded for a long round', () => {
    const results = Array.from({ length: 20 }, () => fakeResult(true, 1));
    const segments = Array.from({ length: 8 }, (_, i) => ({
      a: { x: i * 10, y: 0 },
      b: { x: i * 10 + 10, y: 0 },
    }));
    const scored = scoreRound(results, 10, segments, 0);
    expect(scored.score).toBeLessThan(50000);
    expect(scored.bounces).toBe(7);
    expect(scored.grade).toBe('CLEAN BURN!');
  });
});

describe('gradeRound', () => {
  it('matches the star rules', () => {
    expect(gradeRound(7, 7, 5).stars).toBe(3);
    expect(gradeRound(5, 7, 5).stars).toBe(2);
    expect(gradeRound(1, 7, 5).stars).toBe(1);
    expect(gradeRound(0, 7, 5).stars).toBe(0);
  });

  it('requires every hit for three stars', () => {
    expect(gradeRound(6, 7, 5).stars).toBe(2);
  });
});
