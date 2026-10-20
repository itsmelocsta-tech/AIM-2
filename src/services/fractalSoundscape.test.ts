import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_SOUNDSCAPE, loadSoundscape, saveSoundscape } from './fractalSoundscape';
describe('fractal soundscape preferences', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', { value: '', getItem() { return this.value; }, setItem(_key: string, value: string) { this.value = value; } }); });
  it('defaults to fractal at 25% for 25 minutes', () => expect(loadSoundscape()).toEqual(DEFAULT_SOUNDSCAPE));
  it('persists valid settings', () => { saveSoundscape({ mode:'ambient', volume:40, minutes:10 }); expect(loadSoundscape()).toEqual({mode:'ambient',volume:40,minutes:10}); });
  it('clamps volume and rejects invalid modes', () => { localStorage.setItem('aim_fractal_soundscape_v1', JSON.stringify({mode:'unknown',volume:500,minutes:100})); expect(loadSoundscape()).toEqual({mode:'fractal',volume:100,minutes:25}); });
});
