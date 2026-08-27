import React from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { SpeakerState } from '../../services/voiceService';

interface AimSpeakerButtonProps {
  state: SpeakerState;
  onClick: () => void;
  className?: string;
  id?: string;
}

export const AimSpeakerButton: React.FC<AimSpeakerButtonProps> = ({
  state,
  onClick,
  className = '',
  id = 'aim-speaker-control-btn',
}) => {
  const getButtonConfig = () => {
    switch (state) {
      case 'playing':
        return {
          label: 'AIM is speaking…',
          icon: <Pause className="w-3.5 h-3.5 text-emerald-300" />,
          style: 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/80 shadow-md shadow-emerald-900/30',
          indicator: (
            <span className="flex items-center gap-0.5 mr-1">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ),
        };
      case 'paused':
        return {
          label: 'Resume',
          icon: <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />,
          style: 'bg-amber-950/80 hover:bg-amber-900/80 text-amber-200 border-amber-700/80 shadow-sm shadow-amber-900/20',
          indicator: <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" />,
        };
      case 'finished':
        return {
          label: 'Replay',
          icon: <RotateCcw className="w-3.5 h-3.5 text-indigo-300" />,
          style: 'bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 border-indigo-700/80 shadow-sm shadow-indigo-900/20',
          indicator: null,
        };
      case 'error':
        return {
          label: 'Voice unavailable — tap to try again',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          style: 'bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 border-rose-700/80 shadow-sm shadow-rose-900/20',
          indicator: null,
        };
      case 'ready':
      default:
        return {
          label: 'Listen',
          icon: <Volume2 className="w-3.5 h-3.5 text-indigo-300" />,
          style: 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-750 hover:border-slate-600 shadow-sm',
          indicator: null,
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 cursor-pointer select-none ${config.style} ${className}`}
      title={state === 'playing' ? 'Click to pause' : state === 'paused' ? 'Click to resume' : state === 'finished' ? 'Click to replay' : 'Click to listen'}
    >
      {config.indicator}
      {config.icon}
      <span>{config.label}</span>
    </button>
  );
};
