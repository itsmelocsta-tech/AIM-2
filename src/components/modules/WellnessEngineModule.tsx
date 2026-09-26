import React, { useState } from 'react';
import {
  Heart,
  Moon,
  Activity,
  Apple,
  Smile,
  Trees,
  Focus,
  Plus,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { WellnessLog } from '../../types';
import { getTodayDateString } from '../../utils/dateTimeUtils';

interface WellnessEngineProps {
  wellnessLogs: WellnessLog[];
  timeZone?: string;
  onUpdateLogs: (logs: WellnessLog[]) => void;
  onToast: (msg: string) => void;
}

export const WellnessEngineModule: React.FC<WellnessEngineProps> = ({
  wellnessLogs,
  timeZone,
  onUpdateLogs,
  onToast,
}) => {
  const latestLog = wellnessLogs[0] || {
    id: 'well-init',
    date: getTodayDateString(timeZone),
    sleepHours: 7.5,
    sleepQuality: 8,
    movementMinutes: 45,
    movementType: 'Strength & Walking',
    nutritionRating: 8,
    stressLevel: 3,
    focusHours: 5,
    timeInNatureMinutes: 30,
    notes: 'Feeling energized and focused.',
  };

  const [sleepHours, setSleepHours] = useState(latestLog.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState(latestLog.sleepQuality ?? 8);
  const [movementMinutes, setMovementMinutes] = useState(latestLog.movementMinutes ?? 45);
  const [movementType, setMovementType] = useState(latestLog.movementType || 'Strength & Walking');
  const [nutritionRating, setNutritionRating] = useState(latestLog.nutritionRating ?? 8);
  const [stressLevel, setStressLevel] = useState(latestLog.stressLevel ?? 3);
  const [focusHours, setFocusHours] = useState(latestLog.focusHours ?? 5);
  const [timeInNature, setTimeInNature] = useState(latestLog.timeInNatureMinutes ?? 30);
  const [wellnessNotes, setWellnessNotes] = useState(latestLog.notes || '');

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = getTodayDateString(timeZone);
    const newLog: WellnessLog = {
      id: 'well-' + Date.now(),
      date: todayStr,
      sleepHours,
      sleepQuality,
      movementMinutes,
      movementType,
      nutritionRating,
      stressLevel,
      focusHours,
      timeInNatureMinutes: timeInNature,
      notes: wellnessNotes,
    };

    onUpdateLogs([newLog, ...wellnessLogs.filter((l) => l.date !== todayStr)]);
    onToast('Today’s Whole-Person Vitality logged!');
  };

  const evidenceHabits = [
    { title: 'Morning Sunlight (10-15m)', category: 'Circadian', desc: 'Sets cortisol spike & nighttime melatonin release' },
    { title: 'Electrolyte & Mineral Hydration', category: 'Energy', desc: '500ml water + pinch of sea salt upon waking' },
    { title: '90-Minute Focused Deep Sprint', category: 'Cognition', desc: 'Zero notifications during peak morning energy' },
    { title: 'Zone 2 / Strength Movement (45m)', category: 'Longevity', desc: 'Maintains insulin sensitivity and brain-derived neurotrophic factor (BDNF)' },
    { title: '10:30 PM Screen Sunset', category: 'Recovery', desc: 'Eliminate high blue-light 60 min before sleep' },
  ];

  return (
    <div id="wellness-engine-module" className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Whole-Person Wellness & Vitality Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            High income and high impact require peak physical stamina, neurological clarity, and deep recovery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Daily Vitality Metric Logger (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveLog} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Today’s Wellness Calibration</span>
              <span className="text-xs font-normal text-slate-400">{new Date().toLocaleDateString()}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sleep Hours */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sleep Duration</span>
                  </span>
                  <strong className="text-indigo-400 font-bold">{sleepHours} hrs</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="11"
                  step="0.5"
                  value={sleepHours ?? 7.5}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Sleep Quality */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sleep Quality</span>
                  </span>
                  <strong className="text-amber-400 font-bold">{sleepQuality} / 10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality ?? 8}
                  onChange={(e) => setSleepQuality(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Movement */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Movement / Training</span>
                  </span>
                  <strong className="text-emerald-400 font-bold">{movementMinutes} mins</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={movementMinutes ?? 45}
                  onChange={(e) => setMovementMinutes(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Nutrition Rating */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Apple className="w-3.5 h-3.5 text-rose-400" />
                    <span>Nutrition & Clean Fuel</span>
                  </span>
                  <strong className="text-rose-400 font-bold">{nutritionRating} / 10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={nutritionRating ?? 8}
                  onChange={(e) => setNutritionRating(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Stress Level */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-sky-400" />
                    <span>Stress Friction</span>
                  </span>
                  <strong className="text-sky-400 font-bold">{stressLevel} / 10</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel ?? 3}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Nature / Outdoor Walk */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-teal-400" />
                    <span>Time in Nature / Fresh Air</span>
                  </span>
                  <strong className="text-teal-400 font-bold">{timeInNature} mins</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={timeInNature ?? 30}
                  onChange={(e) => setTimeInNature(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Body, Energy & Recovery Notes
              </label>
              <textarea
                rows={2}
                value={wellnessNotes || ''}
                onChange={(e) => setWellnessNotes(e.target.value)}
                placeholder="How does your physical stamina and mental focus feel today?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Update Vitality Log
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Evidence-Based Whole-Person Habits (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Evidence-Based Vitality Rituals</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non-negotiable foundational habits proven by neuroscience and physiology to maximize execution bandwidth.
            </p>

            <div className="space-y-3">
              {evidenceHabits.map((habit, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-950 text-rose-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-rose-800">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{habit.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase font-semibold">
                        {habit.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{habit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
