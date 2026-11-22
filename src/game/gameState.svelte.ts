import type { Phase, RoundPlan, RoundResult, Segment, Settings, TargetResult } from './types';
import { ARENA, CANVAS, absorberRects, clampDifficulty, createRunSeed, generateRound } from './level';
import { traceBeam } from './beam';
import { evaluateShot, gradeRound, scoreRound } from './scoring';
import { sounds } from './audio';
import { fx } from './render/particles';
import { distanceAlong } from './render/scene';
import { totalPathLength } from './render/draw';

export const RUN_LENGTH = 10;
export type Mode = 'notebook' | 'endless';

export const DIFFICULTY_LABELS = ['Calm', 'Easy', 'Normal', 'Tricky', 'Wild'];

const MAX_INK = 3;
const BEAM_TRAVEL_MS = 650;

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

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
  studyEndsAt = $state<number>(0);
  burntTargetIds = $state<Set<number>>(new Set());

  totalHits = $state<number>(0);
  totalTargets = $state<number>(0);
  totalBallsBurned = $state<number>(0);
  roundPerfect = $state<boolean>(false);

  private runSeed = '';
  mode = $state<Mode>('notebook');
  difficulty = $state<number>(3);
  ink = $state<number>(MAX_INK);
  maxInk = MAX_INK;
  previewSegments = $state<Segment[]>([]);
  inkUsed = $state<number>(0);
  previewActive = $state<boolean>(false);
  roundPassed = $state<boolean>(false);
  bestStars = $state<number>(0);
  totalInkUsed = $state<number>(0);
  newHighScore = $state<boolean>(false);

  settings = $state<Settings>({
    sound: true,
    reducedMotion: prefersReducedMotion(),
  });

  private timerInterval: number | null = null;
  private animFrame: number | null = null;
  private fireTimeout: number | null = null;
  private firingStartTime = 0;
  private lastTickSecond = -1;
  private pendingResult: RoundResult | null = null;
  private runStartHighScore = 0;
  private fieldW = 0;
  private fieldH = 0;

  constructor() {
    this.loadHighScore();
    sounds.enabled = this.settings.sound;
  }

  loadHighScore() {
    try {
      if (typeof localStorage === 'undefined') return;
      const saved = localStorage.getItem('laserblink_highscore');
      if (!saved) return;
      const value = Number(saved);
      if (Number.isFinite(value) && value > 0) {
        this.highScore = Math.floor(value);
      }
    } catch {
      // storage unavailable, keep default
    }
  }

  saveHighScore() {
    if (this.score <= this.highScore) return;
    this.highScore = this.score;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('laserblink_highscore', String(this.highScore));
      }
    } catch {
      // storage unavailable, score still lives in memory
    }
  }

  toggleSound() {
    this.settings.sound = !this.settings.sound;
    sounds.setEnabled(this.settings.sound);
    if (this.settings.sound) sounds.playClick();
  }

  toggleReducedMotion() {
    this.settings.reducedMotion = !this.settings.reducedMotion;
    sounds.playClick();

    // If a shot is mid-flight, settle it right away instead of leaving it hanging.
    if (this.settings.reducedMotion && this.phase === 'firing' && this.pendingResult) {
      this.clearTimers();
      const roundRes = this.pendingResult;
      this.pendingResult = null;
      this.finishFiring(roundRes);
    }
  }

  startGame(options: { seed?: string; mode?: Mode; difficulty?: number } = {}) {
    // First click of the run: unlock audio and start the soundtrack.
    sounds.playClick();
    this.clearTimers();
    fx.reset();

    this.mode = options.mode ?? this.mode;
    this.difficulty = clampDifficulty(options.difficulty ?? this.difficulty);
    this.runSeed = options.seed?.trim() || createRunSeed();
    this.runStartHighScore = this.highScore;
    this.round = 1;
    this.score = 0;
    this.lives = this.maxLives;
    this.totalHits = 0;
    this.totalTargets = 0;
    this.totalBallsBurned = 0;
    this.roundPerfect = false;
    this.bestStars = 0;
    this.totalInkUsed = 0;
    this.ink = this.maxInk;
    this.newHighScore = false;
    this.results = null;
    this.roundPassed = false;
    this.pendingResult = null;

    this.startRound(1);
  }

  retryGame() {
    this.startGame({ seed: this.runSeed, mode: this.mode, difficulty: this.difficulty });
  }

  newRun() {
    this.goToMenu();
  }

  goToMenu() {
    sounds.playClick();
    this.clearTimers();
    this.pendingResult = null;
    this.previewActive = false;
    this.previewSegments = [];
    this.beamProgress = 0;
    this.phase = 'menu';
  }

  startRound(roundNumber: number) {
    this.clearTimers();
    fx.reset();

    this.round =
      this.mode === 'notebook'
        ? Math.min(Math.max(1, roundNumber), RUN_LENGTH)
        : Math.max(1, roundNumber);
    this.plan = generateRound(this.round, this.runSeed, this.difficulty);
    this.fieldW = CANVAS.w;
    this.fieldH = CANVAS.h;
    this.angle = -Math.PI / 4;
    this.beamProgress = 0;
    this.burntTargetIds = new Set();
    this.results = null;
    this.roundPassed = false;
    this.pendingResult = null;

    this.inkUsed = 0;
    this.previewActive = false;
    this.previewSegments = [];

    this.recalculateBeam();

    this.phase = 'study';
    this.studyCountdown = this.plan.studySeconds;
    this.studyEndsAt = performance.now() + this.plan.studySeconds * 1000;
    this.lastTickSecond = Math.ceil(this.studyCountdown);

    sounds.playStudyTick(this.studyCountdown);

    const stepMs = 100;
    this.timerInterval = window.setInterval(() => {
      this.studyCountdown = Math.max(0, this.studyCountdown - stepMs / 1000);

      const second = Math.ceil(this.studyCountdown);
      if (this.studyCountdown > 0 && second !== this.lastTickSecond) {
        this.lastTickSecond = second;
        sounds.playStudyTick(this.studyCountdown);
      }

      if (this.studyCountdown <= 0) {
        this.enterAimPhase();
      }
    }, stepMs);
  }

  enterAimPhase() {
    if (this.phase !== 'study') return;
    this.clearCountdown();
    sounds.playBlink();
    this.phase = 'aim';
    this.studyCountdown = 0;
    this.studyEndsAt = 0;
    this.recalculateBeam();
  }

  // Right-click and the primary key do the same thing: move the page forward.
  advance() {
    if (this.phase === 'study') {
      this.enterAimPhase();
    } else if (this.phase === 'aim') {
      this.fireLaser();
    } else if (this.phase === 'reveal') {
      this.nextRound();
    }
  }

  // The canvas owns the window, so a resize reshapes the field. Pages are only
  // rebuilt while the field is being studied, never in the middle of a shot.
  syncPlayfield() {
    if (this.phase !== 'study' || !this.plan) return;
    if (CANVAS.w === this.fieldW && CANVAS.h === this.fieldH) return;
    this.startRound(this.round);
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

  useInk() {
    if (this.phase !== 'aim' || !this.plan || this.ink <= 0) return;

    this.ink -= 1;
    this.inkUsed += 1;
    this.totalInkUsed += 1;
    this.previewActive = true;
    this.previewSegments = this.trace(this.angle, this.plan.maxBounces);
    sounds.playInk();
  }

  // Default aim guide is only the first leg of the beam. Targets are never drawn from it.
  recalculateBeam() {
    if (!this.plan) return;
    this.segments = this.trace(this.angle, 0);
    if (this.previewActive) {
      this.previewSegments = this.trace(this.angle, this.plan.maxBounces);
    }
  }

  private trace(angle: number, maxBounces: number): Segment[] {
    if (!this.plan) return [];
    const absorbers = absorberRects(this.plan);
    const { segments } = traceBeam(
      this.plan.player,
      angle,
      ARENA,
      this.plan.obstacles,
      maxBounces,
      this.plan.mirrors,
      absorbers,
    );
    return segments;
  }

  fireLaser() {
    if (this.phase !== 'aim' || !this.plan) return;

    this.clearCountdown();
    this.phase = 'firing';
    this.beamProgress = 0;
    this.burntTargetIds = new Set();
    this.firingStartTime = performance.now();
    this.previewActive = false;

    sounds.playLaser();

    const shotSegments = this.trace(this.angle, this.plan.maxBounces);
    this.segments = shotSegments;

    const evaluated = evaluateShot(this.plan.targets, shotSegments);
    const roundRes = this.buildResult(evaluated, shotSegments);
    this.results = roundRes;
    this.pendingResult = roundRes;

    if (this.settings.reducedMotion) {
      this.markHitsBurned(evaluated);
      this.finishFiring(roundRes);
      return;
    }

    const totalLen = totalPathLength(shotSegments);
    let lastBounceIndex = -1;

    const animateBeam = (now: number) => {
      const elapsed = now - this.firingStartTime;
      const progress = Math.min(1, elapsed / BEAM_TRAVEL_MS);
      this.beamProgress = progress;

      const currentDistance = progress * totalLen;
      let accum = 0;
      for (let i = 0; i < shotSegments.length - 1; i++) {
        const segLen = Math.hypot(
          shotSegments[i].b.x - shotSegments[i].a.x,
          shotSegments[i].b.y - shotSegments[i].a.y,
        );
        accum += segLen;
        if (currentDistance >= accum && i > lastBounceIndex) {
          lastBounceIndex = i;
          sounds.playBounce(i);
          const norm = {
            x: Math.sign(shotSegments[i].a.x - shotSegments[i].b.x),
            y: Math.sign(shotSegments[i].a.y - shotSegments[i].b.y),
          };
          fx.spawnBounceSparks(shotSegments[i].b.x, shotSegments[i].b.y, norm);
        }
      }

      for (const res of evaluated) {
        if (!res.hit || this.burntTargetIds.has(res.target.id)) continue;

        const ballDistOnPath = distanceAlong(res.closest, shotSegments);
        if (currentDistance >= ballDistOnPath) {
          this.burntTargetIds.add(res.target.id);
          this.burntTargetIds = new Set(this.burntTargetIds);

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
        this.animFrame = null;
        this.finishFiring(roundRes);
      }
    };

    this.animFrame = requestAnimationFrame(animateBeam);

    // A hidden tab pauses animation frames. The shot still has to land, so the
    // result is settled on a timer as well.
    this.fireTimeout = window.setTimeout(() => {
      if (this.phase === 'firing') this.finishFiring(roundRes);
    }, BEAM_TRAVEL_MS + 240);
  }

  private buildResult(evaluated: TargetResult[], shotSegments: Segment[]): RoundResult {
    const base = scoreRound(evaluated, this.round, shotSegments, this.inkUsed, this.plan?.requiredBounces ?? 0);

    // The generated page owns the quota; fall back to scoring's if it is missing.
    const requiredHits = this.plan?.requiredHits ?? base.requiredHits;
    if (requiredHits === base.requiredHits) return base;

    const grade = gradeRound(base.hits, base.total, requiredHits);
    return {
      ...base,
      requiredHits,
      passed: base.hits >= requiredHits,
      grade: grade.title,
      stars: grade.stars,
    };
  }

  private markHitsBurned(evaluated: TargetResult[]) {
    for (const res of evaluated) {
      if (res.hit) this.burntTargetIds.add(res.target.id);
    }
    this.burntTargetIds = new Set(this.burntTargetIds);
  }

  finishFiring(roundRes: RoundResult) {
    if (this.phase !== 'firing') return;

    this.clearTimers();
    this.pendingResult = null;
    this.phase = 'reveal';
    this.beamProgress = 1;
    this.markHitsBurned(roundRes.results);

    this.score += roundRes.score;
    this.saveHighScore();

    this.totalHits += roundRes.hits;
    this.totalTargets += roundRes.total;
    this.totalBallsBurned += roundRes.hits;
    this.roundPerfect = roundRes.perfect;
    this.roundPassed = roundRes.passed;
    this.bestStars = Math.max(this.bestStars, roundRes.stars);

    if (roundRes.passed) {
      sounds.playPass();
      if (this.plan && roundRes.perfect) {
        fx.addText(this.plan.player.x, this.plan.player.y - 50, '★ PERFECT ASH! ★', '#facc15');
      }
    } else {
      if (this.mode === 'notebook') this.lives = Math.max(0, this.lives - 1);
      sounds.playMiss();
    }
  }

  nextRound() {
    if (this.phase !== 'reveal') return;
    sounds.playClick();

    if (this.mode === 'notebook' && this.lives <= 0) {
      this.endRun('gameover');
      return;
    }
    if (this.mode === 'notebook' && this.round >= RUN_LENGTH) {
      this.endRun('victory');
      return;
    }
    this.startRound(this.round + 1);
  }

  // Endless has no failure state, so the player ends the run themselves.
  endRunNow() {
    if (this.phase === 'menu' || this.phase === 'gameover' || this.phase === 'victory') return;
    this.endRun('gameover');
  }

  private endRun(phase: 'gameover' | 'victory') {
    this.clearTimers();
    const beatHighScore = this.score > this.runStartHighScore;
    this.saveHighScore();
    this.newHighScore = beatHighScore;
    this.phase = phase;

    if (phase === 'victory') {
      sounds.playVictory();
    } else {
      sounds.playGameOver();
    }
  }

  private clearCountdown() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  clearTimers() {
    this.clearCountdown();
    if (this.fireTimeout !== null) {
      clearTimeout(this.fireTimeout);
      this.fireTimeout = null;
    }
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}

export const game = new GameController();
