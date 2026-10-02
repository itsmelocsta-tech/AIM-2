import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { formatLocalTime, getEffectiveTimeZone } from '../../utils/dateTimeUtils';

interface HeaderProps {
  userProfile: UserProfile;
  onOpenAuthModal?: () => void;
  isAuthenticated?: boolean;
  setActiveTab: (tab: string) => void;
  isOnboarding?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  onOpenAuthModal,
  isAuthenticated = false,
  setActiveTab,
  isOnboarding = false,
}) => {
  const effectiveTz = getEffectiveTimeZone(userProfile.timeZone);
  const [timeStr, setTimeStr] = useState(() => formatLocalTime(new Date(), effectiveTz));

  useEffect(() => {
    setTimeStr(formatLocalTime(new Date(), effectiveTz));
    const timer = setInterval(() => {
      setTimeStr(formatLocalTime(new Date(), effectiveTz));
    }, 60000);
    return () => clearInterval(timer);
  }, [effectiveTz]);

  return (
    <header id="aim-main-header" className="px-5 py-3 border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <button className="min-h-11 text-lg font-semibold" onClick={() => setActiveTab('home')} aria-label="AIM Today">AIM</button>
        {!isOnboarding && <span className="text-sm text-slate-400">{timeStr}</span>}
        {!isAuthenticated && <button className="min-h-11 px-3 text-sm" onClick={onOpenAuthModal}>Sign in</button>}
      </div>
    </header>
  );
};
