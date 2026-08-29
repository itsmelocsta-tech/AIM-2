import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  RotateCcw,
  Sliders,
  Compass,
  Zap,
} from 'lucide-react';
import {
  CoachId,
  CoachMessage,
  CoachResponse,
  UserProfile,
  ScheduleItem,
  VoiceState,
  SpeakerState,
  ScheduleChangeProposal,
  Goal,
  MemoryItem,
  DailyPlan,
  WellnessLog,
  LifeUpdate,
} from '../../types';
import { CoachOrb } from './CoachOrb';
import { getCoachConfig } from '../../services/coachRegistry';
import { coachConversationRepository } from '../../services/repositories/coachConversationRepository';
import { scheduleRepository } from '../../services/repositories/scheduleRepository';
import { api } from '../../services/api';
import { voiceEngine } from '../../services/voiceService';
import { intelligenceService, CompactOrbContext } from '../../services/intelligenceService';
import { applyConfirmedScheduleChange } from '../../services/reroutingService';
import { getEffectiveTimeZone, formatTimeRange } from '../../utils/dateTimeUtils';
import { actionExecutionEngine } from '../../services/actionExecutionEngine';

interface CoachScreenProps {
  coachId: CoachId;
  userProfile: UserProfile;
  goals?: Goal[];
  memories?: MemoryItem[];
  dailyPlan?: DailyPlan;
  wellnessLogs?: WellnessLog[];
  lifeUpdates?: LifeUpdate[];
  compactContext?: CompactOrbContext | null;
  onUpdateDailyPlan?: (plan: DailyPlan) => void;
  onUpdateGoals?: (goals: Goal[]) => void;
  onUpdateMemories?: (memories: MemoryItem[]) => void;
  onUpdateLifeUpdates?: (updates: LifeUpdate[]) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onRefreshContext?: () => void;
  onReturnToToday: () => void;
  onOpenVoiceSettings: () => void;
  onOpenLifeUpdate: (initialText?: string) => void;
  onToast: (msg: string) => void;
}

export const CoachScreen: React.FC<CoachScreenProps> = ({
  coachId,
  userProfile,
  goals = [],
  memories = [],
  dailyPlan,
  wellnessLogs = [],
  lifeUpdates = [],
  compactContext: propCompactContext,
  onUpdateDailyPlan,
  onUpdateGoals,
  onUpdateMemories,
  onUpdateLifeUpdates,
  onUpdateProfile,
  onRefreshContext,
  onReturnToToday,
  onOpenVoiceSettings,
  onOpenLifeUpdate,
  onToast,
}) => {
  const config = getCoachConfig(coachId);
  const effectiveTz = getEffectiveTimeZone(userProfile.timeZone);

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [speakerState, setSpeakerState] = useState<SpeakerState>('ready');
  const [pendingProposal, setPendingProposal] = useState<ScheduleChangeProposal | null>(null);
  const [localContext, setLocalContext] = useState<CompactOrbContext | null>(propCompactContext || null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasSpokenOpeningRef = useRef<string | null>(null);

  // Sync prop context or fetch if missing
  useEffect(() => {
    if (propCompactContext) {
      setLocalContext(propCompactContext);
    } else {
      intelligenceService.getCompactOrbContext({ coachId, userProfile }).then(setLocalContext);
    }
  }, [coachId, propCompactContext, userProfile]);

  // Load conversation history for this coach
  useEffect(() => {
    const loadHistory = async () => {
      const stored = await coachConversationRepository.getMessages(coachId, userProfile.id);
      setMessages(stored);
    };
    loadHistory();
  }, [coachId, userProfile.id]);

  // Voice State listener
  useEffect(() => {
    voiceEngine.setVoiceStateListener((state) => {
      setVoiceState(state);
    });
  }, []);

  // Speak opening prompt on fresh coach visit (once per session per coach)
  useEffect(() => {
    if (hasSpokenOpeningRef.current !== coachId && messages.length === 0) {
      hasSpokenOpeningRef.current = coachId;
      const prefs = voiceEngine.getPreferences();
      if (!prefs.isMuted) {
        const timer = setTimeout(() => {
          voiceEngine.speak(config.openingPrompt, {
            onStateChange: (s) => setSpeakerState(s),
            onStart: () => setVoiceState('speaking'),
            onEnd: () => setVoiceState('idle'),
            onError: () => setVoiceState('idle'),
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [coachId, messages.length, config.openingPrompt]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript, isLoadingResponse]);

  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isLoadingResponse) return;

    // Stop active speech
    voiceEngine.stopSpeaking(true);

    const userMessage: CoachMessage = {
      id: `msg-${Date.now()}-user`,
      coachId,
      userId: userProfile.id || 'default_user',
      role: 'user',
      content: cleanText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await coachConversationRepository.addMessage(userMessage);

    setInputText('');
    setLiveTranscript('');
    setIsLoadingResponse(true);
    setVoiceState('processing');

    try {
      // 1. Retrieve compact context before processing message
      const todaySchedule = await scheduleRepository.getDailySchedule({
        userId: userProfile.id || 'default_user',
        timeZone: effectiveTz,
      });

      const currentCompactContext = await intelligenceService.getCompactOrbContext({
        coachId,
        userProfile,
        currentSchedule: todaySchedule,
        userMessage: cleanText,
      });
      setLocalContext(currentCompactContext);

      // 2. Dispatch to coach with compactContext and comprehensive living user data
      const response = await api.interactWithCoach({
        coachId,
        message: cleanText,
        conversationHistory: messages.slice(-6).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        })),
        userProfile,
        goals,
        memories,
        dailyPlan,
        wellnessLogs,
        lifeUpdates,
        currentSchedule: todaySchedule,
        currentTime: new Date().toISOString(),
        timeZone: effectiveTz,
        compactContext: currentCompactContext,
      });

      const assistantMessage: CoachMessage = {
        id: `msg-${Date.now()}-assistant`,
        coachId,
        userId: userProfile.id || 'default_user',
        role: 'assistant',
        content: response.displayText,
        spokenText: response.spokenText,
        structuredResponse: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await coachConversationRepository.addMessage(assistantMessage);

      // Execute any real actions returned by the coach
      if (response.actions && response.actions.length > 0) {
        await actionExecutionEngine.executeActions(response.actions, {
          userProfile,
          dailyPlan: dailyPlan || {
            id: 'dp-today',
            date: new Date().toISOString(),
            priorityTasks: [],
            completedTasksCount: 0,
            timeBlocks: [],
          },
          goals,
          memories,
          lifeUpdates,
          onUpdateDailyPlan,
          onUpdateGoals,
          onUpdateMemories,
          onUpdateLifeUpdates,
          onUpdateProfile,
          onToast,
        });
      }

      // Check if schedule proposal was generated
      if (response.scheduleChangeProposal) {
        setPendingProposal(response.scheduleChangeProposal);
      }

      // Voice narration
      const textToSpeak = response.spokenText || response.displayText;
      voiceEngine.speak(textToSpeak, {
        onStateChange: (s) => setSpeakerState(s),
        onStart: () => setVoiceState('speaking'),
        onEnd: () => setVoiceState('idle'),
        onError: () => setVoiceState('idle'),
      });
    } catch (err) {
      console.error('Coach communication error:', err);
      onToast('Error connecting with coach.');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (voiceState === 'listening' || voiceState === 'transcribing') {
      voiceEngine.stopListening();
      if (liveTranscript.trim()) {
        handleSendMessage(liveTranscript);
      }
    } else {
      voiceEngine.startListening(
        (transcript) => {
          setLiveTranscript(transcript);
          setInputText(transcript);
        },
        (isListening) => {
          setVoiceState(isListening ? 'listening' : 'idle');
        }
      );
    }
  };

  const handleStopSpeaking = () => {
    voiceEngine.stopSpeaking(true);
    setVoiceState('idle');
  };

  const handleApplyProposal = async () => {
    if (!pendingProposal) return;
    try {
      const todaySchedule = await scheduleRepository.getDailySchedule({
        userId: userProfile.id || 'default_user',
        timeZone: effectiveTz,
      });

      const updatedSchedule = applyConfirmedScheduleChange(pendingProposal, todaySchedule);
      await scheduleRepository.batchUpdateSchedule(
        updatedSchedule,
        userProfile.id || 'default_user'
      );

      setPendingProposal(null);
      onToast('Schedule adjustments applied to Today’s plan!');
    } catch (e) {
      onToast('Failed to apply schedule changes.');
    }
  };

  const handleClearHistory = async () => {
    await coachConversationRepository.clearHistory(coachId, userProfile.id);
    setMessages([]);
    onToast('Conversation reset.');
  };

  return (
    <div
      id={`coach-screen-${coachId}`}
      className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-140px)] pb-6 animate-fadeIn"
    >
      {/* Top Coach Header & Return to Today button */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={onReturnToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Today</span>
        </button>

        <div className="flex items-center gap-2">
          {voiceState === 'speaking' && (
            <button
              type="button"
              onClick={handleStopSpeaking}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900"
            >
              <Square className="w-3 h-3 fill-rose-300" />
              <span>Stop Audio</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenVoiceSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            title="Voice Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 text-xs"
              title="Clear Coach Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Coach Banner & Interactive Orb Area */}
      <div className="flex flex-col items-center text-center py-2 space-y-2">
        <CoachOrb
          coachId={coachId}
          voiceState={voiceState}
          size={140}
          onClick={handleToggleVoiceInput}
        />
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-white tracking-tight">{config.roleTitle}</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{config.subtitle}</p>
        </div>

        {/* Compact Context Highlights under Orb */}
        {localContext && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-md">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 font-medium">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span className="truncate max-w-[200px]">{localContext.primaryAttentionFocus}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-medium">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="truncate max-w-[180px]">{localContext.recommendedMicroAction}</span>
            </span>
          </div>
        )}
      </div>

      {/* Pending Schedule Change Proposal Alert Modal */}
      {pendingProposal && (
        <div className="my-3 p-4 bg-indigo-950/70 border-2 border-indigo-500/80 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">Proposed Schedule Reroute</h4>
              <p className="text-xs text-slate-300 mt-0.5">{pendingProposal.reason}</p>

              <div className="mt-2 space-y-1.5">
                {pendingProposal.proposedChanges.map((change, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-900/90 text-xs border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-200 truncate">
                      {change.title || `Item ${change.itemId}`}
                    </span>
                    <span className="text-[11px] text-indigo-300 font-mono">
                      {change.proposedStartAt && change.proposedEndAt
                        ? formatTimeRange(change.proposedStartAt, change.proposedEndAt, effectiveTz)
                        : change.operation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-900/60">
            <button
              type="button"
              onClick={() => setPendingProposal(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleApplyProposal}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              Confirm & Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1 scrollbar-thin">
        {/* Opening prompt card if no messages yet */}
        {messages.length === 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              "{config.openingPrompt}"
            </p>
            {localContext?.recommendedReflectionQuestion && (
              <button
                type="button"
                onClick={() => setInputText(localContext.recommendedReflectionQuestion || '')}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1.5 rounded-xl transition-colors text-left max-w-full"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Prompt: "{localContext.recommendedReflectionQuestion}"</span>
              </button>
            )}
            <p className="text-[11px] text-slate-500">
              Speak with your voice or type your reflection below.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Safety Warning notice if applicable */}
                {msg.structuredResponse?.safety &&
                  msg.structuredResponse.safety.category !== 'none' && (
                    <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Important Support Note</p>
                        <p className="text-[11px] text-amber-300 mt-0.5">
                          {msg.structuredResponse.safety.message ||
                            'AIM is an AI companion and does not replace qualified medical, mental health, or crisis professionals.'}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Recommended Actions buttons */}
                {msg.structuredResponse?.recommendedActions &&
                  msg.structuredResponse.recommendedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Suggested Steps
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.structuredResponse.recommendedActions.map((action, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (action.target === '/home') {
                                onReturnToToday();
                              } else {
                                handleSendMessage(action.label);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Follow up question badge */}
                {msg.structuredResponse?.followUpQuestion && (
                  <p className="text-xs font-semibold text-indigo-300 pt-1 border-t border-slate-800/60 italic">
                    "{msg.structuredResponse.followUpQuestion}"
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoadingResponse && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{config.roleTitle} is reasoning...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="mt-auto pt-2 border-t border-slate-800/80"
      >
        {liveTranscript && (
          <div className="text-xs text-indigo-300 bg-indigo-950/40 px-3 py-1.5 rounded-xl mb-2 border border-indigo-800/50 flex items-center justify-between">
            <span className="truncate">Live audio: "{liveTranscript}"</span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 animate-pulse">
              Listening
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-3 min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center transition-all ${
              voiceState === 'listening' || voiceState === 'transcribing'
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title={
              voiceState === 'listening' ? 'Click to stop recording' : 'Click to speak naturally'
            }
          >
            {voiceState === 'listening' ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-indigo-400" />
            )}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Talk to ${config.label} Coach...`}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoadingResponse}
            className="p-3 min-h-[44px] min-w-[44px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
