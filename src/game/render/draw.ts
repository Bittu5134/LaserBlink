// Canvas rendering primitives for the field notebook: warm graph paper,
// rulers, mirror strips, absorber felt, paper balls and the laser itself.
import type { Mirror, Rect, RectPiece, Segment, Vec2 } from '../types';
import { getSprites } from './sprites';

const CARD_BORDER = '#2c1e13';
export const INK = '#181512';
const LASER_RED = '#ff3a1f';
const LASER_GLOW = '#ff8a4a';
const LASER_CORE = '#fff6ea';
const PAPER_YELLOW = '#f7ebba';
const PENCIL_RED = 'rgba(198, 74, 48, 0.78)';
const PENCIL_BLUE = 'rgba(58, 96, 160, 0.72)';
const RULED_LINE = 'rgba(74, 114, 172, 0.16)';
const MARGIN_LINE = 'rgba(178, 102, 82, 0.17)';

// The cardboard is the arena: one full-bleed surface, walls at the screen edge.
export function drawArenaBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const sprites = getSprites();

  if (sprites.cardboard && sprites.cardboard.complete) {
    ctx.drawImage(sprites.cardboard, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#b78b5e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120, 80, 40, 0.08)';
    for (let x = 0; x < w; x += 12) {
      ctx.fillRect(x, 0, 6, h);
    }
  }

  // Warm shadow falling in from the edges so the field reads as a lit surface.
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.28,
    w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(24, 16, 9, 0)');
  vignette.addColorStop(1, 'rgba(24, 16, 9, 0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Faint corrugation, so the surface is not a flat brown field.
  ctx.save();
  ctx.strokeStyle = 'rgba(96, 64, 38, 0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 36; y < h; y += 37) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + 5);
  }
  ctx.stroke();
  ctx.restore();
}

// The laser bounces here, so the edge has to read as a wall.
export function drawArenaEdge(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const band = 9;
  ctx.save();

  // Dark rim, then a lit inner lip where the beam turns around.
  ctx.fillStyle = 'rgba(34, 22, 13, 0.55)';
  ctx.fillRect(0, 0, w, band);
  ctx.fillRect(0, h - band, w, band);
  ctx.fillRect(0, 0, band, h);
  ctx.fillRect(w - band, 0, band, h);

  ctx.strokeStyle = 'rgba(28, 18, 10, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  ctx.strokeStyle = 'rgba(246, 232, 204, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(band - 0.5, band - 0.5, w - band * 2 + 1, h - band * 2 + 1);

  ctx.restore();
}

// Calibration ticks and registration crosses. No captions on the page.
export function drawPageChrome(
  ctx: CanvasRenderingContext2D,
  arena: Rect,
): void {
  ctx.save();

  // Edge calibration ticks (top and left only, keep the page quiet)
  ctx.strokeStyle = 'rgba(40, 44, 46, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0, x = arena.x + 22; x < arena.x + arena.w - 18; x += 24, i++) {
    const len = i % 5 === 0 ? 9 : 4;
    ctx.moveTo(x, arena.y + 3);
    ctx.lineTo(x, arena.y + 3 + len);
  }
  for (let i = 0, y = arena.y + 22; y < arena.y + arena.h - 18; y += 24, i++) {
    const len = i % 5 === 0 ? 9 : 4;
    ctx.moveTo(arena.x + 3, y);
    ctx.lineTo(arena.x + 3 + len, y);
  }
  ctx.stroke();

  // Corner registration crosses
  ctx.strokeStyle = 'rgba(40, 44, 46, 0.22)';
  const inset = 15;
  for (const [cx, cy] of [
    [arena.x + inset, arena.y + inset],
    [arena.x + arena.w - inset, arena.y + inset],
    [arena.x + inset, arena.y + arena.h - inset],
    [arena.x + arena.w - inset, arena.y + arena.h - inset],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.lineTo(cx + 4, cy);
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 4);
    ctx.stroke();
  }

  ctx.restore();
}

// Quiet countdown ring around the turret during study, no text needed.
export function drawStudyCountdown(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  fraction: number,
): void {
  const clamped = Math.max(0, Math.min(1, fraction));
  const urgent = clamped <= 0.2;
  const start = -Math.PI / 2;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(24, 21, 18, 0.17)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0, Math.PI * 2);
  ctx.stroke();

  if (clamped > 0) {
    const end = start + Math.PI * 2 * clamped;
    ctx.strokeStyle = urgent ? 'rgba(178, 58, 42, 0.9)' : 'rgba(24, 21, 18, 0.62)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 33, start, end);
    ctx.stroke();

    // Head dot makes the remaining time legible at a glance
    ctx.fillStyle = urgent ? 'rgba(178, 58, 42, 0.95)' : 'rgba(24, 21, 18, 0.65)';
    ctx.beginPath();
    ctx.arc(Math.cos(end) * 33, Math.sin(end) * 33, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tick at the start of the countdown
  ctx.strokeStyle = urgent ? 'rgba(178, 58, 42, 0.85)' : 'rgba(24, 21, 18, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(0, -28);
  ctx.stroke();

  ctx.restore();
}

// Crumpled paper ball using the preloaded sprite or a procedural fallback.
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
  ctx.fillStyle = 'rgba(30, 20, 10, 0.28)';
  ctx.beginPath();
  ctx.ellipse(3, radius * 0.7, radius * 0.9, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawSize = radius * 2.3;

  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

    if (burnProgress > 0 && burnProgress < 1) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 90, 20, ${0.4 * (1 - burnProgress)})`;
      ctx.fillRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
    }
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = isBurnt ? '#3b2f29' : '#e2d3b3';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (label && !isBurnt) {
    ctx.fillStyle = 'rgba(255, 253, 246, 0.88)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(24, 21, 18, 0.75)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
  }

  ctx.restore();
}

// The player laser pointer: a small drafting instrument bolted to the page.
export function drawLaserTurret(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  angle: number,
  isAiming: boolean,
  isFiring: boolean,
) {
  ctx.save();
  ctx.translate(pos.x, pos.y);

  ctx.fillStyle = 'rgba(20, 15, 10, 0.32)';
  ctx.beginPath();
  ctx.ellipse(4, 5, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#262a2e';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Small calibration screws on the base
  ctx.fillStyle = '#585f66';
  for (const a of [0.6, 2.2, 4.1, 5.4]) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 19, Math.sin(a) * 19, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#3a4046';
  ctx.fill();
  ctx.strokeStyle = '#5c646b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Needle mark showing the barrel direction
  ctx.strokeStyle = 'rgba(240, 233, 214, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, 0);
  ctx.stroke();

  ctx.rotate(angle);

  ctx.fillStyle = '#161a1e';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(14, -7, 24, 14, 4);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(240, 233, 214, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, -4);
  ctx.lineTo(34, -4);
  ctx.stroke();

  ctx.fillStyle = isFiring ? '#ffffff' : LASER_RED;
  ctx.shadowColor = LASER_RED;
  ctx.shadowBlur = isFiring ? 14 : isAiming ? 7 : 2;
  ctx.beginPath();
  ctx.arc(36, 0, isFiring ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

type TraceStyle = 'guide' | 'preview' | 'solution';

function tracePath(ctx: CanvasRenderingContext2D, segments: Segment[]): void {
  ctx.beginPath();
  ctx.moveTo(segments[0].a.x, segments[0].a.y);
  for (const seg of segments) {
    ctx.lineTo(seg.b.x, seg.b.y);
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  size: number,
  color: string,
): void {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.45);
  ctx.lineTo(-size * 0.7, 0);
  ctx.lineTo(-size, size * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Dashed pencil/red trace with small labelled bounce dots.
export function drawTrace(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  style: TraceStyle = 'preview',
): void {
  if (segments.length === 0) return;

  if (style === 'guide') {
    // Short direction stub from the turret only
    const first = segments[0];
    const len = Math.hypot(first.b.x - first.a.x, first.b.y - first.a.y);
    if (len < 4) return;
    const reach = Math.min(len, 150);
    const end = {
      x: first.a.x + ((first.b.x - first.a.x) / len) * reach,
      y: first.a.y + ((first.b.y - first.a.y) / len) * reach,
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.setLineDash([7, 8]);
    ctx.strokeStyle = 'rgba(198, 74, 48, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(first.a.x, first.a.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(ctx, first.a, end, 8, 'rgba(198, 74, 48, 0.55)');
    ctx.restore();
    return;
  }

  if (style === 'solution') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = PENCIL_BLUE;
    ctx.lineWidth = 2.4;
    tracePath(ctx, segments);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small square ticks at the corners of the expected route
    for (let i = 0; i < segments.length - 1; i++) {
      const p = segments[i].b;
      ctx.strokeStyle = 'rgba(58, 96, 160, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Soft underlay keeps the dashed ink legible on the paper
  ctx.strokeStyle = 'rgba(255, 250, 235, 0.5)';
  ctx.lineWidth = 4;
  ctx.setLineDash([9, 7]);
  tracePath(ctx, segments);
  ctx.stroke();

  ctx.strokeStyle = PENCIL_RED;
  ctx.lineWidth = 2;
  tracePath(ctx, segments);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small bounce dots, one per corner, not a wall of markers
  for (let i = 0; i < segments.length - 1; i++) {
    const p = segments[i].b;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf4';
    ctx.fill();
    ctx.strokeStyle = 'rgba(198, 74, 48, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Direction arrow at the far end of the preview
  const tail = segments[segments.length - 1];
  if (Math.hypot(tail.b.x - tail.a.x, tail.b.y - tail.a.y) > 20) {
    drawArrowHead(ctx, tail.a, tail.b, 9, 'rgba(198, 74, 48, 0.7)');
  }

  ctx.restore();
}


// Fired laser beam: red-orange outer glow, hot core and a flared head.
export function drawLaserBeam(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  progress: number,
  reducedMotion = false,
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

  // 1. Broad warm glow
  ctx.shadowColor = LASER_RED;
  ctx.shadowBlur = reducedMotion ? 8 : 16;
  ctx.strokeStyle = 'rgba(255, 58, 31, 0.32)';
  ctx.lineWidth = 13;
  tracePath(ctx, visible);
  ctx.stroke();

  // 2. Beam body, red-orange
  ctx.shadowBlur = 0;
  ctx.strokeStyle = LASER_RED;
  ctx.lineWidth = 6;
  tracePath(ctx, visible);
  ctx.stroke();

  // 3. Faint orange shoulder
  ctx.strokeStyle = 'rgba(255, 138, 74, 0.65)';
  ctx.lineWidth = 3.4;
  tracePath(ctx, visible);
  ctx.stroke();

  // 4. Hot white core
  ctx.strokeStyle = LASER_CORE;
  ctx.lineWidth = 1.8;
  tracePath(ctx, visible);
  ctx.stroke();

  // 5. Beam head
  const head = visible[visible.length - 1].b;
  ctx.beginPath();
  ctx.arc(head.x, head.y, reducedMotion ? 6 : 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = LASER_GLOW;
  ctx.shadowBlur = reducedMotion ? 6 : 12;
  ctx.fill();

  ctx.restore();
}

export function totalPathLength(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y), 0);
}

// Fixed reflector blocks: wooden rulers with ticks and a clear physical edge.
export function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Rect[]): void {
  for (const rect of obstacles) {
    drawRulerBlock(ctx, rect);
  }
}

function drawRulerBlock(ctx: CanvasRenderingContext2D, rect: Rect): void {
  ctx.save();

  ctx.fillStyle = 'rgba(20, 15, 10, 0.32)';
  ctx.fillRect(rect.x + 4, rect.y + 4, rect.w, rect.h);

  const horizontal = rect.w >= rect.h;
  const grad = horizontal
    ? ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h)
    : ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y);
  grad.addColorStop(0, '#dfa94a');
  grad.addColorStop(0.45, '#ca8a2c');
  grad.addColorStop(1, '#a86c1e');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Two thin grain lines along the length
  ctx.strokeStyle = 'rgba(112, 66, 16, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (horizontal) {
    for (const f of [0.3, 0.7]) {
      const y = rect.y + rect.h * f;
      ctx.moveTo(rect.x + 5, y);
      ctx.lineTo(rect.x + rect.w - 5, y);
    }
  } else {
    for (const f of [0.3, 0.7]) {
      const x = rect.x + rect.w * f;
      ctx.moveTo(x, rect.y + 5);
      ctx.lineTo(x, rect.y + rect.h - 5);
    }
  }
  ctx.stroke();

  // Measurement ticks and occasional numbers
  ctx.strokeStyle = 'rgba(42, 28, 10, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.fillStyle = 'rgba(42, 28, 10, 0.55)';
  ctx.font = '700 6px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (horizontal) {
    let i = 0;
    for (let x = rect.x + 10; x < rect.x + rect.w - 4; x += 11, i++) {
      const major = i % 5 === 0;
      const tick = Math.min(rect.h * 0.45, major ? 15 : 7);
      ctx.moveTo(x, rect.y);
      ctx.lineTo(x, rect.y + tick);
      if (major && rect.h > 30) ctx.fillText(String(i / 5), x, rect.y + tick + 1);
    }
  } else {
    let i = 0;
    for (let y = rect.y + 10; y < rect.y + rect.h - 4; y += 11, i++) {
      const major = i % 5 === 0;
      const tick = Math.min(rect.w * 0.45, major ? 15 : 7);
      ctx.moveTo(rect.x, y);
      ctx.lineTo(rect.x + tick, y);
      if (major && rect.w > 30) {
        ctx.save();
        ctx.translate(rect.x + tick + 2, y);
        ctx.rotate(Math.PI / 2);
        ctx.textBaseline = 'top';
        ctx.fillText(String(i / 5), 0, 0);
        ctx.restore();
      }
    }
  }
  ctx.stroke();

  // Physical ink border and inner bevel
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 244, 210, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);

  ctx.restore();
}

// Fixed mirror panels: metal backing, bright reflective line, bolts and hatch.
export function drawMirrors(ctx: CanvasRenderingContext2D, mirrors: Mirror[]): void {
  for (const mirror of mirrors) {
    drawMirror(ctx, mirror);
  }
}

function drawMirror(ctx: CanvasRenderingContext2D, mirror: Mirror): void {
  const dx = Math.cos(mirror.angle);
  const dy = Math.sin(mirror.angle);
  const px = -dy;
  const py = dx;
  const half = 7.5;
  const c = mirror.center;

  const a = { x: c.x - dx * mirror.halfLength, y: c.y - dy * mirror.halfLength };
  const b = { x: c.x + dx * mirror.halfLength, y: c.y + dy * mirror.halfLength };

  const corner = (p: Vec2, s: number) => ({
    x: p.x + px * half * s,
    y: p.y + py * half * s,
  });
  const a1 = corner(a, 1);
  const a2 = corner(a, -1);
  const b1 = corner(b, 1);
  const b2 = corner(b, -1);

  ctx.save();

  // Offset shadow
  ctx.fillStyle = 'rgba(24, 18, 12, 0.3)';
  ctx.beginPath();
  ctx.moveTo(a1.x + 4, a1.y + 5);
  ctx.lineTo(b1.x + 4, b1.y + 5);
  ctx.lineTo(b2.x + 4, b2.y + 5);
  ctx.lineTo(a2.x + 4, a2.y + 5);
  ctx.closePath();
  ctx.fill();

  // Metal backing
  const grad = ctx.createLinearGradient(
    c.x + px * half,
    c.y + py * half,
    c.x - px * half,
    c.y - py * half,
  );
  grad.addColorStop(0, '#4d5258');
  grad.addColorStop(0.28, '#f3f7fa');
  grad.addColorStop(0.5, '#dfe9ef');
  grad.addColorStop(0.72, '#aeb6bd');
  grad.addColorStop(1, '#42474d');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(a2.x, a2.y);
  ctx.closePath();
  ctx.fill();

  // Reflective hatch marks: diagonal slashes, not measurement ticks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  const run = mirror.halfLength * 2;
  for (let d = 8; d < run - 6; d += 11) {
    const t = d - mirror.halfLength;
    const px0 = c.x + dx * t;
    const py0 = c.y + dy * t;
    ctx.moveTo(px0 + px * (half - 2), py0 + py * (half - 2));
    ctx.lineTo(px0 + dx * 3 - px * (half - 2), py0 + dy * 3 - py * (half - 2));
  }
  ctx.stroke();

  // Ink outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(a2.x, a2.y);
  ctx.closePath();
  ctx.stroke();

  // Bright central reflective line
  ctx.strokeStyle = '#f4fdff';
  ctx.lineWidth = 2.6;
  ctx.shadowColor = 'rgba(206, 242, 255, 0.95)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Bolts near both ends
  ctx.fillStyle = '#3b4046';
  ctx.strokeStyle = '#14171a';
  ctx.lineWidth = 0.8;
  for (const end of [a, b]) {
    const inset = Math.min(9, mirror.halfLength * 0.4);
    const bx = end.x + (end === a ? dx : -dx) * inset;
    const by = end.y + (end === a ? dy : -dy) * inset;
    ctx.beginPath();
    ctx.arc(bx, by, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Small engraved label on the metal backing, not floating on the paper
  if (mirror.halfLength > 20) {
    let labelAngle = mirror.angle;
    if (labelAngle > Math.PI / 2 || labelAngle < -Math.PI / 2) labelAngle += Math.PI;
    ctx.save();
    ctx.translate(c.x + px * 3.2, c.y + py * 3.2);
    ctx.rotate(labelAngle);
    ctx.fillStyle = 'rgba(28, 32, 36, 0.55)';
    ctx.font = '700 5.5px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MIRROR', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

// Dark felt absorber patch: no reflection, diagonal hatch edge, dotted texture.
export function drawAbsorber(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  reducedMotion = false,
): void {
  ctx.save();

  ctx.fillStyle = 'rgba(20, 15, 10, 0.3)';
  ctx.fillRect(rect.x + 3, rect.y + 4, rect.w, rect.h);

  const felt = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  felt.addColorStop(0, '#403c37');
  felt.addColorStop(1, '#282522');
  ctx.fillStyle = felt;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Felt dots, on a stable grid so the patch never shimmers
  ctx.fillStyle = 'rgba(12, 11, 10, 0.35)';
  for (let y = rect.y + 8; y < rect.y + rect.h - 4; y += 8) {
    for (let x = rect.x + 8; x < rect.x + rect.w - 4; x += 8) {
      const offset = Math.floor((y - rect.y) / 8) % 2 === 0 ? 0 : 4;
      ctx.beginPath();
      ctx.arc(x + offset, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Diagonal hatch border only: the felt interior stays dark and matte
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  const inset = Math.min(11, rect.w / 5, rect.h / 5);
  ctx.rect(rect.x + inset, rect.y + inset, rect.w - inset * 2, rect.h - inset * 2);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(228, 214, 186, 0.26)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const span = rect.w + rect.h;
  for (let d = -rect.h; d < span; d += 7) {
    ctx.moveTo(rect.x + d, rect.y + rect.h);
    ctx.lineTo(rect.x + d + rect.h, rect.y);
  }
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  // Corner brackets mark it as a dead zone
  ctx.strokeStyle = 'rgba(232, 220, 196, 0.5)';
  ctx.lineWidth = 1.6;
  const arm = Math.min(10, rect.w / 4, rect.h / 4);
  for (const [cx, cy, sx, sy] of [
    [rect.x + 3, rect.y + 3, 1, 1],
    [rect.x + rect.w - 3, rect.y + 3, -1, 1],
    [rect.x + 3, rect.y + rect.h - 3, 1, -1],
    [rect.x + rect.w - 3, rect.y + rect.h - 3, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * arm);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * arm, cy);
    ctx.stroke();
  }

  if (rect.w >= 54 && rect.h >= 20) {
    const small = rect.h < 30;
    ctx.fillStyle = 'rgba(236, 224, 200, 0.8)';
    ctx.font = `700 ${small ? 7 : 8.5}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ABSORBER', rect.x + rect.w / 2, rect.y + rect.h / 2 + (small ? 0 : -3));
    ctx.strokeStyle = 'rgba(236, 224, 200, 0.28)';
    ctx.lineWidth = 1;
    const tw = Math.min(rect.w - 20, 62);
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w / 2 - tw / 2, rect.y + rect.h / 2 + 8);
    ctx.lineTo(rect.x + rect.w / 2 + tw / 2, rect.y + rect.h / 2 + 8);
    ctx.stroke();
  }

  ctx.restore();
}

