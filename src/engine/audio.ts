// All sounds are synthesised with the Web Audio API: no audio files, nothing to license,
// works offline. The context can only start after a tap (browser autoplay rules).

interface Scratch {
  src: AudioBufferSourceNode;
  band: BiquadFilterNode;
  gain: GainNode;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private scratch: Scratch | null = null;
  private music: { bus: GainNode; timer: number; note: number } | null = null;
  private wantMusic = false;
  muted = false;

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        const master = ctx.createGain();
        master.gain.value = this.muted ? 0 : 0.9;
        master.connect(comp);
        comp.connect(ctx.destination);
        const len = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.ctx = ctx;
        this.master = master;
        this.noiseBuf = buf;
        if (this.wantMusic) this.startMusic();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      /* no audio available: stay silent */
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }

  /** gentle generative music: a slow random walk over a pentatonic scale, through an echo */
  setMusic(on: boolean) {
    this.wantMusic = on;
    if (on) this.startMusic();
    else if (this.music) {
      clearInterval(this.music.timer);
      this.music.bus.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3);
      this.music = null;
    }
  }

  get musicPlaying() {
    return this.music !== null;
  }

  private startMusic() {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || this.music) return;
    const bus = ctx.createGain();
    bus.gain.value = 0.55;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    bus.connect(master);
    bus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(master);
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
    const m = { bus, timer: 0, note: 4 };
    const play = (f: number, dur: number, gain: number) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    m.timer = window.setInterval(() => {
      if (this.muted || ctx.state !== 'running') return;
      if (Math.random() < 0.7) {
        m.note = Math.max(0, Math.min(scale.length - 1, m.note + [-2, -1, 1, 2][(Math.random() * 4) | 0]));
        play(scale[m.note], 1.7, 0.045);
      }
      if (Math.random() < 0.12) play(scale[m.note % 5] / 2, 3, 0.03);
    }, 540);
    this.music = m;
  }

  private tone(freq: number, dur: number, o: { type?: OscillatorType; gain?: number; when?: number; slide?: number } = {}) {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || this.muted) return;
    const t = ctx.currentTime + (o.when ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, o: { gain: number; f0: number; f1: number; q?: number; type?: BiquadFilterType; when?: number }) {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || !this.noiseBuf || this.muted) return;
    const t = ctx.currentTime + (o.when ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.Q.value = o.q ?? 1;
    f.frequency.setValueAtTime(o.f0, t);
    f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain, t + Math.min(0.05, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  /** size: 0 (tiny region) .. 1 (whole page) — bigger regions pop lower */
  pop(size: number) {
    const f = 950 - 520 * Math.min(1, Math.sqrt(size));
    this.tone(f, 0.18, { gain: 0.32, slide: f * 0.5 });
    this.noise(0.04, { gain: 0.08, f0: 3000, f1: 2000, q: 1.2 });
  }

  bloom(durSec: number) {
    this.noise(durSec, { gain: 0.09, f0: 420, f1: 2600, q: 0.8 });
  }

  sparkle() {
    for (let i = 0; i < 3; i++) this.tone(1900 + Math.random() * 1500, 0.14, { gain: 0.05, when: i * 0.06 });
  }

  chime() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, 1.1, { type: 'triangle', gain: 0.16, when: i * 0.12 }),
    );
    this.tone(261.63, 1.6, { type: 'sine', gain: 0.08, when: 0.1 });
  }

  click() {
    this.tone(1250, 0.06, { gain: 0.1, slide: 850 });
  }

  poof() {
    this.noise(0.28, { gain: 0.22, f0: 2200, f1: 180, q: 0.6, type: 'lowpass' });
  }

  scratchStart() {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || !this.noiseBuf || this.scratch) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.9;
    band.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(hp);
    hp.connect(band);
    band.connect(gain);
    gain.connect(master);
    src.start(0, Math.random());
    this.scratch = { src, band, gain };
  }

  /** speed in CSS px per ms */
  scratchSpeed(v: number) {
    const s = this.scratch, ctx = this.ctx;
    if (!s || !ctx) return;
    const t = ctx.currentTime;
    const sp = Math.min(3, v);
    s.gain.gain.setTargetAtTime(this.muted ? 0 : Math.min(0.3, 0.03 + sp * 0.11), t, 0.03);
    s.band.frequency.setTargetAtTime(1300 + sp * 900 + Math.random() * 300, t, 0.05);
  }

  scratchStop() {
    const s = this.scratch, ctx = this.ctx;
    if (!s || !ctx) return;
    this.scratch = null;
    s.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    s.src.stop(ctx.currentTime + 0.2);
  }
}

export const sfx = new Sfx();
