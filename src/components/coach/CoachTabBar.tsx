import React, { useRef } from 'react';
import { Sparkles, Flame, Moon, Heart, Users } from 'lucide-react';
import { CoachId } from '../../types';
import { COACH_CONFIGS } from '../../services/coachRegistry';

interface CoachTabBarProps {
  activeCoachId: CoachId;
  onSelectCoach: (coachId: CoachId) => void;
}

const TAB_ICONS: Record<CoachId, React.ElementType> = {
  guidance: Sparkles,
  motivation: Flame,
  spiritual: Moon,
  health: Heart,
  relationships: Users,
};

export const CoachTabBar: React.FC<CoachTabBarProps> = ({
  activeCoachId,
  onSelectCoach,
}) => {
  const tabsListRef = useRef<HTMLDivElement | null>(null);

  const coaches: CoachId[] = ['guidance', 'motivation', 'spiritual', 'health', 'relationships'];

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % coaches.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + coaches.length) % coaches.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = coaches.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextCoachId = coaches[nextIndex];
    onSelectCoach(nextCoachId);

    // Focus the target tab button
    const buttons = tabsListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (buttons && buttons[nextIndex]) {
      buttons[nextIndex].focus();
    }
  };

  return (
    <nav
      id="aim-coach-nav"
      aria-label="AIM Coaches"
      className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2 sticky top-[57px] z-20 shadow-sm backdrop-blur-sm"
    >
      <div
        ref={tabsListRef}
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-thin py-0.5"
      >
        {coaches.map((id, index) => {
          const config = COACH_CONFIGS[id];
          const Icon = TAB_ICONS[id];
          const isActive = activeCoachId === id;

          // Distinct color accents for each coach tab
          const activeBgClass =
            id === 'guidance'
              ? 'bg-indigo-600/90 text-white shadow-indigo-500/25 border-indigo-400/50'
              : id === 'motivation'
              ? 'bg-orange-600/90 text-white shadow-orange-500/25 border-orange-400/50'
              : id === 'spiritual'
              ? 'bg-purple-600/90 text-white shadow-purple-500/25 border-purple-400/50'
              : id === 'health'
              ? 'bg-emerald-600/90 text-white shadow-emerald-500/25 border-emerald-400/50'
              : 'bg-rose-600/90 text-white shadow-rose-500/25 border-rose-400/50';

          const iconColorClass = isActive
            ? 'text-white'
            : id === 'guidance'
            ? 'text-indigo-400 group-hover:text-indigo-300'
            : id === 'motivation'
            ? 'text-orange-400 group-hover:text-orange-300'
            : id === 'spiritual'
            ? 'text-purple-400 group-hover:text-purple-300'
            : id === 'health'
            ? 'text-emerald-400 group-hover:text-emerald-300'
            : 'text-rose-400 group-hover:text-rose-300';

          return (
            <button
              key={id}
              id={`coach-tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`coach-panel-${id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectCoach(id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`group flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] min-w-[70px] sm:min-w-[100px] flex-1 rounded-xl text-xs sm:text-sm font-semibold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive
                  ? `${activeBgClass} shadow-md border`
                  : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${iconColorClass} ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="truncate">
                {id === 'guidance' ? 'Home' : config.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
