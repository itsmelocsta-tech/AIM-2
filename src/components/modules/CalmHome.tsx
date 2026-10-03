import React, { useEffect, useRef, useState } from 'react';
import { DailyPlan, UserProfile } from '../../types';
import { AimOrbCanvas } from '../common/AimOrbCanvas';
import { getEffectiveTimeZone, getTodayDateString } from '../../utils/dateTimeUtils';

export function chooseNextMove(plan: DailyPlan, today: string) {
  const task = plan.date === today ? plan.priorityTasks.find(item => !item.completed) : undefined;
  if (task) return { message: task.task, label: 'Take the next step', tab: 'planner' };
  if (plan.date === today && plan.priorityTasks.length > 0) return {
    message: 'Your saved priorities are complete. Take a moment to check in.', label: 'Check in', tab: 'check-in',
  };
  return { message: 'Tell me what matters today. We’ll find a place to start.', label: 'Let’s make a plan', tab: 'life-update' };
}

export function CalmHome({ profile, plan, onNavigate }: { profile: UserProfile; plan: DailyPlan; onNavigate: (tab: string) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: getEffectiveTimeZone(profile.timeZone), hour: 'numeric', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile.name && !['AIM User', 'Guest User'].includes(profile.name) ? `, ${profile.name.split(' ')[0]}` : '';
  const move = chooseNextMove(plan, getTodayDateString(profile.timeZone));
  return <section id="calm-today" className="max-w-lg mx-auto text-center py-5 sm:py-9 space-y-5" aria-labelledby="calm-heading">
    <AimOrbCanvas size={140} className="mx-auto" onClick={() => onNavigate('life-update')} />
    <h1 id="calm-heading" className="text-2xl sm:text-3xl font-semibold break-words">{greeting}{name}.</h1>
    <p className="text-slate-300 text-lg leading-relaxed break-words" data-testid="next-move">{move.message}</p>
    <button id="calm-next-action" className="min-h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-semibold" onClick={() => onNavigate(move.tab)}>{move.label}</button>
  </section>;
}

const navigation = [{ id: 'home', label: 'Today' }, { id: 'life-update', label: 'Talk to AIM' }, { id: 'check-in', label: 'Check-in' }, { id: 'more', label: 'More' }];
export function CalmNavigation({ currentTab, onNavigate, guideStep }: { currentTab: string; onNavigate: (tab: string) => void; guideStep?: string }) {
  const target = guideStep === 'intro' ? 'home' : guideStep === 'planner' ? 'life-update' : guideStep === 'check-in' ? 'check-in' : '';
  return <nav id="aim-primary-nav" aria-label="Main navigation" className="calm-navigation grid grid-cols-4 gap-1 p-2 max-w-xl w-full mx-auto">
    {navigation.map(tab => <button id={`nav-tab-${tab.id}`} key={tab.id} onClick={() => onNavigate(tab.id)} aria-current={currentTab === tab.id ? 'page' : undefined}
      aria-describedby={target === tab.id ? 'calm-tour-description' : undefined}
      className={`min-h-12 rounded-xl px-1 text-sm ${currentTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-300'} ${target === tab.id ? 'ring-2 ring-indigo-300 bg-indigo-950' : ''}`}>{tab.label}</button>)}
  </nav>;
}

export function CalmTour({ step, onNext, onDismiss, saving, error }: { step: string; onNext: () => void; onDismiss: () => void; saving: boolean; error: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const content = step === 'intro' ? { title: 'This is Today.', text: 'I’ll keep your next move here. One thing at a time.', number: 1 }
    : step === 'planner' ? { title: 'Talk to AIM.', text: 'When something changes, tell me here by typing or speaking. We’ll review an adjusted plan together.', number: 2 }
    : { title: 'Your check-in.', text: 'Tell me what worked and what got in the way. You can come back whenever you need.', number: 3 };
  return <section aria-labelledby="calm-tour-heading" className="max-w-lg mx-auto border border-indigo-400/50 rounded-2xl p-5 space-y-3">
    <p className="text-sm text-indigo-200">Getting started · {content.number} of 3</p>
    <h2 ref={heading} tabIndex={-1} id="calm-tour-heading" className="text-xl font-semibold">{content.title}</h2>
    <p id="calm-tour-description" className="text-slate-300 leading-relaxed">{content.text}</p>
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button className="min-h-11 rounded-xl px-5 bg-indigo-600" onClick={onNext} disabled={saving}>{saving ? 'Saving…' : step === 'check-in' ? 'Ready' : 'Next'}</button>
      <button className="min-h-11 px-3 text-slate-300" onClick={onDismiss} disabled={saving}>Skip tour</button>
    </div>
  </section>;
}
