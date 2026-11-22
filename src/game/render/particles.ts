// Particle and burn FX engine for LaserBlink
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
  type: 'ember' | 'smoke' | 'spark' | 'char';
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

export class FXManager {
  public particles: Particle[] = [];
  public texts: FloatingText[] = [];
  public scorchMarks: ScorchMark[] = [];

  reset() {
    this.particles = [];
    this.texts = [];
    this.scorchMarks = [];
  }

  // Create scorch mark on the paper
  addScorch(x: number, y: number, radius: number) {
    // Generate organic charred paper jagged ring
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

  // Burst of embers, sparks, and smoke when paper ball is burned
  spawnBurnExplosion(x: number, y: number, color: string) {
    this.addScorch(x, y, 28);

    // Orange/yellow glowing embers
    const emberColors = ['#ff3b00', '#ff8400', '#ffdd00', '#ffffff', color];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2.5 + Math.random() * 3.5,
        color: emberColors[Math.floor(Math.random() * emberColors.length)],
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
        type: 'ember',
      });
    }

    // Ash / smoke puffs
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: -1 - Math.random() * 1.5,
        size: 7 + Math.random() * 9,
        color: Math.random() > 0.5 ? '#2d2720' : '#4a4136',
        alpha: 0.8,
        decay: 0.015 + Math.random() * 0.02,
        type: 'smoke',
      });
    }
  }

  // Laser reflection sparks at walls
  spawnBounceSparks(x: number, y: number, normal: Vec2) {
    const baseAngle = Math.atan2(normal.y, normal.x);
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const angle = baseAngle + spread;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#ffe600' : '#ff4800',
        alpha: 1,
        decay: 0.04 + Math.random() * 0.04,
        type: 'spark',
      });
    }
  }

  // Floating text like "+1000", "PERFECT ASH!"
  addText(x: number, y: number, text: string, color = '#fde047') {
    this.texts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.4,
      vy: -1.6,
    });
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'smoke') {
        p.size += 0.2;
        p.vx *= 0.96;
        p.vy *= 0.97;
      } else if (p.type === 'ember') {
        p.vy += 0.08; // gravity
        p.vx *= 0.98;
      }

      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
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

  draw(ctx: CanvasRenderingContext2D) {
    // Draw scorch marks on paper
    for (const s of this.scorchMarks) {
      ctx.save();
      ctx.fillStyle = `rgba(32, 22, 14, ${s.alpha * 0.65})`;
      ctx.beginPath();
      if (s.points.length > 0) {
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.closePath();
      }
      ctx.fill();

      // Burnt orange outer rim
      ctx.strokeStyle = `rgba(180, 50, 10, ${s.alpha * 0.4})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // glowing ember / spark
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw floating score / combo texts
    for (const t of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = '800 20px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#14161f';
      ctx.lineWidth = 5;
      ctx.strokeText(t.text, 0, 0);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }
  }
}

export const fx = new FXManager();
