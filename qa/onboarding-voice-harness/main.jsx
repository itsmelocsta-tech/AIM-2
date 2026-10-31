import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConversationalHomeModule } from '../../src/components/modules/ConversationalHomeModule';
import { LifeUpdateModule } from '../../src/components/modules/LifeUpdateModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import '../../src/index.css';
import { voiceEngine } from '../../src/services/voiceService';
window.failVoiceCleanup = () => { voiceEngine.stopSpeaking = () => { throw new Error('Fictional audio cleanup failure'); }; };

const profile = { ...DEFAULT_PROFILE, id: 'fictional-voice-regression', onboardingCompleted: false };
const noop = () => {};
const common = { userProfile: profile, dailyPlan: DEFAULT_DAILY_PLAN, goals: [], memories: [], wellnessLogs: [], onNavigateToTab: noop, onToast: noop };
createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-slate-950 text-white p-4">
  {location.search === '?life-update'
    ? <LifeUpdateModule {...common} lifeUpdates={[]} onUpdateLifeUpdates={noop} onCommitReroute={async () => {}} onCommitLifeNote={async () => {}} />
    : <ConversationalHomeModule {...common} userId={profile.id} chatMessages={[]} onUpdateChat={noop} onCommitOnboarding={async () => {}} />}
</main>);
