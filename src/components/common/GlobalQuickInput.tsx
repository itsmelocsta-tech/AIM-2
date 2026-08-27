import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Brain,
  Zap,
  Send,
} from 'lucide-react';
import { AIMCategory, AIM_CATEGORIES, MemoryItem, PriorityTask } from '../../types';

interface GlobalQuickInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMemory: (mem: MemoryItem) => void;
  onSaveTask: (task: PriorityTask) => void;
  onToast: (msg: string) => void;
}

export const GlobalQuickInput: React.FC<GlobalQuickInputProps> = ({
  isOpen,
  onClose,
  onSaveMemory,
  onSaveTask,
  onToast,
}) => {
  const [text, setText] = useState('');
  const [intentType, setIntentType] = useState<'memory' | 'task'>('memory');
  const [category, setCategory] = useState<AIMCategory>('Personal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (intentType === 'task') {
      const newTask: PriorityTask = {
        id: 'pt-quick-' + Date.now(),
        task: text.trim(),
        category,
        timeEstimate: '45m',
        impact: 'High',
        completed: false,
      };
      onSaveTask(newTask);
      onToast('Task added to Today’s Priority list!');
    } else {
      const newMem: MemoryItem = {
        id: 'mem-quick-' + Date.now(),
        title: text.length > 40 ? text.substring(0, 40) + '...' : text,
        content: text.trim(),
        category,
        tags: ['quick-capture'],
        importance: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveMemory(newMem);
      onToast(`Captured in AIM ${category} Memory Vault!`);
    }

    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">AIM Quick Capture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIntentType('memory')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                intentType === 'memory'
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Memory / Note</span>
            </button>

            <button
              type="button"
              onClick={() => setIntentType('task')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                intentType === 'task'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Today’s Task</span>
            </button>
          </div>

          <div>
            <textarea
              rows={3}
              required
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                intentType === 'task'
                  ? 'Enter high-priority action for today...'
                  : 'Capture any thought, framework, script, or idea...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AIMCategory)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {AIM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

