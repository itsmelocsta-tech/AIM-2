export interface AimFeatureFlags {
  fractalLifeMap: boolean;
  fractalLifePropagation: boolean;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return fallback;
}

export function resolveFeatureFlags(env: Record<string, unknown> = {}): AimFeatureFlags {
  return {
    fractalLifeMap: readBoolean(env.VITE_ENABLE_FRACTAL_LIFE_MAP, true),
    fractalLifePropagation: readBoolean(env.VITE_ENABLE_FRACTAL_PROPAGATION, true),
  };
}

const viteEnv = ((import.meta as ImportMeta & { env?: Record<string, unknown> }).env || {});

export const FEATURE_FLAGS = Object.freeze(resolveFeatureFlags(viteEnv));
