import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ScheduleItem } from '../src/types';
import { cancelActivityAlarms, collectActivityAlarms, commitActivities, markAlarmFired, nativeAlarmRequest, readCommitments } from '../src/services/activityAlarms';
import { scheduleRepository } from '../src/services/repositories/scheduleRepository';
import { DEFAULT_DAILY_PLAN } from '../src/services/storage';
import { createUtcIsoFromLocal } from '../src/utils/dateTimeUtils';

const entries = new Map<string, string>();
const now = Date.parse('2026-10-04T17:00:00Z');
const item: ScheduleItem = { id: 'focus', userId: 'a', title: 'Finish one application', startAt: '2026-10-04T17:05:00Z', endAt: '2026-10-04T17:30:00Z', timeZone: 'America/Chicago', status: 'scheduled', priority: 'high', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() };
beforeEach(() => {
  entries.clear(); vi.useFakeTimers(); vi.setSystemTime(now);
  vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) });
  vi.stubGlobal('window', { dispatchEvent: vi.fn(), setTimeout, clearTimeout });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('only arms agreed activities, defaults to start and finish, and duplicate taps do not duplicate alarms', () => {
  expect(collectActivityAlarms('a', [item], now)).toEqual([]);
  commitActivities('a', [item]); commitActivities('a', [item]);
  expect(collectActivityAlarms('a', [item], now).map(a => a.kind)).toEqual(['start', 'end']);
  expect(Object.keys(readCommitments('a'))).toEqual(['focus']);
});
it('uses persisted choices after reload and separates accounts even with the same task id', () => {
  commitActivities('a', [item], { start: false, end: true });
  expect(collectActivityAlarms('a', [item], now).map(a => a.kind)).toEqual(['end']);
  expect(collectActivityAlarms('b', [{ ...item, userId: 'b' }], now)).toEqual([]);
  commitActivities('b', [item]); expect(readCommitments('b')).toEqual({});
});
it('moves both alarms with a reroute and only the finish alarm when extended', () => {
  commitActivities('a', [item]);
  const moved = { ...item, startAt: '2026-10-04T18:00:00Z', endAt: '2026-10-04T18:30:00Z' };
  expect(collectActivityAlarms('a', [moved], now).map(a => a.at)).toEqual([Date.parse(moved.startAt), Date.parse(moved.endAt)]);
  const extended = { ...moved, endAt: '2026-10-04T18:45:00Z' };
  expect(collectActivityAlarms('a', [extended], now)[1].at).toEqual(Date.parse(extended.endAt));
});
it.each(['completed', 'cancelled', 'skipped', 'missed'] as const)('cancels both alarms when %s', status => {
  commitActivities('a', [item]);
  expect(collectActivityAlarms('a', [{ ...item, status }], now)).toEqual([]);
  expect(readCommitments('a')).toEqual({});
});
it('clears removed activities and explicit cancellation', () => {
  commitActivities('a', [item]); expect(collectActivityAlarms('a', [], now)).toEqual([]);
  commitActivities('a', [item]); cancelActivityAlarms('a', item.id);
  expect(collectActivityAlarms('a', [item], now)).toEqual([]);
});
it('does not ring overdue start alerts or replay delivered alerts after reload', () => {
  commitActivities('a', [item]);
  const alarm = collectActivityAlarms('a', [item], Date.parse(item.startAt))[0];
  markAlarmFired('a', alarm);
  expect(collectActivityAlarms('a', [item], Date.parse(item.startAt)).map(a => a.kind)).toEqual(['end']);
  expect(collectActivityAlarms('a', [item], Date.parse(item.endAt) + 61000)).toEqual([]);
});
it('starting an activity already in its block arms only its future finish', () => {
  const started = { ...item, startAt: new Date(now - 30000).toISOString(), status: 'in_progress' as const };
  commitActivities('a', [started]);
  expect(collectActivityAlarms('a', [started], now).map(a => a.kind)).toEqual(['end']);
});
it('ignores invalid and already ended intervals', () => {
  commitActivities('a', [{ ...item, startAt: 'invalid' }, { ...item, endAt: item.startAt }, { ...item, endAt: new Date(now - 10000).toISOString() }]);
  expect(readCommitments('a')).toEqual({});
});
it('schedule sync retains an active activity and completion removes its alarms', async () => {
  await scheduleRepository.saveScheduleItem({ ...item, status: 'in_progress' });
  commitActivities('a', [item]);
  const plan = { ...DEFAULT_DAILY_PLAN, date: '2026-10-04', timeBlocks: [{ id: item.id, title: item.title, time: '12:05 PM - 12:30 PM', details: '', completed: false }] };
  scheduleRepository.syncDayFromPlan('a', plan, 'America/Chicago');
  expect(scheduleRepository.getAlarmItems('a')[0].status).toBe('in_progress');
  scheduleRepository.syncDayFromPlan('a', { ...plan, timeBlocks: [{ ...plan.timeBlocks[0], completed: true }] }, 'America/Chicago');
  expect(collectActivityAlarms('a', scheduleRepository.getAlarmItems('a'), now)).toEqual([]);
});
it('native concurrent requests resolve only their own response, including denied permission', async () => {
  const messages: any[] = [];
  const bridge = { postMessage: (message: string) => messages.push(JSON.parse(message)), onmessage: undefined as any };
  (window as any).AIMAlarms = bridge;
  const permissions = nativeAlarmRequest('permissions'); const replace = nativeAlarmRequest('replace', { alarms: [] });
  bridge.onmessage({ data: JSON.stringify({ id: messages[1].id, ready: true, message: 'cleared' }) });
  bridge.onmessage({ data: JSON.stringify({ id: messages[0].id, ready: false, message: 'permission denied' }) });
  expect(await permissions).toEqual({ ready: false, message: 'permission denied' });
  expect(await replace).toEqual({ ready: true, message: 'cleared' });
});
it('retains a started activity crossing local midnight when its plan is saved', async () => {
  const overnight = { ...item, startAt: '2026-10-05T04:50:00Z', endAt: '2026-10-05T05:15:00Z', status: 'in_progress' as const };
  await scheduleRepository.saveScheduleItem(overnight); commitActivities('a', [overnight]);
  scheduleRepository.syncDayFromPlan('a', { ...DEFAULT_DAILY_PLAN, date: '2026-10-04', timeBlocks: [{ id: item.id, title: item.title, time: '11:50 PM - 12:15 AM', details: '', completed: false }] }, 'America/Chicago');
  expect(scheduleRepository.getAlarmItems('a')[0].endAt).toBe(overnight.endAt);
  expect(collectActivityAlarms('a', scheduleRepository.getAlarmItems('a'), now)[0].kind).toBe('end');
});
it('converts alarm wall-clock times independently of the device time zone and handles daylight-saving transitions', () => {
  expect(createUtcIsoFromLocal('2026-10-04', '23:50', 'America/Chicago')).toBe('2026-10-05T04:50:00.000Z');
  expect(createUtcIsoFromLocal('2026-01-04', '12:00', 'America/Chicago')).toBe('2026-01-04T18:00:00.000Z');
  expect(createUtcIsoFromLocal('2026-10-04', '12:00', 'Asia/Kolkata')).toBe('2026-10-04T06:30:00.000Z');
  expect(createUtcIsoFromLocal('2026-11-01', '01:30', 'America/Chicago')).toBe('2026-11-01T06:30:00.000Z');
  expect(() => createUtcIsoFromLocal('2026-03-08', '02:30', 'America/Chicago')).toThrow('daylight-saving');
});
