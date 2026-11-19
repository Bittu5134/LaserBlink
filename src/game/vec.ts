import type { Segment, Vec2 } from './types';

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, n: number): Vec2 {
  return { x: v.x * n, y: v.y * n };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Vec2): Vec2 {
  const l = length(v) || 1;
  return { x: v.x / l, y: v.y / l };
}

export function fromAngle(angle: number): Vec2 {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function reflect(dir: Vec2, normal: Vec2): Vec2 {
  const d = 2 * dot(dir, normal);
  return normalize({ x: dir.x - d * normal.x, y: dir.y - d * normal.y });
}

export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; distance: number } {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, dot(sub(p, a), ab) / len2));
  const point = add(a, scale(ab, t));
  return { point, distance: length(sub(p, point)) };
}

export function closestOnPath(p: Vec2, segments: Segment[]): { point: Vec2; distance: number } {
  let best = { point: segments[0]?.a ?? p, distance: Infinity };
  for (const seg of segments) {
    const hit = closestOnSegment(p, seg.a, seg.b);
    if (hit.distance < best.distance) best = hit;
  }
  return best;
}
