import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  X,
  Save,
} from 'lucide-react';
import { AIMProject, ProjectStatus } from '../../types';
import { aimContextService } from '../../services/aimContextService';

interface MyProjectsModuleProps {
  projects: AIMProject[];
  onUpdateProject: (updated: AIMProject) => void;
  onCreateProject: (newProject: AIMProject) => void;
  onToast: (msg: string) => void;
  selectedProjectId?: string | null;
}

export const MyProjectsModule: React.FC<MyProjectsModuleProps> = ({
  projects,
  onUpdateProject,
  onCreateProject,
  onToast,
  selectedProjectId,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProject, setEditingProject] = useState<AIMProject | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('');
  const [newProjectPhase, setNewProjectPhase] = useState('Planning');
  const [newProjectNextAction, setNewProjectNextAction] = useState('');
  const [newProjectCollaborators, setNewProjectCollaborators] = useState('');

  const sortedProjects = [...projects].sort((a, b) => a.priority - b.priority);

  const filteredProjects = sortedProjects.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.goal.toLowerCase().includes(q) ||
        p.phase.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSaveEdit = () => {
    if (!editingProject) return;
    onUpdateProject(editingProject);
    setEditingProject(null);
    onToast(`Saved updates to ${editingProject.name}!`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: AIMProject = {
      id: 'proj-' + Date.now(),
      name: newProjectName.trim(),
      priority: projects.length + 1,
      status: 'active',
      phase: newProjectPhase.trim() || 'Active',
      goal: newProjectGoal.trim() || 'Core objective definition in progress',
      purpose: newProjectGoal.trim() || 'Core objective definition in progress',
      whatChanged: 'Project newly initialized in AIM Life OS.',
      lastCompletedAction: 'Created project tracking profile.',
      blockers: [],
      nextAction: newProjectNextAction.trim() || 'Define key milestone roadmap.',
      collaborators: newProjectCollaborators
        ? newProjectCollaborators.split(',').map((c) => c.trim())
        : [],
      progress: 5,
      lastUpdated: new Date().toISOString(),
      notes: '',
    };

    onCreateProject(newProj);
    setShowCreateModal(false);
    setNewProjectName('');
    setNewProjectGoal('');
    setNewProjectNextAction('');
    setNewProjectCollaborators('');
    onToast(`Added project "${newProj.name}"!`);
  };

  return (
    <div id="my-projects-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              10 Operating Projects
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked, prioritized, and continuously recalculated to eliminate distraction and maintain execution momentum.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects by name, goal, or phase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'active', 'blocked', 'waiting', 'maintenance', 'paused', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors shrink-0 ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const isTopPriority = project.priority === 1;
          const isSelected = selectedProjectId === project.id;

          return (
            <div
              key={project.id}
              className={`bg-slate-900/90 rounded-2xl border transition-all overflow-hidden ${
                isTopPriority
                  ? 'border-indigo-500/70 shadow-lg shadow-indigo-950/40'
                  : isSelected
                  ? 'border-emerald-500/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-4 sm:p-5">
                {/* Project Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        isTopPriority
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Priority #{project.priority}
                    </span>
                    <h2 className="text-base font-extrabold text-white">
                      {project.name}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      ({project.phase})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={project.status || 'active'}
                      onChange={(e) => {
                        const newStatus = e.target.value as ProjectStatus;
                        onUpdateProject({ ...project, status: newStatus, lastUpdated: new Date().toISOString() });
                        onToast(`Updated ${project.name} status to ${newStatus}`);
                      }}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer uppercase ${
                        project.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : project.status === 'blocked'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : project.status === 'paused'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : project.status === 'maintenance'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : project.status === 'completed'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <option value="active" className="bg-slate-900 text-emerald-400">Active</option>
                      <option value="blocked" className="bg-slate-900 text-red-400">Blocked</option>
                      <option value="waiting" className="bg-slate-900 text-yellow-400">Waiting</option>
                      <option value="maintenance" className="bg-slate-900 text-purple-400">Maintenance</option>
                      <option value="paused" className="bg-slate-900 text-amber-400">Paused</option>
                      <option value="completed" className="bg-slate-900 text-blue-400">Completed</option>
                    </select>

                    <button
                      onClick={() => setEditingProject(project)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Edit project details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Goal & Purpose */}
                <p className="text-xs sm:text-sm text-slate-300 mb-3 leading-relaxed">
                  {project.goal}
                </p>

                {/* Progress Bar */}
                <div className="mb-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Progress: {project.progress}%</span>
                    <span>Updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isTopPriority ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, project.progress))}%` }}
                    />
                  </div>
                </div>

                {/* Details Grid: What Changed, Last Action, Next Action, Blockers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                    <div>
                      <span className="font-semibold text-slate-400">What Changed Recently:</span>
                      <p className="text-slate-300 mt-0.5">{project.whatChanged || 'No recent material change.'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Last Completed Action:
                      </span>
                      <p className="text-slate-300 mt-0.5">{project.lastCompletedAction || 'None recorded yet.'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                    <div>
                      <span className="font-semibold text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Next Action Recommended:
                      </span>
                      <p className="text-slate-200 font-medium mt-0.5 leading-relaxed">
                        {project.nextAction}
                      </p>
                    </div>

                    {project.blockers && project.blockers.length > 0 && (
                      <div>
                        <span className="font-semibold text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Blockers:
                        </span>
                        <ul className="list-disc pl-4 text-red-300/90 text-[11px] mt-0.5 space-y-0.5">
                          {project.blockers.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaborators Pill List */}
                {project.collaborators && project.collaborators.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Collaborators:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.collaborators.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[11px] font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Project: {editingProject.name}</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  value={editingProject.name || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Priority Rank (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingProject.priority ?? 1}
                    onChange={(e) => setEditingProject({ ...editingProject, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phase</label>
                  <input
                    type="text"
                    value={editingProject.phase || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, phase: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Goal & Purpose</label>
                <textarea
                  rows={2}
                  value={editingProject.goal || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, goal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Next Recommended Action</label>
                <textarea
                  rows={2}
                  value={editingProject.nextAction || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, nextAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Last Completed Action</label>
                <input
                  type="text"
                  value={editingProject.lastCompletedAction || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, lastCompletedAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Blockers (one per line)</label>
                <textarea
                  rows={2}
                  value={(editingProject.blockers || []).join('\n')}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      blockers: e.target.value.split('\n').filter((b) => b.trim().length > 0),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Progress Percentage ({editingProject.progress ?? 0}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editingProject.progress ?? 0}
                  onChange={(e) => setEditingProject({ ...editingProject, progress: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Project</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fort Worth Mobile Wash Route"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phase</label>
                  <input
                    type="text"
                    placeholder="Planning, Launch, Packaging"
                    value={newProjectPhase}
                    onChange={(e) => setNewProjectPhase(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Collaborators</label>
                  <input
                    type="text"
                    placeholder="Separate with commas"
                    value={newProjectCollaborators}
                    onChange={(e) => setNewProjectCollaborators(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Goal & Strategic Purpose</label>
                <textarea
                  rows={2}
                  placeholder="What is the objective of this project and why does it matter?"
                  value={newProjectGoal}
                  onChange={(e) => setNewProjectGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Immediate Next Action</label>
                <textarea
                  rows={2}
                  placeholder="What is the concrete next physical or digital step?"
                  value={newProjectNextAction}
                  onChange={(e) => setNewProjectNextAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
