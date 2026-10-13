import { expect, it } from 'vitest';
import { firestoreData } from '../src/utils/firestoreData';
it('keeps optional absent AI fields out of cloud records without changing supplied values', () => {
  const date = new Date('2026-10-13T12:00:00Z');
  const input = { task: 'Fictional action', completed: false, nextStep: undefined, goals: [{ id: 'goal', recalculatedPath: undefined }], date, availableHours: 0 };
  expect(firestoreData(input)).toEqual({ task: 'Fictional action', completed: false, goals: [{ id: 'goal' }], date, availableHours: 0 });
  expect(input).toHaveProperty('nextStep');
});
