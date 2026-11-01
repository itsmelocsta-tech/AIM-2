import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConversationalHomeModule } from '../../src/components/modules/ConversationalHomeModule';
import { FirstRunGuide } from '../../src/components/modules/FirstRunGuide';
import { LifeUpdateModule } from '../../src/components/modules/LifeUpdateModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import '../../src/index.css';
import { voiceEngine } from '../../src/services/voiceService';
window.failVoiceCleanup = () => { voiceEngine.stopSpeaking = () => { throw new Error('Fictional audio cleanup failure'); }; };

const profile = { ...DEFAULT_PROFILE, id: 'fictional-voice-regression', onboardingCompleted: false };
const noop = () => {};
function GuideHarness() {
  const [step, setStep] = React.useState('intro');
  return <FirstRunGuide step={step} profile={{ ...profile, desiredIdentity: 'An artist with a finished book' }} dailyPlan={{ ...DEFAULT_DAILY_PLAN, priorityTasks: [{ task: 'Draw for 15 minutes tonight.', completed: false }] }} onNext={() => setStep('planner')} />;
}

const common = { userProfile: profile, dailyPlan: DEFAULT_DAILY_PLAN, goals: [], memories: [], wellnessLogs: [], onNavigateToTab: noop, onToast: noop };
createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-slate-950 text-white p-4">
  {location.search === '?guide' ? <GuideHarness /> : location.search === '?life-update'
    ? <LifeUpdateModule {...common} lifeUpdates={[]} onUpdateLifeUpdates={noop} onCommitReroute={async () => {}} onCommitLifeNote={async () => {}} />
    : <ConversationalHomeModule {...common} userId={profile.id} chatMessages={[]} onUpdateChat={noop} onCommitOnboarding={async () => {}} />}
</main>);
