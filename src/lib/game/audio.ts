export type SoundType = 'move' | 'rotate' | 'lock' | 'line' | 'hardDrop' | 'hold' | 'spin';

export class AudioManager {
  private context: AudioContext | null = null;
  private enabled = false;
  private muted = false;

  unlock(): void {
    if (this.context) {
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }
      this.enabled = true;
      return;
    }
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    this.context = new AudioCtx();
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    this.enabled = true;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(type: SoundType): void {
    if (!this.context || !this.enabled || this.muted) {
      return;
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const config = this.getConfig(type);
    osc.type = config.wave;
    osc.frequency.setValueAtTime(config.frequency, now);
    gain.gain.setValueAtTime(config.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.start(now);
    osc.stop(now + config.duration);
  }

  private getConfig(type: SoundType) {
    switch (type) {
      case 'move':
        return { frequency: 240, duration: 0.06, gain: 0.08, wave: 'triangle' as OscillatorType };
      case 'rotate':
        return { frequency: 320, duration: 0.08, gain: 0.1, wave: 'square' as OscillatorType };
      case 'hold':
        return { frequency: 190, duration: 0.1, gain: 0.08, wave: 'sine' as OscillatorType };
      case 'hardDrop':
        return { frequency: 120, duration: 0.12, gain: 0.12, wave: 'sawtooth' as OscillatorType };
      case 'line':
        return { frequency: 520, duration: 0.2, gain: 0.12, wave: 'triangle' as OscillatorType };
      case 'spin':
        return { frequency: 440, duration: 0.14, gain: 0.1, wave: 'sine' as OscillatorType };
      case 'lock':
      default:
        return { frequency: 160, duration: 0.1, gain: 0.1, wave: 'square' as OscillatorType };
    }
  }
}
