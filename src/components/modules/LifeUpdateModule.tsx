import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Download,
  Shield,
  HelpCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Tag,
  Target,
  Zap,
} from 'lucide-react';
import {
  LifeUpdate,
  LifeUpdateAnalysisResult,
  UserProfile,
  DailyPlan,
  Goal,
  MemoryItem,
  WellnessLog,
} from '../../types';
import { api } from '../../services/api';
import { voiceEngine } from '../../services/voiceService';

interface LifeUpdateModuleProps {
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  goals: Goal[];
  memories: MemoryItem[];
  wellnessLogs: WellnessLog[];
  lifeUpdates: LifeUpdate[];
  onUpdateLifeUpdates: (updates: LifeUpdate[]) => void;
  onUpdateDailyPlan: (plan: DailyPlan) => void;
  onUpdateGoals: (goals: Goal[]) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateMemories: (memories: MemoryItem[]) => void;
  onNavigateToTab: (tab: string) => void;
  onToast: (msg: string) => void;
}

export const LifeUpdateModule: React.FC<LifeUpdateModuleProps> = ({
  userProfile,
  dailyPlan,
  goals,
  memories,
  wellnessLogs,
  lifeUpdates,
  onUpdateLifeUpdates,
  onUpdateDailyPlan,
  onUpdateGoals,
  onUpdateProfile,
  onUpdateMemories,
  onNavigateToTab,
  onToast,
}) => {
  // Input State
  const [updateText, setUpdateText] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  // Flow State: 'input' | 'analyzing' | 'confirming' | 'rerouted_summary' | 'failed'
  const [flowState, setFlowState] = useState<
    'input' | 'analyzing' | 'confirming' | 'rerouted_summary' | 'failed'
  >('input');

  // Analysis / Confirmation Data
  const [currentAnalysis, setCurrentAnalysis] = useState<LifeUpdateAnalysisResult | null>(null);
  const [editingUnderstoodPoints, setEditingUnderstoodPoints] = useState<string[]>([]);
  const [isEditingUnderstanding, setIsEditingUnderstanding] = useState(false);
  const [pendingUpdateRecord, setPendingUpdateRecord] = useState<LifeUpdate | null>(null);
  const [rerouteError, setRerouteError] = useState<string | null>(null);

  // Edit / Revision Modal State for Existing Updates
  const [editingUpdate, setEditingUpdate] = useState<LifeUpdate | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter & Privacy toggle
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Clean up voice on unmount
  useEffect(() => {
    return () => {
      if (voiceEngine.getIsListening()) {
        voiceEngine.stopListening();
      }
    };
  }, []);

  // Handle Voice Dictation Toggle
  const handleToggleVoice = () => {
    setMicErrorMessage(null);

    if (isVoiceListening) {
      voiceEngine.stopListening();
      setIsVoiceListening(false);
      return;
    }

    const started = voiceEngine.startListening(
      (fullText) => {
        setVoiceTranscript(fullText);
        setUpdateText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${fullText}` : fullText;
        });
      },
      (listening) => {
        setIsVoiceListening(listening);
      }
    );

    if (started) {
      setIsVoiceListening(true);
    } else {
      setMicErrorMessage('Voice dictation is unavailable in this browser. Please type below.');
    }
  };

  // Submit Life Update for GPS Analysis
  const handleAnalyzeUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = updateText.trim();
    if (!content) {
      onToast('Please enter what changed before updating.');
      return;
    }

    if (isVoiceListening) {
      voiceEngine.stopListening();
      setIsVoiceListening(false);
    }

    setFlowState('analyzing');
    setRerouteError(null);

    try {
      const result = await api.analyzeLifeUpdate({
        content,
        currentGoals: goals,
        currentDailyPlan: dailyPlan,
        userProfile,
        wellnessLogs,
        recentUpdates: lifeUpdates,
      });

      setCurrentAnalysis(result);
      setEditingUnderstoodPoints(result.understandingSummary || []);

      // Prepare append-only record
      const updateId = 'lu-' + Date.now();
      const newRecord: LifeUpdate = {
        id: updateId,
        userId: userProfile.email || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inputType: voiceTranscript ? 'voice' : 'text',
        originalContent: content,
        voiceTranscript: voiceTranscript || undefined,
        confirmedSummary: result.importantLifeChange || content,
        categories: result.categories || ['General life context'],
        entities: result.entities || [],
        affectedGoalIds: result.affectedGoalIds || [],
        affectedTaskIds: result.affectedTaskIds || [],
        affectedPlanIds: result.affectedPlanIds || [],
        urgency: result.urgency || 'medium',
        userConfirmed: false,
        planChangeRequested: true,
        rerouteStatus: 'pending',
        rerouteExplanation: result.proposedReroute?.explanation,
        previousPlanSnapshot: {
          priorityTasks: dailyPlan.priorityTasks,
          timeBlocks: dailyPlan.timeBlocks,
        },
        whatChanged: result.proposedReroute?.whatChanged,
        whatWasRemovedOrPaused: result.proposedReroute?.whatWasRemovedOrPaused,
        newTopPriority: result.proposedReroute?.newTopPriority,
        nextSpecificAction: result.proposedReroute?.nextSpecificAction,
      };

      setPendingUpdateRecord(newRecord);
      setFlowState('confirming');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setFlowState('failed');
      setRerouteError('Unable to analyze your update right now. Your text is safe.');
    }
  };

  // 1. CONFIRMATION: "That's Right — Reroute"
  const handleConfirmAndReroute = () => {
    if (!currentAnalysis || !pendingUpdateRecord) return;

    try {
      const proposed = currentAnalysis.proposedReroute;

      // 1. Apply adaptive task updates (preserve completed tasks strictly)
      const existingCompletedTasks = dailyPlan.priorityTasks.filter((t) => t.completed);
      const newTasks = proposed.suggestedPriorityTasks || [];

      // Merge: Keep all completed tasks intact, replace or append new uncompleted tasks
      const mergedPriorityTasks = [
        ...existingCompletedTasks,
        ...newTasks.filter((nt) => !existingCompletedTasks.some((ct) => ct.task.toLowerCase() === nt.task.toLowerCase())),
      ];

      const existingCompletedBlocks = dailyPlan.timeBlocks.filter((b) => b.completed);
      const newBlocks = proposed.suggestedTimeBlocks || dailyPlan.timeBlocks;
      const mergedTimeBlocks = [
        ...existingCompletedBlocks,
        ...newBlocks.filter((nb) => !existingCompletedBlocks.some((cb) => cb.title.toLowerCase() === nb.title.toLowerCase())),
      ];

      const updatedPlan: DailyPlan = {
        ...dailyPlan,
        priorityTasks: mergedPriorityTasks,
        timeBlocks: mergedTimeBlocks,
        theme: proposed.newTopPriority ? `Focus: ${proposed.newTopPriority}` : dailyPlan.theme,
      };

      // 2. Update Goals if affected
      if (proposed.updatedGoals && proposed.updatedGoals.length > 0) {
        const updatedGoalsList = goals.map((g) => {
          const match = proposed.updatedGoals?.find((ug) => ug.id === g.id || ug.title === g.title);
          if (match) {
            return {
              ...g,
              status: match.status || g.status,
              recalculatedPath: match.recalculatedPath || g.recalculatedPath,
            };
          }
          return g;
        });
        onUpdateGoals(updatedGoalsList);
      }

      // 3. Update User Profile if fields confirmed
      if (proposed.updatedProfileFields && Object.keys(proposed.updatedProfileFields).length > 0) {
        onUpdateProfile({
          ...userProfile,
          ...proposed.updatedProfileFields,
        });
      }

      // 4. Save Confirmed Life Update Record
      const finalizedRecord: LifeUpdate = {
        ...pendingUpdateRecord,
        userConfirmed: true,
        rerouteStatus: 'rerouted',
        confirmedSummary: editingUnderstoodPoints.join(' • ') || pendingUpdateRecord.confirmedSummary,
        newPlanSnapshot: {
          priorityTasks: updatedPlan.priorityTasks,
          timeBlocks: updatedPlan.timeBlocks,
        },
      };

      const updatedHistory = [finalizedRecord, ...lifeUpdates];
      onUpdateLifeUpdates(updatedHistory);
      onUpdateDailyPlan(updatedPlan);

      // 5. Add to Chronological Memory Vault / Timeline
      const timelineMemory: MemoryItem = {
        id: 'mem-' + Date.now(),
        title: `Life Update: ${finalizedRecord.confirmedSummary.substring(0, 50)}`,
        content: `**Life Update:** ${finalizedRecord.originalContent}\n\n**AIM GPS Reroute:** ${finalizedRecord.rerouteExplanation || ''}\n\n**Immediate Next Step:** ${finalizedRecord.nextSpecificAction || ''}`,
        category: (finalizedRecord.categories[0] as any) || 'Personal',
        tags: ['Life Update', 'GPS Reroute', ...finalizedRecord.categories],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        importance: finalizedRecord.urgency === 'critical' || finalizedRecord.urgency === 'high' ? 'critical' : 'high',
      };
      onUpdateMemories([timelineMemory, ...memories]);

      setPendingUpdateRecord(finalizedRecord);
      setFlowState('rerouted_summary');
      setUpdateText('');
      setVoiceTranscript('');
      onToast('Plan successfully rerouted to match your new reality!');
    } catch (err: any) {
      console.error('Rerouting application error:', err);
      // Save update even if rerouting application had an edge-case failure
      const fallbackRecord: LifeUpdate = {
        ...pendingUpdateRecord,
        rerouteStatus: 'failed',
      };
      onUpdateLifeUpdates([fallbackRecord, ...lifeUpdates]);
      setPendingUpdateRecord(fallbackRecord);
      setFlowState('failed');
      setRerouteError('Your update was saved, but the plan could not be adjusted yet. Try rerouting again.');
    }
  };

  // 2. CONFIRMATION: "Save Without Changing My Plan"
  const handleSaveWithoutRerouting = () => {
    if (!pendingUpdateRecord) return;

    const savedRecord: LifeUpdate = {
      ...pendingUpdateRecord,
      userConfirmed: true,
      planChangeRequested: false,
      rerouteStatus: 'no_change_needed',
      rerouteExplanation: 'Saved to life record. Current plan preserved unchanged.',
    };

    const updatedHistory = [savedRecord, ...lifeUpdates];
    onUpdateLifeUpdates(updatedHistory);

    // Add to memories
    const timelineMemory: MemoryItem = {
      id: 'mem-' + Date.now(),
      title: `Life Note: ${savedRecord.confirmedSummary.substring(0, 50)}`,
      content: savedRecord.originalContent,
      category: (savedRecord.categories[0] as any) || 'Personal',
      tags: ['Life Update', ...savedRecord.categories],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importance: 'normal',
    };
    onUpdateMemories([timelineMemory, ...memories]);

    setUpdateText('');
    setVoiceTranscript('');
    setFlowState('input');
    onToast('Update saved to your Life History. Your plan remains intact.');
  };

  // Edit / Revise an existing update without overwriting original history
  const handleSaveRevision = () => {
    if (!editingUpdate || !editedContent.trim()) return;

    const newRevision = {
      timestamp: new Date().toISOString(),
      content: editingUpdate.originalContent,
      note: revisionNote.trim() || 'User revised update details',
    };

    const updatedList = lifeUpdates.map((item) => {
      if (item.id === editingUpdate.id) {
        return {
          ...item,
          originalContent: editedContent.trim(),
          updatedAt: new Date().toISOString(),
          revisionHistory: [...(item.revisionHistory || []), newRevision],
        };
      }
      return item;
    });

    onUpdateLifeUpdates(updatedList);
    setEditingUpdate(null);
    setEditedContent('');
    setRevisionNote('');
    onToast('Update revised and revision history preserved.');
  };

  // Delete update
  const handleDeleteUpdate = (id: string) => {
    const filtered = lifeUpdates.filter((u) => u.id !== id);
    onUpdateLifeUpdates(filtered);
    setDeleteConfirmId(null);
    onToast('Update removed from history.');
  };

  // Toggle privacy for an update
  const handleTogglePrivacy = (id: string) => {
    const updatedList = lifeUpdates.map((u) =>
      u.id === id ? { ...u, isPrivate: !u.isPrivate } : u
    );
    onUpdateLifeUpdates(updatedList);
    onToast('Privacy setting updated.');
  };

  // Export Update History
  const handleExportHistory = () => {
    const dataStr = JSON.stringify(lifeUpdates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aim-life-updates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Life update history exported.');
  };

  const displayedUpdates = showPrivateOnly
    ? lifeUpdates.filter((u) => u.isPrivate)
    : lifeUpdates;

  return (
    <div id="aim-life-update-module" className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* Primary Input Card / Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Adaptive Life GPS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What changed?
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tell AIM what happened, what changed, or what you learned. Your plan will adjust with you.
            </p>
          </div>

          {/* Error Banner if any */}
          {micErrorMessage && (
            <div className="bg-amber-950/60 border border-amber-800/80 rounded-2xl p-3.5 text-xs text-amber-200 flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{micErrorMessage}</span>
            </div>
          )}

          {/* Form Input Area */}
          {flowState === 'input' && (
            <form onSubmit={handleAnalyzeUpdate} className="space-y-4">
              <div className="relative">
                <textarea
                  id="life-update-textarea"
                  ref={textareaRef}
                  rows={4}
                  value={updateText || ''}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="Tell me what changed…"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner"
                />

                {/* Voice Status Overlay when listening */}
                {isVoiceListening && (
                  <div className="absolute bottom-4 left-4 right-4 bg-indigo-950/90 border border-indigo-700 text-indigo-200 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                      <span className="font-semibold">Listening… speak naturally</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className="text-[11px] underline text-indigo-300 hover:text-white"
                    >
                      Done speaking
                    </button>
                  </div>
                )}
              </div>

              {/* Action Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  id="life-update-voice-btn"
                  onClick={handleToggleVoice}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                    isVoiceListening
                      ? 'bg-rose-950/80 border-rose-700 text-rose-300 shadow-md shadow-rose-900/30'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200'
                  }`}
                >
                  {isVoiceListening ? (
                    <>
                      <MicOff className="w-4 h-4 text-rose-400" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-indigo-400" />
                      <span>Dictate with Voice</span>
                    </>
                  )}
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="life-update-submit-btn"
                  disabled={!updateText.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Update My Plan</span>
                </button>
              </div>
            </form>
          )}

          {/* Analyzing State */}
          {flowState === 'analyzing' && (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">AIM GPS Recalculating…</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Analyzing affected goals, tasks, dependencies, and priorities without altering your completed wins.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation Card Before Applying Major Changes */}
          {flowState === 'confirming' && currentAnalysis && (
            <div
              id="aim-confirmation-card"
              className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Here’s what I understood</h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  {currentAnalysis.urgency.toUpperCase()} PRIORITY
                </span>
              </div>

              {/* Contradiction / Follow-up alert if present */}
              {currentAnalysis.conflictsOrUncertainty && (
                <div className="bg-amber-950/50 border border-amber-800/80 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-300 mb-0.5">Note on Previous Context:</span>
                    <span>{currentAnalysis.conflictsOrUncertainty}</span>
                  </div>
                </div>
              )}

              {/* Bullet points of understanding */}
              {!isEditingUnderstanding ? (
                <div className="space-y-2.5">
                  {editingUnderstoodPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Edit AIM's interpretation directly:
                  </label>
                  <textarea
                    rows={3}
                    value={editingUnderstoodPoints.join('\n')}
                    onChange={(e) => setEditingUnderstoodPoints(e.target.value.split('\n'))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Proposed Action Preview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Proposed GPS Reroute Strategy
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{currentAnalysis.proposedReroute?.explanation}"
                </p>
              </div>

              {/* 3 Required Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  id="btn-edit-understanding"
                  onClick={() => setIsEditingUnderstanding(!isEditingUnderstanding)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors text-center"
                >
                  {isEditingUnderstanding ? 'Done Editing' : 'Edit What AIM Understood'}
                </button>

                <button
                  type="button"
                  id="btn-save-without-changing"
                  onClick={handleSaveWithoutRerouting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors text-center"
                >
                  Save Without Changing My Plan
                </button>

                <button
                  type="button"
                  id="btn-confirm-reroute"
                  onClick={handleConfirmAndReroute}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>That’s Right—Reroute</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 8 & 9: Post Reroute Feedback Screen */}
          {flowState === 'rerouted_summary' && pendingUpdateRecord && (
            <div
              id="aim-rerouted-success-card"
              className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-2xl animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Plan Recalibrated & Active</h3>
                </div>
                <button
                  onClick={() => setFlowState('input')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  + Add Another Update
                </button>
              </div>

              {/* Conversational Explanation */}
              <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                "{pendingUpdateRecord.rerouteExplanation}"
              </p>

              {/* 4 Feedback Components */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* What Changed */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> What Changed
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {pendingUpdateRecord.whatChanged && pendingUpdateRecord.whatChanged.length > 0 ? (
                      pendingUpdateRecord.whatChanged.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li>Priority schedule adjusted</li>
                    )}
                  </ul>
                </div>

                {/* What Was Removed or Paused */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Removed, Paused, or Rescheduled
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {pendingUpdateRecord.whatWasRemovedOrPaused &&
                    pendingUpdateRecord.whatWasRemovedOrPaused.length > 0 ? (
                      pendingUpdateRecord.whatWasRemovedOrPaused.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li>No previous wins or tasks removed</li>
                    )}
                  </ul>
                </div>

                {/* New Top Priority */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> New Top Priority
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {pendingUpdateRecord.newTopPriority || 'Execute recalibrated core focus'}
                  </p>
                </div>

                {/* Next Specific Action */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Next Specific Action
                  </span>
                  <p className="text-xs font-semibold text-emerald-300">
                    {pendingUpdateRecord.nextSpecificAction || 'Open today’s updated priority checklist'}
                  </p>
                </div>
              </div>

              {/* View Updated Plan Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  id="btn-view-updated-plan"
                  onClick={() => onNavigateToTab('planner')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>View Updated Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Failure / Retry State */}
          {flowState === 'failed' && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>Rerouting Encountered an Issue</span>
              </div>
              <p className="text-xs text-rose-200">
                {rerouteError || 'Your update was saved, but the plan could not be adjusted yet. Try rerouting again.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-retry-reroute"
                  onClick={() => handleAnalyzeUpdate()}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl"
                >
                  Retry Reroute
                </button>
                <button
                  type="button"
                  onClick={() => setFlowState('input')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Return to Input
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable History Section: Your Updates */}
      <div id="your-updates-history-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Your Updates</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {displayedUpdates.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Chronological log of your life changes, adjustments, and confirmed reroutes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrivateOnly(!showPrivateOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showPrivateOnly
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle private updates filter"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{showPrivateOnly ? 'Private Only' : 'All Updates'}</span>
            </button>

            {lifeUpdates.length > 0 && (
              <button
                onClick={handleExportHistory}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Export updates as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {displayedUpdates.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No life updates recorded yet. Whenever something changes in your work, energy, schedule, or goals, share it above.
            </p>
          </div>
        )}

        {/* List of Saved Updates */}
        <div className="space-y-3">
          {displayedUpdates.map((item) => {
            const isExpanded = expandedUpdateId === item.id;
            const dateFormatted = new Date(item.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                id={`life-update-card-${item.id}`}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3 transition-all hover:border-slate-700/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {dateFormatted}
                    </span>
                    {item.inputType === 'voice' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/60 flex items-center gap-1">
                        <Mic className="w-3 h-3" /> Voice
                      </span>
                    )}
                    {item.isPrivate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 font-semibold border border-amber-800/60 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                        item.rerouteStatus === 'rerouted'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                          : item.rerouteStatus === 'no_change_needed'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {item.rerouteStatus === 'rerouted'
                        ? 'Plan Rerouted'
                        : item.rerouteStatus === 'no_change_needed'
                        ? 'No Plan Change'
                        : 'Saved Update'}
                    </span>
                  </div>

                  {/* Actions: Privacy, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePrivacy(item.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors"
                      title={item.isPrivate ? 'Make Public to AIM' : 'Mark Private'}
                    >
                      {item.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        setEditingUpdate(item);
                        setEditedContent(item.originalContent);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 transition-colors"
                      title="Revise Update"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Update"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                    "{item.originalContent}"
                  </p>

                  {/* Categories Pills */}
                  {item.categories && item.categories.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.categories.map((cat, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Inline */}
                {deleteConfirmId === item.id && (
                  <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs animate-fadeIn">
                    <span className="text-rose-200">Delete this update from your history?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteUpdate(item.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px]"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expand / Collapse Reroute Details */}
                {item.rerouteExplanation && (
                  <div>
                    <button
                      onClick={() => setExpandedUpdateId(isExpanded ? null : item.id)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Reroute Details' : 'View Reroute Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300 animate-fadeIn">
                        <div>
                          <strong className="text-slate-400 block mb-0.5">AIM Explanation:</strong>
                          <span>{item.rerouteExplanation}</span>
                        </div>
                        {item.nextSpecificAction && (
                          <div>
                            <strong className="text-emerald-400 block mb-0.5">Assigned Next Action:</strong>
                            <span className="text-emerald-300">{item.nextSpecificAction}</span>
                          </div>
                        )}
                        {item.revisionHistory && item.revisionHistory.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <span className="font-semibold block text-slate-300">Revision History:</span>
                            {item.revisionHistory.map((rev, idx) => (
                              <div key={idx} className="bg-slate-900 p-2 rounded-lg">
                                <div>• {rev.note} ({new Date(rev.timestamp).toLocaleDateString()})</div>
                                <div className="italic text-slate-500">"{rev.content}"</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Revision Modal */}
      {editingUpdate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Revise Life Update</span>
              </h3>
              <button
                onClick={() => setEditingUpdate(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              AIM preserves previous versions in your revision history so earlier context is never silently erased.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Updated Content:
                </label>
                <textarea
                  rows={4}
                  value={editedContent || ''}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / Revision Note (Optional):
                </label>
                <input
                  type="text"
                  value={revisionNote || ''}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="e.g. Corrected company name, updated date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setEditingUpdate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevision}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
              >
                Save Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
