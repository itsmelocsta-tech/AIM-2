import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cloud,
  Mic,
  PlusCircle,
  Sliders,
  Compass,
  Clock,
} from 'lucide-react';
import { UserProfile, DriveSyncState } from '../../types';
import { WeatherPill } from './WeatherPill';
import { formatLocalTime, getEffectiveTimeZone } from '../../utils/dateTimeUtils';

interface HeaderProps {
  userProfile: UserProfile;
  driveState: Partial<DriveSyncState>;
  onOpenDriveModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenQuickCapture: () => void;
  onOpenFoundationModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unlockedSpacesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  driveState,
  onOpenDriveModal,
  onOpenVoiceModal,
  onOpenQuickCapture,
  onOpenFoundationModal,
  activeTab,
  setActiveTab,
  unlockedSpacesCount = 0,
}) => {
  const effectiveTz = getEffectiveTimeZone(userProfile.timeZone);
  const [timeStr, setTimeStr] = useState(() => formatLocalTime(new Date(), effectiveTz));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatLocalTime(new Date(), effectiveTz));
    }, 1000);
    return () => clearInterval(timer);
  }, [effectiveTz]);

  return (
    <header id="aim-main-header" className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 text-slate-100 px-3 sm:px-4 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Identity */}
        <div
          id="aim-brand-logo"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          title="Return to AIM Home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-[1.5px] shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-semibold tracking-tight text-sm sm:text-base text-white">AIM</span>
              <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 font-medium border border-indigo-800/50">
                Life OS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Local Weather & Live Local Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Clock Pill */}
          <div
            id="aim-header-live-time"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono font-medium text-emerald-400 tabular-nums shadow-sm"
            title={`Local time (${effectiveTz})`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{timeStr}</span>
          </div>

          {/* Local Weather Pill */}
          <WeatherPill userTimeZone={userProfile.timeZone} />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Mode Switcher: Home vs Spaces */}
          {activeTab !== 'home' ? (
            <button
              id="back-to-home-btn"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Voice Home</span>
            </button>
          ) : (
            <button
              id="explore-spaces-header-btn"
              onClick={() => setActiveTab('planner')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-medium bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Life Spaces</span>
              {unlockedSpacesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-900 text-indigo-200 text-[10px]">
                  {unlockedSpacesCount}
                </span>
              )}
            </button>
          )}

          {/* Google Drive Status Button */}
          <button
            id="google-drive-header-btn"
            onClick={onOpenDriveModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-medium transition-colors border ${
              driveState.isConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Google Drive Sync Status"
          >
            <Cloud className={`w-3.5 h-3.5 ${driveState.isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">
              {driveState.isConnected ? 'Drive Synced' : 'Google Drive'}
            </span>
          </button>

          {/* Quick Capture Button */}
          <button
            id="quick-capture-header-btn"
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
            title="Quick Note or Thought"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Capture</span>
          </button>

          {/* Identity Calibration / Settings */}
          <button
            id="foundation-session-btn"
            onClick={onOpenFoundationModal}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Life Vision Calibration"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

