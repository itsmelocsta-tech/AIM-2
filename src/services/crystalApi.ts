import type { CrystalComparison, CrystalSettings } from '../types/optics';

export async function requestCrystalComparison(settings: CrystalSettings, signal?: AbortSignal): Promise<CrystalComparison> {
  const response = await fetch('/api/optics/compare', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings), signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'The lab is unavailable. Please try again.');
  if (!result || !Array.isArray(result.wavelengths) || result.wavelengths.length !== 201 || !result.fibonacci || !result.control) throw new Error('The lab returned incomplete results. Please try again.');
  return result;
}
