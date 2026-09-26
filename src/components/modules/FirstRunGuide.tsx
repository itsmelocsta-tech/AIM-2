import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AimOrbCanvas } from '../common/AimOrbCanvas';
import { DailyPlan, UserProfile } from '../../types';

type GuideStep = 'intro' | 'planner' | 'check-in';

interface FirstRunGuideProps {
  step: GuideStep;
  profile: UserProfile;
  dailyPlan: DailyPlan;
  onNext: () => void;
}

/** One short instruction at a time, on the page where the person can use it. */
export const FirstRunGuide: React.FC<FirstRunGuideProps> = ({ step, profile, dailyPlan, onNext }) => {
  const firstTask = dailyPlan.priorityTasks.find((task) => !task.completed)?.task;
  const content = {
    intro: {
      number: 1,
      heading: 'Your starting point is ready.',
      message: profile.desiredIdentity
        ? `You said you want to become: ${profile.desiredIdentity}`
        : 'We can build from what you shared, one step at a time.',
      detail: firstTask ? `A first step for today: ${firstTask}` : 'Next, we’ll look at your plan for today.',
      action: 'Show me today’s plan',
    },
    planner: {
      number: 2,
      heading: 'Here’s your plan for today.',
      message: firstTask ? `Start with one step: ${firstTask}` : 'Your plan is ready for a first task when you are.',
      detail: 'You can change a task here as your day changes.',
      action: 'Show me how to update AIM',
    },
    'check-in': {
      number: 3,
      heading: 'Plans can change. Tell AIM what happened.',
      message: 'Use this check-in when you finish something, get stuck, or your priorities change.',
      detail: 'You can return here any time. For now, you’re ready to use AIM.',
      action: 'Finish and go to Today',
    },
  }[step];

  return (
    <section
      id={`aim-first-run-${step}`}
      aria-labelledby="aim-first-run-heading"
      className={`mx-auto w-full rounded-2xl border border-indigo-700/50 bg-slate-900 p-5 sm:p-7 text-center shadow-lg ${step === 'intro' ? 'max-w-2xl mt-8' : 'mb-5'}`}
    >
      {step === 'intro' && <AimOrbCanvas size={110} className="mx-auto" />}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300 mb-3">
        <Sparkles className="w-4 h-4" />
        <span>Getting started · {content.number} of 3</span>
      </div>
      <h1 id="aim-first-run-heading" className="text-xl sm:text-2xl font-bold text-white">{content.heading}</h1>
      <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-200 break-words">{content.message}</p>
      <p className="mt-2 text-sm text-slate-400 break-words">{content.detail}</p>
      <button
        id={`aim-first-run-next-${step}`}
        type="button"
        onClick={onNext}
        className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
      >
        {content.action} <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
};
