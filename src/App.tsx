import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Target,
  Brain,
  Heart,
  MessageSquare,
  RefreshCw,
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
} from './types';
import { storageService } from './services/storage';
import { driveService } from './services/driveService';
import { Header } from './components/common/Header';
import { CoachShell } from './components/coach/CoachShell';
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

export default function App() {
  // Default to calm, conversational home
  const [activeTab, setActiveTab] = useState<string>('home');

  // Core Life OS State
  const [userProfile, setUserProfile] = useState<UserProfile>(storageService.getProfile());
  const [memories, setMemories] = useState<MemoryItem[]>(storageService.getMemories());
  const [goals, setGoals] = useState<Goal[]>(storageService.getGoals());
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>(storageService.getDailyPlan());
  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>(storageService.getWellnessLogs());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(storageService.getChatMessages());
  const [lifeUpdates, setLifeUpdates] = useState<LifeUpdate[]>(storageService.getLifeUpdates());

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
  };

  const handleUpdateMemories = (mems: MemoryItem[]) => {
    setMemories(mems);
    storageService.saveMemories(mems);
  };

  const handleUpdateGoals = (gls: Goal[]) => {
    setGoals(gls);
    storageService.saveGoals(gls);
  };

  const handleUpdateDailyPlan = (plan: DailyPlan) => {
    setDailyPlan(plan);
    storageService.saveDailyPlan(plan);
  };

  const handleUpdateWellnessLogs = (logs: WellnessLog[]) => {
    setWellnessLogs(logs);
    storageService.saveWellnessLogs(logs);
  };

  const handleUpdateChatMessages = (msgs: ChatMessage[]) => {
    setChatMessages(msgs);
    storageService.saveChatMessages(msgs);
  };

  const handleUpdateLifeUpdates = (updates: LifeUpdate[]) => {
    setLifeUpdates(updates);
    storageService.saveLifeUpdates(updates);
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
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'life-update', label: 'Life Update', icon: RefreshCw, count: lifeUpdates.length },
    { id: 'planner', label: 'Daily Planner', icon: Calendar, count: dailyPlan.priorityTasks.length },
    { id: 'goals', label: 'Goals', icon: Target, count: goals.length },
    { id: 'memory', label: 'Memory Vault', icon: Brain, count: memories.length },
    { id: 'wellness', label: 'Wellness', icon: Heart, count: wellnessLogs.length },
    { id: 'chat', label: 'Advisor Dialogue', icon: MessageSquare },
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unlockedSpacesCount={totalLearnedItems}
      />

      {/* Sub-Navigation Bar - Visible across spaces */}
      {activeTab !== 'home' && (
        <nav id="aim-primary-nav" className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-4 lg:px-8 py-2 sticky top-[57px] z-30 shadow-sm animate-fadeIn">
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
      )}

      {/* Main Content Area */}
      <main id="aim-main-content" className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'home' && (
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

