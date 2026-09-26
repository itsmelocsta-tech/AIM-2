import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirstRunGuide } from '../src/components/modules/FirstRunGuide';
import { ConversationalHomeModule } from '../src/components/modules/ConversationalHomeModule';
import { AimHomeModule } from '../src/components/modules/AimHomeModule';
import { aimContextService, DEFAULT_PERSONAL_CONTEXT } from '../src/services/aimContextService';
import { DEFAULT_DAILY_PLAN, DEFAULT_PROFILE, storageService } from '../src/services/storage';

describe('guided first run', () => {
  it('shows the first question immediately for a new account', () => {
    const html = renderToStaticMarkup(<ConversationalHomeModule
      userId="just-created-user" userProfile={{ ...DEFAULT_PROFILE, id: 'just-created-user' }}
      dailyPlan={DEFAULT_DAILY_PLAN} goals={[]} memories={[]} wellnessLogs={[]}
      chatMessages={[]} onUpdateChat={() => {}} onCommitOnboarding={async () => {}}
      onNavigateToTab={() => {}} onToast={() => {}}
    />);
    expect(html).toContain('aim-onboarding-step-1');
    expect(html).toContain('Where you are right now');
    expect(html).toContain('aim-current-state-textarea');
    expect(html).not.toContain('Today (Life OS)');
  });

  it('shows one next action on each page and uses the user’s saved task', () => {
    const plan = { ...DEFAULT_DAILY_PLAN, priorityTasks: [{
      id: 'first', task: 'Call the training center', category: 'Career' as const,
      timeEstimate: '15m', impact: 'High' as const, completed: false,
    }] };
    const profile = { ...DEFAULT_PROFILE, desiredIdentity: 'A certified technician', onboardingCompleted: true };

    const intro = renderToStaticMarkup(<FirstRunGuide step="intro" profile={profile} dailyPlan={plan} onNext={() => {}} />);
    const planner = renderToStaticMarkup(<FirstRunGuide step="planner" profile={profile} dailyPlan={plan} onNext={() => {}} />);
    const checkIn = renderToStaticMarkup(<FirstRunGuide step="check-in" profile={profile} dailyPlan={plan} onNext={() => {}} />);

    expect(intro).toContain('A certified technician');
    expect(intro).toContain('Call the training center');
    expect(intro).toContain('Getting started · 1 of 3');
    expect(planner).toContain('Call the training center');
    expect(planner).toContain('Getting started · 2 of 3');
    expect(checkIn).toContain('Getting started · 3 of 3');
    for (const html of [intro, planner, checkIn]) expect(html.match(/<button\b/g)).toHaveLength(1);
  });

  it('shows a new user’s own starting action without another person’s location or projects', () => {
    const profile = { ...DEFAULT_PROFILE, coreMission: 'Learn a new trade', onboardingCompleted: true };
    const plan = { ...DEFAULT_DAILY_PLAN, priorityTasks: [{
      id: 'first', task: 'Call the training center', category: 'Career' as const,
      timeEstimate: '15m', impact: 'High' as const, completed: false,
    }] };
    const rec = aimContextService.generateDailyRecommendation(DEFAULT_PERSONAL_CONTEXT, []);
    const html = renderToStaticMarkup(<AimHomeModule
      userProfile={profile} dailyPlan={plan} startingPoint="I want to train for a new career"
      context={DEFAULT_PERSONAL_CONTEXT} projects={[]} dailyRecommendation={rec}
      onRefreshRecommendation={() => {}} onNavigateToTab={() => {}} onToast={() => {}}
    />);
    expect(html).toContain('Call the training center');
    expect(html).toContain('I want to train for a new career');
    expect(html).not.toContain('Fort Worth');
    expect(html).not.toContain('Ride Guys');
    expect(html).not.toContain('10 Projects');
  });
});

describe('onboarding draft isolation', () => {
  const entries = new Map<string, string>();
  const local = {
    get length() { return entries.size; },
    key(index: number) { return [...entries.keys()][index] || null; },
    getItem(key: string) { return entries.get(key) ?? null; },
    setItem(key: string, value: string) { entries.set(key, value); },
    removeItem(key: string) { entries.delete(key); },
  };

  beforeEach(() => {
    entries.clear();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', local);
  });
  afterAll(() => vi.unstubAllGlobals());

  it('resumes the current account without exposing the previous account’s answers', () => {
    storageService.saveCalibration({ currentState: 'Account A private situation', desiredState: '' }, 'account-a');
    expect(storageService.getCalibration('account-b')).toBeNull();
    storageService.saveCalibration({ currentState: 'Account B situation', desiredState: 'Account B goal' }, 'account-b');
    expect(storageService.getCalibration('account-a')?.currentState).toBe('Account A private situation');
    expect(storageService.getCalibration('account-b')?.desiredState).toBe('Account B goal');
    expect(storageService.getCalibration()).toBeNull();
    storageService.clearAllData();
    expect(storageService.getCalibration('account-a')).toBeNull();
    expect(storageService.getCalibration('account-b')).toBeNull();
  });

  it('keeps a failed life update draft with its own account and clears it on reset', () => {
    storageService.saveLifeUpdateDraft('account-a', 'My schedule changed');
    expect(storageService.getLifeUpdateDraft('account-b')).toBe('');
    expect(storageService.getLifeUpdateDraft('account-a')).toBe('My schedule changed');
    storageService.clearAllData();
    expect(storageService.getLifeUpdateDraft('account-a')).toBe('');
  });
});
