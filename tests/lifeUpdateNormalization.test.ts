import { describe, expect, it } from 'vitest';
import { applyExplicitAvailableHours, extractExplicitAvailableHours } from '../server/lifeUpdateNormalization';

describe('life update explicit available time', () => {
  it('recognizes explicit numeric and word-based hour limits', () => {
    expect(extractExplicitAvailableHours('I only have one hour available today, not two.')).toBe(1);
    expect(extractExplicitAvailableHours('I have 2 productive hours today.')).toBe(2);
    expect(extractExplicitAvailableHours('My available time is 24 hours.')).toBe(24);
  });

  it('ignores incidental mentions and invalid limits', () => {
    expect(extractExplicitAvailableHours('I spent one hour on an appointment.')).toBeNull();
    expect(extractExplicitAvailableHours('I only have 25 hours today.')).toBeNull();
  });

  it('preserves an explicit changed budget even when the model omits it', () => {
    const result: Record<string, any> = {
      planImpact: 'none',
      proposedReroute: { suggestedPriorityTasks: [], suggestedTimeBlocks: [] },
    };
    applyExplicitAvailableHours(result, 'I only have one hour available today, not two.', { availableHours: 2 });
    expect(result.planImpact).toBe('minor');
    expect(result.proposedReroute.updatedPlanFields.availableHours).toBe(1);
    expect(result.proposedReroute.whatChanged).toContain('Available time updated to 1 hour');
  });

  it('does not change a plan when the stated hours match the current budget', () => {
    const result: Record<string, any> = { planImpact: 'none' };
    applyExplicitAvailableHours(result, 'I only have one hour available today.', { availableHours: 1 });
    expect(result).toEqual({ planImpact: 'none' });
  });

  it('preserves completed time blocks and removes only enough unfinished blocks to fit', () => {
    const result: Record<string, any> = {
      affectedTimeBlockIds: [],
      proposedReroute: { suggestedPriorityTasks: [], suggestedTimeBlocks: [] },
    };
    applyExplicitAvailableHours(result, 'I only have one hour available today.', {
      availableHours: 2,
      timeBlocks: [
        { id: 'done', time: '9:00 AM - 9:30 AM', completed: true },
        { id: 'first', time: '10:00 AM - 10:45 AM', completed: false },
        { id: 'later', time: '11:00 AM - 11:45 AM', completed: false },
      ],
    });
    expect(result.proposedReroute.removedTimeBlockIds).toEqual(['later']);
    expect(result.affectedTimeBlockIds).toEqual(['later']);
  });
});
