import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AimAlarmClock } from '../../src/components/common/AimAlarmClock';
import { StartTaskAlarm } from '../../src/components/common/StartTaskAlarm';
import { DailyPlannerModule } from '../../src/components/modules/DailyPlannerModule';
import { scheduleRepository } from '../../src/services/repositories/scheduleRepository';
import { storageService } from '../../src/services/storage';
import { DailyPlan, PriorityTask, UserProfile } from '../../src/types';
import { getTodayDateString } from '../../src/utils/dateTimeUtils';
import '../../src/index.css';

const userId = 'playwright-alarm-user';
const timeZone = 'America/Chicago';
const profile: UserProfile = {
  id: userId,
  name: 'Sam AlarmTester',
  email: '',
  location: 'Test workspace',
  timeZone,
  desiredIdentity: 'Consistent illustrator',
  coreMission: 'Protect short practice sessions',
  currentMonthlyIncome: 0,
  targetMonthlyIncome: 0,
  primaryObstacle: 'Missing practice sessions',
  topSkills: ['Illustration'],
  coreValues: ['Consistency'],
  ninetyDayTrajectory: 'Practice consistently',
  onboardingCompleted: true,
  firstRunGuideStep: 'done',
};
const primaryTask: PriorityTask = {
  id: 'primary-practice',
  task: 'Complete the planned illustration practice',
  description: 'Open the sketchbook and complete one focused practice block.',
  category: 'Creative Projects',
  timeEstimate: '30 min',
  impact: 'High',
  completed: false,
};
const oneMinuteTask: PriorityTask = {
  id: 'one-minute-test',
  task: 'Complete a one-minute line exercise',
  description: 'Draw continuous lines for one minute.',
  category: 'Creative Projects',
  timeEstimate: '1 min',
  impact: 'Medium',
  completed: false,
};
const planDate = getTodayDateString(timeZone);
const savedPlan = storageService.getDailyPlan(planDate);
const startingPlan: DailyPlan = savedPlan.priorityTasks.length ? savedPlan : {
  date: planDate,
  theme: 'Consistent Creative Practice',
  energyLevel: 7,
  availableHours: 1,
  priorityTasks: [primaryTask, oneMinuteTask],
  timeBlocks: [],
  mindsetReminder: 'Small sessions count when they happen consistently.',
  notes: '',
};
if (!savedPlan.priorityTasks.length) storageService.saveDailyPlan(startingPlan);
// Reproduce the normal application reload path. This boundary used to delete
// an in-progress priority activity and its pending finish alarm.
scheduleRepository.syncDayFromPlan(userId, startingPlan, timeZone);

function AlarmHarness() {
  const [view, setView] = useState<'home' | 'planner'>('home');
  const [plan, setPlan] = useState(startingPlan);
  const refreshPlan = () => setPlan(storageService.getDailyPlan(planDate));
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-slate-800 px-4 py-3">
      <h1 className="text-lg font-bold">AIM Alarm Browser Test</h1>
      <nav className="mt-3 flex gap-2" aria-label="Test navigation">
        <button type="button" className="rounded-lg bg-indigo-700 px-3 py-2" onClick={() => setView('home')}>Home</button>
        <button type="button" className="rounded-lg bg-indigo-700 px-3 py-2" onClick={() => setView('planner')}>Daily Planner</button>
      </nav>
    </header>
    <AimAlarmClock userId={userId} />
    {view === 'home' ? <div className="space-y-4 p-4">
      <section data-testid="primary-task" className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h2 className="font-semibold">{primaryTask.task}</h2>
        <p className="text-xs text-slate-300">~30m</p>
        <StartTaskAlarm task={primaryTask} profile={profile} onUpdatePlan={refreshPlan} />
      </section>
      <section data-testid="one-minute-task" className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h2 className="font-semibold">{oneMinuteTask.task}</h2>
        <p className="text-xs text-slate-300">~1m</p>
        <StartTaskAlarm task={oneMinuteTask} profile={profile} onUpdatePlan={refreshPlan} />
      </section>
    </div> : <DailyPlannerModule
      dailyPlan={plan}
      userProfile={profile}
      goals={[]}
      onUpdatePlan={(next) => { storageService.saveDailyPlan(next); setPlan(next); }}
      onUpdateProfile={() => undefined}
      onToast={() => undefined}
    />}
  </main>;
}

createRoot(document.getElementById('root')!).render(<AlarmHarness />);
