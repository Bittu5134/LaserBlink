// Particle and burn FX engine for LaserBlink.
// Canvas2D only: short-lived embers, low flame wisps, soft glow and scorch marks.
import type { Vec2 } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'ember' | 'smoke' | 'spark' | 'char' | 'wisp';
  seed: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface ScorchMark {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  points: Vec2[];
}

export interface GlowMark {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  decay: number;
}

export class FXManager {
  public particles: Particle[] = [];
  public texts: FloatingText[] = [];
  public scorchMarks: ScorchMark[] = [];
  public glows: GlowMark[] = [];
  public reducedMotion = false;

  reset() {
    this.particles = [];
    this.texts = [];
    this.scorchMarks = [];
    this.glows = [];
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
  }

  // Create an organic charred mark on the paper, with a scorched edge.
  addScorch(x: number, y: number, radius: number) {
    const points: Vec2[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      points.push({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r,
      });
    }
    this.scorchMarks.push({
      x,
      y,
      radius,
      alpha: 0.9,
      points,
    });
  }

  // Burst of embers, sparks, wisps and smoke when a paper ball is burned.
  spawnBurnExplosion(x: number, y: number, color: string) {
    this.addScorch(x, y, 28);

    // A single soft warm glow, very brief, never a full screen flash
    if (!this.reducedMotion) {
      this.glows.push({
        x,
        y,
        radius: 10,
        maxRadius: 46,
        alpha: 0.32,
        decay: 0.055,
      });
    }

    const emberColors = ['#ff3b00', '#ff8400', '#ffdd00', '#ffffff', color];
    const emberCount = this.reducedMotion ? 8 : 22;
    for (let i = 0; i < emberCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2 + Math.random() * 2.6,
        color: emberColors[Math.floor(Math.random() * emberColors.length)],
        alpha: 1,
        decay: 0.03 + Math.random() * 0.035,
        type: 'ember',
        seed: Math.random() * Math.PI * 2,
      });
    }

    // Flame wisps: a few slim tongues that rise and fade quickly
    const wispCount = this.reducedMotion ? 2 : 6;
    for (let i = 0; i < wispCount; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -1.4 - Math.random() * 1.6,
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#ffb066' : '#ff7a3c',
        alpha: 0.45 + Math.random() * 0.2,
        decay: 0.038 + Math.random() * 0.025,
        type: 'wisp',
        seed: Math.random() * Math.PI * 2,
      });
    }

    const smokeCount = this.reducedMotion ? 3 : 8;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.6;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: -0.8 - Math.random() * 1.2,
        size: 7 + Math.random() * 8,
        color: Math.random() > 0.5 ? '#2d2720' : '#4a4136',
        alpha: 0.6,
        decay: 0.018 + Math.random() * 0.015,
        type: 'smoke',
        seed: Math.random() * Math.PI * 2,
      });
    }
  }

  // Laser reflection sparks at walls.
  spawnBounceSparks(x: number, y: number, normal: Vec2) {
    const baseAngle = Math.atan2(normal.y, normal.x);
    const count = this.reducedMotion ? 3 : 7;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const angle = baseAngle + spread;
      const speed = 1.6 + Math.random() * 3.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.6 + Math.random() * 1.8,
        color: Math.random() > 0.3 ? '#ffe600' : '#ff4800',
        alpha: 1,
        decay: 0.05 + Math.random() * 0.04,
        type: 'spark',
        seed: Math.random() * Math.PI * 2,
      });
    }
  }

  // Floating text like "+820 DIRECT BURN!"
  addText(x: number, y: number, text: string, color = '#fde047') {
    this.texts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.4,
      vy: this.reducedMotion ? -1 : -1.6,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const drift = this.reducedMotion ? 0.5 : 1;
      p.x += p.vx * drift;
      p.y += p.vy * drift;

      if (p.type === 'smoke') {
        p.size += this.reducedMotion ? 0.08 : 0.18;
        p.vx *= 0.96;
        p.vy *= 0.97;
      } else if (p.type === 'ember') {
        p.vy += this.reducedMotion ? 0.03 : 0.07;
        p.vx *= 0.98;
      } else if (p.type === 'wisp') {
        p.vx += Math.sin(p.seed + p.alpha * 8) * 0.02;
        p.size *= 0.99;
      }

      p.alpha -= p.decay * (this.reducedMotion ? 1.4 : 1);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.glows.length - 1; i >= 0; i--) {
      const g = this.glows[i];
      g.radius += (g.maxRadius - g.radius) * 0.16;
      g.alpha -= g.decay;
      if (g.alpha <= 0) this.glows.splice(i, 1);
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.alpha -= 0.02;
      if (t.scale > 1) t.scale -= 0.03;
      if (t.alpha <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  // Scorch marks sit under the objects; particles and text sit above them.
  drawScorch(ctx: CanvasRenderingContext2D) {
    for (const s of this.scorchMarks) {
      if (s.points.length === 0) continue;
      ctx.save();

      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.closePath();
      };

      // Scorched paper edge: wide warm stain outside the char
      trace();
      ctx.strokeStyle = `rgba(148, 86, 34, ${s.alpha * 0.16})`;
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.strokeStyle = `rgba(104, 58, 24, ${s.alpha * 0.22})`;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Char body
      trace();
      ctx.fillStyle = `rgba(32, 22, 14, ${s.alpha * 0.62})`;
      ctx.fill();

      // Warm inner rim, low saturation
      ctx.strokeStyle = `rgba(180, 74, 20, ${s.alpha * 0.38})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.restore();
    }
  }

  drawParticles(ctx: CanvasRenderingContext2D) {
    // Soft warm glow, drawn behind particles
    for (const g of this.glows) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, g.alpha);
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      grad.addColorStop(0, 'rgba(255, 196, 120, 0.9)');
      grad.addColorStop(0.5, 'rgba(255, 120, 40, 0.35)');
      grad.addColorStop(1, 'rgba(255, 120, 40, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'wisp') {
        // Slim flame tongue: two layered curves, no flicker under reduced motion
        const sway = this.reducedMotion ? 0 : Math.sin(p.seed + p.alpha * 10) * p.size * 0.5;
        ctx.strokeStyle = p.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = p.size * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + sway * 0.4, p.y - p.size, p.x + sway, p.y - p.size * 1.9);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 238, 196, 0.65)';
        ctx.lineWidth = p.size * 0.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + sway * 0.3, p.y - p.size * 0.8, p.x + sway * 0.8, p.y - p.size * 1.5);
        ctx.stroke();
      } else {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = this.reducedMotion ? 0 : p.type === 'spark' ? 4 : 5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const t of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = '800 18px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = '#14161f';
      ctx.lineWidth = 5;
      ctx.strokeText(t.text, 0, 0);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawScorch(ctx);
    this.drawParticles(ctx);
  }
}

export const fx = new FXManager();
