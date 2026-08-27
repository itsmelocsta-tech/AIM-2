import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  FastForward,
} from 'lucide-react';
import {
  ScheduleItem,
  ScheduleItemStatus,
  UserProfile,
  DailyPlan,
  Goal,
  VoiceState,
  SpeakerState,
} from '../../types';
import { CoachOrb } from './CoachOrb';
import { scheduleRepository } from '../../services/repositories/scheduleRepository';
import { voiceEngine } from '../../services/voiceService';
import {
  getEffectiveTimeZone,
  groupScheduleItems,
  formatTimeRange,
  findActiveOrNextItem,
} from '../../utils/dateTimeUtils';
import { WeatherCard } from '../common/WeatherCard';
import { CompactOrbContext } from '../../services/intelligenceService';

interface HomeScreenProps {
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  goals: Goal[];
  compactContext?: CompactOrbContext | null;
  onNavigateToTab: (tab: string) => void;
  onOpenCalendar: () => void;
  onOpenVoiceSettings: () => void;
  onOpenLifeUpdate: (initialText?: string) => void;
  onToast: (msg: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  dailyPlan,
  goals,
  compactContext,
  onNavigateToTab,
  onOpenCalendar,
  onOpenVoiceSettings,
  onOpenLifeUpdate,
  onToast,
}) => {
  const effectiveTz = getEffectiveTimeZone(userProfile.timeZone);

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEarlierExpanded, setIsEarlierExpanded] = useState(false);

  // Voice States
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [speakerState, setSpeakerState] = useState<SpeakerState>('ready');
  const [greetingText, setGreetingText] = useState('');
  const [isMuted, setIsMuted] = useState<boolean>(() => voiceEngine.getPreferences().isMuted);

  // Auto-scroll ref
  const currentItemRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);

  // Load canonical schedule
  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const items = await scheduleRepository.getDailySchedule({
        userId: userProfile.id || 'default_user',
        timeZone: effectiveTz,
      });
      setScheduleItems(items);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [userProfile.id, effectiveTz]);

  // Voice Engine State subscription
  useEffect(() => {
    voiceEngine.setVoiceStateListener((state) => {
      setVoiceState(state);
    });
  }, []);

  // Compute greeting and speak once per app session
  useEffect(() => {
    if (isLoading) return;

    const { current, next, isDayComplete } = findActiveOrNextItem(scheduleItems);

    let contextualSentence = 'Your next step is ready.';
    if (scheduleItems.length === 0) {
      contextualSentence = 'Your schedule is clear. Let’s build today’s plan.';
    } else if (current && current.status === 'in_progress') {
      contextualSentence = 'You have one activity in progress.';
    } else if (isDayComplete) {
      contextualSentence = 'Today’s main schedule is complete. Rest and reflect.';
    }

    const fullGreeting = `Good day. Let’s see where we are today. ${contextualSentence}`;
    setGreetingText(fullGreeting);

    const sessionState = voiceEngine.getGreetingSessionState();
    if (!sessionState.hasSpokenHomeGreeting && !isMuted) {
      const timer = setTimeout(() => {
        voiceEngine.speak(fullGreeting, {
          onStateChange: (state) => setSpeakerState(state),
          onStart: () => setVoiceState('speaking'),
          onEnd: () => setVoiceState('idle'),
          onError: () => setVoiceState('idle'),
        });
        voiceEngine.markGreetingSpoken(fullGreeting);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isLoading, scheduleItems, isMuted]);

  // Scroll to active or next item once
  useEffect(() => {
    if (!isLoading && scheduleItems.length > 0 && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
      const timer = setTimeout(() => {
        if (currentItemRef.current) {
          currentItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scheduleItems]);

  const { earlier, current, upcoming } = groupScheduleItems(scheduleItems);
  const isDayComplete =
    scheduleItems.length > 0 &&
    !current &&
    upcoming.length === 0 &&
    earlier.length === scheduleItems.length;

  // Handlers for Schedule Actions
  const handleUpdateStatus = async (item: ScheduleItem, nextStatus: ScheduleItemStatus) => {
    try {
      const updated = await scheduleRepository.updateScheduleItemStatus(
        item.id,
        nextStatus,
        userProfile.id || 'default_user'
      );
      setScheduleItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      onToast(`Updated: ${item.title}`);
    } catch {
      onToast('Failed to update schedule item.');
    }
  };

  const handleAddTime = async (item: ScheduleItem, minutesToAdd: number) => {
    try {
      const currentEndMs = new Date(item.endAt).getTime();
      const newEndIso = new Date(currentEndMs + minutesToAdd * 60 * 1000).toISOString();
      const updated = await scheduleRepository.saveScheduleItem({
        ...item,
        endAt: newEndIso,
      });
      setScheduleItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      onToast(`Added +${minutesToAdd}m to ${item.title}`);
    } catch {
      onToast('Failed to extend time.');
    }
  };

  // Voice Interaction Controls
  const handleReplayGreeting = () => {
    voiceEngine.speak(greetingText, {
      onStateChange: (state) => setSpeakerState(state),
      onStart: () => setVoiceState('speaking'),
      onEnd: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  };

  const handleStopSpeaking = () => {
    voiceEngine.stopSpeaking(true);
    setVoiceState('idle');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    voiceEngine.setPreferences({ isMuted: next });
    if (next) {
      voiceEngine.stopSpeaking(true);
    }
  };

  const handleOrbClick = () => {
    if (voiceState === 'speaking') {
      handleStopSpeaking();
    } else if (voiceState === 'listening') {
      voiceEngine.stopListening();
    } else {
      voiceEngine.startListening(
        (text) => {
          onOpenLifeUpdate(text);
        },
        (isListening) => {
          setVoiceState(isListening ? 'listening' : 'idle');
        }
      );
    }
  };

  return (
    <div id="aim-home-screen" className="space-y-6 max-w-3xl mx-auto pb-12 animate-fadeIn">
      {/* Live Local Weather & Time Atmospheric Card */}
      <WeatherCard userTimeZone={userProfile.timeZone} />

      {/* Guidance Orb & Spoken Greeting Section */}
      <section className="flex flex-col items-center text-center pt-2 sm:pt-4 space-y-3">
        <div className="relative">
          <CoachOrb
            coachId="guidance"
            voiceState={voiceState}
            size={170}
            onClick={handleOrbClick}
          />
        </div>

        {/* Spoken Greeting Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-lg w-full shadow-lg backdrop-blur-sm space-y-3">
          <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            {greetingText}
          </p>

          {/* Greeting Voice Controls */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
            {voiceState === 'speaking' ? (
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-800/60 text-rose-300 hover:bg-rose-900"
                title="Stop speaking"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>Stop Voice</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReplayGreeting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                title="Replay spoken greeting"
              >
                <RotateCcw className="w-3 h-3 text-indigo-400" />
                <span>Replay Greeting</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-xl border text-xs ${
                isMuted
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onOpenVoiceSettings}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="Voice Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Schedule Container */}
      <section className="space-y-4">
        {/* Expandable Earlier Today Section */}
        {earlier.length > 0 && (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsEarlierExpanded(!isEarlierExpanded)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Earlier Today ({earlier.length} completed / past)</span>
              </div>
              {isEarlierExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isEarlierExpanded && (
              <div className="p-3.5 pt-0 space-y-2 border-t border-slate-800/60 divide-y divide-slate-800/40">
                {earlier.map((item) => (
                  <div
                    key={item.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs opacity-75"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate line-through text-slate-400">{item.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {formatTimeRange(item.startAt, item.endAt, effectiveTz)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Schedule Block (NOW) */}
        {current && (
          <div
            ref={currentItemRef}
            id="aim-current-schedule-block"
            className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/80 rounded-2xl p-5 shadow-xl shadow-indigo-950/30 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-sm shadow-indigo-500/50">
                  <Sparkles className="w-3 h-3" />
                  NOW
                </span>
                <span className="text-xs text-indigo-300 font-medium">
                  {current.status === 'in_progress' ? 'In Progress' : 'Active Time Block'}
                </span>
              </div>

              <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                {formatTimeRange(current.startAt, current.endAt, effectiveTz)}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{current.title}</h2>
              {current.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{current.description}</p>
              )}
            </div>

            {/* Action Bar for Current Block */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              {current.status !== 'in_progress' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(current, 'in_progress')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start Activity</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(current, 'scheduled')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleUpdateStatus(current, 'completed')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Complete</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddTime(current, 15)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Add 15 minutes to this activity"
              >
                <Plus className="w-3 h-3" />
                <span>+15m</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLifeUpdate(`I need to adjust my current activity: ${current.title}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Something Changed</span>
              </button>
            </div>
          </div>
        )}

        {/* Next Upcoming Schedule Blocks */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Upcoming Next
              </h3>
              <button
                type="button"
                onClick={onOpenCalendar}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Full Day View
              </button>
            </div>

            <div className="space-y-2.5">
              {upcoming.slice(0, 3).map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                    </div>

                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {formatTimeRange(item.startAt, item.endAt, effectiveTz)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item, 'in_progress')}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item, 'completed')}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200 ml-3"
                    >
                      Mark Complete
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenLifeUpdate(`I need to adjust my upcoming activity: ${item.title}`)
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Adjust</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Schedule State */}
        {scheduleItems.length === 0 && (
          <div className="bg-slate-900/80 border border-dashed border-slate-700/80 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Nothing is scheduled yet.</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tell AIM how you want today to go, and I’ll help build the plan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('planner')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
              >
                Build Today’s Plan
              </button>
              <button
                type="button"
                onClick={() => onOpenLifeUpdate()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Tell AIM What Changed
              </button>
            </div>
          </div>
        )}

        {/* Day Complete State */}
        {isDayComplete && (
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Today’s main schedule is complete.
              </h3>
              <p className="text-xs text-slate-300">
                Would you like to reflect on today or prepare tomorrow?
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('planner')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
              >
                Evening Reflection
              </button>
              <button
                type="button"
                onClick={() => onOpenCalendar()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Plan Tomorrow
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
