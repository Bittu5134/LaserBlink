import type { Mirror, Rect, Vec2 } from './types';
import { dot, sub } from './vec';

const EPS = 0.000001;

function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

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

// Ray cast against a finite mirror segment. Reflection happens on either face.
export function rayMirror(origin: Vec2, dir: Vec2, mirror: Mirror): { t: number; normal: Vec2 } | null {
  if (!Number.isFinite(mirror.halfLength) || mirror.halfLength <= 0) return null;
  if (!Number.isFinite(mirror.angle) || !Number.isFinite(mirror.center.x) || !Number.isFinite(mirror.center.y)) {
    return null;
  }

  const along = { x: Math.cos(mirror.angle), y: Math.sin(mirror.angle) };
  const denom = cross(dir, along);
  if (Math.abs(denom) < EPS) return null;

  const toCenter = sub(mirror.center, origin);
  const t = cross(toCenter, along) / denom;
  const u = cross(toCenter, dir) / denom;

  if (t <= EPS || !Number.isFinite(t)) return null;
  if (Math.abs(u) > mirror.halfLength + EPS) return null;

  let normal = { x: -along.y, y: along.x };
  if (dot(dir, normal) > 0) normal = { x: -normal.x, y: -normal.y };
  // Avoid -0 leaking into callers and equality checks.
  normal = { x: normal.x + 0, y: normal.y + 0 };
  return { t, normal };
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
