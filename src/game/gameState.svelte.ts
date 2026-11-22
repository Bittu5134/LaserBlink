import type { Phase, RoundPlan, RoundResult, Segment, Settings } from './types';
import { ARENA, generateRound } from './level';
import { traceBeam } from './beam';
import { evaluateShot, scoreRound } from './scoring';
import { sounds } from './audio';
import { fx } from './render/particles';
import { distanceAlong } from './render/scene';
import { totalPathLength } from './render/draw';

export class GameController {
  phase = $state<Phase>('menu');
  round = $state<number>(1);
  score = $state<number>(0);
  highScore = $state<number>(0);
  lives = $state<number>(3);
  maxLives = 3;

  plan = $state<RoundPlan | null>(null);
  angle = $state<number>(-Math.PI / 4);
  segments = $state<Segment[]>([]);
  results = $state<RoundResult | null>(null);

  beamProgress = $state<number>(0);
  studyCountdown = $state<number>(0);
  burntTargetIds = $state<Set<number>>(new Set());

  totalHits = $state<number>(0);
  totalTargets = $state<number>(0);
  totalBallsBurned = $state<number>(0);
  roundPerfect = $state<boolean>(false);

  settings = $state<Settings>({
    sound: true,
    assist: 'stub',
  });

  private timerInterval: number | null = null;
  private animFrame: number | null = null;
  private firingStartTime = 0;

  constructor() {
    this.loadHighScore();
  }

  loadHighScore() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('laserblink_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('laserblink_highscore', String(this.highScore));
      }
    }
  }

  toggleSound() {
    this.settings.sound = !this.settings.sound;
    sounds.enabled = this.settings.sound;
    if (this.settings.sound) sounds.playClick();
  }

  toggleAssist() {
    if (this.settings.assist === 'stub') {
      this.settings.assist = 'full';
    } else if (this.settings.assist === 'full') {
      this.settings.assist = 'off';
    } else {
      this.settings.assist = 'stub';
    }
    sounds.playClick();
    this.recalculateBeam();
  }

  startGame() {
    sounds.playClick();
    this.round = 1;
    this.score = 0;
    this.lives = this.maxLives;
    this.totalHits = 0;
    this.totalTargets = 0;
    this.totalBallsBurned = 0;
    this.startRound(1);
  }

  retryGame() {
    this.startGame();
  }

  goToMenu() {
    sounds.playClick();
    this.clearTimers();
    this.phase = 'menu';
  }

  startRound(roundNumber: number) {
    this.clearTimers();
    fx.reset();
    this.round = roundNumber;
    this.plan = generateRound(roundNumber);
    this.angle = -Math.PI / 4;
    this.beamProgress = 0;
    this.burntTargetIds = new Set();
    this.results = null;

    // Recalculate aiming path
    this.recalculateBeam();

    // Start study / memorization phase
    this.phase = 'study';
    this.studyCountdown = this.plan.studySeconds;

    sounds.playBeep(false);

    const stepMs = 100;
    this.timerInterval = window.setInterval(() => {
      this.studyCountdown = Math.max(0, this.studyCountdown - stepMs / 1000);

      // Audio beeps on last 3 seconds
      if (this.studyCountdown > 0 && this.studyCountdown <= 2.1 && Math.round(this.studyCountdown * 10) % 10 === 0) {
        sounds.playBeep(false);
      }

      if (this.studyCountdown <= 0) {
        this.clearTimers();
        this.enterAimPhase();
      }
    }, stepMs);
  }

  enterAimPhase() {
    // BLINK! Paper balls disappear into hiding
    sounds.playBlink();
    this.phase = 'aim';
    this.recalculateBeam();
  }

  setAimAngle(angle: number) {
    if (this.phase !== 'aim') return;
    this.angle = angle;
    this.recalculateBeam();
  }

  adjustAngle(delta: number) {
    if (this.phase !== 'aim') return;
    this.angle += delta;
    this.recalculateBeam();
  }

  recalculateBeam() {
    if (!this.plan) return;
    const { segments } = traceBeam(
      this.plan.player,
      this.angle,
      ARENA,
      this.plan.obstacles,
      this.plan.maxBounces,
    );
    this.segments = segments;
  }

  // Fire laser!
  fireLaser() {
    if (this.phase !== 'aim' || !this.plan) return;

    this.phase = 'firing';
    this.beamProgress = 0;
    this.burntTargetIds = new Set();
    this.firingStartTime = performance.now();

    sounds.playLaser();

    // Evaluate target hit candidates
    const evaluated = evaluateShot(this.plan.targets, this.segments);
    const roundRes = scoreRound(evaluated, this.round, this.segments);
    this.results = roundRes;

    const DURATION = 650; // beam travel duration in ms
    const totalLen = totalPathLength(this.segments);

    let lastBounceIndex = -1;

    const animateBeam = (now: number) => {
      const elapsed = now - this.firingStartTime;
      const progress = Math.min(1, elapsed / DURATION);
      this.beamProgress = progress;

      // Check wall bounce points for bounce sound and sparks
      const currentDistance = progress * totalLen;
      let accum = 0;
      for (let i = 0; i < this.segments.length - 1; i++) {
        const segLen = Math.hypot(
          this.segments[i].b.x - this.segments[i].a.x,
          this.segments[i].b.y - this.segments[i].a.y,
        );
        accum += segLen;
        if (currentDistance >= accum && i > lastBounceIndex) {
          lastBounceIndex = i;
          sounds.playBounce(i);
          const norm = {
            x: Math.sign(this.segments[i].a.x - this.segments[i].b.x),
            y: Math.sign(this.segments[i].a.y - this.segments[i].b.y),
          };
          fx.spawnBounceSparks(this.segments[i].b.x, this.segments[i].b.y, norm);
        }
      }

      // Check for paper ball burns as the laser cuts through
      for (const res of evaluated) {
        if (!res.hit || this.burntTargetIds.has(res.target.id)) continue;

        const ballDistOnPath = distanceAlong(res.closest, this.segments);
        if (currentDistance >= ballDistOnPath) {
          this.burntTargetIds.add(res.target.id);
          this.burntTargetIds = new Set(this.burntTargetIds);

          // Paper burning sizzle and fire burst!
          sounds.playBurn();
          fx.spawnBurnExplosion(res.target.pos.x, res.target.pos.y, res.target.color);

          const comboCount = this.burntTargetIds.size;
          const comboLabel = comboCount > 1 ? ` x${comboCount} COMBO!` : ' DIRECT BURN!';
          fx.addText(res.target.pos.x, res.target.pos.y - 30, `+${Math.round(res.accuracy * 1000)}${comboLabel}`);
        }
      }

      if (progress < 1) {
        this.animFrame = requestAnimationFrame(animateBeam);
      } else {
        this.finishFiring(roundRes);
      }
    };

    this.animFrame = requestAnimationFrame(animateBeam);
  }

  finishFiring(roundRes: RoundResult) {
    this.phase = 'reveal';
    this.beamProgress = 1;

    // Apply score
    this.score += roundRes.score;
    this.saveHighScore();

    this.totalHits += roundRes.hits;
    this.totalTargets += roundRes.total;
    this.totalBallsBurned += roundRes.hits;
    this.roundPerfect = roundRes.perfect;

    if (roundRes.perfect) {
      sounds.playClear();
      if (this.plan) {
        fx.addText(this.plan.player.x, this.plan.player.y - 50, '★ PERFECT ASH! +2500 ★', '#facc15');
      }
    }

    // Check if player passed the round or lost a life
    // Requirement to pass: hit at least 1 target or >= 50%
    const minHitsRequired = Math.max(1, Math.floor(roundRes.total * 0.4));
    if (roundRes.hits < minHitsRequired) {
      this.lives = Math.max(0, this.lives - 1);
      if (this.lives <= 0) {
        window.setTimeout(() => {
          sounds.playGameOver();
          this.phase = 'gameover';
        }, 1500);
      }
    }
  }

  nextRound() {
    sounds.playClick();
    if (this.lives > 0) {
      this.startRound(this.round + 1);
    } else {
      this.phase = 'gameover';
    }
  }

  clearTimers() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}

export const game = new GameController();
