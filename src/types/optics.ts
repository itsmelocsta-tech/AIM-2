export interface CrystalSettings {
  nA: number;
  nB: number;
  dA: number;
  dB: number;
  layerCount: number;
  angle: number;
  polarization: 's' | 'p';
  control: 'matched' | 'periodic';
  defectNm: number;
}
export interface CrystalCurve {
  label: string;
  sequence: string;
  countA: number;
  countB: number;
  thicknessNm: number;
  reflection: number[];
  transmission: number[];
}
export interface CrystalComparison {
  wavelengths: number[];
  fibonacci: CrystalCurve;
  control: CrystalCurve;
  baseline: number[];
  energyError: number;
  settings: CrystalSettings;
}
export const DEFAULT_CRYSTAL_SETTINGS: CrystalSettings = {
  nA: 1.52, nB: 1, dA: 90, dB: 140, layerCount: 10,
  angle: 0, polarization: 's', control: 'matched', defectNm: 0,
};
