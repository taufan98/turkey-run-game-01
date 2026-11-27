// Gobble's Great Escape — all sound is synthesised with WebAudio.
// No audio files ship in the game, so nothing is fetched over the network.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  unlock() {
    this.ensureContext();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopOvenSizzle();
    return this.muted;
  }

  playTone(frequency, duration, type, volume, slideTo) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  playNoise(duration, volume, filterFrequency) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency || 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  gobble() {
    // The turkey's signature call: two quick descending notes.
    this.playTone(420, 0.09, 'square', 0.1, 300);
    setTimeout(() => this.playTone(360, 0.12, 'square', 0.1, 240), 90);
  }

  jumpWhoosh() {
    this.playNoise(0.18, 0.1, 900);
  }

  cornDing(golden) {
    this.playTone(golden ? 1320 : 880, 0.12, 'sine', 0.14, golden ? 1760 : 1170);
  }

  thud() {
    this.playTone(140, 0.18, 'sine', 0.22, 60);
    this.playNoise(0.12, 0.12, 500);
  }

  knifeWhistle() {
    this.playTone(1800, 0.35, 'sine', 0.07, 500);
  }

  farmerShout() {
    this.playTone(220, 0.16, 'sawtooth', 0.12, 160);
    setTimeout(() => this.playTone(196, 0.2, 'sawtooth', 0.12, 130), 140);
  }

  startOvenSizzle() {
    if (this.muted || this.sizzleNodes) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    this.sizzleNodes = { source, gain };
  }

  stopOvenSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.source.stop();
    } catch (error) {
      // Already stopped; nothing to do.
    }
    this.sizzleNodes = null;
  }

  caughtSting() {
    this.playTone(392, 0.25, 'sawtooth', 0.14, 370);
    setTimeout(() => this.playTone(311, 0.25, 'sawtooth', 0.14, 294), 220);
    setTimeout(() => this.playTone(233, 0.5, 'sawtooth', 0.16, 220), 440);
  }

  escapedFanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((frequency, index) => {
      setTimeout(() => this.playTone(frequency, 0.3, 'triangle', 0.16), index * 130);
    });
    setTimeout(() => this.gobble(), 560);
  }
}
