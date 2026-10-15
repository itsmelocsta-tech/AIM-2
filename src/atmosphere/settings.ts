export const intents = ['settle', 'focus', 'restore', 'energize'] as const;
export type Intent = typeof intents[number];
export type Settings = { palette: 'amethyst' | 'lagoon' | 'forest' | 'ember'; shape: 'branches' | 'rings' | 'petals'; intensity: number; density: number; motion: number; volume: number; sound: 'rain' | 'drone' };
export type Preferences = { version: 1; intent: Intent; current: Settings; learned: Partial<Record<Intent, Settings>> };
export const presets: Record<Intent, Settings> = {
  settle: { palette: 'lagoon', shape: 'rings', intensity: 25, density: 2, motion: 0, volume: 15, sound: 'rain' },
  focus: { palette: 'amethyst', shape: 'branches', intensity: 40, density: 3, motion: 15, volume: 15, sound: 'rain' },
  restore: { palette: 'forest', shape: 'petals', intensity: 30, density: 2, motion: 10, volume: 15, sound: 'rain' },
  energize: { palette: 'ember', shape: 'petals', intensity: 55, density: 4, motion: 30, volume: 20, sound: 'drone' },
};
const bounded = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
export function sanitizeSettings(value: unknown): Settings {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const d = presets.focus;
  return { palette: ['amethyst', 'lagoon', 'forest', 'ember'].includes(v.palette as string) ? v.palette as Settings['palette'] : d.palette,
    shape: ['branches', 'rings', 'petals'].includes(v.shape as string) ? v.shape as Settings['shape'] : d.shape,
    intensity: bounded(v.intensity, d.intensity, 5, 75), density: bounded(v.density, d.density, 1, 5), motion: bounded(v.motion, d.motion, 0, 50), volume: bounded(v.volume, d.volume, 0, 50), sound: v.sound === 'drone' ? 'drone' : 'rain' };
}
export function preferenceKey(ownerId: string) { return `aim.atmosphere.v1:${encodeURIComponent(ownerId)}`; }
export function decodePreferences(raw: string | null): Preferences {
  const empty: Preferences = { version: 1, intent: 'focus', current: { ...presets.focus }, learned: {} };
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || v.version !== 1) return empty;
    const learned: Preferences['learned'] = {};
    for (const intent of intents) if (v.learned?.[intent]) learned[intent] = sanitizeSettings(v.learned[intent]);
    return { version: 1, intent: intents.includes(v.intent) ? v.intent : 'focus', current: sanitizeSettings(v.current), learned };
  } catch { return empty; }
}
// Deliberately a local keyword suggestion, not a diagnosis or an emotion classifier.
export function suggestIntent(description: string): Intent {
  const text = description.toLowerCase().replace(/\b(?:not|never|isn't|aren't|don't feel|do not feel)\s+(?:very\s+|really\s+)?(?:overwhelmed|anxious|stressed|tired|exhausted|sleepy)\b/g, '');
  if (/\b(overwhelmed|anxious|stressed|settle|calm)\b/.test(text)) return 'settle';
  if (/\b(tired|exhausted|sleepy|energize|energy|wake)\b/.test(text)) return 'energize';
  if (/\b(restore|rest|unwind|break|relax)\b/.test(text)) return 'restore';
  return 'focus';
}
export function soften(settings: Settings): Settings {
  return sanitizeSettings({ ...settings, intensity: settings.intensity - 10, density: settings.density - 1, motion: Math.max(0, settings.motion - 10), volume: Math.max(0, settings.volume - 5) });
}
export function branchPaths(depth: number): string[] {
  const paths: string[] = [];
  function branch(x: number, y: number, length: number, angle: number, level: number) {
    const nx = x + Math.cos(angle) * length, ny = y + Math.sin(angle) * length;
    paths.push(`M${x.toFixed(2)},${y.toFixed(2)} L${nx.toFixed(2)},${ny.toFixed(2)}`);
    if (level > 0) for (const delta of [-0.48, 0.48]) branch(nx, ny, length * 0.61, angle + delta, level - 1);
  }
  for (let i = 0; i < 6; i++) branch(200, 200, 66, i * Math.PI / 3, Math.max(0, Math.min(4, depth - 1)));
  return paths;
}
