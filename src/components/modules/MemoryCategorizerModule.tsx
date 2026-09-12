import React, { useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  Tag,
  Calendar,
  Cloud,
  FileText,
  Trash2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { MemoryItem, AIMCategory, AIM_CATEGORIES } from '../../types';
import { driveService } from '../../services/driveService';

interface MemoryCategorizerProps {
  memories: MemoryItem[];
  onUpdateMemories: (memories: MemoryItem[]) => void;
  onToast: (msg: string) => void;
}

export const MemoryCategorizerModule: React.FC<MemoryCategorizerProps> = ({
  memories,
  onUpdateMemories,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  // New Memory form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<AIMCategory>('Business');
  const [newTags, setNewTags] = useState('');
  const [newImportance, setNewImportance] = useState<'normal' | 'high' | 'critical'>('high');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsList = newTags
      ? newTags.split(',').map((t) => t.trim().toLowerCase())
      : ['insight'];

    const newMem: MemoryItem = {
      id: 'mem-' + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: tagsList,
      importance: newImportance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateMemories([newMem, ...memories]);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setIsAddingMemory(false);
    onToast(`Memory "${newMem.title}" saved to ${newMem.category} vault!`);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    onUpdateMemories(updated);
    onToast('Memory archived.');
  };

  const handleExportMemoryToDrive = async (memory: MemoryItem) => {
    const markdown = `# ${memory.title}\n\n**Category:** ${memory.category}\n**Importance:** ${memory.importance}\n**Date:** ${new Date(memory.createdAt).toLocaleString()}\n**Tags:** ${memory.tags.join(', ')}\n\n## Content\n${memory.content}\n\n---\n*Saved by AIM Life Operating System.*`;

    try {
      const res = await driveService.exportDocumentToDrive({
        title: `AIM Memory - ${memory.title}`,
        content: markdown,
      });
      if (res.success) {
        onToast('Memory synced to Google Drive!');
      }
    } catch (e) {
      onToast('Error syncing to Drive');
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="memory-categorizer-module" className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Automatic Life Memory Vault
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            16 logical spaces for your thoughts, assets, frameworks, and business documents. Never manually file again.
          </p>
        </div>

        <button
          onClick={() => setIsAddingMemory(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Memory</span>
        </button>
      </div>

      {/* Add Memory Modal */}
      {isAddingMemory && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Log Insight or Framework into AIM Memory</span>
            </h3>
            <button onClick={() => setIsAddingMemory(false)} className="text-xs text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddMemory} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Title / Key Concept *</label>
                <input
                  type="text"
                  required
                  value={newTitle || ''}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. High-Converting Sales Script Architecture"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory || 'Personal'}
                  onChange={(e) => setNewCategory(e.target.value as AIMCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {AIM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Content / Framework / Notes *</label>
              <textarea
                rows={4}
                required
                value={newContent || ''}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write or paste your notes, frameworks, contracts, or ideas here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags || ''}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. sales, high-ticket, outreach"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority / Importance</label>
                <select
                  value={newImportance || 'normal'}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical / Core Anchor</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingMemory(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Save Memory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all memories, tags, concepts, scripts, or assets..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* 16 Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Categories ({memories.length})
          </button>
          {AIM_CATEGORIES.map((cat) => {
            const count = memories.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-indigo-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-800/80">
                  {mem.category}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    mem.importance === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : mem.importance === 'high'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {mem.importance}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">{mem.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                {mem.content}
              </p>
            </div>

            {/* Tags & Action Bar */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {mem.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(mem.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExportMemoryToDrive(mem)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Export to Google Drive"
                  >
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
