import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  FileText,
  Lock,
  LogOut,
} from 'lucide-react';
import { DriveSyncState, UserProfile, Goal, DailyPlan, MemoryItem } from '../../types';
import { driveService } from '../../services/driveService';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveState: Partial<DriveSyncState>;
  userProfile: UserProfile;
  goals: Goal[];
  dailyPlan: DailyPlan;
  memories: MemoryItem[];
  onUpdateDriveState: (state: Partial<DriveSyncState>) => void;
  onToast: (msg: string) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  driveState,
  userProfile,
  goals,
  dailyPlan,
  memories,
  onUpdateDriveState,
  onToast,
}) => {
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await driveService.requestAccessToken();
      const newState = driveService.getStoredState();
      onUpdateDriveState(newState);
      onToast('Connected to Google Drive successfully!');
    } catch (e: any) {
      onToast(`Google Drive connection failed: ${e.message || 'Authentication error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    driveService.disconnect();
    onUpdateDriveState(driveService.getStoredState());
    onToast('Disconnected from Google Drive.');
  };

  const handleSyncFullWorkspaceToDrive = async () => {
    setIsSyncingAll(true);
    try {
      const fullBlueprintMarkdown = `# AIM (Artificial Intelligence for Manifestation) - Master Life OS Blueprint
**Owner:** ${userProfile.name} (${userProfile.email})
**Generated Date:** ${new Date().toLocaleString()}

---

## 1. Identity & 90-Day Trajectory
- **Desired Identity:** ${userProfile.desiredIdentity}
- **Core Mission:** ${userProfile.coreMission}
- **Primary Obstacle & Constraint:** ${userProfile.primaryObstacle}
- **Core Values:** ${userProfile.coreValues.join(', ')}
- **90-Day Trajectory:** ${userProfile.ninetyDayTrajectory}

---

## 2. Active Manifestation & Life Goals
${goals
  .map(
    (g) => `### ${g.title} (${g.category})
- **Target Date:** ${g.targetDate}
- **Progress:** ${g.currentProgress}%
- **Why:** ${g.why}
- **Milestones:**
${g.milestones.map((m) => `  - [${m.completed ? 'x' : ' '}] ${m.title}`).join('\n')}
`
  )
  .join('\n')}

---

## 3. Today's Daily Execution Master Plan (${dailyPlan.date})
- **Theme:** ${dailyPlan.theme}
- **Energy Level:** ${dailyPlan.energyLevel}/10
- **Mindset Anchor:** "${dailyPlan.mindsetReminder}"
- **Priority Tasks:**
${dailyPlan.priorityTasks.map((t) => `- [${t.completed ? 'x' : ' '}] ${t.task} (${t.timeEstimate}, ${t.category})`).join('\n')}

---

## 4. Memory Vault & Key Frameworks (${memories.length} Items)
${memories
  .map(
    (m) => `### [${m.category}] ${m.title}
*Tags: ${m.tags.join(', ')} | Importance: ${m.importance}*
${m.content}
`
  )
  .join('\n')}

---
*Created and synchronized by AIM Life Operating System.*`;


      const res = await driveService.exportDocumentToDrive({
        title: `AIM_Master_Life_Blueprint_${new Date().toISOString().split('T')[0]}`,
        content: fullBlueprintMarkdown,
      });

      if (res.success) {
        onUpdateDriveState(driveService.getStoredState());
        onToast('Full AIM Master Blueprint saved to Google Drive!');
      } else {
        onToast(`Drive sync failed: ${res.message || 'Unable to save to Drive'}`);
      }
    } catch (e: any) {
      onToast(`Error syncing workspace: ${e.message || 'Failed to sync'}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const syncedFiles = driveState.syncedFiles || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Drive Integration</h2>
              <p className="text-xs text-slate-400">
                Securely sync and backup your life blueprints, client contracts, and daily plans.
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

        {/* Body */}
        <div className="px-6 space-y-5">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Google Drive Connected</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Account: {driveState.userEmail || userProfile.email || 'itsmelocsta@gmail.com'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleSyncFullWorkspaceToDrive}
                disabled={isSyncingAll}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-bounce' : ''}`} />
                <span>{isSyncingAll ? 'Exporting...' : 'Backup Full Blueprint'}</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sync History & Files */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              Recent Synchronized Documents ({syncedFiles.length})
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {syncedFiles.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950 text-center text-xs text-slate-500 italic">
                  No documents exported yet. Click "Backup Full Blueprint" to save your master workspace.
                </div>
              ) : (
                syncedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{file.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Synced'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={file.webViewLink || 'https://drive.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 text-[11px] flex items-center gap-1 border border-slate-800"
                    >
                      <span>Open Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
