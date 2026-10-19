export type SoundscapeMode = 'fractal' | 'ambient' | 'silence';
export interface SoundscapePreferences { mode: SoundscapeMode; volume: number; minutes: number }
export const DEFAULT_SOUNDSCAPE: SoundscapePreferences = { mode: 'fractal', volume: 25, minutes: 25 };
const KEY = 'aim_fractal_soundscape_v1';
export function loadSoundscape(): SoundscapePreferences {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { mode: ['fractal','ambient','silence'].includes(data.mode) ? data.mode : 'fractal',
      volume: Number.isFinite(data.volume) ? Math.max(0, Math.min(100, data.volume)) : 25,
      minutes: [10,25,45].includes(data.minutes) ? data.minutes : 25 };
  } catch { return { ...DEFAULT_SOUNDSCAPE }; }
}
export function saveSoundscape(value: SoundscapePreferences) {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
export class SoundscapeEngine {
  private context: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  async start(prefs: SoundscapePreferences, onEnd: () => void) {
    this.stop();
    if (prefs.mode === 'silence') return;
    const generation = this.generation;
    const context = new AudioContext();
    this.context = context;
    try {
      await context.resume();
      if (generation !== this.generation) { await context.close(); return; }
      const master = context.createGain();
      master.gain.setValueAtTime(0, context.currentTime);
      master.gain.linearRampToValueAtTime(Math.min(0.12, prefs.volume / 100 * 0.12), context.currentTime + 0.8);
      master.connect(context.destination);
      this.nodes.push(master);
      // Four quiet harmonics. Deterministic multiscale modulation for the fractal variant.
      [110, 164.81, 220, 329.63].forEach((frequency, i) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        const gain = context.createGain();
        gain.gain.value = 0.11;
        oscillator.connect(gain).connect(master);
        oscillator.start();
        this.nodes.push(oscillator, gain);
        if (prefs.mode === 'fractal') {
          [0.07, 0.13, 0.29].forEach((rate, j) => {
            const lfo = context.createOscillator();
            const depth = context.createGain();
            lfo.frequency.value = rate * (1 + i * 0.08);
            depth.gain.value = 0.017 / (j + 1);
            lfo.connect(depth).connect(gain.gain);
            lfo.start();
            this.nodes.push(lfo, depth);
          });
        }
      });
      this.timer = setTimeout(() => { this.stop(); onEnd(); }, prefs.minutes * 60_000);
    } catch (error) { this.stop(); throw error; }
  }
  setVolume(volume: number) {
    const master = this.nodes[0] as GainNode | undefined;
    if (master && this.context) master.gain.setTargetAtTime(Math.min(0.12, Math.max(0, volume) / 100 * 0.12), this.context.currentTime, 0.08);
  }
  stop() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    for (const node of this.nodes) if ('stop' in node) { try { (node as OscillatorNode).stop(); } catch {} }
    this.nodes = [];
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
