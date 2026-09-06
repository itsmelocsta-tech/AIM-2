import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Target,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface FoundationSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetAllData?: () => void;
  onToast: (msg: string) => void;
}

export const FoundationSessionModal: React.FC<FoundationSessionModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  onResetAllData,
  onToast,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [desiredIdentity, setDesiredIdentity] = useState(userProfile.desiredIdentity);
  const [coreMission, setCoreMission] = useState(userProfile.coreMission);
  const [currentMonthlyIncome, setCurrentMonthlyIncome] = useState(userProfile.currentMonthlyIncome);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(userProfile.targetMonthlyIncome);
  const [primaryObstacle, setPrimaryObstacle] = useState(userProfile.primaryObstacle);
  const [topSkills, setTopSkills] = useState(userProfile.topSkills.join(', '));
  const [coreValues, setCoreValues] = useState(userProfile.coreValues.join(', '));
  const [ninetyDayTrajectory, setNinetyDayTrajectory] = useState(userProfile.ninetyDayTrajectory);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      return;
    }
    if (onResetAllData) {
      onResetAllData();
      setIsConfirmingReset(false);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim(),
      desiredIdentity: desiredIdentity.trim(),
      coreMission: coreMission.trim(),
      currentMonthlyIncome: Number(currentMonthlyIncome) || 0,
      targetMonthlyIncome: Number(targetMonthlyIncome) || 15000,
      primaryObstacle: primaryObstacle.trim(),
      topSkills: topSkills.split(',').map((s) => s.trim()).filter(Boolean),
      coreValues: coreValues.split(',').map((v) => v.trim()).filter(Boolean),
      ninetyDayTrajectory: ninetyDayTrajectory.trim(),
      onboardingCompleted: true,
    };

    onSaveProfile(updated);
    onToast('Identity & Financial Trajectory Calibrated!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                AIM Foundation Session: Identity Calibration
              </h2>
              <p className="text-xs text-slate-400">
                AIM doesn’t just remember what you said—it remembers who you are trying to become.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Monthly Cash Flow ($ USD)
              </label>
              <input
                type="number"
                required
                value={targetMonthlyIncome}
                onChange={(e) => setTargetMonthlyIncome(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Who are you trying to become? (Dream Identity Anchor) *
            </label>
            <input
              type="text"
              required
              value={desiredIdentity}
              onChange={(e) => setDesiredIdentity(e.target.value)}
              placeholder="e.g. Elite High-Leverage Consultant & Digital Asset Builder"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Core Mission & Life Purpose *
            </label>
            <textarea
              rows={2}
              required
              value={coreMission}
              onChange={(e) => setCoreMission(e.target.value)}
              placeholder="e.g. Generate $15k+/mo recurring cashflow while building scalable equity and living in peak physical vitality."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              What is the single biggest obstacle standing in your way right now?
            </label>
            <textarea
              rows={2}
              value={primaryObstacle}
              onChange={(e) => setPrimaryObstacle(e.target.value)}
              placeholder="e.g. Inconsistent daily outreach momentum, fragmented attention during morning work hours."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monetizable Skills (comma separated)
              </label>
              <input
                type="text"
                value={topSkills}
                onChange={(e) => setTopSkills(e.target.value)}
                placeholder="Strategic Advisory, Copywriting, AI Workflows, Design"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Core Values (comma separated)
              </label>
              <input
                type="text"
                value={coreValues}
                onChange={(e) => setCoreValues(e.target.value)}
                placeholder="Freedom, Relentless Execution, Whole-Person Health"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              90-Day Trajectory Milestone
            </label>
            <input
              type="text"
              value={ninetyDayTrajectory}
              onChange={(e) => setNinetyDayTrajectory(e.target.value)}
              placeholder="Close 5 high-ticket retainer clients @ $3,000/mo, publish core masterclass asset."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onResetAllData ? (
              <div>
                {isConfirmingReset ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Confirm Reset Everything</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Data & Restart as New User</span>
                  </button>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Calibrate & Save Trajectory
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
