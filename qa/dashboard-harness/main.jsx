import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AimDashboardModule } from '../../src/components/modules/AimDashboardModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT } from '../../src/services/aimContextService';
import '../../src/index.css';

function Fixture() {
  const [owner, setOwner] = useState('fictional-A');
  const [destination, setDestination] = useState('home');
  const [finished, setFinished] = useState(false);
  const [lifeUpdates, setLifeUpdates] = useState([]);
  const plan = { ...DEFAULT_DAILY_PLAN, priorityTasks: [
    { id: 'fixture-1', task: 'Outline a short story', completed: true, impact: 'high', timeEstimate: '20m' },
    { id: 'fixture-2', task: 'Draft the opening page', completed: finished, impact: 'high', timeEstimate: '30m' },
  ] };
  return <main className="min-h-screen bg-slate-950 text-white p-3"><div className="max-w-6xl mx-auto">
    <p>Fictional component fixture</p><button onClick={() => setOwner(owner === 'fictional-A' ? 'fictional-B' : 'fictional-A')}>Switch fixture account</button><button onClick={() => setFinished(true)}>Complete fixture task</button><button onClick={() => setLifeUpdates([{ id: 'fixture-change', userId: owner, createdAt: '2026-10-28T12:00:00.000Z', updatedAt: '2026-10-28T12:00:00.000Z', inputType: 'text', originalContent: 'My work shift moved earlier.', confirmedSummary: 'The work shift moved two hours earlier.', categories: ['Schedule'], affectedGoalIds: [], affectedTaskIds: ['fixture-2'], affectedPlanIds: ['today'], urgency: 'medium', userConfirmed: true, planChangeRequested: true, rerouteStatus: 'pending' }])}>Apply fixture life change</button><output aria-label="Navigation destination">{destination}</output>
    <AimDashboardModule atmosphereOwnerId={owner} availableViews={['crystal-lab', 'atmosphere']} userProfile={{ ...DEFAULT_PROFILE, name: 'Taylor', onboardingCompleted: true, coreMission: 'Finish a short story' }} dailyPlan={plan} lifeUpdates={lifeUpdates} context={DEFAULT_PERSONAL_CONTEXT} projects={[]}
      onRefreshRecommendation={() => {}} onNavigateToTab={setDestination} onToast={() => {}} />
  </div></main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
