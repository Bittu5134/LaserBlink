import type { Phase, RoundPlan, Segment, TargetResult, Vec2 } from '../types';
import { ARENA, CANVAS } from '../level';
import { closestOnPath, closestOnSegment } from '../vec';
import {
  drawScratchpadBackground,
  drawPageChrome,
  drawStudyCountdown,
  drawPaperBall,
  drawLaserTurret,
  drawLaserBeam,
  drawTrace,
  drawObstacles,
  drawMirrors,
  drawPieces,
  totalPathLength,
  INK,
} from './draw';
import { fx } from './particles';

export interface SceneState {
  phase: Phase;
  plan: RoundPlan | null;
  angle: number;
  // Kept optional: the controller may hand over the basic guide separately
  // from the ink preview trace.
  segments?: Segment[];
  results: TargetResult[] | null;
  beamProgress: number;
  studyCountdown: number;
  previewActive: boolean;
  previewSegments: Segment[];
  solutionSegments: Segment[];
  reducedMotion: boolean;
  failedReveal: boolean;
  burntTargetIds: Set<number>;
}

function activeSegments(s: SceneState): Segment[] {
  if (s.segments && s.segments.length > 0) return s.segments;
  return s.previewSegments;
}

export function drawScene(ctx: CanvasRenderingContext2D, s: SceneState): void {
  // The controller settles a frame late in some phases; keep drawing safe.
  const previewActive = s.previewActive ?? false;
  const previewSegments = s.previewSegments ?? [];
  const solutionSegments = s.solutionSegments ?? [];
  const reducedMotion = s.reducedMotion ?? false;
  const failedReveal = s.failedReveal ?? false;

  fx.setReducedMotion(reducedMotion);

  drawScratchpadBackground(ctx, CANVAS.w, CANVAS.h, ARENA);

  const plan = s.plan;
  if (!plan) return;

  drawPageChrome(ctx, ARENA);

  // Scorch marks sit on the paper, under the physical pieces
  fx.drawScorch(ctx);

  if (plan.obstacles.length > 0) {
    drawObstacles(ctx, plan.obstacles);
  }
  if (plan.mirrors && plan.mirrors.length > 0) {
    drawMirrors(ctx, plan.mirrors);
  }
  if (plan.pieces && plan.pieces.length > 0) {
    // Block pieces mirror plan.obstacles, which are already drawn above;
    // only the absorber patches need their own pass.
    const absorbers = plan.pieces.filter((piece) => piece.kind === 'absorber');
    if (absorbers.length > 0) drawPieces(ctx, absorbers, reducedMotion);
  }

  if (s.phase === 'study') {
    const fraction = plan.studySeconds > 0 ? s.studyCountdown / plan.studySeconds : 0;
    drawStudyCountdown(ctx, plan.player, fraction);
    for (const t of plan.targets) {
      drawPaperBall(ctx, t.pos, t.radius, t.spriteIndex, false);
    }
  }

  if (s.phase === 'aim') {
    if (previewActive) {
      const trace = previewSegments.length > 0 ? previewSegments : activeSegments(s);
      drawTrace(ctx, trace, 'preview');
    } else {
      drawTrace(ctx, activeSegments(s), 'guide');
    }
  }

  if (s.phase === 'firing') {
    const segments = activeSegments(s);
    const reached = s.beamProgress * totalPathLength(segments);

    // Targets re-emerge as the beam head passes their point on the path.
    for (const t of plan.targets) {
      const burnt = s.burntTargetIds.has(t.id);
      const distance = closestOnPath(t.pos, segments).distance;
      if (!burnt && distance > reached) continue;
      drawPaperBall(ctx, t.pos, t.radius, t.spriteIndex, burnt, undefined);
    }

    drawLaserBeam(ctx, segments, s.beamProgress, reducedMotion);
  }

  if (s.phase === 'reveal') {
    const segments = activeSegments(s);

    if (failedReveal && solutionSegments.length > 0) {
      drawTrace(ctx, solutionSegments, 'solution');
    }

    for (const t of plan.targets) {
      const burnt = s.burntTargetIds.has(t.id);
      drawPaperBall(ctx, t.pos, t.radius, t.spriteIndex, burnt, undefined);
    }

    drawLaserBeam(ctx, segments, 1, reducedMotion);

    if (s.results) {
      drawAccuracyDetails(ctx, s.results);
    }
  }

  drawLaserTurret(
    ctx,
    plan.player,
    s.angle,
    s.phase === 'aim',
    s.phase === 'firing',
  );

  // Embers, wisps and floating score text above everything else
  fx.drawParticles(ctx);
}

function drawAccuracyDetails(ctx: CanvasRenderingContext2D, results: TargetResult[]): void {
  for (const r of results) {
    const p = r.target.pos;
    const cx = p.x;
    const cy = p.y + r.target.radius + 20;

    // Result badge: a shape, not colour alone
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = r.hit ? '#fffdf4' : '#fbf3e3';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (r.hit) {
      ctx.strokeStyle = '#2f7d4f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 4.4, cy + 0.2);
      ctx.lineTo(cx - 1.2, cy + 3.4);
      ctx.lineTo(cx + 5, cy - 3.6);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#b23a2a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 3.8, cy - 3.8);
      ctx.lineTo(cx + 3.8, cy + 3.8);
      ctx.moveTo(cx + 3.8, cy - 3.8);
      ctx.lineTo(cx - 3.8, cy + 3.8);
      ctx.stroke();
    }
    ctx.restore();

    // Miss: dotted line to the closest point on the beam
    if (!r.hit) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(r.closest.x, r.closest.y);
      ctx.strokeStyle = 'rgba(178, 58, 42, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(178, 58, 42, 0.75)';
      ctx.beginPath();
      ctx.arc(r.closest.x, r.closest.y, 2.6, 0, Math.PI * 2);
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
