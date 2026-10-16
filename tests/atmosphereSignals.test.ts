import { describe, expect, it } from 'vitest';
import { contourPaths, driftParameters } from '../src/atmosphere/geometry';
import { createPinkNoise, toneFrequency, volumeGain, NOISE_SAMPLE_RATE } from '../src/atmosphere/audioDSP';
import { decodePreferences, presets, sanitizeSettings, soften } from '../src/atmosphere/settings';

const rms = (signal: Float32Array) => Math.sqrt(signal.reduce((sum, value) => sum + value * value, 0) / signal.length);
function powerAtBin(signal: Float32Array, bin: number) {
  let real = 0, imaginary = 0;
  for (let i = 0; i < signal.length; i++) { const angle = 2 * Math.PI * bin * i / signal.length; real += signal[i] * Math.cos(angle); imaginary += signal[i] * Math.sin(angle); }
  return real * real + imaginary * imaginary;
}

describe('bounded atmosphere signal generation', () => {
  it('produces zero-mean, normalized, periodic pink noise with the expected power slope', () => {
    const signal = createPinkNoise(8192, 97);
    expect(rms(signal)).toBeCloseTo(.16, 5);
    expect(Math.abs(signal.reduce((sum, value) => sum + value, 0) / signal.length)).toBeLessThan(1e-7);
    expect(Math.max(...signal.map(Math.abs))).toBeLessThanOrEqual(.800001);
    // These frequencies are inside the tapered passband: doubling f halves power.
    expect(powerAtBin(signal, 64) / powerAtBin(signal, 128)).toBeCloseTo(2, 3);
    expect(powerAtBin(signal, 128) / powerAtBin(signal, 256)).toBeCloseTo(2, 3);
    expect(powerAtBin(signal, 2)).toBeLessThan(powerAtBin(signal, 64) * 1e-8);
    let differences = 0;
    for (let i = 1; i < signal.length; i++) differences += (signal[i] - signal[i - 1]) ** 2;
    expect(Math.abs(signal[0] - signal.at(-1)!)).toBeLessThan(6 * Math.sqrt(differences / (signal.length - 1)));
    expect(NOISE_SAMPLE_RATE).toBe(16000);
  });
  it('has repeatable independent channels and bounded buffer allocations', () => {
    expect(createPinkNoise(256, 97)).toEqual(createPinkNoise(256, 97));
    expect(createPinkNoise(256, 97)).not.toEqual(createPinkNoise(256, 503));
    for (const length of [0, 16, 111, 32.5, NaN, 262144]) expect(() => createPinkNoise(length)).toThrow();
  });
  it('keeps motion and audio controls bounded without interpreting them as biological rates', () => {
    expect(volumeGain(0)).toBe(0); expect(volumeGain(900)).toBeCloseTo(.2); expect(volumeGain(NaN)).toBe(0);
    expect(volumeGain(25)).toBeLessThan(volumeGain(50) / 2);
    expect(toneFrequency(100)).toBeGreaterThan(toneFrequency(0) * 7);
    expect(driftParameters(50).seconds).toBeGreaterThanOrEqual(120);
    expect(driftParameters(900).distance).toBeLessThanOrEqual(8);
    expect(driftParameters(NaN)).toEqual(driftParameters(0));
  });
  it('draws finite closed contours at every detail level, with no unbounded complexity', () => {
    for (const detail of [1, 2, 3, 4, 5]) {
      const paths = contourPaths(detail);
      expect(paths.length).toBeLessThanOrEqual(16);
      for (const path of paths) { expect(path).toMatch(/^M.* Z$/); expect(path).not.toMatch(/NaN|Infinity/); }
    }
    expect(contourPaths(5).join('').length).toBeLessThan(50000);
    expect(contourPaths(900)).toEqual(contourPaths(5));
    expect(contourPaths(1)).not.toEqual(contourPaths(3));
  });
  it('upgrades old saved settings without replacing prior choices or learning', () => {
    const old = { palette: 'ember', shape: 'rings', intensity: 35, density: 4, motion: 0, volume: 9, sound: 'drone' };
    const loaded = decodePreferences(JSON.stringify({ version: 1, intent: 'settle', current: old, learned: { settle: old } }));
    expect(loaded.current).toMatchObject(old); expect(loaded.learned.settle).toMatchObject(old);
    expect(loaded.current.saturation).toBe(50); expect(loaded.current.tone).toBe(40);
    expect(sanitizeSettings({ saturation: 900, tone: -3 })).toMatchObject({ saturation: 100, tone: 0 });
    expect(soften(presets.energize).saturation).toBeLessThan(presets.energize.saturation);
  });
});
