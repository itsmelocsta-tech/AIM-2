import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { scheduleRepository } from '../src/services/repositories/scheduleRepository';
import { DEFAULT_DAILY_PLAN, storageService } from '../src/services/storage';

const entries = new Map<string, string>();
const local = {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, value); },
  removeItem: (key: string) => { entries.delete(key); },
};

beforeEach(() => {
  entries.clear();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', local);
});
afterEach(() => vi.unstubAllGlobals());

it('shows the confirmed daily plan in the coach schedule and does not regenerate generic blocks after all blocks are removed', async () => {
  const plan = {
    ...DEFAULT_DAILY_PLAN, date: '2026-09-26',
    timeBlocks: [{ id: 'focus', time: '9:00 AM - 10:00 AM', title: 'Call my employer', details: 'Call the listed number', completed: false }],
  };
  scheduleRepository.syncDayFromPlan('user-a', plan, 'America/Chicago');
  const saved = await scheduleRepository.getDailySchedule({ userId: 'user-a', date: plan.date, timeZone: 'America/Chicago' });
  expect(saved.map(item => item.title)).toEqual(['Call my employer']);
  expect(saved[0].userId).toBe('user-a');

  scheduleRepository.syncDayFromPlan('user-a', { ...plan, timeBlocks: [] }, 'America/Chicago');
  expect(await scheduleRepository.getDailySchedule({ userId: 'user-a', date: plan.date, timeZone: 'America/Chicago' })).toEqual([]);
});

it('loads the account day’s plan even when the device day has already advanced', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-27T02:00:00Z'));
  try {
    storageService.saveDailyPlan({
      ...DEFAULT_DAILY_PLAN, date: '2026-09-26',
      timeBlocks: [{ id: 'evening', time: '20:00 - 20:30', title: 'Evening reflection', details: '', completed: false }],
    });
    const items = await scheduleRepository.getDailySchedule({ userId: 'user-a', date: '2026-09-26', timeZone: 'America/Chicago' });
    expect(items.map(item => item.title)).toEqual(['Evening reflection']);
  } finally {
    vi.useRealTimers();
  }
});
