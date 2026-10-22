import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useContextualNavigation } from '../../src/hooks/useContextualNavigation';
import { ContextualNavigation } from '../../src/components/common/ContextualNavigation';
import { CoachTabBar } from '../../src/components/coach/CoachTabBar';
import { AimDashboardModule } from '../../src/components/modules/AimDashboardModule';
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT } from '../../src/services/aimContextService';
import { publishUserMention } from '../../src/services/contextualNavigationService';
import '../../src/index.css';

const profileFor = id => JSON.parse(localStorage.getItem(`fixture-profile:${id}`) || 'null') || { ...DEFAULT_PROFILE, id, name: 'Fictional tester', onboardingCompleted: true };
function Harness() {
  const [userId, setUserId] = useState('fictional-a');
  const [profile, setProfile] = useState(() => profileFor('fictional-a'));
  const [activeTab, setActiveTab] = useState('home');
  const [text, setText] = useState('');
  const nav = useContextualNavigation({ userId, ready: true, profile, context: DEFAULT_PERSONAL_CONTEXT, projects: [], goals: [], memories: [], dailyPlan: DEFAULT_DAILY_PLAN, wellnessLogs: [],
    onUpdateProfile(next) { localStorage.setItem(`fixture-profile:${userId}`, JSON.stringify(next)); setProfile(next); } });
  return <main className="min-h-screen bg-slate-950 text-white p-3">
    <p>Fictional navigation fixture</p>
    <button onClick={() => { const id = userId === 'fictional-a' ? 'fictional-b' : 'fictional-a'; setUserId(id); setProfile(profileFor(id)); setActiveTab('home'); }}>Switch fixture account</button>
    <button onClick={() => publishUserMention('someone-else', 'Health and dating')}>Other account event</button>
    <ContextualNavigation availableModules={nav.modules} activeTab={activeTab} onNavigate={setActiveTab} />
    <CoachTabBar activeCoachId="guidance" availableCoaches={nav.coaches} onSelectCoach={() => {}} />
    <form onSubmit={event => { event.preventDefault(); nav.mention(text); setText(''); }}>
      <label>Tell AIM<input aria-label="Tell AIM" value={text} onChange={e => setText(e.target.value)} className="bg-slate-800 p-2" /></label><button type="submit">Share</button>
    </form>
    <AimDashboardModule atmosphereOwnerId={userId} availableViews={nav.spaces} availableModules={nav.modules} userProfile={profile} dailyPlan={DEFAULT_DAILY_PLAN} context={DEFAULT_PERSONAL_CONTEXT} projects={[]} onRefreshRecommendation={() => {}} onNavigateToTab={setActiveTab} onToast={() => {}} />
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
