import { describe, expect, it } from 'vitest';
import { branchPaths, decodePreferences, preferenceKey, presets, sanitizeSettings, soften, suggestIntent } from '../src/atmosphere/settings';

describe('local atmosphere preferences', () => {
  it('suggests a reversible starting point, prioritizing overwhelm over a task', () => {
    expect(suggestIntent('I feel overwhelmed and need to focus on writing')).toBe('settle');
    expect(suggestIntent('I am not anxious; I want to focus')).toBe('focus');
    expect(suggestIntent('I am not tired and want to write')).toBe('focus');
    expect(suggestIntent('I feel exhausted and need energy')).toBe('energize');
    expect(suggestIntent('I want to unwind')).toBe('restore');
    expect(suggestIntent('')).toBe('focus');
  });
  it('validates untrusted persisted settings and bounds geometry and intensity', () => {
    expect(sanitizeSettings({ intensity: Infinity, density: 900, motion: -6, volume: 800, palette: 'script', shape: null })).toEqual({ ...presets.focus, density: 5, motion: 0, volume: 50 });
    expect(branchPaths(900)).toHaveLength(186);
    expect(branchPaths(-9)).toHaveLength(6);
  });
  it('drops descriptions and arbitrary fields from both current and learned settings', () => {
    const decoded = decodePreferences(JSON.stringify({ version: 1, intent: 'energize', description: 'PRIVATE_REQUEST', current: { ...presets.energize, description: 'PRIVATE_REQUEST' }, learned: { focus: { ...presets.focus, raw: 'PRIVATE_REQUEST' }, arbitrary: presets.focus } }));
    expect(decoded.intent).toBe('energize');
    expect(JSON.stringify(decoded)).not.toContain('PRIVATE_REQUEST');
    expect(Object.keys(decoded.learned)).toEqual(['focus']);
    expect(decodePreferences('broken')).toEqual(decodePreferences(null));
    expect(decodePreferences('{"version":2}')).toEqual(decodePreferences(null));
  });
  it('uses separate keys per identity and preview, including separator-like identities', () => {
    expect(new Set(['public-preview', 'A', 'B', 'A:B', 'A%3AB'].map(preferenceKey)).size).toBe(5);
  });
  it('reduces stimulation, respects minimums and never mutates a preset', () => {
    const original = { ...presets.energize };
    const result = soften(original);
    expect(result.intensity).toBeLessThan(original.intensity);
    expect(result.motion).toBeLessThan(original.motion);
    expect(original).toEqual(presets.energize);
    let minimal = result;
    for (let i = 0; i < 30; i++) minimal = soften(minimal);
    expect(minimal).toMatchObject({ intensity: 5, density: 1, motion: 0, volume: 0 });
  });
});
