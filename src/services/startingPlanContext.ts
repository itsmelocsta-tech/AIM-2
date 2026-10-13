import type { CrossReferenceResult, DailyPlan } from '../types';

export function applyStartingPlanContext(plan: DailyPlan, result: CrossReferenceResult): DailyPlan {
  const context = result.startingPlanContext;
  const hours = context?.availableHours;
  const energy = context?.energyLevel;
  return {
    ...plan,
    ...(typeof hours === 'number' && Number.isFinite(hours) && hours >= 0 && hours <= 24 ? { availableHours: hours } : {}),
    ...(typeof energy === 'number' && Number.isFinite(energy) && energy >= 1 && energy <= 10 ? { energyLevel: energy } : {}),
  };
}
