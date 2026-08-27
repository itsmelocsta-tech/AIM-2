import React from 'react';

interface AudioWaveformProps {
  isPlaying?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'white';
  barCount?: number;
  className?: string;
  label?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying = true,
  size = 'sm',
  color = 'emerald',
  barCount = 5,
  className = '',
  label,
}) => {
  // Height and width styling per size tier
  const sizeStyles = {
    xs: { container: 'h-3 gap-0.5', bar: 'w-0.5', maxH: '12px', minH: '3px' },
    sm: { container: 'h-4 gap-0.5', bar: 'w-1', maxH: '16px', minH: '4px' },
    md: { container: 'h-6 gap-1', bar: 'w-1', maxH: '24px', minH: '4px' },
    lg: { container: 'h-8 gap-1.5', bar: 'w-1.5', maxH: '32px', minH: '6px' },
  };

  const colorStyles = {
    indigo: 'bg-indigo-400 shadow-indigo-500/50',
    emerald: 'bg-emerald-400 shadow-emerald-500/50',
    amber: 'bg-amber-400 shadow-amber-500/50',
    cyan: 'bg-cyan-400 shadow-cyan-500/50',
    white: 'bg-white shadow-white/50',
  };

  const selectedSize = sizeStyles[size] || sizeStyles.sm;
  const barColor = colorStyles[color] || colorStyles.emerald;

  // Staggered pattern of heights for dynamic organic sound wave feeling
  const heights = [0.4, 0.9, 0.6, 1.0, 0.7, 0.85, 0.5, 0.95, 0.65, 0.45];
  const durations = [0.65, 0.5, 0.75, 0.55, 0.7, 0.6, 0.8, 0.52, 0.68, 0.58];

  const bars = Array.from({ length: barCount }, (_, i) => {
    const heightRatio = heights[i % heights.length];
    const duration = durations[i % durations.length];
    const delay = (i * 0.1).toFixed(2);

    return (
      <span
        key={i}
        className={`inline-block rounded-full transition-all duration-200 ${selectedSize.bar} ${barColor}`}
        style={{
          height: isPlaying ? `${Math.max(25, heightRatio * 100)}%` : selectedSize.minH,
          animation: isPlaying
            ? `aimWaveformBounce ${duration}s ease-in-out ${delay}s infinite alternate`
            : 'none',
          boxShadow: isPlaying ? '0 0 6px currentColor' : 'none',
        }}
      />
    );
  });

  return (
    <div
      className={`inline-flex items-center ${selectedSize.container} select-none ${className}`}
      role="img"
      aria-label={label || (isPlaying ? 'Audio playing waveform' : 'Audio inactive')}
    >
      <style>{`
        @keyframes aimWaveformBounce {
          0% {
            transform: scaleY(0.25);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.35);
            opacity: 0.75;
          }
        }
      `}</style>
      {bars}
      {label && <span className="ml-1.5 text-[10px] font-medium tracking-wide">{label}</span>}
    </div>
  );
};
