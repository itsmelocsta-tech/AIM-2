export const NOISE_SAMPLE_RATE = 16000;
export const NOISE_LENGTH = 131072;

function randomGenerator(seed: number) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 4294967296; };
}

// Band-limited periodic noise with 1/f power (1/sqrt(f) amplitude), from random-phase Fourier bins.
// No DC component, no downloaded samples, and no binaural or therapeutic encoding.
export function createPinkNoise(length = NOISE_LENGTH, seed = 97): Float32Array {
  if (!Number.isInteger(length) || length < 32 || length > NOISE_LENGTH || (length & (length - 1))) throw new Error('Noise length must be a bounded power of two.');
  const real = new Float64Array(length), imaginary = new Float64Array(length);
  const random = randomGenerator(seed);
  for (let k = 1; k < length / 2; k++) {
    const frequency = k * NOISE_SAMPLE_RATE / length;
    const band = Math.min(1, Math.max(0, (frequency - 35) / 25)) * Math.min(1, Math.max(0, (8000 - frequency) / 1000));
    const phase = random() * Math.PI * 2, amplitude = band / Math.sqrt(k);
    real[k] = real[length - k] = Math.cos(phase) * amplitude;
    imaginary[k] = Math.sin(phase) * amplitude; imaginary[length - k] = -imaginary[k];
  }
  for (let i = 1, j = 0; i < length; i++) {
    let bit = length >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [real[i], real[j]] = [real[j], real[i]]; [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]]; }
  }
  for (let size = 2; size <= length; size *= 2) {
    const step = Math.PI * 2 / size, wr = Math.cos(step), wi = Math.sin(step);
    for (let start = 0; start < length; start += size) {
      let ar = 1, ai = 0;
      for (let j = 0; j < size / 2; j++) {
        const low = start + j, high = low + size / 2;
        const tr = ar * real[high] - ai * imaginary[high], ti = ar * imaginary[high] + ai * real[high];
        real[high] = real[low] - tr; imaginary[high] = imaginary[low] - ti;
        real[low] += tr; imaginary[low] += ti;
        const next = ar * wr - ai * wi; ai = ar * wi + ai * wr; ar = next;
      }
    }
  }
  let energy = 0, peak = 0;
  for (const value of real) { energy += value * value; peak = Math.max(peak, Math.abs(value)); }
  const gain = Math.min(.16 / Math.sqrt(energy / length), .8 / peak);
  return Float32Array.from(real, value => value * gain);
}

export function volumeGain(volume: number) {
  const value = Number.isFinite(volume) ? Math.max(0, Math.min(50, volume)) : 0;
  return .2 * (value / 50) ** 1.6;
}
export function toneFrequency(tone: number) {
  const value = Number.isFinite(tone) ? Math.max(0, Math.min(100, tone)) : 35;
  return 350 * (8 ** (value / 100));
}
