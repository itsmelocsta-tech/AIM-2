import React, { useState } from 'react';
import {
  Calendar,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Cloud,
  ChevronRight,
  Plus,
  RefreshCw,
  Layers,
  BarChart2,
  GitCommit,
  CheckSquare,
  Flame,
  Target,
} from 'lucide-react';
import { DailyPlan, PriorityTask, TimeBlock, UserProfile, Goal } from '../../types';
import { api } from '../../services/api';
import { driveService } from '../../services/driveService';
import { ensureDetailedTaskGuidance } from '../../utils/taskGuidance';

interface DailyPlannerProps {
  dailyPlan: DailyPlan;
  userProfile: UserProfile;
  goals: Goal[];
  onUpdatePlan: (plan: DailyPlan) => void;
  onToast: (msg: string) => void;
}

type PlannerHorizon = 'today' | 'weekly' | 'monthly' | 'timeline';

export const DailyPlannerModule: React.FC<DailyPlannerProps> = ({
  dailyPlan,
  userProfile,
  goals,
  onUpdatePlan,
  onToast,
}) => {
  const [plannerHorizon, setPlannerHorizon] = useState<PlannerHorizon>('today');
  const [activeMode, setActiveMode] = useState<'plan' | 'morning_align' | 'evening_review'>('plan');
  const [energyLevel, setEnergyLevel] = useState(dailyPlan?.energyLevel ?? 8);
  const [availableHours, setAvailableHours] = useState(dailyPlan?.availableHours ?? 8);
  const [morningNotes, setMorningNotes] = useState('');
  const [eveningNotes, setEveningNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  // New task input
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = dailyPlan.priorityTasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = { ...dailyPlan, priorityTasks: updatedTasks };
    onUpdatePlan(updated);
  };

  // Toggle timeblock completion
  const handleToggleBlock = (blockId: string) => {
    const updatedBlocks = dailyPlan.timeBlocks.map((b) =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    );
    const updated = { ...dailyPlan, timeBlocks: updatedBlocks };
    onUpdatePlan(updated);
  };

  // Add custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: PriorityTask = {
      id: 'pt-' + Date.now(),
      task: newTaskTitle.trim(),
      description: ensureDetailedTaskGuidance(newTaskTitle.trim()),
      category: 'Business',
      timeEstimate: '45m',
      impact: 'High',
      completed: false,
    };

    onUpdatePlan({
      ...dailyPlan,
      priorityTasks: [...dailyPlan.priorityTasks, newTask],
    });
    setNewTaskTitle('');
    onToast('Priority task added to today’s plan.');
  };

  // Run Morning Alignment with AIM AI
  const handleGenerateMorningPlan = async () => {
    setIsGenerating(true);
    try {
      const activeGoalTitles = goals.filter((g) => g.status === 'active').map((g) => g.title);
      const planData = await api.generateDailyPlan({
        type: 'morning',
        energyLevel,
        availableHours,
        goals: activeGoalTitles,
        dayNotes: morningNotes,
      });

      if (planData) {
        const newPlan: DailyPlan = {
          date: dailyPlan.date,
          theme: planData.theme || 'High-Leverage Daily Execution',
          energyLevel,
          availableHours,
          priorityTasks: planData.topThreePriorityTasks?.map((t: any, idx: number) => ({
            id: 'pt-' + idx + '-' + Date.now(),
            task: t.task,
            description: ensureDetailedTaskGuidance(t.task, t.description),
            category: t.category || 'Business',
            timeEstimate: t.timeEstimate || '60m',
            impact: t.impact || 'High',
            completed: false,
          })) || dailyPlan.priorityTasks,
          timeBlocks: planData.timeBlocks?.map((b: any, idx: number) => ({
            id: 'tb-' + idx + '-' + Date.now(),
            time: b.time,
            title: b.title,
            details: ensureDetailedTaskGuidance(b.title, b.details),
            completed: false,
          })) || dailyPlan.timeBlocks,
          mindsetReminder: planData.mindsetReminder || 'Focus strictly on compounding actions.',
          notes: morningNotes || dailyPlan.notes,
        };

        onUpdatePlan(newPlan);
        setActiveMode('plan');
        onToast('Ideal Day Master Plan generated!');
      }
    } catch (e) {
      onToast('Error generating morning plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Evening Reflection with AIM AI
  const handleGenerateEveningReview = async () => {
    setIsGenerating(true);
    try {
      const completedCount = dailyPlan.priorityTasks.filter((t) => t.completed).length;
      const totalCount = dailyPlan.priorityTasks.length;
      const combinedNotes = `Completed ${completedCount} of ${totalCount} priority tasks. User reflection: ${eveningNotes}`;

      const reviewData = await api.generateDailyPlan({
        type: 'evening',
        energyLevel,
        availableHours,
        goals: goals.map((g) => g.title),
        dayNotes: combinedNotes,
      });

      if (reviewData) {
        const updatedPlan: DailyPlan = {
          ...dailyPlan,
          eveningReflection: {
            summary: reviewData.summary || 'Solid consistency and forward progress today.',
            winsAcknowledged: reviewData.winsAcknowledged || ['Advanced core priorities'],
            patternsIdentified: reviewData.patternsIdentified || ['Maintained focus on revenue tasks'],
            adjustmentsForTomorrow: reviewData.adjustmentsForTomorrow || ['Protect morning deep-work blocks'],
            closingThought: reviewData.closingThought || 'Every focused day brings you closer to your vision.',
          },
        };

        onUpdatePlan(updatedPlan);
        setActiveMode('plan');
        onToast('Evening Reflection & Trajectory Recalculated!');
      }
    } catch (e) {
      onToast('Error generating evening review');
    } finally {
      setIsGenerating(false);
    }
  };

  // Sync Daily Plan to Google Drive
  const handleSyncToDrive = async () => {
    setIsSyncingDrive(true);
    const content = `# AIM Daily Execution Plan - ${dailyPlan.date}\n\n**Focus Theme:** ${dailyPlan.theme}\n**Energy Level:** ${dailyPlan.energyLevel}/10\n**Mindset Anchor:** "${dailyPlan.mindsetReminder}"\n\n## Top Priority Tasks\n${dailyPlan.priorityTasks
      .map((t) => `- [${t.completed ? 'x' : ' '}] **${t.task}** (${t.category}, ${t.timeEstimate}, Impact: ${t.impact})`)
      .join('\n')}\n\n## Time Blocks\n${dailyPlan.timeBlocks
      .map((b) => `- [${b.completed ? 'x' : ' '}] **${b.time}** - ${b.title} (${b.details})`)
      .join('\n')}\n\n${
      dailyPlan.eveningReflection
        ? `## Evening Reflection & Recalculation\n**Summary:** ${dailyPlan.eveningReflection.summary}\n**Wins:**\n${dailyPlan.eveningReflection.winsAcknowledged
            .map((w) => `- ${w}`)
            .join('\n')}\n**Adjustments for Tomorrow:**\n${dailyPlan.eveningReflection.adjustmentsForTomorrow
            .map((a) => `- ${a}`)
            .join('\n')}\n`
        : ''
    }\n---\n*Synced from AIM Life Operating System.*`;

    try {
      const res = await driveService.exportDocumentToDrive({
        title: `AIM Daily Plan - ${dailyPlan.date}`,
        content,
      });
      if (res.success) {
        onToast('Daily Plan synced directly to Google Drive!');
      }
    } catch (e) {
      onToast('Error syncing to Drive');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const completedTasksCount = dailyPlan.priorityTasks.filter((t) => t.completed).length;

  return (
    <div id="daily-planner-module" className="space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daily Master Planner & Reflection Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {dailyPlan.date} • Theme: <strong className="text-indigo-300 font-semibold">{dailyPlan.theme}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveMode('morning_align')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Morning Align</span>
          </button>

          <button
            onClick={() => setActiveMode('evening_review')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evening Review</span>
          </button>

          <button
            onClick={handleSyncToDrive}
            disabled={isSyncingDrive}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Sync Plan to Google Drive"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Morning Alignment Modal / Drawer */}
      {activeMode === 'morning_align' && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Morning Alignment: "How do you want today to go?"</h3>
            </div>
            <button onClick={() => setActiveMode('plan')} className="text-xs text-slate-400 hover:text-slate-200">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Energy Level (1-10): <strong className="text-amber-400">{energyLevel}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel ?? 8}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Available Productive Hours: <strong className="text-indigo-400">{availableHours} hrs</strong>
              </label>
              <input
                type="range"
                min="2"
                max="14"
                value={availableHours ?? 8}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              What is your primary intent, responsibilities, or known obstacles for today?
            </label>
            <textarea
              rows={3}
              value={morningNotes || ''}
              onChange={(e) => setMorningNotes(e.target.value)}
              placeholder="e.g. Focus on closing the $3,500 proposal with Alex, ship project deliverables, keep energy high, and hit the gym at 4:30pm."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setActiveMode('plan')}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateMorningPlan}
              disabled={isGenerating}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Synthesizing Master Plan...' : 'Generate Ideal Plan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Evening Review Modal / Drawer */}
      {activeMode === 'evening_review' && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Evening Reflection: "How was your day?"</h3>
            </div>
            <button onClick={() => setActiveMode('plan')} className="text-xs text-slate-400 hover:text-slate-200">
              Close
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            AIM never shames missed tasks. We reflect, celebrate wins, extract patterns, and recalculate tomorrow’s trajectory with precision.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              What went well, what friction occurred, and what did you learn today?
            </label>
            <textarea
              rows={4}
              value={eveningNotes || ''}
              onChange={(e) => setEveningNotes(e.target.value)}
              placeholder="e.g. Sent all 15 pitches, followed up with 2 clients. Got tired around 2pm, should take a 15 min fresh air break. Feeling excited about tomorrow."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setActiveMode('plan')}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateEveningReview}
              disabled={isGenerating}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing & Recalculating...' : 'Complete Evening Reflection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Header: Horizon Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setPlannerHorizon('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              plannerHorizon === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPlannerHorizon('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              plannerHorizon === 'weekly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPlannerHorizon('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              plannerHorizon === 'monthly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlannerHorizon('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              plannerHorizon === 'timeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Timeline
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          {plannerHorizon === 'today' && 'Daily execution & time blocks'}
          {plannerHorizon === 'weekly' && '7-day momentum & pacing'}
          {plannerHorizon === 'monthly' && '30-day identity manifestation'}
          {plannerHorizon === 'timeline' && 'Adaptive trajectory history'}
        </span>
      </div>

      {/* HORIZON VIEW: TODAY */}
      {plannerHorizon === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Left Column: Top 3 Priority Tasks (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Today’s High-Impact Priorities</span>
                </h3>
                <span className="text-xs text-emerald-400 font-semibold">
                  {completedTasksCount} / {dailyPlan.priorityTasks.length} Done
                </span>
              </div>

              <div className="space-y-3">
                {dailyPlan.priorityTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      t.completed
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      <CheckCircle2
                        className={`w-4 h-4 ${t.completed ? 'text-emerald-400' : 'text-slate-600'}`}
                      />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className={`font-semibold ${t.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                        {t.task}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {t.category}
                        </span>
                        <span>{t.timeEstimate}</span>
                        <span className={`font-semibold ${t.impact === 'High' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {t.impact} Impact
                        </span>
                      </div>
                      {t.description && (
                        <div className="mt-2.5 text-[11px] text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Action Steps (What to do):
                          </span>
                          <div className="whitespace-pre-line text-slate-300">
                            {t.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Task Add */}
              <form onSubmit={handleAddTask} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={newTaskTitle || ''}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="+ Add another priority task..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Mindset Anchor Card */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Psychological Anchor
              </span>
              <p className="text-xs text-indigo-200 font-medium italic leading-relaxed">
                "{dailyPlan.mindsetReminder}"
              </p>
            </div>

            {/* Evening Reflection Summary (if completed) */}
            {dailyPlan.eveningReflection && (
              <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-5 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Evening Trajectory Calibration</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dailyPlan.eveningReflection.summary}
                </p>
                <div className="space-y-1 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block">Identified Patterns:</span>
                  {dailyPlan.eveningReflection.patternsIdentified.map((p, i) => (
                    <div key={i} className="text-indigo-300 text-[11px]">• {p}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Time Blocks (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Daily Execution Schedule & Time Blocks</span>
                </h3>
                <span className="text-xs text-slate-400">{dailyPlan.availableHours} Productive Hours</span>
              </div>

              <div className="space-y-3">
                {dailyPlan.timeBlocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => handleToggleBlock(block.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                      block.completed
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      <CheckCircle2
                        className={`w-4 h-4 ${block.completed ? 'text-emerald-400' : 'text-slate-600'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${block.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {block.title}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800 shrink-0">
                          {block.time}
                        </span>
                      </div>
                      {block.details && (
                        <div className="mt-2 text-[11px] text-slate-300 leading-relaxed bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                            Execution Details:
                          </span>
                          <div className="whitespace-pre-line text-slate-200">
                            {block.details}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HORIZON VIEW: WEEKLY */}
      {plannerHorizon === 'weekly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>7-Day Strategic Momentum Pacing</span>
            </h3>
            <span className="text-xs text-indigo-300 font-mono">Week Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={day}
                  className={`p-4 rounded-xl border flex flex-col justify-between min-h-[140px] ${
                    isToday
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                      : 'bg-slate-950 border-slate-800/80'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium">
                      {isToday
                        ? dailyPlan.priorityTasks[0]?.task || 'Core Priority Sprint'
                        : `Phase ${idx + 1} Execution Block`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{isToday ? `${dailyPlan.availableHours}h focus` : '6-8h focus'}</span>
                    <span className="text-emerald-400 font-semibold">{isToday ? 'Active' : 'Queued'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HORIZON VIEW: MONTHLY */}
      {plannerHorizon === 'monthly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>30-Day Identity & Milestone Roadmap</span>
            </h3>
            <span className="text-xs text-slate-400">{goals.length} Active Target Goals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g, idx) => (
              <div key={g.id || idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{g.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800">
                    {g.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic">"{g.why}"</p>
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  {g.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="text-[11px] text-slate-300 flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HORIZON VIEW: TIMELINE */}
      {plannerHorizon === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-indigo-400" />
              <span>Continuous Execution Timeline & GPS Recalibration Trail</span>
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 border-l-2 border-slate-800">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-950" />
              <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-indigo-400 font-mono">CURRENT TRAJECTORY</span>
                <h4 className="text-xs font-bold text-white">{dailyPlan.theme}</h4>
                <p className="text-xs text-slate-400">
                  {dailyPlan.priorityTasks.length} active priority tasks aligned with target identity: "{userProfile.desiredIdentity || 'High Performer'}".
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-950" />
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">90-DAY DESTINATION</span>
                <h4 className="text-xs font-bold text-slate-200">Core Identity Manifestation</h4>
                <p className="text-xs text-slate-400">
                  {userProfile.ninetyDayTrajectory || 'Consistent compounding execution of high-leverage milestones.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
