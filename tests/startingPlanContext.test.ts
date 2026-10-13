import { expect, it } from 'vitest';
import { applyStartingPlanContext } from '../src/services/startingPlanContext';
import { DEFAULT_DAILY_PLAN } from '../src/services/storage';
import type { CrossReferenceResult } from '../src/types';

it('saves the stated four hours rather than the six-hour planner default', () => {
  const result = { startingPlanContext: { availableHours: 4, energyLevel: 3 } } as CrossReferenceResult;
  const saved = applyStartingPlanContext({ ...DEFAULT_DAILY_PLAN, availableHours: 6 }, result);
  expect(saved.availableHours).toBe(4); expect(saved.energyLevel).toBe(3);
  expect(applyStartingPlanContext(saved, { startingPlanContext: { availableHours: 0 } } as CrossReferenceResult).availableHours).toBe(0);
});
it('keeps the existing setting when AI omits it or sends an invalid number', () => {
  for (const context of [undefined, { availableHours: -1 }, { availableHours: 25 }, { availableHours: NaN }]) {
    expect(applyStartingPlanContext(DEFAULT_DAILY_PLAN, { startingPlanContext: context } as CrossReferenceResult).availableHours).toBe(DEFAULT_DAILY_PLAN.availableHours);
  }
});
