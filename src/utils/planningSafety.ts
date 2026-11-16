/** Shared deterministic checks. AI suggestions never override the person's capacity. */
export function planningCapacity(energy: unknown, hours: unknown) {
  const energyLevel = energy ?? 8;
  const availableHours = hours ?? 8;
  if (typeof energyLevel !== 'number' || !Number.isFinite(energyLevel) || energyLevel < 1 || energyLevel > 10 ||
      typeof availableHours !== 'number' || !Number.isFinite(availableHours) || availableHours < 0 || availableHours > 24) {
    throw new Error('Choose an energy level from 1 to 10 and available hours from 0 to 24.');
  }
  return { energyLevel, availableHours };
}

export function timeRangeMinutes(value: unknown): [number, number] | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;
  const [, sh, sm, eh, em] = match.map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (sh > 23 || eh > 24 || (eh === 24 && em !== 0) || end <= start) return null;
  return [start, end];
}

export function assertFeasibleTimeBlocks(blocks: { time: string }[], hours: number): void {
  const ranges = blocks.map(block => timeRangeMinutes(block.time));
  if (ranges.some(range => !range)) throw new Error('AIM could not verify the suggested times. Your plan was not changed.');
  const sorted = (ranges as [number, number][]).sort((a, b) => a[0] - b[0]);
  if (sorted.some((range, i) => i > 0 && range[0] < sorted[i - 1][1])) {
    throw new Error('The suggested times overlap. Your plan was not changed.');
  }
  const minutes = sorted.reduce((total, [start, end]) => total + end - start, 0);
  if (!Number.isFinite(hours) || hours < 0 || minutes > hours * 60 + 0.001) {
    throw new Error('The suggested work exceeds your available time. Your plan was not changed.');
  }
}

function estimateMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?$/i);
  if (!match || (!match[1] && !match[2])) return null;
  const minutes = Number(match[1] || 0) * 60 + Number(match[2] || 0);
  return minutes > 0 ? minutes : null;
}

export function assertUsableMorningPlan(plan: any, hours: number): void {
  const text = (value: unknown) => typeof value === 'string' && !!value.trim();
  if (!plan || !Array.isArray(plan.topThreePriorityTasks) || !Array.isArray(plan.timeBlocks) ||
      plan.topThreePriorityTasks.length > 3 ||
      plan.topThreePriorityTasks.some((task: any) => !text(task?.task) || !text(task?.description) || estimateMinutes(task?.timeEstimate) === null) ||
      plan.timeBlocks.some((block: any) => !text(block?.title) || !text(block?.details)) ||
      (!plan.topThreePriorityTasks.length && plan.timeBlocks.length)) {
    throw new Error('AIM did not return a usable daily plan.');
  }
  const estimated = plan.topThreePriorityTasks.reduce((total: number, task: any) => total + estimateMinutes(task.timeEstimate)!, 0);
  if (estimated > hours * 60 + 0.001) throw new Error('The suggested priorities exceed your available time.');
  assertFeasibleTimeBlocks(plan.timeBlocks, hours);
}
