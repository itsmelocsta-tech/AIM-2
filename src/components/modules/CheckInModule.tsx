import { authenticatedFetch, AuthenticationError } from '../../services/authenticatedFetch';
import React, { useState } from 'react';
import {
  Mic,
  Send,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import {
  PersonalOperatingContext,
  AIMProject,
  CheckInConflictResult,
  ProposedProjectUpdate,
} from '../../types';
import { aimContextService } from '../../services/aimContextService';

interface CheckInModuleProps {
  context: PersonalOperatingContext;
  projects: AIMProject[];
  onApplyContextUpdate: (updatedContext: PersonalOperatingContext) => void;
  onApplyProjectUpdate: (updatedProjects: AIMProject[]) => void;
  onToast: (msg: string) => void;
  onNavigateToHome: () => void;
}

export const CheckInModule: React.FC<CheckInModuleProps> = ({
  context,
  projects,
  onApplyContextUpdate,
  onApplyProjectUpdate,
  onToast,
  onNavigateToHome,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<CheckInConflictResult | null>(null);

  // Quick Action Chips
  const quickActions = [
    { label: 'I finished something', prompt: 'I finished ' },
    { label: 'I am blocked', prompt: 'I am currently blocked on ' },
    { label: 'Update a project', prompt: 'Update for project ' },
    { label: 'Change a priority', prompt: 'I want to change priority for ' },
    { label: 'Add a new project', prompt: 'I want to add a new project called ' },
    { label: 'Pause a project', prompt: 'Please pause project ' },
    { label: 'Record a job application', prompt: 'I applied for ' },
    { label: 'Update my qualifications', prompt: 'My qualifications changed: ' },
  ];

  const handleChipClick = (chipPrompt: string) => {
    setInputText((prev) => (prev ? prev + ' ' + chipPrompt : chipPrompt));
  };

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onToast('Speech recognition is not supported in this browser. Please type your update.');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
      recognition.stop();
    }
  };

  const handleAnalyzeCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    try {
      // 1. First run deterministic local check
      const localResult = aimContextService.detectConflicts(inputText, context, projects);

      // 2. Also query server check-in endpoint for deep reasoning if available
      try {
        const res = await authenticatedFetch('/api/aim/context/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: inputText,
            context,
            projects,
          }),
        });
        if (res.ok) {
          const srv = await res.json();
          if (srv.hasConflict || srv.detectedProjectChanges?.length > 0) {
            localResult.hasConflict = Boolean(localResult.hasConflict || srv.hasConflict);
            if (srv.conflicts && Array.isArray(srv.conflicts)) {
              localResult.conflicts = [...(localResult.conflicts || []), ...srv.conflicts];
            }
            localResult.userConfirmationRequired = true;
          }
        }
      } catch (err) {
        if (err instanceof AuthenticationError) return;
        console.warn('Server check-in fallback to local parser:', err);
      }

      setParsedResult(localResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (!parsedResult) return;

    // Apply project changes
    let updatedProjects = [...projects];
    if (parsedResult.detectedProjectChanges.length > 0) {
      for (const change of parsedResult.detectedProjectChanges) {
        updatedProjects = updatedProjects.map((p) => {
          if (p.id === change.projectId) {
            return {
              ...p,
              status: change.proposedStatus || p.status,
              lastCompletedAction: change.proposedLastAction || p.lastCompletedAction,
              nextAction: change.proposedNextAction || p.nextAction,
              whatChanged: `Updated via check-in: "${inputText.substring(0, 100)}"`,
              blockers: change.proposedBlocker
                ? Array.from(new Set([...p.blockers, change.proposedBlocker]))
                : p.blockers,
              lastUpdated: new Date().toISOString(),
            };
          }
          return p;
        });
      }
      onApplyProjectUpdate(updatedProjects);
    }

    // Record in audit log
    const updatedContext = {
      ...context,
      lastCheckInTime: new Date().toISOString(),
      auditLog: [
        {
          id: 'audit-' + Date.now(),
          timestamp: new Date().toISOString(),
          eventType: 'context_update' as const,
          description: `User check-in recorded: "${inputText.substring(0, 120)}"`,
        },
        ...context.auditLog,
      ],
    };
    onApplyContextUpdate(updatedContext);

    onToast('Check-in confirmed and applied successfully!');
    setParsedResult(null);
    setInputText('');
    onNavigateToHome();
  };

  return (
    <div id="check-in-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-400" />
          Smart Check-In & Context Engine
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Speak or type what you completed, what changed, or where you're blocked. AIM evaluates your update against confirmed operating facts to prevent accidental regressions.
        </p>

        {/* Quick Action Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Actions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip.prompt)}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Box with Mic & Submit */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <form onSubmit={handleAnalyzeCheckIn} className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              placeholder="e.g. 'I applied to The Parking Spot shuttle driver role' or 'Finished the BrandNMotion landing page' or 'I am blocked on the $340 deposit for Everfleet'..."
              value={inputText || ''}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Speak your update"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Updates are previewed for conflicts before saving.
            </span>

            <button
              type="submit"
              disabled={isAnalyzing || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Update...' : 'Preview & Evaluate'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preview & Conflict Review Modal / Box */}
      {parsedResult && (
        <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-5 h-5 ${
                  parsedResult.hasConflict ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <h2 className="text-base font-bold text-white">
                {parsedResult.hasConflict
                  ? 'Review Potential Operating Conflicts'
                  : 'Proposed Operating Updates'}
              </h2>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                parsedResult.hasConflict
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {parsedResult.hasConflict ? 'Confirmation Required' : 'Ready to Apply'}
            </span>
          </div>

          {/* Conflict Warning List */}
          {parsedResult.hasConflict && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-xs text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Conflict with Confirmed Operating Facts:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {parsedResult.conflicts.map((c, i) => (
                  <li key={i} className="leading-relaxed">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-400 pt-1">
                AIM never silently overwrites core constraints. Please confirm if you genuinely intend to modify these rules.
              </p>
            </div>
          )}

          {/* Detected Project Changes */}
          {parsedResult.detectedProjectChanges.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">
                Target Project Updates:
              </span>
              {parsedResult.detectedProjectChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white">{change.projectName}</span>
                    <p className="text-slate-300">{change.explanation}</p>
                    {change.proposedNextAction && (
                      <p className="text-indigo-300">
                        <strong>Proposed Next Action:</strong> {change.proposedNextAction}
                      </p>
                    )}
                  </div>
                  {change.proposedStatus && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 uppercase font-semibold">
                      {change.proposedStatus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setParsedResult(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel / Edit Input
            </button>
            <button
              type="button"
              onClick={handleConfirmAndApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Apply Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
