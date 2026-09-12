import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  Briefcase,
  CheckCircle2,
  Car,
  ChevronRight,
  ExternalLink,
  Target,
  PauseCircle,
  AlertCircle,
  HelpCircle,
  Layers,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  AIMProject,
  JobListing,
  PersonalOperatingContext,
  DailyActionRecommendation,
} from '../../types';
import { aimContextService } from '../../services/aimContextService';

interface AimHomeModuleProps {
  context: PersonalOperatingContext;
  projects: AIMProject[];
  topJobMatch?: JobListing | null;
  dailyRecommendation?: DailyActionRecommendation | null;
  onRefreshRecommendation: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectProject?: (projectId: string) => void;
  onToast: (msg: string) => void;
}

export const AimHomeModule: React.FC<AimHomeModuleProps> = ({
  context,
  projects,
  topJobMatch,
  dailyRecommendation,
  onRefreshRecommendation,
  onNavigateToTab,
  onSelectProject,
  onToast,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const blockedProjects = projects.filter((p) => p.status === 'blocked');
  const pausedProjects = projects.filter((p) => p.status === 'paused');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRecommendation();
      onToast('Refreshed your daily action recommendation!');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const rec = dailyRecommendation || aimContextService.generateDailyRecommendation(context, projects, topJobMatch);

  return (
    <div id="aim-home-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner: Location, Vehicle Policy & Core Context */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                AIM Life Operating System
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/60">
                  Daily Mission Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Fort Worth, Texas & DFW Metro Area • Texas Non-CDL Class C • Clean Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="aim-home-refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              title="Recalculate today's recommendation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isRefreshing ? 'Recalculating...' : 'Refresh Move'}</span>
            </button>
            <button
              id="aim-home-checkin-shortcut-btn"
              onClick={() => onNavigateToTab('check-in')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>
          </div>
        </div>

        {/* Transportation & Vehicle Policy Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Car className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">Work Vehicle Required</div>
              <div className="text-[11px] text-amber-300/90">Employer must provide on-duty vehicle</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">No Personal Vehicle</div>
              <div className="text-[11px] text-slate-400">Strictly excluded personal car / gig driving</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Target className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">Income Urgency</div>
              <div className="text-[11px] text-indigo-300/90">Immediate income prioritized over long-term</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary OS Grid: Where you are & What changed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Where Am I Right Now? */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                1. Where You Are Right Now
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                Confirmed Context
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {rec.whereYouAre}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Primary Focus: <strong className="text-white">Immediate Income</strong></span>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Context Settings <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. What Changed Since Last Check-In? */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                2. What Changed
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/60">
                Live Audit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {rec.whatChanged}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Audit Trail: <strong className="text-white">{context.auditLog.length} events logged</strong></span>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View History <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. TODAY'S ONE MONEY MOVE (PROMINENT HERO CARD) */}
      <div
        id="aim-todays-money-move"
        className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
              Today's Money Move
            </span>
            <span className="text-xs text-indigo-300 font-mono font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ~{rec.moneyMove.timeEstimate}
            </span>
            {(rec.provenance || (rec as any).verification) && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950/80 text-emerald-300 border border-emerald-800/60 font-mono font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {String(rec.provenance?.moneyMoveSource || (rec as any).verification?.source || 'user_provided').replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Highest-probability income action
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2 leading-snug">
          {rec.moneyMove.title}
        </h2>

        {/* Detailed Explanation Breakdown (What, Why, Needed, Blockers, Done) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
            <div>
              <span className="font-bold text-indigo-300">Why this is the best move right now:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{rec.moneyMove.whyBestMove}</p>
            </div>
            <div>
              <span className="font-bold text-slate-200">What is needed:</span>
              <p className="text-slate-400 mt-0.5">{rec.moneyMove.whatIsNeeded}</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
            <div>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                What could block it:
              </span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{rec.moneyMove.whatCouldBlockIt}</p>
            </div>
            <div>
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                What "Done" looks like:
              </span>
              <p className="text-slate-300 mt-0.5">{rec.moneyMove.definitionOfDone}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            onClick={() => onNavigateToTab('scanner')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all group"
          >
            <span>Execute In Opportunity Scanner</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {topJobMatch && (
            <a
              href={topJobMatch.directApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <span>Apply Directly at {topJobMatch.employer}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>

        {(rec.provenance || (rec as any).verification) && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Source: <strong className="text-slate-300">{String(rec.provenance?.moneyMoveSource || (rec as any).verification?.source || 'user_provided').replace(/_/g, ' ')}</strong>
            </span>
            <span className="text-slate-500">
              {rec.provenance?.moneyMoveType === 'recommendation_with_verified_job'
                ? 'Verified active employer listing'
                : 'Direct action recommendation based on stored objectives'}
            </span>
          </div>
        )}
      </div>

      {/* 6. ONE SUPPORTING ACTION & 7. DEFER FOR NOW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 6. One Supporting Move */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                6. One Supporting Action
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ~{rec.supportingMove.timeEstimate}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-2">
              {rec.supportingMove.title}
            </h3>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2 my-2">
              <div>
                <span className="text-slate-400 font-semibold">Strategic Value:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{rec.supportingMove.whyBestMove}</p>
              </div>
              <div>
                <span className="text-emerald-300 font-semibold">Definition of Done:</span>
                <p className="text-slate-300 mt-0.5">{rec.supportingMove.definitionOfDone}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Target Project: Ride Guys Auto Detail</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Open Project Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 7. What Should I Intentionally Defer? */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5" />
                7. Intentionally Defer For Now
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 font-semibold border border-amber-800/50">
                Distraction Shield
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              To guarantee immediate income velocity, deliberately decline or pause work on these items:
            </p>

            <ul className="space-y-2 text-xs">
              {rec.deferForNow.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300">
                  <PauseCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Eliminates decision fatigue</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-xs text-slate-300 hover:text-white font-medium"
            >
              Manage 10 Projects
            </button>
          </div>
        </div>
      </div>

      {/* 10 Active Projects Status Quick Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Active Projects Snapshot (10 Tracked)</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('projects')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            View All & Edit <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {projects.slice(0, 6).map((proj) => {
            const isPriority1 = proj.priority === 1;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  if (onSelectProject) onSelectProject(proj.id);
                  onNavigateToTab('projects');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isPriority1
                    ? 'bg-indigo-950/40 border-indigo-700/60 hover:border-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-xs text-white truncate">
                    #{proj.priority} {proj.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      proj.status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : proj.status === 'blocked'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : proj.status === 'paused'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                  {proj.goal}
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isPriority1 ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, proj.progress))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
