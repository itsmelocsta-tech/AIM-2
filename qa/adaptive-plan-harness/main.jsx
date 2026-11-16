import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DailyPlannerModule } from '../../src/components/modules/DailyPlannerModule';
import { LifeUpdateModule } from '../../src/components/modules/LifeUpdateModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import '../../src/index.css';
const profile = { ...DEFAULT_PROFILE, id: 'fictional-planning', onboardingCompleted: true };
const initial = { ...DEFAULT_DAILY_PLAN, availableHours: 2, priorityTasks: [{ id: 'done', task: 'Send the draft', category: 'Personal', timeEstimate: '15m', impact: 'High', completed: true }], timeBlocks: [{ id: 'family', time: '16:00 - 17:00', title: 'Family time', details: 'A retained commitment', completed: false }] };
function Harness() {
  const [plan, setPlan] = useState(() => JSON.parse(localStorage.getItem('fictional-safe-plan') || 'null') || initial);
  const [toast, setToast] = useState('');
  const save = next => { localStorage.setItem('fictional-safe-plan', JSON.stringify(next)); setPlan(next); };
  const reroute = new URLSearchParams(location.search).has('reroute');
  return <main className="bg-slate-950 text-white min-h-screen p-3">
    <p>Fictional local persistence; real production components. AI and authentication are fixtures.</p>
    <output aria-label="Plan notification">{toast}</output>
    {reroute ? <LifeUpdateModule userProfile={profile} dailyPlan={plan} goals={[]} wellnessLogs={[]} lifeUpdates={[]}
      onUpdateLifeUpdates={() => {}} onCommitReroute={async data => save(data.plan)} onCommitLifeNote={async () => {}}
      onNavigateToTab={() => {}} onToast={setToast}/> :
      <DailyPlannerModule dailyPlan={plan} userProfile={profile} goals={[]} onUpdatePlan={save} onUpdateProfile={() => {}} onToast={setToast}/>}
    <output aria-label="Saved plan state">{JSON.stringify(plan)}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
