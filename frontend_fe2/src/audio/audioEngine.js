// Procedural Web Audio FX Engine for FE2 Spatial OS
// 100% Client-Side Web Audio API Synthesis (Zero external audio files)

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.22; // Safe, polite volume
    this.initialized = false;
  }

  // Lazy initialize upon user gesture
  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (!muted) {
      this.init();
      this.resume();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // 1. Keystroke: Short subtle click with micro pitch jitter
  playKeystroke() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // High-pass filtered noise burst for the mechanical tactile click
      const bufferSize = this.ctx.sampleRate * 0.015; // 15ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Slight pitch variation per key
      filter.frequency.setValueAtTime(2800 + (Math.random() * 800 - 400), t);
      filter.Q.setValueAtTime(3, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.02);

      // Subtle tonal thud underneath
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 60, t);
      oscGain.gain.setValueAtTime(this.volume * 0.18, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch (e) {
      // Audio fallback
    }
  }

  // 2. Scan: High-tech digital chirp / radar blip
  playScan() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(1850, t + 0.08);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  // 3. Relocalization: Distinct harmonic crystal chime (rich chord shimmer)
  playRelocalize() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Beautiful harmonic chord: E5, G#5, B5, E6
      const freqs = [659.25, 830.61, 987.77, 1318.51];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        const startTime = t + idx * 0.04;
        const duration = 0.55;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.22, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {}
  }

  // 4. Warning: Non-disturbing dual-tone alert klaxon
  playWarning() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [0, 0.12].forEach((delay) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, t + delay);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, t + delay);

        gain.gain.setValueAtTime(0.001, t + delay);
        gain.gain.linearRampToValueAtTime(this.volume * 0.35, t + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 0.1);
      });
    } catch (e) {}
  }

  // 5. Success: Bright confirmation chord resolution
  playSuccess() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Ascending major chord: C5, E5, G5, C6
      const chord = [523.25, 659.25, 783.99, 1046.50];

      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        const startTime = t + idx * 0.06;
        const duration = 0.65;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.28, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {}
  }

  // 6. Tactile Button Click
  playClick() {
    if (this.isMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
