import type { Bounce, Rect, Segment, Vec2 } from './types';
import { rayInsideArena, rayObstacle } from './ray';
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

    // 1. Check inner arena wall bounce
    const wallHit = rayInsideArena(point, dir, arena);
    if (wallHit && wallHit.t < nearest) {
      nearest = wallHit.t;
      normal = wallHit.normal;
    }

    // 2. Check exterior obstacle bounces
    for (const rect of obstacles) {
      const hit = rayObstacle(point, dir, rect);
      if (hit && hit.t < nearest) {
        nearest = hit.t;
        normal = hit.normal;
      }
    }

    if (!Number.isFinite(nearest) || nearest <= 0) break;

    const end = add(point, scale(dir, nearest));
    segments.push({ a: point, b: end });

    if (i === maxBounces) break;

    bounces.push({ point: end, normal, index: i });
    // Nudge point slightly away from wall along normal into arena
    point = add(end, scale(normal, 0.15));
    dir = reflect(dir, normal);
  }

  return { segments, bounces };
}
