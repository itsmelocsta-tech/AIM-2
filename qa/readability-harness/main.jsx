import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VoiceModal } from '../../src/components/common/VoiceModal';
import { ConversationalHomeModule } from '../../src/components/modules/ConversationalHomeModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import '../../src/index.css';
const reply = ('Here is a clear, practical response you can read at your own pace. Choose one useful action, make room for it today, and review what happened.\n\n').repeat(10) +
  'Long text also wraps: ' + 'ExampleLongWord'.repeat(18) + '\n\nEND OF REPLY';
const profile = { ...DEFAULT_PROFILE, id: 'fictional-readability', name: 'Test reader', onboardingCompleted: true };
function Harness() {
  const [messages, setMessages] = useState([{ id: 'fixture', role: 'aim', content: reply, timestamp: '2026-10-31T12:00:00Z' }]);
  return <main className="min-h-screen bg-slate-950 text-white">
    {location.search === '?modal'
      ? <VoiceModal isOpen onClose={() => {}} userProfile={profile} onAddChatMessage={message => setMessages(all => [...all, message])} onToast={() => {}} />
      : <ConversationalHomeModule userId={profile.id} userProfile={profile} dailyPlan={DEFAULT_DAILY_PLAN}
          goals={[]} memories={[]} wellnessLogs={[]} chatMessages={messages} onUpdateChat={setMessages}
          onCommitOnboarding={async () => {}} onNavigateToTab={() => {}} onToast={() => {}} />}
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
