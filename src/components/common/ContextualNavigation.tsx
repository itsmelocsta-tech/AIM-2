import React from 'react';
import { Brain, Calendar, Clock, Compass, Heart, Layers, MessageSquare, Send, Sliders, Sparkles, Target, Users } from 'lucide-react';
import type { AimModuleId } from '../../services/moduleAccessService';

const tabs: { id: AimModuleId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Today', icon: Sparkles },
  { id: 'chat', label: 'Talk to AIM', icon: MessageSquare },
  { id: 'planner', label: 'My plan', icon: Calendar },
  { id: 'check-in', label: 'Check-In', icon: Send },
  { id: 'scanner', label: 'Your Opportunities', icon: Compass },
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'memory', label: 'Memory Vault', icon: Brain },
  { id: 'wellness', label: 'Wellness', icon: Heart },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export function ContextualNavigation({ availableModules, activeTab, onNavigate }: { availableModules: ReadonlySet<AimModuleId>; activeTab: string; onNavigate: (id: AimModuleId) => void }) {
  return <nav id="aim-primary-nav" aria-label="Your AIM sections" className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-3 sm:px-4 lg:px-8 py-2 sticky top-[69px] z-30 shadow-sm">
    <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
      {tabs.filter(tab => availableModules.has(tab.id)).map(({ id, label, icon: Icon }) => <button key={id} id={`nav-tab-${id}`} type="button"
        aria-current={activeTab === id ? 'page' : undefined} onClick={() => onNavigate(id)}
        className={`flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}>
        <Icon className="w-3.5 h-3.5" /><span>{label}</span>
      </button>)}
    </div>
  </nav>;
}
