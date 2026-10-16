import { createPinkNoise, NOISE_SAMPLE_RATE, toneFrequency } from './audioDSP';
import type { Settings } from './settings';

let noise: [Float32Array, Float32Array] | undefined;
export function createAmbientGraph(context: BaseAudioContext, settings: Settings) {
  const output = context.createGain(); output.gain.value = 0;
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = .5;
  filter.frequency.value = toneFrequency(settings.tone);
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.knee.value = 6; limiter.ratio.value = 12; limiter.attack.value = .003; limiter.release.value = .2;
  filter.connect(output); output.connect(limiter); limiter.connect(context.destination);
  const sources: AudioScheduledSourceNode[] = [];
  if (settings.sound === 'drone') {
    // Original C-major pad; harmonics have normalized nominal energy, no special-frequency claim.
    for (const frequency of [130.81, 164.81, 196]) for (const harmonic of [1, 2]) {
      const voice = context.createOscillator(); voice.type = 'sine'; voice.frequency.value = frequency * harmonic;
      const gain = context.createGain(); gain.gain.value = harmonic === 1 ? .1267 : .0317;
      voice.connect(gain); gain.connect(filter); sources.push(voice);
    }
  } else {
    noise ||= [createPinkNoise(undefined, 97), createPinkNoise(undefined, 503)];
    const buffer = context.createBuffer(2, noise[0].length, NOISE_SAMPLE_RATE);
    for (let channel = 0; channel < 2; channel++) buffer.getChannelData(channel).set(noise[channel]);
    const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    if (settings.sound === 'rain') {
      const wash = context.createGain(); wash.gain.value = .98;
      const movement = context.createOscillator(); movement.frequency.value = .065;
      const depth = context.createGain(); depth.gain.value = .12;
      movement.connect(depth); depth.connect(wash.gain); source.connect(wash); wash.connect(filter); sources.push(movement);
    } else source.connect(filter);
    sources.push(source);
  }
  const now = context.currentTime;
  for (const source of sources) source.start(now);
  return {
    output, filter,
    dispose() { for (const source of sources) { try { source.stop(); } catch { /* already stopped */ } } },
  };
}
