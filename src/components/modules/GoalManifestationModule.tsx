import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Cloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Goal, GoalMilestone, AIMCategory, AIM_CATEGORIES, UserProfile } from '../../types';
import { api } from '../../services/api';
import { driveService } from '../../services/driveService';

interface GoalManifestationProps {
  goals: Goal[];
  userProfile: UserProfile;
  onUpdateGoals: (goals: Goal[]) => void;
  onToast: (msg: string) => void;
}

export const GoalManifestationModule: React.FC<GoalManifestationProps> = ({
  goals,
  userProfile,
  onUpdateGoals,
  onToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [recalculatingGoalId, setRecalculatingGoalId] = useState<string | null>(null);

  // New Goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newWhy, setNewWhy] = useState('');
  const [newCategory, setNewCategory] = useState<AIMCategory>('Finances');
  const [newTargetDate, setNewTargetDate] = useState('2026-11-30');
  const [newRevenue, setNewRevenue] = useState<number>(5000);
  const [newObstacles, setNewObstacles] = useState('');

  // Toggle milestone completion
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        return {
          ...g,
          milestones: updatedMilestones,
          currentProgress: newProgress,
          status: newProgress === 100 ? ('completed' as const) : ('active' as const),
        };
      }
      return g;
    });
    onUpdateGoals(updated);
  };

  // Add new Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newWhy.trim()) return;

    const obstaclesList = newObstacles
      ? newObstacles.split(',').map((s) => s.trim())
      : ['Maintaining sustained execution'];

    const newGoal: Goal = {
      id: 'goal-' + Date.now(),
      title: newTitle.trim(),
      why: newWhy.trim(),
      category: newCategory,
      targetDate: newTargetDate,
      currentProgress: 15,
      obstacles: obstaclesList,
      milestones: [
        { id: 'm-1', title: 'Define immediate 48-hour action sprint', completed: true },
        { id: 'm-2', title: 'Execute primary high-leverage milestones', completed: false },
        { id: 'm-3', title: 'Lock in recurring results and systematize', completed: false },
      ],
      status: 'active',
      revenuePotential: Number(newRevenue) || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdateGoals([newGoal, ...goals]);
    setNewTitle('');
    setNewWhy('');
    setNewObstacles('');
    setIsAddingGoal(false);
    onToast(`New Goal "${newGoal.title}" locked into your life trajectory!`);
  };

  // AIM Intelligent Recalculation (Never Shame, Always Recalculate)
  const handleRecalculateGoal = async (goal: Goal) => {
    setRecalculatingGoalId(goal.id);
    try {
      const response = await api.chatWithAIM({
        message: `I need to recalculate my path for the goal: "${goal.title}". Why: "${goal.why}". Current obstacles: ${goal.obstacles.join(', ')}. Create a fresh, realistic, high-leverage 3-step action plan to regain unstoppable momentum without guilt or overwhelm.`,
        history: [],
        userProfile,
        contextCategory: goal.category,
      });

      const updated = goals.map((g) => {
        if (g.id === goal.id) {
          return {
            ...g,
            status: 'active' as const,
            recalculatedPath: response.reply,
          };
        }
        return g;
      });

      onUpdateGoals(updated);
      onToast('Path recalculated! Check the updated trajectory advice.');
    } catch (e) {
      onToast('Error recalculating goal');
    } finally {
      setRecalculatingGoalId(null);
    }
  };

  // Export Goal Blueprint to Google Drive
  const handleExportGoalToDrive = async (goal: Goal) => {
    const markdown = `# AIM Goal Trajectory Blueprint: ${goal.title}\n\n**Category:** ${goal.category}\n**Target Date:** ${goal.targetDate}\n**Progress:** ${goal.currentProgress}%\n${goal.revenuePotential ? `**Revenue Impact:** $${goal.revenuePotential.toLocaleString()}/mo\n` : ''}\n\n## The Deep 'Why'\n${goal.why}\n\n## Known Obstacles & Root Causes\n${goal.obstacles.map((o) => `- ${o}`).join('\n')}\n\n## Milestone Ladder\n${goal.milestones.map((m) => `- [${m.completed ? 'x' : ' '}] ${m.title}`).join('\n')}\n\n${goal.recalculatedPath ? `## Recalculated Trajectory Guidance\n${goal.recalculatedPath}\n` : ''}\n---\n*Exported from AIM (Artificial Intelligence for Manifestation) Life OS.*`;

    try {
      const res = await driveService.exportDocumentToDrive({
        title: `Goal - ${goal.title}`,
        content: markdown,
      });
      if (res.success) {
        onToast('Goal Blueprint saved to Google Drive!');
      }
    } catch (e) {
      onToast('Error saving to Google Drive');
    }
  };

  const filteredGoals = selectedCategory === 'All'
    ? goals
    : goals.filter((g) => g.category === selectedCategory);

  return (
    <div id="goal-manifestation-module" className="space-y-8 animate-fadeIn">
      {/* Top Banner: Identity & Trajectory Anchor */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
            Identity Manifestation Trajectory
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Who You Are Becoming
          </h2>
          <p className="text-xs text-indigo-200 font-medium">
            "{userProfile.desiredIdentity}"
          </p>
        </div>

        <button
          onClick={() => setIsAddingGoal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {/* Add Goal Modal / Drawer */}
      {isAddingGoal && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Define New Goal & Manifestation Anchor</span>
            </h3>
            <button onClick={() => setIsAddingGoal(false)} className="text-xs text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Goal Title *</label>
              <input
                type="text"
                required
                value={newTitle || ''}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Generate $15,000/month recurring income with 5 retainer clients"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                The Deep "Why" (Who will this help you become?) *
              </label>
              <textarea
                rows={2}
                required
                value={newWhy || ''}
                onChange={(e) => setNewWhy(e.target.value)}
                placeholder="e.g. Total financial autonomy so I can provide for my family, invest in deep creative projects, and operate from freedom rather than anxiety."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={newCategory || 'Finances'}
                onChange={(e) => setNewCategory(e.target.value as AIMCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {AIM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
              <input
                type="date"
                value={newTargetDate || ''}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Revenue Impact ($)</label>
              <input
                type="number"
                value={newRevenue ?? 0}
                onChange={(e) => setNewRevenue(Number(e.target.value))}
                placeholder="5000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Known Obstacles (comma separated)</label>
              <input
                type="text"
                value={newObstacles || ''}
                onChange={(e) => setNewObstacles(e.target.value)}
                placeholder="e.g. Scrambled daily focus, fear of cold outreach"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingGoal(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {['All', 'Finances', 'Business', 'Health', 'Personal', 'Projects'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => (
          <div
            key={goal.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Category & Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-800/80">
                    {goal.category}
                  </span>
                  {goal.revenuePotential && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-800/80">
                      <DollarSign className="w-3 h-3" />
                      +${goal.revenuePotential.toLocaleString()}/mo
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">Target: {goal.targetDate}</span>
              </div>

              {/* Goal Title & Why */}
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{goal.title}</h3>
                <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
                  "{goal.why}"
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Progress Trajectory</span>
                  <span className="text-emerald-400">{goal.currentProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${goal.currentProgress}%` }}
                  />
                </div>
              </div>

              {/* Milestones Checklist */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Milestone Ladder
                </span>
                <div className="space-y-2">
                  {goal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(goal.id, m.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                        m.completed
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 line-through'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${m.completed ? 'text-emerald-400' : 'text-slate-600'}`}
                      />
                      <span>{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Obstacles Diagnostic */}
              {goal.obstacles.length > 0 && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-semibold text-amber-300 block mb-1 text-[11px]">
                    Identified Constraints & Obstacles:
                  </span>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    {goal.obstacles.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recalculated Guidance */}
              {goal.recalculatedPath && (
                <div className="bg-indigo-950/40 border border-indigo-800/60 p-3 rounded-xl text-xs text-indigo-200">
                  <span className="font-bold text-indigo-300 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AIM Recalculated Trajectory:</span>
                  </span>
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {goal.recalculatedPath}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Recalculate + Google Drive Export */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleRecalculateGoal(goal)}
                disabled={recalculatingGoalId === goal.id}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${recalculatingGoalId === goal.id ? 'animate-spin' : ''}`}
                />
                <span>{recalculatingGoalId === goal.id ? 'Recalculating...' : 'Recalculate Path'}</span>
              </button>

              <button
                onClick={() => handleExportGoalToDrive(goal)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Export Goal to Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save to Drive</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
