import type { Bounce, Rect, Segment, Vec2 } from './types';
import { rayRect } from './ray';
import { add, fromAngle, reflect, scale } from './vec';

export function traceBeam(
  origin: Vec2,
  angle: number,
  arena: Rect,
  obstacles: Rect[],
  maxBounces: number,
): { segments: Segment[]; bounces: Bounce[] } {
  const segments: Segment[] = [];
  const bounces: Bounce[] = [];
  let point = { ...origin };
  let dir = fromAngle(angle);

  for (let i = 0; i <= maxBounces; i++) {
    let nearest = Infinity;
    let normal: Vec2 = { x: 0, y: 0 };

    const wallHit = rayRect(point, dir, arena);
    if (wallHit && wallHit.t < nearest) {
      nearest = wallHit.t;
      normal = wallHit.normal;
    }

    for (const rect of obstacles) {
      const hit = rayRect(point, dir, rect);
      if (hit && hit.t < nearest) {
        nearest = hit.t;
        normal = hit.normal;
      }
    }

    if (!Number.isFinite(nearest)) break;

    const end = add(point, scale(dir, nearest));
    segments.push({ a: point, b: end });

    if (i === maxBounces) break;

    bounces.push({ point: end, normal, index: i });
    point = add(end, scale(normal, 0.5));
    dir = reflect(dir, normal);
  }

  return { segments, bounces };
}
