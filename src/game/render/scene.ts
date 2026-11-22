import type { Phase, RoundPlan, Segment, TargetResult, Vec2 } from '../types';
import { ARENA, CANVAS } from '../level';
import { closestOnSegment } from '../vec';
import {
  drawScratchpadBackground,
  drawPaperBall,
  drawLaserTurret,
  drawAimGuide,
  drawLaserBeam,
  drawObstacles,
  totalPathLength,
  INK,
} from './draw';
import { fx } from './particles';

export interface SceneState {
  phase: Phase;
  plan: RoundPlan | null;
  angle: number;
  segments: Segment[];
  results: TargetResult[] | null;
  beamProgress: number;
  studyCountdown: number;
  assist: 'off' | 'stub' | 'full';
  burntTargetIds: Set<number>;
}

export function drawScene(ctx: CanvasRenderingContext2D, s: SceneState): void {
  // 1. Draw scratchpad notebook page on cardboard mat
  drawScratchpadBackground(ctx, CANVAS.w, CANVAS.h, ARENA);

  const plan = s.plan;
  if (!plan) return;

  // 2. Draw obstacles (rulers / cardboard blocks)
  if (plan.obstacles.length > 0) {
    drawObstacles(ctx, plan.obstacles);
  }

  // 3. Draw Scorch Marks & Particles on the paper
  fx.draw(ctx);

  // 4. Study phase: Paper balls are scattered and visible!
  if (s.phase === 'study') {
    for (const t of plan.targets) {
      drawPaperBall(ctx, t.pos, t.radius, t.spriteIndex, false, String(t.id));
    }
  }

  // 5. Aim phase: Paper balls are HIDDEN ("hiddent ehn you have to point a lazer that reflects aff fo the edges")
  // Only subtle faint pencil sketch or eraser dusting on the scratchpad paper
  if (s.phase === 'aim') {
    // Optional faint pencil watermark circles if full assist is on, otherwise completely hidden
    if (s.assist === 'full') {
      ctx.save();
      ctx.strokeStyle = 'rgba(74, 114, 172, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      for (const t of plan.targets) {
        ctx.beginPath();
        ctx.arc(t.pos.x, t.pos.y, t.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Aim guide with reflecting bounces
    if (s.assist !== 'off') {
      drawAimGuide(ctx, s.segments, s.segments.length - 1, plan.maxBounces);
    }
  }

  // 6. Firing phase: Laser beam surges forward, paper balls reappeared and get burnt!
  if (s.phase === 'firing') {
    // Paper balls reappear back! ("once place you put back the image and it burns the paper and gives you score")
    const reachedLength = s.beamProgress * totalPathLength(s.segments);

    for (const t of plan.targets) {
      const isBurnt = s.burntTargetIds.has(t.id);
      drawPaperBall(
        ctx,
        t.pos,
        t.radius,
        t.spriteIndex,
        isBurnt,
        String(t.id),
        isBurnt ? 1 : 0,
      );
    }

    // Laser beam firing animation
    drawLaserBeam(ctx, s.segments, s.beamProgress);
  }

  // 7. Reveal phase: Laser beam remains lit, burnt paper balls show charred scorch marks
  if (s.phase === 'reveal') {
    drawLaserBeam(ctx, s.segments, 1);

    for (const t of plan.targets) {
      const isBurnt = s.burntTargetIds.has(t.id);
      drawPaperBall(ctx, t.pos, t.radius, t.spriteIndex, isBurnt, String(t.id));
    }

    // Draw accuracy badges and connection indicators
    if (s.results) {
      drawAccuracyDetails(ctx, s.results);
    }
  }

  // 8. Player turret
  drawLaserTurret(
    ctx,
    plan.player,
    s.angle,
    s.phase === 'aim',
    s.phase === 'firing',
  );
}

function drawAccuracyDetails(ctx: CanvasRenderingContext2D, results: TargetResult[]): void {
  for (const r of results) {
    const p = r.target.pos;

    // Accuracy badge
    const badgeText = r.hit ? `${Math.round(r.accuracy * 100)}% BURN` : 'MISSED';
    const badgeColor = r.accuracy >= 0.95 ? '#16a34a' : r.hit ? '#ca8a04' : '#dc2626';

    ctx.save();
    ctx.translate(p.x, p.y + r.target.radius + 16);

    // Badge bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-42, -10, 84, 20, 6);
    ctx.fill();
    ctx.stroke();

    // Badge text
    ctx.fillStyle = badgeColor;
    ctx.font = '800 11px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 1);

    ctx.restore();

    // If missed, draw dotted line to closest laser beam segment
    if (!r.hit) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(r.closest.x, r.closest.y);
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nearest point dot
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(r.closest.x, r.closest.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function distanceAlong(point: Vec2, segments: Segment[]): number {
  let run = 0;
  for (const seg of segments) {
    const nearest = closestOnSegment(point, seg.a, seg.b);
    if (nearest.distance < 1) {
      return run + Math.hypot(nearest.point.x - seg.a.x, nearest.point.y - seg.a.y);
    }
    run += Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
  }
  return run;
}
