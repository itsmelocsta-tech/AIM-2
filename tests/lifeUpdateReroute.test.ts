import { describe, expect, it } from 'vitest';
import { buildReroutedDailyPlan, describeReroute } from '../src/services/lifeUpdateReroute';
import { DEFAULT_DAILY_PLAN } from '../src/services/storage';
import type { LifeUpdateAnalysisResult } from '../src/types';

const currentPlan = {
  ...DEFAULT_DAILY_PLAN,
  priorityTasks: [
    { id: 'finished', task: 'Called my contact', category: 'Career' as const, timeEstimate: '15m', impact: 'High' as const, completed: true },
    { id: 'affected', task: 'Prepare for the old interview', category: 'Career' as const, timeEstimate: '30m', impact: 'High' as const, completed: false },
    { id: 'untouched', task: 'Pick up groceries', category: 'Personal' as const, timeEstimate: '20m', impact: 'Medium' as const, completed: false },
  ],
  timeBlocks: [
    { id: 'done-block', time: '09:00 - 09:30', title: 'Morning walk', details: '', completed: true },
    { id: 'old-block', time: '12:00 - 13:00', title: 'Interview prep', details: '', completed: false },
    { id: 'other-block', time: '16:00 - 17:00', title: 'Family time', details: '', completed: false },
  ],
};

function analysis(overrides: Partial<LifeUpdateAnalysisResult> = {}): LifeUpdateAnalysisResult {
  return {
    understandingSummary: [], importantLifeChange: 'The interview was cancelled', categories: [], entities: [],
    urgency: 'medium', affectedGoalIds: [], affectedTaskIds: ['affected', 'finished'],
    affectedTimeBlockIds: ['old-block', 'done-block'], affectedPlanIds: [currentPlan.date],
    conflictsOrUncertainty: null, planImpact: 'major',
    proposedReroute: {
      explanation: 'Adjust the plan', whatChanged: [], whatWasRemovedOrPaused: [],
      newTopPriority: 'Contact a new employer', nextSpecificAction: 'Call employer',
      suggestedPriorityTasks: [
        { ...currentPlan.priorityTasks[0], task: 'Pretend the completed task changed' },
        { ...currentPlan.priorityTasks[1], task: 'Contact the new employer' },
        { id: 'new', task: 'Email the new employer', category: 'Career', timeEstimate: '15m', impact: 'High', completed: false },
      ],
      suggestedTimeBlocks: [{ ...currentPlan.timeBlocks[0], title: 'Pretend the walk changed' }],
      removedTimeBlockIds: ['old-block', 'done-block'],
    },
    ...overrides,
  };
}

describe('confirmed life update reroute', () => {
  it('keeps completed and unrelated work while applying only ID-matched changes', () => {
    const result = buildReroutedDailyPlan(currentPlan, analysis());
    expect(result.priorityTasks.map(task => task.task)).toEqual([
      'Called my contact', 'Contact the new employer', 'Pick up groceries', 'Email the new employer',
    ]);
    expect(result.timeBlocks.map(block => block.title)).toEqual(['Morning walk', 'Family time']);
    expect(describeReroute(currentPlan, result)).toEqual({
      changed: ['Updated task: Contact the new employer', 'Added task: Email the new employer'],
      removed: ['Removed time block: Interview prep'],
    });
  });

  it('preserves the plan for an informational update even if suggestions were sent', () => {
    expect(buildReroutedDailyPlan(currentPlan, analysis({ planImpact: 'none' }))).toBe(currentPlan);
  });

  it('does not silently drop unfinished tasks that the analysis omitted', () => {
    const result = buildReroutedDailyPlan(currentPlan, analysis({
      affectedTaskIds: [], affectedTimeBlockIds: [],
      proposedReroute: { ...analysis().proposedReroute, suggestedPriorityTasks: [], suggestedTimeBlocks: [], removedTaskIds: ['untouched'] },
    }));
    expect(result.priorityTasks).toEqual(currentPlan.priorityTasks);
    expect(result.timeBlocks).toEqual(currentPlan.timeBlocks);
  });
});
