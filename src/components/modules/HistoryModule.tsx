import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  PersonalOperatingContext,
  JobScanRun,
  JobMaterialChange,
  AIMProject,
} from '../../types';
import { jobScannerService } from '../../services/jobScannerService';

interface HistoryModuleProps {
  context: PersonalOperatingContext;
  projects: AIMProject[];
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({ context, projects }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scanRuns = jobScannerService.getScanRuns();
  const materialChanges = jobScannerService.getMaterialChanges();
  const auditLogs = context.auditLog || [];

  return (
    <div id="history-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              AIM Audit History & Timeline
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete chronological ledger of job scans, material market updates, project milestones, and operating context changes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Logged Events: <strong className="text-white">{auditLogs.length + scanRuns.length + materialChanges.length}</strong></span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All History' },
            { id: 'scans', label: `Job Scans (${scanRuns.length})` },
            { id: 'material_changes', label: `Market Changes (${materialChanges.length})` },
            { id: 'projects', label: `Context & Projects (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Material Market Changes Highlight */}
      {(filterType === 'all' || filterType === 'material_changes') && materialChanges.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Detected Material Market Changes (Pay & Requirements)
            </h2>
          </div>

          <div className="space-y-2">
            {materialChanges.map((ch) => (
              <div
                key={ch.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{ch.employer}</strong>
                    <span className="text-slate-400">• {ch.role}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 uppercase font-bold border border-emerald-800">
                      {ch.changeType}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{ch.summary}</p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono shrink-0">
                  {new Date(ch.detectedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Scanner Runs History */}
      {(filterType === 'all' || filterType === 'scans') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Opportunity Scanner Runs (DFW Corridor)
            </h2>
          </div>

          <div className="space-y-2.5">
            {scanRuns.map((run) => (
              <div
                key={run.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {run.searchCenter} ({run.searchRadiusMiles} mi radius)
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        run.status === 'success'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300'
                      }`}
                    >
                      {run.status}
                    </span>
                    {run.isWeekdayScheduled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-medium border border-indigo-800">
                        Scheduled 7:30 AM
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(run.scanCompletionTime).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{run.summaryMessage}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Candidates: <strong className="text-white">{run.candidatesFound}</strong></span>
                  <span>Excluded (CDL/Personal Car/Labor): <strong className="text-amber-400">{run.excludedCount}</strong></span>
                  <span>New Matches: <strong className="text-emerald-400">{run.newMatchesCount}</strong></span>
                  <span>Changes: <strong className="text-indigo-400">{run.materialChangesCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context & Project Audit Logs */}
      {(filterType === 'all' || filterType === 'projects') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Context, Milestone & Priority Audit Trail
            </h2>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-semibold">
                      {(log.eventType || log.actionType || 'Update').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300">{log.description}</p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
