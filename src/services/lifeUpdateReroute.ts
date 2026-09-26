import { DailyPlan, LifeUpdateAnalysisResult, PriorityTask, TimeBlock } from '../types';

/** Apply only explicitly affected changes while protecting completed and unrelated work. */
export function buildReroutedDailyPlan(plan: DailyPlan, analysis: LifeUpdateAnalysisResult): DailyPlan {
  const proposal = analysis.proposedReroute;
  if (!proposal || !Array.isArray(proposal.suggestedPriorityTasks) ||
      !Array.isArray(proposal.suggestedTimeBlocks)) {
    throw new Error('AIM did not return a usable reroute. Your plan was not changed.');
  }
  if (analysis.planImpact === 'none') return plan;

  const affectedTasks = new Set(analysis.affectedTaskIds || []);
  const affectedBlocks = new Set(analysis.affectedTimeBlockIds || []);
  const removedTasks = new Set(proposal.removedTaskIds || []);
  const removedBlocks = new Set(proposal.removedTimeBlockIds || []);

  const currentTaskIds = new Set(plan.priorityTasks.map(item => item.id));
  const changedTasks = new Map(proposal.suggestedPriorityTasks.map(item => [item.id, item]));
  const priorityTasks = plan.priorityTasks.flatMap(item => {
    if (item.completed) return [item];
    if (!affectedTasks.has(item.id)) return [item];
    if (removedTasks.has(item.id)) return [];
    const replacement = changedTasks.get(item.id);
    return replacement?.task?.trim() ? [{ ...item, ...replacement, completed: false }] : [item];
  });
  for (const item of proposal.suggestedPriorityTasks) {
    if (!item?.id || !item.task?.trim() || currentTaskIds.has(item.id) ||
        priorityTasks.some(task => task.task.trim().toLowerCase() === item.task.trim().toLowerCase())) continue;
    priorityTasks.push({ ...item, completed: false } as PriorityTask);
    currentTaskIds.add(item.id);
  }

  const currentBlockIds = new Set(plan.timeBlocks.map(item => item.id));
  const changedBlocks = new Map(proposal.suggestedTimeBlocks.map(item => [item.id, item]));
  const timeBlocks = plan.timeBlocks.flatMap(item => {
    if (item.completed) return [item];
    if (!affectedBlocks.has(item.id)) return [item];
    if (removedBlocks.has(item.id)) return [];
    const replacement = changedBlocks.get(item.id);
    return replacement?.title?.trim() ? [{ ...item, ...replacement, completed: false }] : [item];
  });
  for (const item of proposal.suggestedTimeBlocks) {
    if (!item?.id || !item.title?.trim() || currentBlockIds.has(item.id) ||
        timeBlocks.some(block => block.title.trim().toLowerCase() === item.title.trim().toLowerCase())) continue;
    timeBlocks.push({ ...item, completed: false } as TimeBlock);
    currentBlockIds.add(item.id);
  }

  return {
    ...plan,
    priorityTasks,
    timeBlocks,
    theme: proposal.newTopPriority?.trim() ? `Focus: ${proposal.newTopPriority.trim()}` : plan.theme,
  };
}

export function describeReroute(before: DailyPlan, after: DailyPlan): { changed: string[]; removed: string[] } {
  const changed: string[] = [];
  const removed: string[] = [];
  const priorTasks = new Map(before.priorityTasks.map(task => [task.id, task]));
  const nextTaskIds = new Set(after.priorityTasks.map(task => task.id));
  const priorBlocks = new Map(before.timeBlocks.map(block => [block.id, block]));
  const nextBlockIds = new Set(after.timeBlocks.map(block => block.id));

  for (const task of after.priorityTasks) {
    const prior = priorTasks.get(task.id);
    if (!prior) changed.push(`Added task: ${task.task}`);
    else if (prior.task !== task.task || prior.category !== task.category ||
             prior.timeEstimate !== task.timeEstimate || prior.impact !== task.impact ||
             prior.description !== task.description) changed.push(`Updated task: ${task.task}`);
  }
  for (const task of before.priorityTasks) {
    if (!nextTaskIds.has(task.id)) removed.push(`Removed task: ${task.task}`);
  }
  for (const block of after.timeBlocks) {
    const prior = priorBlocks.get(block.id);
    if (!prior) changed.push(`Added time block: ${block.title}`);
    else if (prior.title !== block.title || prior.time !== block.time || prior.details !== block.details) changed.push(`Updated time block: ${block.title} (${block.time})`);
  }
  for (const block of before.timeBlocks) {
    if (!nextBlockIds.has(block.id)) removed.push(`Removed time block: ${block.title}`);
  }
  return { changed, removed };
}
