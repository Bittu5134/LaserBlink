import type { Segment, Vec2 } from '../types';

export const SCREEN = '#1d1a2b';
export const RAISE = '#2a2540';
export const CREAM = '#f3e7cc';
export const PAPER = '#fffdf9';
export const INK = '#14161f';
export const BEAM = '#ff5a36';
export const BEAM_CORE = '#fff1d6';
export const LEMON = '#fde047';

export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCREEN;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(243, 231, 204, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 32) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  radius: number,
  fill: string,
  label?: string,
): void {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  if (label) {
    ctx.fillStyle = INK;
    ctx.font = '700 17px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pos.x, pos.y + 1);
  }
}

export function drawRing(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  radius: number,
  color: string,
  dash: number[] = [],
): void {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawBeam(ctx: CanvasRenderingContext2D, segments: Segment[], progress = 1): void {
  if (segments.length === 0) return;

  let remaining = progress * totalLength(segments);
  const visible: Segment[] = [];

  for (const seg of segments) {
    const len = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
    if (remaining <= 0) break;
    if (remaining >= len) {
      visible.push(seg);
      remaining -= len;
    } else {
      const t = remaining / len;
      visible.push({
        a: seg.a,
        b: { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t },
      });
      remaining = 0;
    }
  }

  if (visible.length === 0) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [width, color] of [
    [7, BEAM],
    [2, BEAM_CORE],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(visible[0].a.x, visible[0].a.y);
    for (const seg of visible) {
      ctx.lineTo(seg.b.x, seg.b.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  const head = visible[visible.length - 1].b;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
}

export function totalLength(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y), 0);
}

export function drawSparks(ctx: CanvasRenderingContext2D, points: Vec2[], color = LEMON): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const p of points) {
    ctx.moveTo(p.x - 7, p.y);
    ctx.lineTo(p.x + 7, p.y);
    ctx.moveTo(p.x, p.y - 7);
    ctx.lineTo(p.x, p.y + 7);
  }
  ctx.stroke();
}
