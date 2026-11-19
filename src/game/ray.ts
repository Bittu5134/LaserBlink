import type { Rect, Vec2 } from './types';
import { dot, sub } from './vec';

const EPS = 0.00001;

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

export function rayRect(origin: Vec2, dir: Vec2, rect: Rect): { t: number; normal: Vec2 } | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  let nx = 0;
  let ny = 0;

  if (Math.abs(dir.x) < EPS) {
    if (origin.x < rect.x || origin.x > rect.x + rect.w) return null;
  } else {
    const inv = 1 / dir.x;
    let t1 = (rect.x - origin.x) * inv;
    let t2 = (rect.x + rect.w - origin.x) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tmin) {
      tmin = t1;
      nx = inv > 0 ? -1 : 1;
      ny = 0;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dir.y) < EPS) {
    if (origin.y < rect.y || origin.y > rect.y + rect.h) return null;
  } else {
    const inv = 1 / dir.y;
    let t1 = (rect.y - origin.y) * inv;
    let t2 = (rect.y + rect.h - origin.y) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tmin) {
      tmin = t1;
      nx = 0;
      ny = inv > 0 ? -1 : 1;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (tmax < EPS) return null;
  const t = tmin > EPS ? tmin : tmax;
  if (!Number.isFinite(t)) return null;
  return { t, normal: { x: nx, y: ny } };
}
