import type { RoundResult, Segment, Target, TargetResult } from './types';
import { closestOnPath } from './vec';

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

export function scoreRound(results: TargetResult[], roundNumber: number, segments: Segment[]): RoundResult {
  const hits = results.filter((r) => r.hit).length;
  const total = results.length;
  const perfect = hits === total && total > 0;

  // Base score + accuracy bonus + combo scaling
  let totalScore = 0;
  let combo = 0;

  for (const r of results) {
    if (r.hit) {
      combo += 1;
      const basePoints = 1000;
      const accuracyBonus = Math.round(r.accuracy * 500);
      const comboMultiplier = combo; // 1x, 2x, 3x...
      totalScore += (basePoints + accuracyBonus) * comboMultiplier;
    }
  }

  if (perfect) {
    totalScore += 2500; // Perfect round bonus!
  }

  const overallAccuracy =
    results.length > 0 ? results.reduce((acc, r) => acc + r.accuracy, 0) / results.length : 0;

  return {
    round: roundNumber,
    results,
    accuracy: overallAccuracy,
    score: totalScore,
    perfect,
    segments,
    hits,
    total,
  };
}

export function gradeRound(hits: number, total: number, accuracy: number): { title: string; stars: number } {
  if (hits === total && accuracy >= 0.92) {
    return { title: 'PERFECT ASH!', stars: 3 };
  }
  if (hits === total) {
    return { title: 'CLEAN BURN!', stars: 3 };
  }
  if (hits >= Math.ceil(total * 0.6)) {
    return { title: 'SCORCHED!', stars: 2 };
  }
  if (hits > 0) {
    return { title: 'GRAZED', stars: 1 };
  }
  return { title: 'MISSED', stars: 0 };
}
