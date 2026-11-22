import type { RoundResult, Segment, Target, TargetResult } from './types';
import { closestOnPath } from './vec';

export function requiredHitsFor(total: number): number {
  return Math.ceil(Math.max(1, total) * 0.6);
}

export function accuracyFor(target: Target, segments: Segment[]): TargetResult {
  const closest = closestOnPath(target.pos, segments);
  const r = target.radius;
  // If the beam goes inside the radius, 1.0 accuracy. Otherwise fall off smoothly.
  const raw = closest.distance <= r ? 1.0 : 1.0 - (closest.distance - r) / (r * 2.5);
  const accuracy = Math.max(0, Math.min(1, raw));

  return {
    target,
    hit: closest.distance <= r + 8, // generous hit window for great game feel
    accuracy,
    closest: closest.point,
    distance: closest.distance,
  };
}

export function evaluateShot(targets: Target[], segments: Segment[]): TargetResult[] {
  return targets.map((t) => accuracyFor(t, segments));
}

export function scoreRound(
  results: TargetResult[],
  roundNumber: number,
  segments: Segment[],
  inkUsed = 0,
): RoundResult {
  const hits = results.filter((r) => r.hit).length;
  const total = results.length;
  const requiredHits = requiredHitsFor(total);
  const perfect = hits === total && total > 0;
  const bounces = Math.max(0, segments.length - 1);
  const ink = Math.max(0, Math.floor(Number.isFinite(inkUsed) ? inkUsed : 0));

  let totalScore = 0;
  let combo = 0;

  for (const r of results) {
    if (!r.hit) continue;
    combo += 1;
    const basePoints = 300;
    const accuracyBonus = Math.round(r.accuracy * 200);
    const comboMultiplier = Math.min(combo, 5); // keep late-round scores bounded
    totalScore += (basePoints + accuracyBonus) * comboMultiplier;
  }

  if (perfect) totalScore += 1500;
  totalScore += Math.max(0, 4 - bounces) * 80;
  totalScore += Math.max(0, 3 - ink) * 150;

  const overallAccuracy =
    results.length > 0 ? results.reduce((acc, r) => acc + r.accuracy, 0) / results.length : 0;
  const grade = gradeRound(hits, total, requiredHits);

  return {
    round: roundNumber,
    results,
    accuracy: overallAccuracy,
    score: Math.round(totalScore),
    perfect,
    segments,
    hits,
    total,
    requiredHits,
    passed: hits >= requiredHits,
    grade: grade.title,
    stars: grade.stars,
    inkUsed: ink,
    bounces,
  };
}

export function gradeRound(
  hits: number,
  total: number,
  requiredHits = requiredHitsFor(total),
): { title: string; stars: number } {
  const quota = Math.max(1, requiredHits);
  if (total > 0 && hits === total) {
    return { title: 'CLEAN BURN!', stars: 3 };
  }
  if (hits >= quota) {
    return { title: 'SCORCHED!', stars: 2 };
  }
  if (hits > 0) {
    return { title: 'GRAZED', stars: 1 };
  }
  return { title: 'MISSED', stars: 0 };
}
