import { describe, expect, it } from 'vitest';
import type { Mirror, Rect, Vec2 } from './types';
import { rayInsideArena, rayMirror, rayObstacle } from './ray';

const arena: Rect = { x: 0, y: 0, w: 100, h: 100 };

describe('rayInsideArena', () => {
  it('hits the right wall and reports an inward normal', () => {
    const hit = rayInsideArena({ x: 50, y: 50 }, { x: 1, y: 0 }, arena);
    expect(hit).not.toBeNull();
    expect(hit?.t).toBeCloseTo(50);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('hits the top wall', () => {
    const hit = rayInsideArena({ x: 50, y: 50 }, { x: 0, y: -1 }, arena);
    expect(hit?.t).toBeCloseTo(50);
    expect(hit?.normal).toEqual({ x: 0, y: 1 });
  });

  it('returns null when the direction misses the walls', () => {
    expect(rayInsideArena({ x: 50, y: 50 }, { x: 0, y: 0 }, arena)).toBeNull();
  });
});

describe('rayObstacle', () => {
  it('hits the near face of a rectangle', () => {
    const hit = rayObstacle({ x: 10, y: 50 }, { x: 1, y: 0 }, { x: 40, y: 40, w: 20, h: 20 });
    expect(hit?.t).toBeCloseTo(30);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('misses a rectangle above the ray', () => {
    expect(rayObstacle({ x: 10, y: 10 }, { x: 1, y: 0 }, { x: 40, y: 40, w: 20, h: 20 })).toBeNull();
  });

  it('does not report a hit when starting inside the rectangle', () => {
    expect(rayObstacle({ x: 50, y: 50 }, { x: 1, y: 0 }, { x: 40, y: 40, w: 20, h: 20 })).toBeNull();
  });
});

describe('rayMirror', () => {
  const mirror: Mirror = { center: { x: 50, y: 50 }, halfLength: 30, angle: 0 };

  it('hits the finite segment and faces the incoming ray', () => {
    const hit = rayMirror({ x: 50, y: 10 }, { x: 0, y: 1 }, mirror);
    expect(hit?.t).toBeCloseTo(40);
    expect(hit?.normal).toEqual({ x: 0, y: -1 });
  });

  it('misses beyond the finite half length', () => {
    const origin: Vec2 = { x: 5, y: 10 };
    expect(rayMirror(origin, { x: 0, y: 1 }, mirror)).toBeNull();
  });

  it('misses parallel rays', () => {
    expect(rayMirror({ x: 10, y: 10 }, { x: 1, y: 0 }, mirror)).toBeNull();
  });

  it('reflects off the back face with a flipped normal', () => {
    const hit = rayMirror({ x: 50, y: 90 }, { x: 0, y: -1 }, mirror);
    expect(hit?.normal).toEqual({ x: 0, y: 1 });
  });

  it('rejects malformed mirrors', () => {
    expect(rayMirror({ x: 50, y: 10 }, { x: 0, y: 1 }, { ...mirror, halfLength: 0 })).toBeNull();
    expect(rayMirror({ x: 50, y: 10 }, { x: 0, y: 1 }, { ...mirror, angle: Number.NaN })).toBeNull();
  });
});
