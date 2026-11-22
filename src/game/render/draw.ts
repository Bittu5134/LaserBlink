// Canvas rendering primitives for scratchpad, cardboard mat, laser beams, and paper balls
import type { Segment, Vec2 } from '../types';
import { getSprites } from './sprites';

export const CARD_BORDER = '#2c1e13';
export const INK = '#181512';
export const LASER_RED = '#ff2b2b';
export const LASER_GLOW = '#ff6b4a';
export const LASER_CORE = '#fff6ea';
export const PAPER_YELLOW = '#f7ebba';
export const RULED_LINE = 'rgba(74, 114, 172, 0.16)';
export const MARGIN_LINE = 'rgba(235, 78, 78, 0.28)';

// Draw cardboard outer table mat and torn scratchpad paper sheet
export function drawScratchpadBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  arena: { x: number; y: number; w: number; h: number },
) {
  const sprites = getSprites();

  // 1. Draw cardboard mat background
  if (sprites.cardboard && sprites.cardboard.complete) {
    ctx.drawImage(sprites.cardboard, 0, 0, w, h);
  } else {
    // Cardboard procedural fallback
    ctx.fillStyle = '#b78b5e';
    ctx.fillRect(0, 0, w, h);

    // Corrugated vertical lines
    ctx.fillStyle = 'rgba(120, 80, 40, 0.08)';
    for (let x = 0; x < w; x += 12) {
      ctx.fillRect(x, 0, 6, h);
    }
  }

  // 2. Draw paper drop shadow
  ctx.save();
  ctx.fillStyle = 'rgba(20, 14, 10, 0.45)';
  ctx.beginPath();
  ctx.roundRect(arena.x + 8, arena.y + 10, arena.w, arena.h, 12);
  ctx.fill();
  ctx.restore();

  // 3. Draw scratchpad paper sheet
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(arena.x, arena.y, arena.w, arena.h, 12);
  ctx.clip();

  if (sprites.scratchpad && sprites.scratchpad.complete) {
    ctx.drawImage(sprites.scratchpad, arena.x, arena.y, arena.w, arena.h);
    // Tint slightly with warm scratchpad yellow
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
  } else {
    // Procedural yellow scratchpad paper
    ctx.fillStyle = PAPER_YELLOW;
    ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
  }

  // Ruled notebook lines
  ctx.strokeStyle = RULED_LINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = arena.y + 36; y < arena.y + arena.h; y += 32) {
    ctx.moveTo(arena.x, y);
    ctx.lineTo(arena.x + arena.w, y);
  }
  ctx.stroke();

  // Left red margin line
  ctx.strokeStyle = MARGIN_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(arena.x + 64, arena.y);
  ctx.lineTo(arena.x + 64, arena.y + arena.h);
  ctx.stroke();

  // Subtle grid lines for aiming clarity
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.035)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = arena.x; x < arena.x + arena.w; x += 40) {
    ctx.moveTo(x, arena.y);
    ctx.lineTo(x, arena.y + arena.h);
  }
  ctx.stroke();

  ctx.restore();

  // 4. Scratchpad paper border with torn / chunky brutalist outline
  ctx.save();
  ctx.strokeStyle = '#2b1b11';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(arena.x, arena.y, arena.w, arena.h, 12);
  ctx.stroke();

  // Top paper tape or binder clips styling
  ctx.fillStyle = 'rgba(245, 235, 190, 0.75)';
  ctx.strokeStyle = '#382518';
  ctx.lineWidth = 2;
  const clipW = 80;
  const clipH = 18;
  // Left tape
  ctx.fillRect(arena.x + 120, arena.y - 8, clipW, clipH);
  ctx.strokeRect(arena.x + 120, arena.y - 8, clipW, clipH);
  // Right tape
  ctx.fillRect(arena.x + arena.w - 200, arena.y - 8, clipW, clipH);
  ctx.strokeRect(arena.x + arena.w - 200, arena.y - 8, clipW, clipH);

  ctx.restore();
}

// Draw crumpled paper ball using preloaded sprite or procedural fallback
export function drawPaperBall(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  radius: number,
  spriteIndex: number,
  isBurnt = false,
  label?: string,
  burnProgress = 0,
) {
  const sprites = getSprites();
  const spriteList = isBurnt ? sprites.burntBalls : sprites.balls;
  const sprite = spriteList[spriteIndex % 7];

  ctx.save();
  ctx.translate(pos.x, pos.y);

  // Soft drop shadow on paper
  ctx.fillStyle = 'rgba(30, 20, 10, 0.3)';
  ctx.beginPath();
  ctx.ellipse(3, radius * 0.7, radius * 0.9, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawSize = radius * 2.3;

  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

    // If burning in progress, overlay glowing flame flicker
    if (burnProgress > 0 && burnProgress < 1) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 90, 20, ${0.4 * (1 - burnProgress)})`;
      ctx.fillRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
    }
  } else {
    // Procedural crumpled ball fallback
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isBurnt ? '#3b2f29' : '#e2d3b3';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ID label or badge
  if (label && !isBurnt) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = '800 13px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
  }

  ctx.restore();
}

// Draw the player laser pointer turret
export function drawLaserTurret(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  angle: number,
  isAiming: boolean,
  isFiring: boolean,
) {
  ctx.save();
  ctx.translate(pos.x, pos.y);

  // Turret base shadow
  ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
  ctx.beginPath();
  ctx.ellipse(4, 5, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Turret base body
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#22252a';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Inner beveled dial
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#374151';
  ctx.fill();
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rotating laser barrel
  ctx.rotate(angle);

  // Barrel nozzle
  ctx.fillStyle = '#111827';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(14, -7, 24, 14, 4);
  ctx.fill();
  ctx.stroke();

  // Laser aperture lens
  ctx.fillStyle = isFiring ? '#ffffff' : LASER_RED;
  ctx.shadowColor = LASER_RED;
  ctx.shadowBlur = isFiring ? 16 : isAiming ? 8 : 2;
  ctx.beginPath();
  ctx.arc(36, 0, isFiring ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw aiming laser beam with dotted bounce path and reflecting angles
export function drawAimGuide(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  bounces: number,
  maxBounces: number,
) {
  if (segments.length === 0) return;

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer red guide line
  ctx.strokeStyle = 'rgba(255, 43, 43, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(segments[0].a.x, segments[0].a.y);
  for (const seg of segments) {
    ctx.lineTo(seg.b.x, seg.b.y);
  }
  ctx.stroke();

  // Inner yellow guide line
  ctx.setLineDash([4, 12]);
  ctx.strokeStyle = '#fff066';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.setLineDash([]);

  // Draw bounce points with reflection arrows/dots
  for (let i = 0; i < segments.length - 1; i++) {
    const pt = segments[i].b;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2b2b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bounce number badge
    ctx.fillStyle = INK;
    ctx.font = '700 10px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), pt.x, pt.y);
  }

  ctx.restore();
}

// Draw high energy fired laser beam with glow, hot core, and head flare
export function drawLaserBeam(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  progress: number,
) {
  if (segments.length === 0 || progress <= 0) return;

  let remaining = progress * totalPathLength(segments);
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

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Broad outer atmospheric red glow
  ctx.shadowColor = LASER_RED;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(255, 43, 43, 0.45)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(visible[0].a.x, visible[0].a.y);
  for (const seg of visible) ctx.lineTo(seg.b.x, seg.b.y);
  ctx.stroke();

  // 2. High-energy intense beam
  ctx.strokeStyle = LASER_RED;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(visible[0].a.x, visible[0].a.y);
  for (const seg of visible) ctx.lineTo(seg.b.x, seg.b.y);
  ctx.stroke();

  // 3. Superhot white laser core
  ctx.strokeStyle = LASER_CORE;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(visible[0].a.x, visible[0].a.y);
  for (const seg of visible) ctx.lineTo(seg.b.x, seg.b.y);
  ctx.stroke();

  // 4. White-hot beam head pulse
  const head = visible[visible.length - 1].b;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ff5a36';
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.restore();
}

export function totalPathLength(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y), 0);
}

// Draw cardboard / wooden obstacle blocks
export function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: { x: number; y: number; w: number; h: number }[]) {
  for (const rect of obstacles) {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w, rect.h);

    // Obstacle body (ruler / wooden / cardboard bar)
    ctx.fillStyle = '#ca8a04'; // Warm amber ruler color
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Thick ink border
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    // Ruler measurement markings
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (rect.w > rect.h) {
      for (let x = rect.x + 10; x < rect.x + rect.w; x += 12) {
        const tickH = (x - rect.x) % 24 === 0 ? 14 : 7;
        ctx.moveTo(x, rect.y);
        ctx.lineTo(x, rect.y + tickH);
      }
    } else {
      for (let y = rect.y + 10; y < rect.y + rect.h; y += 12) {
        const tickW = (y - rect.y) % 24 === 0 ? 14 : 7;
        ctx.moveTo(rect.x, y);
        ctx.lineTo(rect.x + tickW, y);
      }
    }
    ctx.stroke();

    ctx.restore();
  }
}
