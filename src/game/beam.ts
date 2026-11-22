import type { Bounce, Mirror, Rect, Segment, Vec2 } from './types';
import { rayInsideArena, rayMirror, rayObstacle } from './ray';
import { add, fromAngle, reflect, scale } from './vec';

export function traceBeam(
  origin: Vec2,
  angle: number,
  arena: Rect,
  obstacles: Rect[],
  maxBounces: number,
  mirrors: Mirror[] = [],
  absorbers: Rect[] = [],
): { segments: Segment[]; bounces: Bounce[]; stopped?: 'absorber' } {
  const segments: Segment[] = [];
  const bounces: Bounce[] = [];
  let point = { ...origin };
  let dir = fromAngle(angle);
  let stopped: 'absorber' | undefined;

  // One loop per flight segment. The budget counts walls, obstacles and mirrors.
  for (let i = 0; i <= maxBounces; i++) {
    let nearest = Infinity;
    let normal: Vec2 = { x: 0, y: 0 };
    let absorbed = false;

    const wallHit = rayInsideArena(point, dir, arena);
    if (wallHit && wallHit.t < nearest) {
      nearest = wallHit.t;
      normal = wallHit.normal;
    }

    for (const rect of obstacles) {
      const hit = rayObstacle(point, dir, rect);
      if (hit && hit.t < nearest) {
        nearest = hit.t;
        normal = hit.normal;
        absorbed = false;
      }
    }

    for (const mirror of mirrors) {
      const hit = rayMirror(point, dir, mirror);
      if (hit && hit.t < nearest) {
        nearest = hit.t;
        normal = hit.normal;
        absorbed = false;
      }
    }

    for (const rect of absorbers) {
      const hit = rayObstacle(point, dir, rect);
      if (hit && hit.t < nearest) {
        nearest = hit.t;
        normal = hit.normal;
        absorbed = true;
      }
    }

    if (!Number.isFinite(nearest) || nearest <= 0) break;

    const end = add(point, scale(dir, nearest));
    if (Math.hypot(end.x - point.x, end.y - point.y) < 0.000001) break;
    segments.push({ a: point, b: end });

    if (absorbed) {
      stopped = 'absorber';
      break;
    }

    if (i === maxBounces) break;

    bounces.push({ point: end, normal, index: i });
    // Nudge away from the surface so the next cast cannot hit the same spot.
    point = add(end, scale(normal, 0.15));
    dir = reflect(dir, normal);
  }

  return stopped ? { segments, bounces, stopped } : { segments, bounces };
}
