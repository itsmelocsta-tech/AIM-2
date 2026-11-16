import { describe, expect, it } from 'vitest';
import { planningCapacity, assertUsableMorningPlan, timeRangeMinutes } from '../src/utils/planningSafety';

const plan = () => ({
  topThreePriorityTasks: [{ task: 'Draft a paragraph', description: 'Open the draft; write and save one paragraph.', timeEstimate: '15m' }],
  timeBlocks: [{ time: '10:00 - 10:15', title: 'Draft a paragraph', details: 'Open the draft; write and save one paragraph.' }],
});
describe('realistic planning safety', () => {
  it('honors zero and fractional hours and rejects corrupt capacity', () => {
    expect(planningCapacity(1, 0)).toEqual({ energyLevel: 1, availableHours: 0 });
    expect(planningCapacity(3, 0.25).availableHours).toBe(0.25);
    for (const hours of [-1, 25, NaN, Infinity, '2']) expect(() => planningCapacity(5, hours)).toThrow();
    expect(() => planningCapacity(0, 2)).toThrow();
  });
  it('checks workload against time without double counting tasks and their calendar blocks', () => {
    expect(() => assertUsableMorningPlan(plan(), 0.25)).not.toThrow();
    expect(() => assertUsableMorningPlan(plan(), 0)).toThrow();
    const oversized = plan(); oversized.topThreePriorityTasks[0].timeEstimate = '1h 30m';
    expect(() => assertUsableMorningPlan(oversized, 1)).toThrow(/priorities/);
    const overlapped = plan(); overlapped.timeBlocks.push({ ...overlapped.timeBlocks[0], time: '10:10 - 10:25' });
    expect(() => assertUsableMorningPlan(overlapped, 2)).toThrow(/overlap/);
    expect(() => assertUsableMorningPlan({ topThreePriorityTasks: [], timeBlocks: [] }, 0)).not.toThrow();
  });
  it('rejects missing instructions, unknown durations, and unusable times', () => {
    expect(() => assertUsableMorningPlan({ ...plan(), topThreePriorityTasks: [{ task: 'Write', timeEstimate: 'soon' }] }, 1)).toThrow();
    for (const time of ['25:00 - 26:00', '12:30 - 12:00', '23:00 - 24:15', '23:30 - 24:00', 'tomorrow', '10:00']) expect(timeRangeMinutes(time)).toBeNull();
    expect(timeRangeMinutes('23:30 – 23:59')).toEqual([1410, 1439]);
  });
});
