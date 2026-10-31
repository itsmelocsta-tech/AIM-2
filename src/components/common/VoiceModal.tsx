import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  Send,
  RefreshCw,
  Play,
  Square,
} from 'lucide-react';
import { AimOrbCanvas } from './AimOrbCanvas';
import { AudioWaveform } from './AudioWaveform';
import { UserProfile, ChatMessage, Goal, MemoryItem, DailyPlan, WellnessLog, LifeUpdate } from '../../types';
import { api } from '../../services/api';
import { voiceEngine } from '../../services/voiceService';
import { PREVIEW_SENTENCE } from '../../services/voiceProfiles';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  chatMessages?: ChatMessage[];
  goals?: Goal[];
  memories?: MemoryItem[];
  dailyPlan?: DailyPlan;
  wellnessLogs?: WellnessLog[];
  lifeUpdates?: LifeUpdate[];
  onAddChatMessage: (msg: ChatMessage) => void;
  onToast: (msg: string) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  chatMessages = [],
  goals = [],
  memories = [],
  dailyPlan,
  wellnessLogs = [],
  lifeUpdates = [],
  onAddChatMessage,
  onToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [visibleHeight, setVisibleHeight] = useState<number>();
  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    const syncHeight = () => setVisibleHeight(viewport?.height ?? window.innerHeight);
    syncHeight();
    viewport?.addEventListener('resize', syncHeight);
    window.addEventListener('resize', syncHeight);
    return () => {
      viewport?.removeEventListener('resize', syncHeight);
      window.removeEventListener('resize', syncHeight);
    };
  }, [isOpen]);
  const [lastAIMReply, setLastAIMReply] = useState(
    userProfile?.name
      ? `I'm here with you, ${userProfile.name}. What is on your mind or in front of you today?`
      : `I'm listening. What is on your mind or in front of you today?`
  );

  useEffect(() => {
    if (!isOpen) {
      voiceEngine.stopListening();
      voiceEngine.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
      setIsPreviewing(false);
      setIsThinking(false);
    } else {
      setLastAIMReply(
        userProfile?.name
          ? `I'm here with you, ${userProfile.name}. What is on your mind or in front of you today?`
          : `I'm listening. What is on your mind or in front of you today?`
      );
    }
  }, [isOpen, userProfile?.name]);

  if (!isOpen) return null;

  const handleTogglePreview = () => {
    if (isPreviewing || isSpeaking) {
      voiceEngine.stopSpeaking(true);
      setIsPreviewing(false);
      setIsSpeaking(false);
      return;
    }

    if (isListening) {
      voiceEngine.stopListening();
      setIsListening(false);
    }

    const activeProfile = voiceEngine.getActiveProfile();
    setIsPreviewing(true);
    setIsSpeaking(true);

    voiceEngine.previewVoice(activeProfile.id, PREVIEW_SENTENCE, {
      onStart: () => {
        setIsPreviewing(true);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsPreviewing(false);
        setIsSpeaking(false);
      },
      onError: () => {
        setIsPreviewing(false);
        setIsSpeaking(false);
      },
    });
  };

  const toggleListening = () => {
    if (isPreviewing) {
      voiceEngine.stopSpeaking(true);
      setIsPreviewing(false);
      setIsSpeaking(false);
    }

    if (isListening) {
      voiceEngine.stopListening();
      setIsListening(false);
    } else {
      voiceEngine.stopSpeaking();
      setIsSpeaking(false);
      const started = voiceEngine.startListening(
        (text) => {
          setTranscript(text);
        },
        (listening) => {
          setIsListening(listening);
          if (!listening && transcript.trim()) {
            handleProcessVoiceInput(transcript.trim());
          }
        }
      );

      if (!started) {
        onToast('Microphone not available in this browser. You can type below!');
      }
    }
  };

  const handleProcessVoiceInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsListening(false);
    setIsThinking(true);

    const userMsg: ChatMessage = {
      id: 'voice-user-' + Date.now(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };
    onAddChatMessage(userMsg);

    try {
      const historyForChat = (chatMessages || []).slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.chatWithAIM({
        message: userInput,
        history: historyForChat,
        userProfile,
        goals,
        memories,
        dailyPlan,
        wellnessLogs,
        lifeUpdates,
      });

      setLastAIMReply(response.reply);
      const aimMsg: ChatMessage = {
        id: 'voice-aim-' + Date.now(),
        role: 'aim',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };
      onAddChatMessage(aimMsg);

      // Speak back the response
      setIsSpeaking(true);
      voiceEngine.speak(response.reply, () => {
        setIsSpeaking(false);
      });
    } catch (e) {
      onToast('Error processing voice query');
    } finally {
      setIsThinking(false);
      setTranscript('');
    }
  };

  const activeProfile = voiceEngine.getActiveProfile();

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-hidden bg-slate-950/90 backdrop-blur-xl animate-fadeIn" style={{ height: visibleHeight ?? '100dvh' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="aim-voice-dialog-title" className="bg-slate-900/90 border border-slate-800 rounded-3xl w-full min-w-0 max-w-2xl max-h-full p-4 sm:p-6 overflow-y-auto shadow-2xl flex flex-col items-center text-center gap-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close conversation"
          className="absolute top-2 right-2 min-h-[44px] min-w-[44px] p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-1 px-8 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AIM Verbal Thinking Space</span>
          </div>
          <h2 id="aim-voice-dialog-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Conversational Life Companion
          </h2>
        </div>

        {/* Large Central Glowing AIM Orb */}
        <div className="py-1 relative shrink-0">
          <AimOrbCanvas
            size={112}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            onClick={toggleListening}
          />
        </div>

        {/* Audio Activity Waveform Status Pill */}
        <div className="flex flex-wrap shrink-0 items-center justify-center gap-3">
          <div
            id="aim-voice-modal-waveform-container"
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all ${
              isSpeaking || isPreviewing
                ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-950/50 text-emerald-300'
                : isListening
                ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md shadow-indigo-950/50 text-indigo-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <AudioWaveform
              isPlaying={isSpeaking || isPreviewing || isListening}
              size="sm"
              color={isSpeaking || isPreviewing ? 'emerald' : isListening ? 'indigo' : 'cyan'}
              barCount={6}
            />
            <span className="text-xs font-semibold font-mono">
              {isPreviewing
                ? `Previewing: ${activeProfile.accentTitle} (${activeProfile.genderPresentation})`
                : isSpeaking
                ? 'AIM Voice Active'
                : isListening
                ? 'Listening to Input...'
                : `Voice: ${activeProfile.accentTitle}`}
            </span>
          </div>

          {/* Quick Voice Preview Trigger */}
          <button
            id="aim-voice-modal-preview-btn"
            type="button"
            onClick={handleTogglePreview}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isPreviewing
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Preview standard benchmark voice audio"
          >
            {isPreviewing ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span>Preview</span>
              </>
            )}
          </button>
        </div>

        {/* Live Transcript / Subtitle Box */}
        <div id="aim-voice-response" role="region" aria-label="AIM response" tabIndex={0} className="w-full min-w-0 shrink-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-h-[35dvh] text-left text-base leading-7 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {isThinking ? (
            <div className="flex items-center gap-2 text-indigo-300">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>AIM is reasoning and formulating response...</span>
            </div>
          ) : isPreviewing ? (
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Standard Voice Benchmark</span>
              <p className="text-emerald-100 font-medium italic">"{PREVIEW_SENTENCE}"</p>
            </div>
          ) : isListening ? (
            <p className="text-emerald-300 italic font-mono">
              "{transcript || 'Listening to your voice...'}"
            </p>
          ) : (
            <p className="text-slate-200">{lastAIMReply}</p>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row shrink-0 items-center gap-4 w-full justify-center">
          <button
            onClick={toggleListening}
            className={`px-6 py-3 rounded-full font-bold text-base flex items-center gap-2 shadow-lg transition-all ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white hover:opacity-90'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Stop Listening' : 'Tap to Speak with AIM'}</span>
          </button>

          {/* Quick Manual Text Input fallback */}
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={transcript || ''}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessVoiceInput(transcript);
              }}
              placeholder="Or type here..."
              className="min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 sm:w-48"
            />
            <button
              onClick={() => handleProcessVoiceInput(transcript)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

