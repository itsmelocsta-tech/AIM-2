import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConversationalHomeModule } from '../../src/components/modules/ConversationalHomeModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN, storageService } from '../../src/services/storage';
import '../../src/index.css';
const userId = 'fictional-copy-review';
const key = 'fictional-plan-copy-commit';
if (!storageService.getCalibration(userId)) storageService.saveCalibration({
  currentState: 'I want to make more time to draw.', changesWanted: 'Practice after work.', desiredState: 'Finish my art book.',
  result: {
    analysis: { coreGapSummary: 'You want to draw more, but finding time has been hard.', hiddenStrengths: ['You enjoy drawing.'], primaryBottlenecks: ['Not enough free time.'], empoweringInsight: 'A short practice each day can help.' },
    recommendedOptionId: 'option-2', recommendedReason: 'A routine fits your time after work.',
    pathways: [
      ['Rapid Momentum & Quick-Win Sprint', 'Immediate high-leverage action to break inertia and generate fast proof in 7 days', 'Fast / Immediate'],
      ['Systematic Foundation & Compounding Engine', 'Restructure daily rhythms, core skills, and repeatable systems for sustainable growth', 'Balanced & Scalable'],
      ['Total Identity Shift & Bold Leap', 'High-conviction transformation: cutting low-leverage anchors and stepping directly into the target standard', 'Intensive & Transformative'],
    ].map(([title, tagline, pace], i) => ({ id: `option-${i+1}`, title, tagline, pace, focus: 'Draw after work.', whyItFits: 'It fits the time you have after work.', actionPlan48h: ['Draw for 15 minutes tonight.'], first7DaysMilestones: ['Finish one drawing.'], obstaclesNeutralized: ['Finding time to draw.'], projected30DayOutcome: 'Work toward a few finished pages.' })),
    synthesizedProfile: { desiredIdentity: 'An artist with a finished book', coreMission: 'Finish my art book.', primaryObstacle: 'Finding time.', topSkills: ['Drawing'], coreValues: ['Art'], ninetyDayTrajectory: 'Finish ten pages.' },
    suggestedInitialGoals: [{ title: 'Finish one page', category: 'Personal', why: 'I want to finish my book.', milestones: ['Finish a sketch'] }],
    suggestedTodayTasks: [{ task: 'Draw for 15 minutes tonight.', category: 'Personal', timeEstimate: '15m', impact: 'High' }],
  },
}, userId);
function Harness() {
  const saved = JSON.parse(localStorage.getItem(key) || 'null');
  const [profile, setProfile] = useState(saved?.profile || { ...DEFAULT_PROFILE, id: userId });
  const [plan, setPlan] = useState(saved?.plan || DEFAULT_DAILY_PLAN);
  const [chat, setChat] = useState(saved?.chat || []);
  return <main className="min-h-screen bg-slate-950 text-white">
    <ConversationalHomeModule userId={userId} userProfile={profile} dailyPlan={plan} goals={[]} memories={[]} wellnessLogs={[]} chatMessages={chat}
      onCommitOnboarding={async data => { localStorage.setItem(key, JSON.stringify(data)); setProfile(data.profile); setPlan(data.plan); }}
      onUpdateChat={messages => { setChat(messages); const data = JSON.parse(localStorage.getItem(key)); localStorage.setItem(key, JSON.stringify({ ...data, chat: messages })); }}
      onToast={()=>{}} onNavigateToTab={()=>{}} />
    {profile.onboardingCompleted && <section aria-label="Saved plan"><h2>Your saved plan</h2><p>{plan.theme}</p><p>{plan.priorityTasks[0]?.task}</p><p>{chat.at(-1)?.content}</p></section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
