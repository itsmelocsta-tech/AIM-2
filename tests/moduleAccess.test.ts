import { describe, expect, it } from 'vitest';
import { getUnlockedModules } from '../src/services/moduleAccessService';
import { DEFAULT_DAILY_PLAN, DEFAULT_PROFILE } from '../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT } from '../src/services/aimContextService';

const baseInput = { profile: DEFAULT_PROFILE, context: DEFAULT_PERSONAL_CONTEXT, projects: [], goals: [], memories: [], dailyPlan: DEFAULT_DAILY_PLAN, wellnessLogs: [] };

describe('progressive Life OS module access', () => {
  it('shows only AIM home during onboarding', () => {
    expect([...getUnlockedModules(baseInput)]).toEqual(['home']);
  });

  it('unlocks relevant modules from the user disclosure', () => {
    const modules = getUnlockedModules({ ...baseInput, profile: { ...DEFAULT_PROFILE, onboardingCompleted: true }, calibrationText: 'I need a job and steady income, want to finish my album, and improve my sleep and nutrition.' });
    expect(modules.has('scanner')).toBe(true);
    expect(modules.has('projects')).toBe(true);
    expect(modules.has('wellness')).toBe(true);
  });

  it('does not expose unrelated modules without supporting data', () => {
    const modules = getUnlockedModules({ ...baseInput, profile: { ...DEFAULT_PROFILE, onboardingCompleted: true }, calibrationText: 'I want more peace and clearer decisions.' });
    expect(modules.has('scanner')).toBe(false);
    expect(modules.has('projects')).toBe(false);
    expect(modules.has('wellness')).toBe(false);
  });

  it('restores relevant modules from cloud onboarding memory when the browser cache is empty', () => {
    const modules = getUnlockedModules({
      ...baseInput, profile: { ...DEFAULT_PROFILE, onboardingCompleted: true },
      memories: [{ id: 'saved-onboarding', title: 'Your starting plan', content: 'I want illustration clients and better sleep.', category: 'Goals', tags: ['alignment', 'identity', 'pathway'], createdAt: '2026-10-16', updatedAt: '2026-10-16', importance: 'critical' }],
    });
    expect(modules.has('scanner')).toBe(true);
    expect(modules.has('wellness')).toBe(true);
  });

  it('keeps a saved personal opportunity target reachable without money-related profile wording', () => {
    const modules = getUnlockedModules({
      ...baseInput, profile: { ...DEFAULT_PROFILE, onboardingCompleted: true },
      context: { ...DEFAULT_PERSONAL_CONTEXT, opportunityFocus: { category: 'education', description: 'Drawing classes', location: 'Austin' } },
    });
    expect(modules.has('scanner')).toBe(true);
  });
});
