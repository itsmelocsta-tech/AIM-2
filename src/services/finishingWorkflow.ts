import { DailyPlan, PriorityTask, TimeBlock } from '../types';

export const nextFinisherTask = (plan: DailyPlan): PriorityTask | undefined =>
  plan.priorityTasks.find((task) => !task.completed);

export const morningPlanContext = (notes: string, driftTrigger: string, protectiveRoutine: string): string =>
  [
    notes.trim(),
    driftTrigger.trim() && `Distraction the user identified: ${driftTrigger.trim()}`,
    protectiveRoutine.trim() && `Existing setup the user wants to keep: ${protectiveRoutine.trim()}`,
  ].filter(Boolean).join('\n');

export const reconcilePriorityTasks = (existing: PriorityTask[], generated: PriorityTask[]): PriorityTask[] => {
  const byTitle = new Map(existing.map((task) => [task.task.trim().toLocaleLowerCase(), task]));
  // A new plan must not silently erase work the person checked off or tasks they added.
  const seen = new Set<string>();
  const merged = generated.map((task) => {
    const key = task.task.trim().toLocaleLowerCase();
    seen.add(key);
    const previous = byTitle.get(key);
    return previous ? { ...task, id: previous.id, completed: previous.completed } : task;
  });
  return [...merged, ...existing.filter((task) => !seen.has(task.task.trim().toLocaleLowerCase()))];
};

export const reconcileTimeBlocks = (existing: TimeBlock[], generated: TimeBlock[]): TimeBlock[] => {
  const key = (block: TimeBlock) => `${block.time}|${block.title.trim().toLocaleLowerCase()}`;
  const bySlot = new Map(existing.map((block) => [key(block), block]));
  const seen = new Set<string>();
  const merged = generated.map((block) => {
    const slot = key(block);
    seen.add(slot);
    const previous = bySlot.get(slot);
    return previous ? { ...block, id: previous.id, completed: previous.completed } : block;
  });
  return [...merged, ...existing.filter((block) => !seen.has(key(block)))];
};

export const groundedEveningReflection = (
  plan: DailyPlan,
  notes: string,
  protectiveRoutine: string,
  response?: Record<string, unknown>
): NonNullable<DailyPlan['eveningReflection']> => {
  const completed = plan.priorityTasks.filter((task) => task.completed);
  const count = plan.priorityTasks.length;
  const realResponse = response && response.source !== 'fallback' ? response : null;
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
  const routine = protectiveRoutine.trim();
  const adjustments = strings(realResponse?.adjustmentsForTomorrow);
  if (routine && !adjustments.includes(routine)) adjustments.unshift(routine);

  return {
    summary: `You finished ${completed.length} of ${count} priority tasks today. Unfinished work can be revisited tomorrow.`,
    // The checked tasks are the only wins AIM can confirm. The AI cannot award imaginary ones.
    winsAcknowledged: completed.map((task) => task.task),
    patternsIdentified: strings(realResponse?.patternsIdentified),
    adjustmentsForTomorrow: adjustments,
    closingThought: typeof realResponse?.closingThought === 'string' && realResponse.closingThought.trim()
      ? realResponse.closingThought : 'One clear step is enough to begin again.',
    userNotes: notes.trim(),
  };
};
