import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DailyPlannerModule } from '../src/components/modules/DailyPlannerModule';
import { AimHomeModule } from '../src/components/modules/AimHomeModule';
import { groundedEveningReflection, morningPlanContext, nextFinisherTask, reconcilePriorityTasks, reconcileTimeBlocks } from '../src/services/finishingWorkflow';
import { DEFAULT_DAILY_PLAN, DEFAULT_PROFILE, storageService } from '../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT } from '../src/services/aimContextService';
import { PriorityTask } from '../src/types';

const task = (id: string, title: string, completed = false): PriorityTask => ({
  id, task: title, completed, category: 'Personal', impact: 'High', timeEstimate: '20m',
});

describe('Drifter → Finisher → Architect', () => {
  it('moves to the next real priority as work is completed without losing checked or user-added work', () => {
    const existing = [task('first', 'Send the draft', true), task('manual', 'Call the mentor')];
    const generated = [task('fresh', 'Send the draft'), task('next', 'Review the proposal')];
    const merged = reconcilePriorityTasks(existing, generated);

    expect(merged).toEqual([
      expect.objectContaining({ id: 'first', task: 'Send the draft', completed: true }),
      expect.objectContaining({ id: 'next', task: 'Review the proposal', completed: false }),
      expect.objectContaining({ id: 'manual', task: 'Call the mentor', completed: false }),
    ]);
    expect(nextFinisherTask({ ...DEFAULT_DAILY_PLAN, priorityTasks: merged })?.task).toBe('Review the proposal');
    expect(nextFinisherTask({ ...DEFAULT_DAILY_PLAN, priorityTasks: merged.map((t) => ({ ...t, completed: true })) })).toBeUndefined();
    expect(reconcilePriorityTasks(existing, [])).toEqual(existing);
    const oldBlock = { id: 'block-1', time: '09:00', title: 'Write', details: 'Draft page', completed: true };
    expect(reconcileTimeBlocks([oldBlock], [{ ...oldBlock, id: 'new-id', completed: false }]))
      .toEqual([oldBlock]);
    expect(reconcileTimeBlocks([oldBlock], [])).toEqual([oldBlock]);
  });

  it('puts the person’s distraction and routine into planning and records only verified wins during fallback', () => {
    expect(morningPlanContext('Finish the draft', 'messages', 'Draft at 9am'))
      .toContain('Existing setup the user wants to keep: Draft at 9am');
    const plan = { ...DEFAULT_DAILY_PLAN, priorityTasks: [task('a', 'Send the draft', true), task('b', 'Call the mentor')] };
    const review = groundedEveningReflection(plan, 'I lost time to messages', 'Draft at 9am', {
      source: 'fallback', winsAcknowledged: ['Won a new client'], patternsIdentified: ['Perfect focus'],
    });
    expect(review.winsAcknowledged).toEqual(['Send the draft']);
    expect(review.patternsIdentified).toEqual([]);
    expect(review.summary).toContain('1 of 2');
    expect(review.userNotes).toBe('I lost time to messages');
    expect(review.adjustmentsForTomorrow).toEqual(['Draft at 9am']);
    const suggested = groundedEveningReflection(plan, '', '', {
      summary: 'Signed a client today', winsAcknowledged: ['Signed a client today'],
    });
    expect(suggested.summary).toContain('1 of 2');
    expect(suggested.winsAcknowledged).toEqual(['Send the draft']);
  });

  it('keeps the user’s setup in their profile for the next daily plan', () => {
    const entries = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    });
    try {
      storageService.saveProfile({ ...DEFAULT_PROFILE, id: 'user-1', finishingSystem: {
        driftTrigger: 'Checking messages', protectiveRoutine: 'Write at 9am',
      } });
      const saved = storageService.getProfile();
      expect(saved.id).toBe('user-1');
      expect(morningPlanContext('', saved.finishingSystem?.driftTrigger || '', saved.finishingSystem?.protectiveRoutine || ''))
        .toContain('Write at 9am');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('places the workflow in the existing planner and home without another navigation choice', () => {
    const profile = { ...DEFAULT_PROFILE, finishingSystem: {
      driftTrigger: 'Notifications before writing', protectiveRoutine: 'Write at 9am with notifications off',
    } };
    const plan = { ...DEFAULT_DAILY_PLAN, priorityTasks: [task('a', 'Write the first page')] };
    const planner = renderToStaticMarkup(<DailyPlannerModule
      dailyPlan={plan} userProfile={profile} goals={[]}
      onUpdatePlan={() => {}} onUpdateProfile={() => {}} onToast={() => {}}
    />);
    const home = renderToStaticMarkup(<AimHomeModule
      userProfile={profile} dailyPlan={plan} context={DEFAULT_PERSONAL_CONTEXT} projects={[]}
      onRefreshRecommendation={() => {}} onNavigateToTab={() => {}} onToast={() => {}}
    />);
    expect(planner).toContain('Drifter → Finisher → Architect');
    expect(planner).toContain('Notifications before writing');
    expect(planner).toContain('Next to finish');
    expect(planner).toContain('Write at 9am with notifications off');
    expect(home).toContain('Your finishing setup: Write at 9am with notifications off');
  });
});
