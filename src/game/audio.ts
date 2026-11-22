// Interaction sounds only. Everything here is synthesised at call time.

const MASTER_LEVEL = 0.7;
const PENTATONIC = [0, 2, 4, 7, 9];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private sources = new Set<AudioScheduledSourceNode>();

  private burnStep = 0;
  private burnAt = -1;

  private _enabled = true;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this.setEnabled(value);
  }

  setEnabled(value: boolean) {
    if (this._enabled === value) return;
    this._enabled = value;

    if (!value) this.stopAll();
    this.applyLevel();
  }

  playClick() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.noiseHit(ctx, t, 0.035, 2100, 0.8, 0.16);
    this.tone(ctx, 'triangle', 760, 540, t, 0.045, 0.045);
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
    gain.connect(this.bus!);
    this.track(src, filter, gain);
  }

  playLaser() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.tone(ctx, 'sine', 640, 180, t, 0.3, 0.12);
    this.tone(ctx, 'sawtooth', 1280, 260, t, 0.26, 0.028, 1500);

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
    gain.connect(this.bus!);
    this.track(src, filter, gain);
  }

  // Ascending pentatonic, so a chain of bounces turns into a phrase.
  playBounce(index = 0) {
    const ctx = this.begin();
    if (!ctx) return;

    const i = Math.max(0, Math.floor(index));
    const octave = Math.floor((i % 15) / PENTATONIC.length);
    const note = PENTATONIC[i % PENTATONIC.length] + octave * 12;
    const t = ctx.currentTime;

    this.pluck(ctx, hz(74 + note), t, 0.11, 0.26);
    this.noiseHit(ctx, t, 0.02, 3200, 0.7, 0.03);
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
    gain.connect(this.bus!);
    this.track(src, filter, gain);

    this.pluck(ctx, hz(72 + PENTATONIC[this.burnStep]), t, 0.1, 0.32);
  }

  playInk() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [84, 88, 91].forEach((midi, i) => {
      this.tone(ctx, 'sine', hz(midi), hz(midi), t + i * 0.05, 0.16, 0.035);
    });
  }

  playPass() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [67, 72, 76, 79].forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.065, 0.08, 0.34);
    });
  }

  playMiss() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    this.tone(ctx, 'sine', 120, 68, t, 0.24, 0.11, 420);
    this.noiseHit(ctx, t, 0.1, 340, 0.6, 0.04);
  }

  playVictory() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [72, 76, 79, 84, 79, 84, 88].forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.095, 0.07, 0.5);
    });
    this.pluck(ctx, hz(60), t, 0.07, 0.9);
  }

  playGameOver() {
    const ctx = this.begin();
    if (!ctx) return;
    const t = ctx.currentTime;

    [67, 64, 60, 55].forEach((midi, i) => {
      this.pluck(ctx, hz(midi), t + i * 0.13, 0.085, 0.55);
    });
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

      this.bus = this.ctx.createGain();
      this.bus.gain.value = 1;
      this.bus.connect(this.master);

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

  private applyLevel() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(this._enabled ? MASTER_LEVEL : 0, this.ctx.currentTime, 0.03);
  }

  private pluck(ctx: AudioContext, freq: number, t: number, amp: number, dur: number) {
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
    gain.connect(this.bus!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.track(osc, filter, gain);
  }

  private tone(
    ctx: AudioContext,
    type: OscillatorType,
    f0: number,
    f1: number,
    t: number,
    dur: number,
    amp: number,
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
      filter.connect(this.bus!);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      this.track(osc, gain, filter);
      return;
    }

    gain.connect(this.bus!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.track(osc, gain);
  }

  private pencilTap(ctx: AudioContext, t: number, freq: number, amp: number) {
    this.noiseHit(ctx, t, 0.03, 1500, 0.65, amp * 1.1);
    this.tone(ctx, 'triangle', freq, freq * 0.97, t, 0.05, amp * 0.7);
  }

  private noiseHit(
    ctx: AudioContext,
    t: number,
    dur: number,
    freq: number,
    q: number,
    amp: number,
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
    gain.connect(this.bus!);
    this.track(src, filter, gain);
  }

  private noiseSource(ctx: AudioContext, t: number, dur: number): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.start(t);
    src.stop(t + dur);
    return src;
  }

  private track(src: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      for (const node of [src, ...nodes]) {
        try {
          node.disconnect();
        } catch {
          // already torn down
        }
      }
    };
  }

  private stopAll() {
    if (!this.ctx) return;
    const at = this.ctx.currentTime + 0.03;
    for (const src of this.sources) {
      try {
        src.stop(at);
      } catch {
        // never started, or already stopped
      }
    }
  }
}

export const sounds = new SoundEngine();
