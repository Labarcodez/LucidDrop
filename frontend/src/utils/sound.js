// Simple sound manager using Web Audio API
class SoundManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setMuted(muted) {
    this.enabled = !muted;
    if (muted && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    } else if (!muted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') return;
    
    const frequencies = {
      win: [523, 659, 784],
      loss: [440, 349, 294],
      spin: [440, 440, 440],
      cashout: [523, 659, 784, 1047],
      jackpot: [523, 659, 784, 1047, 1568],
    };

    const notes = frequencies[type] || frequencies.spin;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.15);
      osc.start(this.ctx.currentTime + i * 0.1);
      osc.stop(this.ctx.currentTime + i * 0.1 + 0.15);
    });
  }
}

export const sound = new SoundManager();