import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { CalmHome, CalmNavigation, CalmTour, chooseNextMove } from '../src/components/modules/CalmHome';
import { DEFAULT_DAILY_PLAN, DEFAULT_PROFILE } from '../src/services/storage';
import { getTodayDateString } from '../src/utils/dateTimeUtils';

const task = { id: 'a', task: 'Call the training center', category: 'Career' as const, timeEstimate: '15m', impact: 'High' as const, completed: false };
describe('calm home', () => {
  it('uses the first unfinished priority and never presents yesterday as today', () => {
    const plan = { ...DEFAULT_DAILY_PLAN, date: '2026-09-27', priorityTasks: [{ ...task, completed: true }, { ...task, id: 'b', task: 'Submit the application' }] };
    expect(chooseNextMove(plan, plan.date).message).toBe('Submit the application');
    expect(chooseNextMove(plan, '2026-09-28').tab).toBe('life-update');
  });
  it('offers a check-in only after actual priorities are completed', () => {
    expect(chooseNextMove({ ...DEFAULT_DAILY_PLAN, date: 'today', priorityTasks: [{ ...task, completed: true }] }, 'today').tab).toBe('check-in');
    expect(chooseNextMove({ ...DEFAULT_DAILY_PLAN, date: 'today' }, 'today').tab).toBe('life-update');
  });
  it('renders one primary action without secondary cards or fictional personalization', () => {
    const html = renderToStaticMarkup(<CalmHome profile={DEFAULT_PROFILE} plan={{ ...DEFAULT_DAILY_PLAN, date: getTodayDateString(), priorityTasks: [task] }} onNavigate={() => {}} />);
    expect(html).toContain(task.task);
    expect(html.match(/<button\b/g)).toHaveLength(1);
    for (const text of ['Fort Worth', 'Projects', 'Opportunity Scanner', 'organized everything']) expect(html).not.toContain(text);
  });
  it('exposes four stable navigation controls without counters', () => {
    const html = renderToStaticMarkup(<CalmNavigation currentTab="home" onNavigate={() => {}} guideStep="planner" />);
    expect(html.match(/<button\b/g)).toHaveLength(4);
    expect(html).toContain('aria-describedby="calm-tour-description"');
    expect(html).toContain('Talk to AIM');
    expect(html).toContain('More');
  });
  it('provides a dismissible tour and a visible save failure', () => {
    const html = renderToStaticMarkup(<CalmTour step="intro" onNext={() => {}} onDismiss={() => {}} saving={false} error="Could not save" />);
    expect(html).toContain('Skip tour');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Could not save');
  });
});
