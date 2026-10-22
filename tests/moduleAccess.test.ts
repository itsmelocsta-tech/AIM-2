import { describe, expect, it } from 'vitest';
import { getRevealedCoaches, getRevealedSpaces, getUnlockedModules } from '../src/services/moduleAccessService';
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
  it('reveals health and relationship sections from user messages, not AIM replies or generated profile advice', () => {
    const profile = { ...DEFAULT_PROFILE, id: 'person-a', onboardingCompleted: true, coreMission: 'AI suggested sleep and dating support' };
    const message = (role: 'user' | 'aim', content: string) => ({ id: role, role, content, timestamp: '2026-10-21' });
    const withoutMention = getUnlockedModules({ ...baseInput, profile, chatMessages: [message('aim', 'Improve your health and relationships.')] });
    expect(withoutMention.has('wellness')).toBe(false);
    expect(withoutMention.has('relationships')).toBe(false);
    const input = { ...baseInput, profile, chatMessages: [message('user', 'My health needs attention and I argued with my friend.')] };
    expect(getUnlockedModules(input).has('wellness')).toBe(true);
    expect(getUnlockedModules(input).has('relationships')).toBe(true);
    expect(getRevealedCoaches(input)).toEqual(['guidance', 'health', 'relationships']);
  });
  it('does not infer app projects from happy, wellness from healthy generated plans, or friendships from friendly', () => {
    const input = { ...baseInput, profile: { ...DEFAULT_PROFILE, onboardingCompleted: true }, calibrationText: 'I want to feel happy and have a friendly conversation.',
      memories: [{ id: 'foundation', title: 'Start', content: 'CURRENT SITUATION:\nA clearer direction.\n\nCHOSEN PLAN: Better health and dating', category: 'Goals' as const, tags: ['alignment'], createdAt: '', updatedAt: '', importance: 'critical' as const }] };
    expect(getRevealedSpaces(input)).toEqual([]);
  });
  it('restores saved topics, ignores another account life update and keeps life-update navigation usable', () => {
    const input = { ...baseInput, profile: { ...DEFAULT_PROFILE, id: 'person-b', onboardingCompleted: true, contextualSpaces: ['relationships' as const] },
      lifeUpdates: [{ userId: 'person-a', userConfirmed: true, originalContent: 'I have health concerns.' }] as any };
    expect(getUnlockedModules(input).has('relationships')).toBe(true);
    expect(getUnlockedModules(input).has('wellness')).toBe(false);
    expect(getUnlockedModules(input).has('life-update')).toBe(true);
  });
});
