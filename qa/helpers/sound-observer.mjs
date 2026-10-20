// Real Chromium AudioContext and samples. Only resume timing is controllable
// for the cancellation regression; no engine or generated waveform is mocked.
export async function observeAudio(page) {
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext;
    window.__soundQA = { sessions: [], delayResume: false, releases: [] };
    window.AudioContext = class extends NativeContext {
      constructor(...args) {
        super(...args);
        this.qa = { context: this, analyser: null, oscillatorCount: 0, master: null };
        window.__soundQA.sessions.push(this.qa);
      }
      createGain() {
        const gain = super.createGain();
        if (!this.qa.master) {
          this.qa.master = gain;
          this.qa.analyser = super.createAnalyser();
          gain.connect(this.qa.analyser);
        }
        return gain;
      }
      createOscillator() { this.qa.oscillatorCount++; return super.createOscillator(); }
      async resume() {
        await super.resume();
        if (window.__soundQA.delayResume) await new Promise(resolve => window.__soundQA.releases.push(resolve));
      }
    };
  });
}
export const audioState = page => page.evaluate(() => window.__soundQA.sessions.map(session => {
  const samples = new Float32Array(session.analyser?.fftSize || 32);
  session.analyser?.getFloatTimeDomainData(samples);
  return { state: session.context.state, oscillators: session.oscillatorCount,
    rms: Math.sqrt(samples.reduce((total, value) => total + value * value, 0) / samples.length) };
}));

