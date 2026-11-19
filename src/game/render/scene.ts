import type { Phase, RoundPlan, Segment, TargetResult, Vec2 } from '../types';
import { ARENA } from '../level';
import { closestOnSegment } from '../vec';
import {
  BEAM,
  CREAM,
  INK,
  LEMON,
  PAPER,
  RAISE,
  SCREEN,
  drawBall,
  drawBeam,
  drawGrid,
  drawRing,
  drawSparks,
  totalLength,
} from './draw';

export interface SceneState {
  phase: Phase;
  plan: RoundPlan | null;
  angle: number;
  segments: Segment[];
  results: TargetResult[] | null;
  beamProgress: number;
  assist: 'off' | 'stub';
}

export function drawScene(ctx: CanvasRenderingContext2D, s: SceneState): void {
  drawGrid(ctx, 1000, 625);
  const plan = s.plan;
  if (!plan) return;

  drawWalls(ctx);

  for (const rect of plan.obstacles) {
    ctx.fillStyle = RAISE;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  }

  if (s.phase === 'study') {
    for (const t of plan.targets) drawBall(ctx, t.pos, t.radius, t.color, String(t.id));
  }

  if (s.phase === 'firing' || s.phase === 'reveal') {
    drawBeam(ctx, s.segments, s.phase === 'reveal' ? 1 : s.beamProgress);
    if (s.phase === 'reveal') {
      drawBounceMarks(ctx, s.segments, plan);
    }
  }

  if (s.phase === 'firing' && s.results) {
    drawLiveTargets(ctx, s);
  }

  if (s.phase === 'aim') drawAim(ctx, plan.player, s.angle, s.assist, plan.maxBounces);

  drawPlayer(ctx, plan.player, s.angle, s.phase === 'aim');

  if (s.phase === 'reveal' && s.results) drawReveal(ctx, s.results);
}

function drawWalls(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = RAISE;
  ctx.fillRect(0, 0, 1000, ARENA.y);
  ctx.fillRect(0, ARENA.y + ARENA.h, 1000, 625 - ARENA.y - ARENA.h);
  ctx.fillRect(0, 0, ARENA.x, 625);
  ctx.fillRect(ARENA.x + ARENA.w, 0, 1000 - ARENA.x - ARENA.w, 625);

  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(ARENA.x - 4, ARENA.y - 4, ARENA.w + 8, ARENA.h + 8);

  ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
  ctx.lineWidth = 2;
  const c = 16;
  ctx.beginPath();
  for (const [x, y, dx, dy] of [
    [ARENA.x, ARENA.y, 1, 1],
    [ARENA.x + ARENA.w, ARENA.y, -1, 1],
    [ARENA.x, ARENA.y + ARENA.h, 1, -1],
    [ARENA.x + ARENA.w, ARENA.y + ARENA.h, -1, -1],
  ]) {
    ctx.moveTo(x + dx * 4, y + dy * c);
    ctx.lineTo(x + dx * 4, y + dy * 4);
    ctx.lineTo(x + dx * c, y + dy * 4);
  }
  ctx.stroke();
}

function drawPlayer(ctx: CanvasRenderingContext2D, pos: Vec2, angle: number, armed: boolean): void {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(14, -8);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fillStyle = BEAM;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 17, 0, Math.PI * 2);
  ctx.fillStyle = armed ? PAPER : '#e8dcc4';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = BEAM;
  ctx.fill();
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  angle: number,
  assist: 'off' | 'stub',
  bounces: number,
): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  if (assist === 'stub') {
    ctx.beginPath();
    ctx.setLineDash([5, 7]);
    ctx.moveTo(pos.x + dx * 34, pos.y + dy * 34);
    ctx.lineTo(pos.x + dx * 86, pos.y + dy * 86);
    ctx.strokeStyle = BEAM;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = 'rgba(243, 231, 204, 0.55)';
  ctx.font = '700 13px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BOUNCES ${bounces}`, pos.x + 28, pos.y + 28);
}

function drawBounceMarks(ctx: CanvasRenderingContext2D, segments: Segment[], plan: RoundPlan): void {
  const points: Vec2[] = segments.slice(0, -1).map((s) => s.b);
  if (points.length > 0) drawSparks(ctx, points.slice(0, plan.maxBounces));
}

function drawLiveTargets(ctx: CanvasRenderingContext2D, s: SceneState): void {
  if (!s.results) return;
  const reached = s.beamProgress * totalLength(s.segments);

  for (const result of s.results) {
    if (!result.hit) continue;
    if (distanceAlong(result.closest, s.segments) > reached) continue;
    drawBall(ctx, result.target.pos, result.target.radius, result.target.color, String(result.target.id));
  }
}

export function distanceAlong(point: Vec2, segments: Segment[]): number {
  let run = 0;
  for (const seg of segments) {
    const nearest = closestOnSegment(point, seg.a, seg.b);
    if (nearest.distance < 1) return run + Math.hypot(nearest.point.x - seg.a.x, nearest.point.y - seg.a.y);
    run += Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
  }
  return run;
}

function drawReveal(ctx: CanvasRenderingContext2D, results: TargetResult[]): void {
  for (const r of results) {
    const p = r.target.pos;
    ctx.globalAlpha = 0.55;
    drawRing(ctx, p, r.target.radius * 3, 'rgba(243, 231, 204, 0.35)', [3, 6]);
    drawRing(ctx, p, r.target.radius * 2, 'rgba(243, 231, 204, 0.55)', [3, 6]);
    ctx.globalAlpha = 1;

    if (!r.hit) {
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(r.closest.x, r.closest.y);
      ctx.strokeStyle = 'rgba(255, 177, 153, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(r.closest.x, r.closest.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = BEAM;
      ctx.fill();
    }

    if (r.hit) {
      drawBall(ctx, p, r.target.radius, r.target.color, String(r.target.id));
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r.target.radius, 0, Math.PI * 2);
      ctx.fillStyle = SCREEN;
      ctx.fill();
      ctx.strokeStyle = 'rgba(243, 231, 204, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(243, 231, 204, 0.8)';
      ctx.font = '700 14px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(r.target.id), p.x, p.y);
    }

    const label = `${Math.round(r.accuracy * 100)}%`;
    ctx.font = '700 15px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = r.accuracy >= 0.999 ? LEMON : r.hit ? MINT : CREAM;
    ctx.fillText(label, p.x, p.y + r.target.radius + 12);
  }
}

const MINT = '#86efac';
