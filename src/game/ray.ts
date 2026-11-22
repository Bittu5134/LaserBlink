import type { Rect, Vec2 } from './types';
import { dot, sub } from './vec';

const EPS = 0.000001;

export function rayCircle(origin: Vec2, dir: Vec2, center: Vec2, radius: number): number | null {
  const oc = sub(origin, center);
  const b = dot(oc, dir);
  const c = dot(oc, oc) - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const t1 = -b - root;
  const t2 = -b + root;
  if (t1 > EPS) return t1;
  if (t2 > EPS) return t2;
  return null;
}

// Ray cast from INSIDE the arena bouncing off its interior walls
export function rayInsideArena(origin: Vec2, dir: Vec2, arena: Rect): { t: number; normal: Vec2 } | null {
  let tx = Infinity;
  let nx = 0;

  if (dir.x > EPS) {
    tx = (arena.x + arena.w - origin.x) / dir.x;
    nx = -1; // hitting right wall, bounces left
  } else if (dir.x < -EPS) {
    tx = (arena.x - origin.x) / dir.x;
    nx = 1; // hitting left wall, bounces right
  }

  let ty = Infinity;
  let ny = 0;

  if (dir.y > EPS) {
    ty = (arena.y + arena.h - origin.y) / dir.y;
    ny = -1; // hitting bottom wall, bounces up
  } else if (dir.y < -EPS) {
    ty = (arena.y - origin.y) / dir.y;
    ny = 1; // hitting top wall, bounces down
  }

  if (tx < ty) {
    if (!Number.isFinite(tx) || tx < EPS) return null;
    return { t: tx, normal: { x: nx, y: 0 } };
  } else {
    if (!Number.isFinite(ty) || ty < EPS) return null;
    return { t: ty, normal: { x: 0, y: ny } };
  }
}

// Ray cast from OUTSIDE an obstacle rectangle hitting its exterior faces
export function rayObstacle(origin: Vec2, dir: Vec2, rect: Rect): { t: number; normal: Vec2 } | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  let normalX = 0;
  let normalY = 0;

  // X slab
  if (Math.abs(dir.x) < EPS) {
    if (origin.x < rect.x || origin.x > rect.x + rect.w) return null;
  } else {
    const inv = 1 / dir.x;
    let t1 = (rect.x - origin.x) * inv;
    let t2 = (rect.x + rect.w - origin.x) * inv;
    let n1 = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      n1 = 1;
    }
    if (t1 > tmin) {
      tmin = t1;
      normalX = n1;
      normalY = 0;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  // Y slab
  if (Math.abs(dir.y) < EPS) {
    if (origin.y < rect.y || origin.y > rect.y + rect.h) return null;
  } else {
    const inv = 1 / dir.y;
    let t1 = (rect.y - origin.y) * inv;
    let t2 = (rect.y + rect.h - origin.y) * inv;
    let n2 = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      n2 = 1;
    }
    if (t1 > tmin) {
      tmin = t1;
      normalX = 0;
      normalY = n2;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (tmin > EPS && Number.isFinite(tmin)) {
    return { t: tmin, normal: { x: normalX, y: normalY } };
  }
  return null;
}
