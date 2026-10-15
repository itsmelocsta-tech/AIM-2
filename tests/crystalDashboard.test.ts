import { describe, expect, it } from 'vitest';
import reference from './fixtures/crystal-python-reference.json';
import { calculateLosslessSpectrum, compareCrystalLayers } from '../server/crystalOptics';
import { DEFAULT_CRYSTAL_SETTINGS } from '../src/types/optics';

describe('web Crystal Lab physics', () => {
  it.each(reference.cases)('matches Python at $angle degrees $polarization with cavity $defectNm', testCase => {
    const actual = calculateLosslessSpectrum(reference.wavelengths, testCase.layers, testCase.angle, testCase.polarization as 's' | 'p');
    actual.reflection.forEach((value, i) => expect(value).toBeCloseTo(testCase.reflection[i], 12));
    actual.transmission.forEach((value, i) => expect(value).toBeCloseTo(testCase.transmission[i], 12));
  });
  it('has a Fresnel bare glass baseline and conserves energy', () => {
    const result = compareCrystalLayers(DEFAULT_CRYSTAL_SETTINGS);
    expect(result.wavelengths).toHaveLength(201);
    expect(result.baseline[0]).toBeCloseTo(((1 - 1.52) / (1 + 1.52)) ** 2, 12);
    expect(result.energyError).toBeLessThan(1e-12);
  });
  it('matches material counts and thickness while changing order', () => {
    const result = compareCrystalLayers({ ...DEFAULT_CRYSTAL_SETTINGS, defectNm: 200 });
    expect(result.fibonacci.sequence).not.toBe(result.control.sequence);
    expect(result.control.countA).toBe(result.fibonacci.countA);
    expect(result.control.countB).toBe(result.fibonacci.countB);
    expect(result.control.thicknessNm).toBe(result.fibonacci.thicknessNm);
    expect(result.control.sequence[5]).toBe('D');
    expect(result.fibonacci.sequence[5]).toBe('D');
  });
  it('labels periodic controls and reports their different material amounts', () => {
    const result = compareCrystalLayers({ ...DEFAULT_CRYSTAL_SETTINGS, control: 'periodic' });
    expect(result.control.sequence).toBe('ABABABABAB');
    expect(result.fibonacci.countA).toBe(6);
    expect(result.control.countA).toBe(5);
  });
  it('has no artificial reflection for identical media', () => {
    const result = calculateLosslessSpectrum([400, 550, 780], [{ n: 1, d: 200 }], 60, 'p', 1);
    expect(Math.max(...result.reflection)).toBeLessThan(1e-25);
  });
  it.each([{ layerCount: 1000000 }, { nA: 0 }, { angle: 90 }, { dB: -1 }, { nA: '1.5' }, { polarization: 'x' }, { control: 'unknown' }, { defectNm: 1001 }])('rejects unbounded or invalid settings %o', bad => {
    expect(() => compareCrystalLayers({ ...DEFAULT_CRYSTAL_SETTINGS, ...bad })).toThrow();
  });
});
