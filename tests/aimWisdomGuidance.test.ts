import { describe, expect, it } from 'vitest';
import type { DailyPlan, LifeUpdate, UserProfile } from '../src/types';
import { buildAIMWisdomGuidance } from '../src/services/aimWisdomGuidance';

const profile: UserProfile = {
  id: 'fictional-user',
  name: 'Taylor',
  email: 'fictional@example.test',
  desiredIdentity: 'A steady working writer',
  coreMission: 'Finish a short story without neglecting rest',
  currentMonthlyIncome: 0,
  targetMonthlyIncome: 0,
  primaryObstacle: 'Messages interrupt the first work block',
  topSkills: ['Writing'],
  coreValues: ['Care', 'Craft'],
  ninetyDayTrajectory: 'Finish and revise one story',
  onboardingCompleted: true,
};

const plan = (completed = 0): DailyPlan => ({
  date: '2026-10-28',
  theme: 'Protect the opening writing block',
  energyLevel: 5,
  availableHours: 3,
  priorityTasks: [
    { id: 'outline', task: 'Outline the final scene', description: 'Open the story notes, list the final five beats, and save the outline.', category: 'Personal', timeEstimate: '40m', impact: 'High', completed: completed > 0 },
    { id: 'draft', task: 'Draft the opening page', description: 'Open the draft and write one page without editing.', category: 'Personal', timeEstimate: '30m', impact: 'High', completed: completed > 1 },
  ],
  timeBlocks: [],
  mindsetReminder: 'Make the next step visible.',
  notes: 'Only three hours are available today.',
});

const update = (overrides: Partial<LifeUpdate> = {}): LifeUpdate => ({
  id: 'update-1', userId: 'fictional-user', createdAt: '2026-10-28T15:00:00.000Z', updatedAt: '2026-10-28T15:00:00.000Z', inputType: 'text',
  originalContent: 'My evening shift moved two hours earlier.', confirmedSummary: 'The work shift now starts two hours earlier.', categories: ['Schedule'],
  affectedGoalIds: [], affectedTaskIds: ['draft'], affectedPlanIds: ['2026-10-28'], urgency: 'medium', userConfirmed: true, planChangeRequested: true,
  rerouteStatus: 'pending', ...overrides,
});

describe('Awareness–Intention–Motion wisdom guidance', () => {
  it('uses the saved plan and refuses to invent a personal pattern', () => {
    const guidance = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: plan() });
    expect(guidance.evolution.phase).toBe('intention');
    expect(guidance.intention.focus).toBe('Outline the final scene');
    expect(guidance.motion.setup).toContain('list the final five beats');
    expect(guidance.motion.timeboxMinutes).toBe(25);
    expect(guidance.awareness.confirmedPatterns).toEqual([]);
    expect(guidance.awareness.reflection).toContain('will not guess');
  });

  it('evolves from centered intention to branching motion when saved progress changes', () => {
    const before = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: plan() });
    const after = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: plan(1) });
    expect(before.evolution).toMatchObject({ phase: 'intention', geometry: 'rings' });
    expect(after.evolution).toMatchObject({ phase: 'motion', geometry: 'branches', completedCount: 1 });
    expect(after.evolution.revision).not.toBe(before.evolution.revision);
    expect(after.motion.nextAction).toBe('Draft the opening page');
  });

  it('opens into awareness and uses only confirmed reflection patterns when work is complete', () => {
    const completePlan = plan(2);
    completePlan.eveningReflection = {
      summary: 'The phone-free start made it easier to finish.',
      winsAcknowledged: ['Finished both saved tasks'],
      patternsIdentified: ['Starting before checking messages reduced drift'],
      adjustmentsForTomorrow: ['Keep the phone outside the room'],
      closingThought: 'Protect the setup that worked.',
      userNotes: 'I lost focus after opening messages at lunch.',
    };
    const guidance = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: completePlan });
    expect(guidance.evolution).toMatchObject({ phase: 'awareness', geometry: 'petals', palette: 'forest' });
    expect(guidance.awareness.confirmedPatterns).toEqual(['Starting before checking messages reduced drift']);
    expect(guidance.awareness.reflection).toContain('lost focus');
  });

  it('returns to awareness for a pending life change and selects the newest saved update', () => {
    const older = update({ id: 'older', updatedAt: '2026-10-27T15:00:00.000Z', confirmedSummary: 'An older schedule note.' });
    const newer = update({ id: 'newer', updatedAt: '2026-10-29T15:00:00.000Z' });
    const guidance = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: plan(2), lifeUpdates: [older, newer] });
    expect(guidance.evolution.phase).toBe('awareness');
    expect(guidance.evolution.geometry).toBe('contours');
    expect(guidance.awareness.circumstance).toContain('two hours earlier');
    expect(guidance.adaptation).toMatchObject({ sourceUpdateId: 'newer', status: 'recalibrating' });
    expect(guidance.adaptation.summary).toContain('holding the current plan steady');
  });

  it('uses a confirmed reroute as the new intention and motion without replacing unrelated work', () => {
    const rerouted = update({
      rerouteStatus: 'rerouted',
      newTopPriority: 'Move the writing block before the shift',
      nextSpecificAction: 'Reserve 8:00–8:25 AM for the final scene outline',
      rerouteExplanation: 'The writing block moved earlier; the story goal stayed intact.',
      whatChanged: ['Writing moved to 8:00 AM'],
      whatWasRemovedOrPaused: ['Evening drafting block'],
    });
    const guidance = buildAIMWisdomGuidance({ userProfile: profile, dailyPlan: plan(), lifeUpdates: [rerouted] });
    expect(guidance.evolution.phase).toBe('intention');
    expect(guidance.intention.focus).toBe('Move the writing block before the shift');
    expect(guidance.motion.nextAction).toContain('8:00–8:25 AM');
    expect(guidance.adaptation.changes).toEqual(['Writing moved to 8:00 AM', 'Paused or removed: Evening drafting block']);
  });
});
