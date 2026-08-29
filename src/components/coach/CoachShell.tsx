import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, ShieldCheck, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { CoachId, UserProfile, DailyPlan, Goal, MemoryItem, WellnessLog, LifeUpdate } from '../../types';
import { TodayHeader } from './TodayHeader';
import { CoachTabBar } from './CoachTabBar';
import { HomeScreen } from './HomeScreen';
import { CoachScreen } from './CoachScreen';
import { MonthlyCalendarModal } from './MonthlyCalendarModal';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { intelligenceService, CompactOrbContext } from '../../services/intelligenceService';

interface CoachShellProps {
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  goals: Goal[];
  memories?: MemoryItem[];
  wellnessLogs?: WellnessLog[];
  lifeUpdates?: LifeUpdate[];
  onUpdateDailyPlan?: (plan: DailyPlan) => void;
  onUpdateGoals?: (goals: Goal[]) => void;
  onUpdateMemories?: (memories: MemoryItem[]) => void;
  onUpdateLifeUpdates?: (updates: LifeUpdate[]) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenLifeUpdate: (initialText?: string) => void;
  onToast: (msg: string) => void;
}

export const CoachShell: React.FC<CoachShellProps> = ({
  userProfile,
  dailyPlan,
  goals,
  memories = [],
  wellnessLogs = [],
  lifeUpdates = [],
  onUpdateDailyPlan,
  onUpdateGoals,
  onUpdateMemories,
  onUpdateLifeUpdates,
  onUpdateProfile,
  onNavigateToTab,
  onOpenLifeUpdate,
  onToast,
}) => {
  const [activeCoachId, setActiveCoachId] = useState<CoachId>('guidance');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [compactContext, setCompactContext] = useState<CompactOrbContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [showIntelligenceBar, setShowIntelligenceBar] = useState(false);

  // Retrieve compact context for the active orb via Wisdom & Priority engines
  const loadOrbContext = async (cId: CoachId, force = false) => {
    try {
      setIsLoadingContext(true);
      const ctx = await intelligenceService.getCompactOrbContext({
        coachId: cId,
        userProfile,
        forceRefresh: force,
      });
      setCompactContext(ctx);
    } catch (err) {
      console.warn('Failed to load compact context:', err);
    } finally {
      setIsLoadingContext(false);
    }
  };

  useEffect(() => {
    loadOrbContext(activeCoachId);
  }, [activeCoachId, userProfile.desiredIdentity, userProfile.primaryObstacle]);

  return (
    <div id="aim-coach-shell" className="min-h-full flex flex-col">
      {/* 1. Sticky Today Header */}
      <TodayHeader
        userTimeZone={userProfile.timeZone}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
      />

      {/* 2. Accessible 5-Coach Tab Navigation */}
      <CoachTabBar
        activeCoachId={activeCoachId}
        onSelectCoach={(cId) => setActiveCoachId(cId)}
      />

      {/* 3. Compact Context Strip (Wisdom & Priority Intelligence Scaffolding) */}
      {compactContext && (
        <div className="px-3 sm:px-6 pt-2">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex items-center gap-1 font-semibold text-indigo-400 shrink-0">
                <Compass className="w-3.5 h-3.5" />
                <span>Priority Focus:</span>
              </span>
              <span className="text-slate-300 truncate font-medium">
                {compactContext.primaryAttentionFocus}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowIntelligenceBar((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors px-2 py-0.5 rounded-md hover:bg-slate-800"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Wisdom Lens</span>
                {showIntelligenceBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => loadOrbContext(activeCoachId, true)}
                disabled={isLoadingContext}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                title="Recalibrate intelligence context"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingContext ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded Wisdom & Priority Context Panel */}
          {showIntelligenceBar && (
            <div className="mt-1.5 p-3.5 bg-slate-900/90 border border-indigo-900/40 rounded-xl space-y-2 animate-fadeIn text-xs shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Primary Wisdom Shift:</span>
                  </div>
                  <p className="text-slate-300 pl-5 leading-relaxed">
                    {compactContext.primaryWisdomShift}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommended Micro-Win:</span>
                  </div>
                  <p className="text-slate-300 pl-5 leading-relaxed">
                    {compactContext.immediateActionForNow}
                  </p>
                </div>
              </div>

              {compactContext.relevantDomains.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Synthesized across: {compactContext.relevantDomains.map((d) => d.replace(/_/g, ' ')).join(', ')}</span>
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    {compactContext.evidenceConfidence}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Main Coach / Schedule Content Container */}
      <div className="flex-1 px-3 sm:px-6 pt-3">
        {activeCoachId === 'guidance' ? (
          <HomeScreen
            userProfile={userProfile}
            dailyPlan={dailyPlan}
            goals={goals}
            memories={memories}
            wellnessLogs={wellnessLogs}
            lifeUpdates={lifeUpdates}
            compactContext={compactContext}
            onUpdateDailyPlan={onUpdateDailyPlan}
            onUpdateGoals={onUpdateGoals}
            onUpdateMemories={onUpdateMemories}
            onUpdateLifeUpdates={onUpdateLifeUpdates}
            onUpdateProfile={onUpdateProfile}
            onNavigateToTab={onNavigateToTab}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            onOpenLifeUpdate={onOpenLifeUpdate}
            onToast={onToast}
          />
        ) : (
          <CoachScreen
            coachId={activeCoachId}
            userProfile={userProfile}
            goals={goals}
            memories={memories}
            dailyPlan={dailyPlan}
            wellnessLogs={wellnessLogs}
            lifeUpdates={lifeUpdates}
            compactContext={compactContext}
            onUpdateDailyPlan={onUpdateDailyPlan}
            onUpdateGoals={onUpdateGoals}
            onUpdateMemories={onUpdateMemories}
            onUpdateLifeUpdates={onUpdateLifeUpdates}
            onUpdateProfile={onUpdateProfile}
            onRefreshContext={() => loadOrbContext(activeCoachId, true)}
            onReturnToToday={() => setActiveCoachId('guidance')}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            onOpenLifeUpdate={onOpenLifeUpdate}
            onToast={onToast}
          />
        )}
      </div>

      {/* Modals */}
      <MonthlyCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        userId={userProfile.id || 'default_user'}
        userTimeZone={userProfile.timeZone}
        onToast={onToast}
      />

      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        onToast={onToast}
      />
    </div>
  );
};
