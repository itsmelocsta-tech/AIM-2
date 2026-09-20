import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Target,
  Brain,
  Heart,
  MessageSquare,
  RefreshCw,
  Compass,
  Layers,
  Send,
  Clock,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  UserProfile,
  MemoryItem,
  Goal,
  DailyPlan,
  WellnessLog,
  ChatMessage,
  DriveSyncState,
  LifeUpdate,
  PersonalOperatingContext,
  AIMProject,
  JobListing,
  DailyActionRecommendation,
} from './types';
import {
  storageService,
  DEFAULT_PROFILE,
  DEFAULT_MEMORIES,
  DEFAULT_GOALS,
  DEFAULT_DAILY_PLAN,
  DEFAULT_WELLNESS,
  DEFAULT_CHAT,
} from './services/storage';
import { driveService } from './services/driveService';
import { aimContextService } from './services/aimContextService';
import { jobScannerService } from './services/jobScannerService';
import { Header } from './components/common/Header';
import { CoachShell } from './components/coach/CoachShell';
import { AimHomeModule } from './components/modules/AimHomeModule';
import { OpportunityScannerModule } from './components/modules/OpportunityScannerModule';
import { MyProjectsModule } from './components/modules/MyProjectsModule';
import { CheckInModule } from './components/modules/CheckInModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { LifeUpdateModule } from './components/modules/LifeUpdateModule';
import { DailyPlannerModule } from './components/modules/DailyPlannerModule';
import { GoalManifestationModule } from './components/modules/GoalManifestationModule';
import { MemoryCategorizerModule } from './components/modules/MemoryCategorizerModule';
import { WellnessEngineModule } from './components/modules/WellnessEngineModule';
import { ChatAdvisorModule } from './components/modules/ChatAdvisorModule';
import { DriveSyncModal } from './components/modules/DriveSyncModal';
import { FoundationSessionModal } from './components/modules/FoundationSessionModal';
import { VoiceModal } from './components/common/VoiceModal';
import { GlobalQuickInput } from './components/common/GlobalQuickInput';
import { useAuth } from './context/AuthContext';
import { firestoreRepository } from './services/repositories/firestoreRepository';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const requestSignIn = () => setIsAuthModalOpen(true);
    window.addEventListener('aim:authentication-required', requestSignIn);
    return () => window.removeEventListener('aim:authentication-required', requestSignIn);
  }, []);

  // Default to calm, conversational home
  const [activeTab, setActiveTab] = useState<string>('home');

  // Core Life OS State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storageService.getMemories());
  const [goals, setGoals] = useState<Goal[]>(() => storageService.getGoals());
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>(() => storageService.getDailyPlan());
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>(() => storageService.getWellnessLogs());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => storageService.getChatMessages());
  const [lifeUpdates, setLifeUpdates] = useState<LifeUpdate[]>(() => storageService.getLifeUpdates());

  // AIM Life OS State
  const [aimContext, setAimContext] = useState<PersonalOperatingContext>(() => aimContextService.getContext());
  const [aimProjects, setAimProjects] = useState<AIMProject[]>(() => aimContextService.getProjects());
  const [homeViewMode, setHomeViewMode] = useState<'daily_os' | 'advisor'>('daily_os');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load user data from Firestore when auth state changes
  useEffect(() => {
    let isCancelled = false;
    async function loadUserData() {
      if (!user) return;
      try {
        const [remoteProfile, remoteContext, remoteProjects, remoteGoals, remoteMemories, remoteWellness, remoteLifeUpdates, remotePlan] = await Promise.all([
          firestoreRepository.getUserProfile(user.uid),
          firestoreRepository.getUserContext(user.uid),
          firestoreRepository.getUserProjects(user.uid),
          firestoreRepository.getUserGoals(user.uid),
          firestoreRepository.getUserMemories(user.uid),
          firestoreRepository.getUserWellness(user.uid),
          firestoreRepository.getUserLifeUpdates(user.uid),
          firestoreRepository.getUserDailyPlan(user.uid, new Date().toISOString().split('T')[0]),
        ]);

        if (isCancelled) return;

        if (remoteProfile) {
          setUserProfile(remoteProfile);
          storageService.saveProfile(remoteProfile);
        } else {
          // Initialize fresh profile for this user
          const initialProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || (user.isAnonymous ? 'Guest User' : user.email?.split('@')[0] || 'AIM User'),
            email: user.email || '',
            location: '',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
            desiredIdentity: '',
            coreMission: '',
            currentMonthlyIncome: 0,
            targetMonthlyIncome: 0,
            primaryObstacle: '',
            topSkills: [],
            coreValues: [],
            ninetyDayTrajectory: '',
            onboardingCompleted: false,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(initialProfile);
          storageService.saveProfile(initialProfile);
          await firestoreRepository.saveUserProfile(user.uid, initialProfile);
        }

        if (remoteContext) {
          setAimContext(remoteContext);
          aimContextService.saveContext(remoteContext);
        }
        if (remoteProjects && remoteProjects.length > 0) {
          setAimProjects(remoteProjects);
          aimContextService.saveProjects(remoteProjects);
        }
        if (remoteGoals && remoteGoals.length > 0) {
          setGoals(remoteGoals);
          storageService.saveGoals(remoteGoals);
        }
        if (remoteMemories && remoteMemories.length > 0) {
          setMemories(remoteMemories);
          storageService.saveMemories(remoteMemories);
        }
        if (remoteWellness && remoteWellness.length > 0) {
          setWellnessLogs(remoteWellness);
          storageService.saveWellnessLogs(remoteWellness);
        }
        if (remoteLifeUpdates && remoteLifeUpdates.length > 0) {
          setLifeUpdates(remoteLifeUpdates);
          storageService.saveLifeUpdates(remoteLifeUpdates);
        }
        if (remotePlan) {
          setDailyPlan(remotePlan);
          storageService.saveDailyPlan(remotePlan);
        }
      } catch (err) {
        console.warn('[App] Error syncing remote user data:', err);
      }
    }

    loadUserData();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const topJobMatch = jobScannerService.getListings().find((j) => j.fitRating === 'strong_fit') || null;
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyActionRecommendation>(() =>
    aimContextService.generateDailyRecommendation(aimContext, aimProjects, topJobMatch)
  );

  const handleUpdateAimContext = (updated: PersonalOperatingContext) => {
    setAimContext(updated);
    aimContextService.saveContext(updated);
    if (user?.uid) {
      firestoreRepository.saveUserContext(user.uid, updated).catch(console.warn);
    }
    setDailyRecommendation(aimContextService.generateDailyRecommendation(updated, aimProjects, topJobMatch));
  };

  const handleUpdateAimProjects = (updated: AIMProject[]) => {
    setAimProjects(updated);
    aimContextService.saveProjects(updated);
    if (user?.uid) {
      firestoreRepository.saveUserProjects(user.uid, updated).catch(console.warn);
    }
    setDailyRecommendation(aimContextService.generateDailyRecommendation(aimContext, updated, topJobMatch));
  };

  const handleUpdateSingleProject = (updatedProj: AIMProject) => {
    const updated = aimProjects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    handleUpdateAimProjects(updated);
  };

  const handleCreateAimProject = (newProj: AIMProject) => {
    const updated = [...aimProjects, newProj];
    handleUpdateAimProjects(updated);
  };

  const handleRefreshRecommendation = () => {
    const freshTopJob = jobScannerService.getListings().find((j) => j.fitRating === 'strong_fit') || null;
    const freshRec = aimContextService.generateDailyRecommendation(aimContext, aimProjects, freshTopJob);
    setDailyRecommendation(freshRec);
  };

  const handleJobApplied = (job: JobListing) => {
    const immIncome = aimProjects.find((p) => p.id === 'proj-immediate-income');
    if (immIncome) {
      const updatedImm = {
        ...immIncome,
        lastCompletedAction: `Applied to ${job.employer} (${job.role})`,
        whatChanged: `Submitted application to ${job.employer} via official portal.`,
        lastUpdated: new Date().toISOString(),
      };
      handleUpdateSingleProject(updatedImm);
    }
  };

  // Drive state
  const [driveState, setDriveState] = useState<Partial<DriveSyncState>>(driveService.getStoredState());

  // Modals state
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFoundationModalOpen, setIsFoundationModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // State Persistence handlers
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    storageService.saveProfile(profile);
    if (user?.uid) {
      firestoreRepository.saveUserProfile(user.uid, profile).catch(console.warn);
    }
  };

  const handleUpdateMemories = (mems: MemoryItem[]) => {
    setMemories(mems);
    storageService.saveMemories(mems);
    if (user?.uid) {
      firestoreRepository.saveUserMemories(user.uid, mems).catch(console.warn);
    }
  };

  const handleUpdateGoals = (gls: Goal[]) => {
    setGoals(gls);
    storageService.saveGoals(gls);
    if (user?.uid) {
      firestoreRepository.saveUserGoals(user.uid, gls).catch(console.warn);
    }
  };

  const handleUpdateDailyPlan = (plan: DailyPlan) => {
    setDailyPlan(plan);
    storageService.saveDailyPlan(plan);
    if (user?.uid) {
      firestoreRepository.saveUserDailyPlan(user.uid, plan).catch(console.warn);
    }
  };

  const handleUpdateWellnessLogs = (logs: WellnessLog[]) => {
    setWellnessLogs(logs);
    storageService.saveWellnessLogs(logs);
    if (user?.uid) {
      firestoreRepository.saveUserWellness(user.uid, logs).catch(console.warn);
    }
  };

  const handleUpdateChatMessages = (msgs: ChatMessage[]) => {
    setChatMessages(msgs);
    storageService.saveChatMessages(msgs);
  };

  const handleUpdateLifeUpdates = (updates: LifeUpdate[]) => {
    setLifeUpdates(updates);
    storageService.saveLifeUpdates(updates);
    if (user?.uid) {
      firestoreRepository.saveUserLifeUpdates(user.uid, updates).catch(console.warn);
    }
  };

  // Full reset for new user testing
  const handleResetAllData = async () => {
    if (user?.uid) {
      await firestoreRepository.deleteAllUserData(user.uid).catch(console.warn);
    }
    storageService.clearAllData();
    localStorage.removeItem('aim_personal_context');
    localStorage.removeItem('aim_projects_data');
    localStorage.removeItem('aim_job_listings');
    localStorage.removeItem('aim_job_scan_runs');
    setUserProfile({ ...DEFAULT_PROFILE });
    setMemories([...DEFAULT_MEMORIES]);
    setGoals([...DEFAULT_GOALS]);
    setDailyPlan({ ...DEFAULT_DAILY_PLAN, date: new Date().toISOString().split('T')[0] });
    setWellnessLogs([...DEFAULT_WELLNESS]);
    setChatMessages([...DEFAULT_CHAT]);
    setLifeUpdates([]);
    setAimContext(aimContextService.getContext());
    setAimProjects(aimContextService.getProjects());
    setDriveState({
      isConnected: false,
      accessToken: null,
      userEmail: null,
      lastSyncTime: null,
      syncedFiles: [],
    });
    setActiveTab('home');
    showToast('All data reset to a clean baseline.');
  };

  // Quick Action Handler from Chat
  const handleQuickAction = (actionType: string, payload?: any) => {
    if (actionType === 'start_plan') {
      setActiveTab('planner');
      showToast('Switched to Daily Planner!');
    } else if (actionType === 'life_update') {
      setActiveTab('life-update');
      showToast('Switched to Life Update!');
    } else if (actionType === 'add_memory') {
      setIsDriveModalOpen(true);
    } else if (actionType === 'create_task') {
      const newTask = {
        id: 'pt-' + Date.now(),
        task: typeof payload === 'string' ? payload.substring(0, 60) : 'Execute strategic step',
        category: 'Personal' as const,
        timeEstimate: '45m',
        impact: 'High' as const,
        completed: false,
      };
      const updatedPlan = {
        ...dailyPlan,
        priorityTasks: [...dailyPlan.priorityTasks, newTask],
      };
      handleUpdateDailyPlan(updatedPlan);
      showToast('Task added to Today’s Priority Plan!');
    }
  };

  const navigationTabs = [
    { id: 'home', label: 'Today (Life OS)', icon: Sparkles },
    { id: 'scanner', label: 'Opportunity Scanner', icon: Compass },
    { id: 'projects', label: '10 Projects', icon: Layers, count: aimProjects.length },
    { id: 'check-in', label: 'Check-In', icon: Send },
    { id: 'history', label: 'Audit History', icon: Clock },
    { id: 'settings', label: 'OS Context', icon: Sliders },
    { id: 'planner', label: 'Daily Planner', icon: Calendar, count: dailyPlan.priorityTasks.length },
    { id: 'goals', label: 'Goals', icon: Target, count: goals.length },
    { id: 'memory', label: 'Memory Vault', icon: Brain, count: memories.length },
    { id: 'wellness', label: 'Wellness', icon: Heart, count: wellnessLogs.length },
    { id: 'chat', label: 'Advisor Orbs', icon: MessageSquare },
  ];

  const totalLearnedItems =
    memories.length +
    goals.length +
    dailyPlan.priorityTasks.length +
    wellnessLogs.length +
    lifeUpdates.length;

  return (
    <div id="aim-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Minimal Header with Live Weather & Time */}
      <Header
        userProfile={userProfile}
        driveState={driveState}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenFoundationModal={() => setIsFoundationModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isAuthenticated={Boolean(user)}
        userEmail={user?.email || (user?.isAnonymous ? 'Guest Account' : null)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unlockedSpacesCount={totalLearnedItems}
      />

      {/* Sub-Navigation Bar - Always accessible across all spaces */}
      <nav id="aim-primary-nav" className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-3 sm:px-4 lg:px-8 py-2 sticky top-[57px] z-30 shadow-sm animate-fadeIn">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 font-bold border border-indigo-800">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="aim-main-content" className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 max-w-sm mx-auto mb-2">
              <button
                id="home-view-daily-os-btn"
                onClick={() => setHomeViewMode('daily_os')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  homeViewMode === 'daily_os'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today's Life OS
              </button>
              <button
                id="home-view-advisor-btn"
                onClick={() => setHomeViewMode('advisor')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  homeViewMode === 'advisor'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Advisor Sanctuary
              </button>
            </div>

            {homeViewMode === 'daily_os' ? (
              <AimHomeModule
                context={aimContext}
                projects={aimProjects}
                topJobMatch={topJobMatch}
                dailyRecommendation={dailyRecommendation}
                onRefreshRecommendation={handleRefreshRecommendation}
                onNavigateToTab={setActiveTab}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  setActiveTab('projects');
                }}
                onToast={showToast}
              />
            ) : (
              <CoachShell
                userProfile={userProfile}
                dailyPlan={dailyPlan}
                goals={goals}
                memories={memories}
                wellnessLogs={wellnessLogs}
                lifeUpdates={lifeUpdates}
                onUpdateDailyPlan={handleUpdateDailyPlan}
                onUpdateGoals={handleUpdateGoals}
                onUpdateMemories={handleUpdateMemories}
                onUpdateLifeUpdates={handleUpdateLifeUpdates}
                onUpdateProfile={handleUpdateProfile}
                onNavigateToTab={setActiveTab}
                onOpenLifeUpdate={(initialText) => {
                  setActiveTab('life-update');
                }}
                onToast={showToast}
              />
            )}
          </div>
        )}

        {activeTab === 'scanner' && (
          <OpportunityScannerModule
            context={aimContext}
            onJobApplied={handleJobApplied}
            onToast={showToast}
          />
        )}

        {activeTab === 'projects' && (
          <MyProjectsModule
            projects={aimProjects}
            selectedProjectId={selectedProjectId}
            onUpdateProject={handleUpdateSingleProject}
            onCreateProject={handleCreateAimProject}
            onToast={showToast}
          />
        )}

        {activeTab === 'check-in' && (
          <CheckInModule
            context={aimContext}
            projects={aimProjects}
            onApplyContextUpdate={handleUpdateAimContext}
            onApplyProjectUpdate={handleUpdateAimProjects}
            onToast={showToast}
            onNavigateToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryModule
            context={aimContext}
            projects={aimProjects}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModule
            context={aimContext}
            projects={aimProjects}
            onUpdateContext={handleUpdateAimContext}
            onToast={showToast}
          />
        )}

        {activeTab === 'life-update' && (
          <LifeUpdateModule
            userProfile={userProfile}
            dailyPlan={dailyPlan}
            goals={goals}
            memories={memories}
            wellnessLogs={wellnessLogs}
            lifeUpdates={lifeUpdates}
            onUpdateLifeUpdates={handleUpdateLifeUpdates}
            onUpdateDailyPlan={handleUpdateDailyPlan}
            onUpdateGoals={handleUpdateGoals}
            onUpdateProfile={handleUpdateProfile}
            onUpdateMemories={handleUpdateMemories}
            onNavigateToTab={setActiveTab}
            onToast={showToast}
          />
        )}

        {activeTab === 'planner' && (
          <DailyPlannerModule
            dailyPlan={dailyPlan}
            userProfile={userProfile}
            goals={goals}
            onUpdatePlan={handleUpdateDailyPlan}
            onToast={showToast}
          />
        )}

        {activeTab === 'goals' && (
          <GoalManifestationModule
            goals={goals}
            userProfile={userProfile}
            onUpdateGoals={handleUpdateGoals}
            onToast={showToast}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryCategorizerModule
            memories={memories}
            onUpdateMemories={handleUpdateMemories}
            onToast={showToast}
          />
        )}

        {activeTab === 'wellness' && (
          <WellnessEngineModule
            wellnessLogs={wellnessLogs}
            onUpdateLogs={handleUpdateWellnessLogs}
            onToast={showToast}
          />
        )}

        {activeTab === 'chat' && (
          <ChatAdvisorModule
            chatMessages={chatMessages}
            userProfile={userProfile}
            goals={goals}
            memories={memories}
            dailyPlan={dailyPlan}
            wellnessLogs={wellnessLogs}
            lifeUpdates={lifeUpdates}
            onUpdateChat={handleUpdateChatMessages}
            onQuickAction={handleQuickAction}
            onToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        driveState={driveState}
        userProfile={userProfile}
        goals={goals}
        dailyPlan={dailyPlan}
        memories={memories}
        onUpdateDriveState={setDriveState}
        onToast={showToast}
      />

      <FoundationSessionModal
        isOpen={isFoundationModalOpen}
        onClose={() => setIsFoundationModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleUpdateProfile}
        onResetAllData={handleResetAllData}
        onToast={showToast}
      />

      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        userProfile={userProfile}
        chatMessages={chatMessages}
        goals={goals}
        memories={memories}
        dailyPlan={dailyPlan}
        wellnessLogs={wellnessLogs}
        lifeUpdates={lifeUpdates}
        onAddChatMessage={(msg) => handleUpdateChatMessages([...chatMessages, msg])}
        onToast={showToast}
      />

      <GlobalQuickInput
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSaveMemory={(mem) => handleUpdateMemories([mem, ...memories])}
        onSaveTask={(task) =>
          handleUpdateDailyPlan({
            ...dailyPlan,
            priorityTasks: [...dailyPlan.priorityTasks, task],
          })
        }
        onToast={showToast}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Toast Alert Pill */}
      {toastMessage && (
        <div
          id="aim-toast-alert"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

