// Procedural Web Audio for LaserBlink. No files, no samples, no dependencies.

type Scene = 'menu' | 'study' | 'aim' | 'reveal' | 'gameover' | 'victory';
type Bus = 'music' | 'fx';

interface SceneSpec {
  root: number;
  tempo: number;
  arp: (number | null)[];
  pad: number[];
  padAt: number[];
  shaker: number[];
  thump: number[];
}

const MASTER_LEVEL = 0.6;
const MUSIC_LEVEL = 0.3;
const FX_LEVEL = 0.7;
const PENTATONIC = [0, 2, 4, 7, 9];

const SCENES: Record<Scene, SceneSpec> = {
  menu: {
    root: 48,
    tempo: 74,
    arp: [0, 7, 12, null, 9, null, 7, 4, 0, 7, 14, null, 12, null, 9, 7],
    pad: [0, 7, 12],
    padAt: [0, 8],
    shaker: [4, 12],
    thump: [0, 8],
  },
  study: {
    root: 50,
    tempo: 62,
    arp: [0, null, 7, null, 4, null, null, 9, 2, null, 7, null, 4, null, 9, null],
    pad: [0, 7],
    padAt: [0, 8],
    shaker: [8],
    thump: [0],
  },
  aim: {
    root: 45,
    tempo: 56,
    arp: [0, null, null, 3, null, null, 7, null, 0, null, null, 10, null, 7, null, null],
    pad: [0, 3, 7],
    padAt: [0, 8],
    shaker: [4, 12],
    thump: [0],
  },
  reveal: {
    root: 53,
    tempo: 84,
    arp: [0, 4, 7, 12, 9, 7, 4, 7, 0, 4, 7, 12, 16, 12, 9, 7],
    pad: [0, 4, 7],
    padAt: [0, 8],
    shaker: [2, 6, 10, 14],
    thump: [0, 8],
  },
  gameover: {
    root: 43,
    tempo: 54,
    arp: [7, null, 3, null, 0, null, null, 3, 2, null, 0, null, null, 0, null, null],
    pad: [0, 3, 7],
    padAt: [0, 8],
    shaker: [],
    thump: [0],
  },
  victory: {
    root: 60,
    tempo: 100,
    arp: [0, 4, 7, 12, 16, 12, 7, 4, 0, 4, 7, 12, 14, 12, 7, 4],
    pad: [0, 4, 7, 12],
    padAt: [0, 8],
    shaker: [0, 4, 8, 12],
    thump: [0, 8],
  },
};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private musicSources = new Set<AudioScheduledSourceNode>();
  private fxSources = new Set<AudioScheduledSourceNode>();

  private timer: number | null = null;
  private musicOn = false;
  private scene: Scene = 'menu';
  private step = 0;
  private nextTime = 0;

  private burnStep = 0;
  private burnAt = -1;

  private _enabled = true;
  private _musicEnabled = true;

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this.setEnabled(value);
  }

  setEnabled(value: boolean) {
    if (this._enabled === value) return;
    this._enabled = value;

    if (!value) {
      this.stopMusic();
      this.stopAllSources();
    } else if (this._musicEnabled && this.scene !== 'menu') {
      this.startMusic();
    }
    this.applyMasterLevel();
  }

  setScene(scene: Scene) {
    const changed = this.scene !== scene;
    this.scene = scene;

    if (scene === 'menu') {
      this.stopMusic();
      return;
    }
    if (!changed) return;

    this.step = 0;
    this.burnStep = 0;
    this.burnAt = -1;

    if (this.ctx && this._enabled && this._musicEnabled) {
      this.startMusic();
    }
  }

  startMusic() {
    if (!this._enabled || !this._musicEnabled) return;
    const ctx = this.ensure();
    if (!ctx) return;

    if (this.musicOn && this.timer !== null) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;

    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(ctx.currentTime);
      this.musicBus.gain.setTargetAtTime(MUSIC_LEVEL, ctx.currentTime, 0.2);
    }

    this.tick();
    this.timer = window.setInterval(() => this.tick(), 100);
  }

  stopMusic() {
    this.musicOn = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    const ctx = this.ctx;
    if (!ctx) return;

    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(ctx.currentTime);
      this.musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    }
    this.stopSources(this.musicSources, ctx.currentTime + 0.15);
  }

  playClick() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.noiseHit(ctx, t, 0.035, 2100, 0.8, 0.16, 'fx');
    this.tone(ctx, 'triangle', 760, 540, t, 0.045, 0.045, 'fx');
  }



  playStudyTick(remainingSeconds: number) {
    const ctx = this.begin();
    if (!ctx) return;

    const left = Number.isFinite(remainingSeconds) ? Math.max(0, remainingSeconds) : 9;
    const urgent = left <= 3;
    this.pencilTap(ctx, ctx.currentTime, urgent ? 940 : 640, urgent ? 0.065 : 0.045);
  }

  playBlink() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    const src = this.noiseSource(ctx, t, 0.26);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.85;
    filter.frequency.setValueAtTime(1300, t);
    filter.frequency.exponentialRampToValueAtTime(3100, t + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus!);
    this.track(src, 'fx', filter, gain);
  }

  playLaser() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.tone(ctx, 'sine', 640, 180, t, 0.3, 0.12, 'fx');
    this.tone(ctx, 'sawtooth', 1280, 260, t, 0.26, 0.028, 'fx', 1500);

    const src = this.noiseSource(ctx, t, 0.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(5200, t + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus!);
    this.track(src, 'fx', filter, gain);
  }

  playBounce(index = 0) {
    const ctx = this.begin();
    if (!ctx) return;

    const i = Math.max(0, Math.floor(index));
    const octave = Math.floor((i % 15) / PENTATONIC.length);
    const note = PENTATONIC[i % PENTATONIC.length] + octave * 12;
    const t = ctx.currentTime;

    this.pluck(ctx, hz(74 + note), t, 0.11, 0.26, 'fx');
    this.noiseHit(ctx, t, 0.02, 3200, 0.7, 0.03, 'fx');
  }

  playBurn() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (t - this.burnAt < 0.6) {
      this.burnStep = (this.burnStep + 1) % PENTATONIC.length;
    } else {
      this.burnStep = 0;
    }
    this.burnAt = t;

    const src = this.noiseSource(ctx, t, 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.24);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus!);
    this.track(src, 'fx', filter, gain);

    const note = PENTATONIC[this.burnStep];
    this.pluck(ctx, hz(72 + note), t, 0.1, 0.32, 'fx');
  }



  playGameOver() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [67, 64, 60, 55].forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.13, 0.085, 0.55, 'fx');
    });
  }

  playInk() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [84, 88, 91].forEach((midi, i) => {
      this.tone(ctx, 'sine', hz(midi), hz(midi), t + i * 0.05, 0.16, 0.035, 'fx');
    });
  }

  playPass() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [67, 72, 76, 79].forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.065, 0.08, 0.34, 'fx');
    });
  }

  playMiss() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.tone(ctx, 'sine', 120, 68, t, 0.24, 0.11, 'fx', 420);
    this.noiseHit(ctx, t, 0.1, 340, 0.6, 0.04, 'fx');
  }

  playVictory() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    const notes = [72, 76, 79, 84, 79, 84, 88];
    notes.forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.095, 0.07, 0.5, 'fx');
    });
    this.pluck(ctx, hz(60), t, 0.07, 0.9, 'fx');
  }



  private begin(): AudioContext | null {
    if (!this._enabled) return null;
    return this.ensure();
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;

      this.ctx = new Ctor();

      this.master = this.ctx.createGain();
      this.master.gain.value = this._enabled ? MASTER_LEVEL : 0;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      this.fxBus = this.ctx.createGain();
      this.fxBus.gain.value = FX_LEVEL;
      this.fxBus.connect(this.master);

      const length = Math.floor(this.ctx.sampleRate);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private applyMasterLevel() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(this._enabled ? MASTER_LEVEL : 0, this.ctx.currentTime, 0.03);
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.musicOn) return;

    const now = ctx.currentTime;
    if (this.nextTime < now - 0.5) this.nextTime = now + 0.05;

    while (this.nextTime < now + 0.3) {
      this.scheduleStep(this.scene, this.step, this.nextTime);
      this.step = (this.step + 1) % 16;
      this.nextTime += 30 / SCENES[this.scene].tempo;
    }
  }

  private scheduleStep(scene: Scene, step: number, t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const spec = SCENES[scene];
    const stepDur = 30 / spec.tempo;

    const note = spec.arp[step];
    if (note !== null && note !== undefined) {
      const amp = step % 8 === 0 ? 0.2 : 0.15;
      this.pluck(ctx, hz(spec.root + 12 + note), t, amp, 0.65 + stepDur * 0.4, 'music');
    }

    if (spec.padAt.includes(step)) {
      const duration = stepDur * 7.6;
      for (const interval of spec.pad) {
        this.pad(ctx, hz(spec.root + interval), t, duration, 0.055);
      }
    }

    if (spec.shaker.includes(step)) this.shaker(ctx, t);
    if (spec.thump.includes(step)) this.thump(ctx, t);
  }

  private pluck(ctx: AudioContext, freq: number, t: number, amp: number, dur: number, bus: Bus) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(4600, freq * 6), t);
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(amp, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus === 'music' ? this.musicBus! : this.fxBus!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.track(osc, bus, filter, gain);
  }

  private tone(
    ctx: AudioContext,
    type: OscillatorType,
    f0: number,
    f1: number,
    t: number,
    dur: number,
    amp: number,
    bus: Bus,
    filterHz?: number,
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(amp, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    if (filterHz) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterHz, t);
      gain.connect(filter);
      filter.connect(bus === 'music' ? this.musicBus! : this.fxBus!);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      this.track(osc, bus, gain, filter);
      return;
    }

    gain.connect(bus === 'music' ? this.musicBus! : this.fxBus!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.track(osc, bus, gain);
  }

  private pad(ctx: AudioContext, freq: number, t: number, dur: number, amp: number) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(820, t);
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(amp, t + 0.9);
    gain.gain.setValueAtTime(amp, t + dur * 0.62);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    filter.connect(gain);
    gain.connect(this.musicBus!);

    for (const detune of [-5, 5]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      this.track(osc, 'music', filter, gain);
    }
  }

  private shaker(ctx: AudioContext, t: number) {
    this.noiseHit(ctx, t, 0.035, 3600, 0.7, 0.022, 'music');
  }

  private thump(ctx: AudioContext, t: number) {
    this.tone(ctx, 'sine', 84, 56, t, 0.16, 0.035, 'music');
  }

  private pencilTap(ctx: AudioContext, t: number, freq: number, amp: number) {
    this.noiseHit(ctx, t, 0.03, 1500, 0.65, amp * 1.1, 'fx');
    this.tone(ctx, 'triangle', freq, freq * 0.97, t, 0.05, amp * 0.7, 'fx');
  }

  private noiseHit(
    ctx: AudioContext,
    t: number,
    dur: number,
    freq: number,
    q: number,
    amp: number,
    bus: Bus,
    sweepTo?: number,
  ) {
    const src = this.noiseSource(ctx, t, dur + 0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(amp, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus === 'music' ? this.musicBus! : this.fxBus!);
    this.track(src, bus, filter, gain);
  }

  private noiseSource(ctx: AudioContext, t: number, dur: number): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.start(t);
    src.stop(t + dur);
    return src;
  }

  private track(src: AudioScheduledSourceNode, bus: Bus, ...nodes: AudioNode[]) {
    const set = bus === 'music' ? this.musicSources : this.fxSources;
    set.add(src);
    src.onended = () => {
      set.delete(src);
      try {
        src.disconnect();
      } catch {
        // already torn down
      }
      for (const node of nodes) {
        try {
          node.disconnect();
        } catch {
          // already torn down
        }
      }
    };
  }

  private stopSources(set: Set<AudioScheduledSourceNode>, at: number) {
    for (const src of set) {
      try {
        src.stop(at);
      } catch {
        // source was never started or already stopped
      }
    }
  }

  private stopAllSources() {
    if (!this.ctx) return;
    const at = this.ctx.currentTime + 0.03;
    this.stopSources(this.musicSources, at);
    this.stopSources(this.fxSources, at);
  }
}

export const sounds = new SoundEngine();
