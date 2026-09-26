import { afterEach, expect, it, vi } from 'vitest';
import { getTodayDateString } from '../src/utils/dateTimeUtils';
import { getTodayDateStr, storageService } from '../src/services/storage';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it('uses the account day instead of UTC when an evening session crosses UTC midnight', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-27T02:00:00Z'));
  vi.stubEnv('TZ', 'America/Chicago');

  expect(getTodayDateString('America/Chicago')).toBe('2026-09-26');
  expect(getTodayDateString('Asia/Tokyo')).toBe('2026-09-27');
  expect(getTodayDateStr('America/Chicago')).toBe('2026-09-26');
  expect(storageService.getDailyPlan().date).toBe('2026-09-26');
});

it('uses the account day across a winter UTC boundary too', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2027-01-01T02:00:00Z'));
  expect(getTodayDateString('America/Chicago')).toBe('2026-12-31');
});
