import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Volume2, VolumeX, Sliders, Globe } from 'lucide-react';
import {
  formatDayOfWeek,
  formatFullLocalDate,
  formatLocalTime,
  getEffectiveTimeZone,
  getTodayDateString,
} from '../../utils/dateTimeUtils';
import { voiceEngine } from '../../services/voiceService';
import { WeatherPill } from '../common/WeatherPill';

interface TodayHeaderProps {
  userTimeZone?: string;
  onOpenCalendar: () => void;
  onOpenVoiceSettings: () => void;
  onDateChange?: (newDateStr: string) => void;
}

export const TodayHeader: React.FC<TodayHeaderProps> = ({
  userTimeZone,
  onOpenCalendar,
  onOpenVoiceSettings,
  onDateChange,
}) => {
  const effectiveTz = getEffectiveTimeZone(userTimeZone);
  const [now, setNow] = useState<Date>(new Date());
  const [isMuted, setIsMuted] = useState<boolean>(() => voiceEngine.getPreferences().isMuted);

  useEffect(() => {
    let lastDateStr = getTodayDateString(effectiveTz);

    // Update every 30 seconds for clock accuracy and midnight day shift
    const interval = setInterval(() => {
      const currentNow = new Date();
      setNow(currentNow);

      const currentDateStr = getTodayDateString(effectiveTz);
      if (currentDateStr !== lastDateStr) {
        lastDateStr = currentDateStr;
        if (onDateChange) {
          onDateChange(currentDateStr);
        }
      }
    }, 30000);

    // Also listen to visibility change for device resume / background returning
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const resumeNow = new Date();
        setNow(resumeNow);
        const resumeDateStr = getTodayDateString(effectiveTz);
        if (resumeDateStr !== lastDateStr) {
          lastDateStr = resumeDateStr;
          if (onDateChange) {
            onDateChange(resumeDateStr);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveTz, onDateChange]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceEngine.setPreferences({ isMuted: nextMuted });
    if (nextMuted) {
      voiceEngine.stopSpeaking(true);
    }
  };

  const dayOfWeek = formatDayOfWeek(now, effectiveTz);
  const fullDate = formatFullLocalDate(now, effectiveTz);
  const localTime = formatLocalTime(now, effectiveTz);

  return (
    <div
      id="aim-today-sticky-header"
      className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 transition-colors"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Date & Live Time Header */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {dayOfWeek}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{effectiveTz.replace(/_/g, ' ')}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {fullDate}
            </h1>
            <span
              id="aim-live-clock"
              className="text-xs sm:text-sm font-medium text-emerald-400 font-mono tabular-nums px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40"
            >
              {localTime}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Local Weather Pill */}
          <WeatherPill userTimeZone={userTimeZone} />

          {/* Monthly Calendar Button */}
          <button
            id="open-monthly-calendar-btn"
            onClick={onOpenCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm"
            title="Open Monthly Schedule Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Calendar</span>
          </button>

          {/* Voice Mute / Unmute */}
          <button
            id="toggle-voice-mute-btn"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border text-xs transition-all ${
              isMuted
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title={isMuted ? 'Voice narration muted (Click to unmute)' : 'Voice narration active (Click to mute)'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Voice Settings */}
          <button
            id="open-voice-settings-btn"
            onClick={onOpenVoiceSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Voice & Audio Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

