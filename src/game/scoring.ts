import type { Segment, Target, TargetResult } from './types';
import { closestOnPath } from './vec';

export function accuracyFor(target: Target, segments: Segment[]): TargetResult {
  const closest = closestOnPath(target.pos, segments);
  const r = target.radius;
  const raw = closest.distance <= r ? 1 : 1 - (closest.distance - r) / (r * 3);
  const accuracy = Math.max(0, Math.min(1, raw));

  return {
    target,
    hit: closest.distance <= r + 3,
    accuracy,
    closest: closest.point,
    distance: closest.distance,
  };
}

export function evaluateShot(targets: Target[], segments: Segment[]): TargetResult[] {
  return targets.map((t) => accuracyFor(t, segments));
}

export function combinedAccuracy(results: TargetResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
}

export function scoreRound(results: TargetResult[]): { accuracy: number; score: number; perfect: boolean } {
  const accuracy = combinedAccuracy(results);
  const base = results.reduce((sum, r) => sum + Math.round(r.accuracy * 1000), 0);
  const perfect = results.every((r) => r.accuracy >= 0.999);
  return {
    accuracy,
    score: base + (perfect ? 500 : 0),
    perfect,
  };
}

export function band(accuracy: number): string {
  if (accuracy >= 0.999) return 'DIRECT';
  if (accuracy >= 0.66) return 'CLOSE';
  if (accuracy >= 0.33) return 'NEAR';
  return 'OFF';
}

export function grade(accuracy: number): string {
  if (accuracy >= 0.96) return 'SHARPSHOOTER';
  if (accuracy >= 0.86) return 'LOCKED IN';
  if (accuracy >= 0.7) return 'STEADY HAND';
  if (accuracy >= 0.5) return 'WARMING UP';
  return 'BLIND LUCK';
}
