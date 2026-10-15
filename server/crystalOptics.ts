import type { CrystalComparison, CrystalCurve, CrystalSettings } from '../src/types/optics';

export function validateCrystalSettings(value: unknown): CrystalSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Enter valid comparison settings.');
  const p = value as CrystalSettings;
  const bounds = { nA: [1, 3.5], nB: [1, 3.5], dA: [5, 1000], dB: [5, 1000], layerCount: [2, 40], angle: [0, 75], defectNm: [0, 1000] };
  for (const [key, [low, high]] of Object.entries(bounds)) {
    const n = p[key as keyof CrystalSettings];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < low || n > high) throw new Error(`${key} must be between ${low} and ${high}.`);
  }
  if (!Number.isInteger(p.layerCount)) throw new Error('Layer count must be a whole number.');
  if (!['s', 'p'].includes(p.polarization) || !['matched', 'periodic'].includes(p.control)) throw new Error('Choose a valid polarization and comparison.');
  return Object.fromEntries([...Object.keys(bounds), 'polarization', 'control'].map(key => [key, p[key as keyof CrystalSettings]])) as unknown as CrystalSettings;
}

export function fibonacciSequence(count: number): string {
  let prev = 'A', current = 'AB';
  while (current.length < count) [prev, current] = [current, current + prev];
  return current.slice(0, count);
}

/** Same standard transfer-matrix model as the supplied Python module.
 * Supported inputs guarantee propagating waves in real, lossless layers.
 * Store imaginary off-diagonal elements as real coefficients, preserving
 * complex matrix multiplication without a browser-side engine dependency.
 */
export function calculateLosslessSpectrum(wavelengths: number[], layers: { n: number; d: number }[], angle: number, polarization: 's' | 'p', substrate = 1.52) {
  const transverse = Math.sin(angle * Math.PI / 180);
  const q = (n: number) => polarization === 's' ? n * Math.sqrt(1 - (transverse / n) ** 2) : n / Math.sqrt(1 - (transverse / n) ** 2);
  const q0 = q(1), qs = q(substrate);
  const reflection: number[] = [], transmission: number[] = [];
  for (const wavelength of wavelengths) {
    let a = 1, b = 0, c = 0, d = 1;
    for (const layer of layers) {
      const cosTheta = Math.sqrt(1 - (transverse / layer.n) ** 2);
      const phase = 2 * Math.PI * layer.n * layer.d * cosTheta / wavelength;
      const co = Math.cos(phase), si = Math.sin(phase), admittance = q(layer.n);
      const ib = -si / admittance, ic = -si * admittance;
      [a, b, c, d] = [a * co - b * ic, a * ib + b * co, c * co + d * ic, d * co - c * ib];
    }
    const denominator = (q0 * a + qs * d) ** 2 + (q0 * qs * b + c) ** 2;
    reflection.push(((q0 * a - qs * d) ** 2 + (q0 * qs * b - c) ** 2) / denominator);
    transmission.push(4 * q0 * qs / denominator);
  }
  return { reflection, transmission };
}

export function compareCrystalLayers(input: unknown): CrystalComparison {
  const settings = validateCrystalSettings(input);
  const { nA, nB, dA, dB, layerCount, angle, polarization, defectNm } = settings;
  const wavelengths = Array.from({ length: 201 }, (_, i) => 380 + 2 * i);
  const fib = fibonacciSequence(layerCount);
  const countA = [...fib].filter(c => c === 'A').length;
  const matched = Array.from({ length: layerCount }, (_, i) => Math.floor((i + 1) * countA / layerCount) > Math.floor(i * countA / layerCount) ? 'A' : 'B').join('');
  const reference = settings.control === 'matched' ? matched : 'AB'.repeat(Math.ceil(layerCount / 2)).slice(0, layerCount);
  const curve = (sequence: string, label: string): CrystalCurve => {
    let symbols = [...sequence];
    if (defectNm > 0) symbols.splice(Math.floor(symbols.length / 2), 0, 'D');
    const layers = symbols.map(symbol => symbol === 'A' ? { n: nA, d: dA } : symbol === 'B' ? { n: nB, d: dB } : { n: 1, d: defectNm });
    return { label, sequence: symbols.join(''), countA: [...sequence].filter(x => x === 'A').length, countB: [...sequence].filter(x => x === 'B').length,
      thicknessNm: layers.reduce((total, layer) => total + layer.d, 0), ...calculateLosslessSpectrum(wavelengths, layers, angle, polarization) };
  };
  const fibonacci = curve(fib, 'Fibonacci');
  const control = curve(reference, settings.control === 'matched' ? 'Same-count control' : 'Periodic AB');
  const baseline = calculateLosslessSpectrum(wavelengths, [], angle, polarization).reflection;
  const energyError = Math.max(...[fibonacci, control].flatMap(c => c.reflection.map((r, i) => Math.abs(r + c.transmission[i] - 1))));
  if (![...fibonacci.reflection, ...fibonacci.transmission, ...control.reflection, ...control.transmission, ...baseline, energyError].every(Number.isFinite)) throw new Error('These settings could not be calculated reliably.');
  return { settings, wavelengths, fibonacci, control, baseline, energyError };
}
