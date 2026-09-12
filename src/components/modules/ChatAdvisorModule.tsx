import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, UserProfile, AIMCategory, AIM_CATEGORIES, Goal, MemoryItem, DailyPlan, WellnessLog, LifeUpdate } from '../../types';
import { AimOrbCanvas } from '../common/AimOrbCanvas';
import { api } from '../../services/api';
import { voiceEngine } from '../../services/voiceService';

interface ChatAdvisorProps {
  chatMessages: ChatMessage[];
  userProfile: UserProfile;
  goals?: Goal[];
  memories?: MemoryItem[];
  dailyPlan?: DailyPlan;
  wellnessLogs?: WellnessLog[];
  lifeUpdates?: LifeUpdate[];
  onUpdateChat: (messages: ChatMessage[]) => void;
  onQuickAction: (actionType: string, payload?: any) => void;
  onToast: (msg: string) => void;
}

export const ChatAdvisorModule: React.FC<ChatAdvisorProps> = ({
  chatMessages,
  userProfile,
  goals = [],
  memories = [],
  dailyPlan,
  wellnessLogs = [],
  lifeUpdates = [],
  onUpdateChat,
  onQuickAction,
  onToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AIMCategory | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      category: selectedCategory,
    };

    const newHistory = [...chatMessages, userMsg];
    onUpdateChat(newHistory);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await api.chatWithAIM({
        message: text,
        history: newHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        userProfile,
        goals,
        memories,
        dailyPlan,
        wellnessLogs,
        lifeUpdates,
        contextCategory: selectedCategory,
      });

      const aimMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'aim',
        content: response.reply,
        timestamp: new Date().toISOString(),
        category: (response.extractedCategory as AIMCategory) || selectedCategory || 'Journal',
        suggestedActions: [
          { title: 'Turn into Actionable Task', actionType: 'create_task' },
          { title: 'Log in AIM Memory Vault', actionType: 'add_memory' },
        ],
      };

      onUpdateChat([...newHistory, aimMsg]);

      // Automatically speak the key takeaway if user wants voice feedback
      // voiceEngine.speak(response.reply);
    } catch (error) {
      onToast('Error conversing with AIM');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSpeakMessage = (text: string) => {
    if (isSpeaking) {
      voiceEngine.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceEngine.speak(text, () => setIsSpeaking(false));
    }
  };

  return (
    <div id="chat-advisor-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] min-h-[600px] animate-fadeIn">
      {/* Left Column: AIM Core Identity & Interactive Orb (4 Cols) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between items-center text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-xs font-semibold uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            <span>AIM Thinking Partner</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Who You Are Becoming
          </h2>
          <p className="text-xs text-indigo-200 font-medium italic max-w-xs leading-relaxed">
            "{userProfile.desiredIdentity}"
          </p>
        </div>

        {/* Dynamic Interactive Orb */}
        <div className="py-4">
          <AimOrbCanvas
            size={190}
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            onClick={() => handleSpeakMessage(chatMessages[chatMessages.length - 1]?.content || 'I am AIM, ready to assist your growth.')}
          />
          <span className="text-[11px] text-slate-400 block mt-2">
            {isThinking
              ? 'AIM is synthesizing multi-step path...'
              : isSpeaking
              ? 'Speaking response (click orb to stop)'
              : 'Click Orb to listen to last reflection'}
          </span>
        </div>

        {/* Core Principles Pill */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left w-full space-y-2 text-xs">
          <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            AIM Guiding Commitments
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px]">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Root cause analysis without judgment</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Daily cash monetization & high-leverage focus</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Always recalculate the path forward</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Column: Chat Stream & Message Input (8 Cols) */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-md flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {chatMessages.map((msg) => {
            const isAIM = msg.role === 'aim';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isAIM ? 'justify-start' : 'justify-end'}`}
              >
                {isAIM && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 p-[1.5px] shrink-0 mt-1">
                    <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                )}

                <div className={`max-w-2xl space-y-2.5 ${isAIM ? 'text-left' : 'text-right'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-sm ${
                      isAIM
                        ? 'bg-slate-950 border border-slate-800 text-slate-200'
                        : 'bg-indigo-600 text-white rounded-br-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {isAIM && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => handleSpeakMessage(msg.content)}
                          className="hover:text-indigo-300 flex items-center gap-1 text-slate-400"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggested Actions if AIM message */}
                  {isAIM && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => onQuickAction(action.actionType, msg.content)}
                          className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <PlusCircle className="w-3 h-3 text-emerald-400" />
                          <span>{action.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3.5 justify-start items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/80 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>AIM is analyzing your trajectory and formulating solutions...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Optional Category Tag Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
              Focus Space:
            </span>
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                !selectedCategory ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Auto-Detect
            </button>
            {AIM_CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <input
              type="text"
              value={inputText || ''}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask AIM anything: monetize a skill, solve an obstacle, map today, build a proposal..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
