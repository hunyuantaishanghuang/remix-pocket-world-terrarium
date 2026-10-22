// Zero-dependency procedural Web Audio API sound generator for Pocket World Terrarium

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;

  constructor() {
    // Check localStorage preference
    try {
      const saved = localStorage.getItem('pocket_world_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      // Ignore
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('pocket_world_sound', String(val));
    } catch {
      // Ignore
    }
    if (!val && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playPlaceTone('tree');
    }
    return this.enabled;
  }

  /**
   * Cozy pentatonic chime on placing elements
   */
  public playPlaceTone(tool: string) {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pentatonic scale note mapping based on tool
    let freq = 523.25; // C5
    if (tool === 'sakura' || tool === 'torii') freq = 659.25; // E5
    else if (tool === 'flower' || tool === 'deer') freq = 587.33; // D5
    else if (tool === 'house' || tool === 'pavilion') freq = 783.99; // G5
    else if (tool === 'crystal' || tool === 'shootingstar') freq = 1046.5; // C6
    else if (tool === 'onsen' || tool === 'lake' || tool === 'duck') freq = 440.0; // A4
    else if (tool === 'cloud' || tool === 'snowcloud') freq = 698.46; // F5
    else if (tool === 'remove') freq = 329.63; // E4 (lower)

    osc.type = tool === 'crystal' || tool === 'rainbow' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.15);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  /**
   * Water bubble / splash effect
   */
  public playWaterSplash() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Day/Night switch chime
   */
  public playTimeChange(isNight: boolean) {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const chords = isNight ? [440, 554.37, 659.25] : [523.25, 659.25, 783.99];
    chords.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.06);

      gain.gain.setValueAtTime(0.001, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.08, t + i * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.65);
    });
  }
}

export const soundManager = new SoundManager();
