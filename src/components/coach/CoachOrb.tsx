import React, { useEffect, useRef } from 'react';
import { CoachId, VoiceState } from '../../types';

interface CoachOrbProps {
  coachId: CoachId;
  voiceState?: VoiceState;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CoachOrb: React.FC<CoachOrbProps> = ({
  coachId,
  voiceState = 'idle',
  size = 180,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isListening = voiceState === 'listening' || voiceState === 'transcribing';
  const isSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing' || voiceState === 'requesting_permission';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let isPaused = false;

    const handleVisibility = () => {
      isPaused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Color Palettes by Coach
    const getCoachGradients = (cId: CoachId) => {
      switch (cId) {
        case 'motivation':
          return {
            halo: ['rgba(249, 115, 22, 0.4)', 'rgba(239, 68, 68, 0.25)', 'rgba(249, 115, 22, 0)'],
            core: ['#fdba74', '#f97316', '#dc2626'],
            shadow: '#ea580c',
          };
        case 'spiritual':
          return {
            halo: ['rgba(168, 85, 247, 0.4)', 'rgba(251, 191, 36, 0.25)', 'rgba(168, 85, 247, 0)'],
            core: ['#e9d5ff', '#a855f7', '#7e22ce'],
            shadow: '#9333ea',
          };
        case 'health':
          return {
            halo: ['rgba(16, 185, 129, 0.4)', 'rgba(6, 182, 212, 0.25)', 'rgba(16, 185, 129, 0)'],
            core: ['#6ee7b7', '#10b981', '#047857'],
            shadow: '#059669',
          };
        case 'relationships':
          return {
            halo: ['rgba(244, 63, 94, 0.4)', 'rgba(251, 113, 133, 0.25)', 'rgba(244, 63, 94, 0)'],
            core: ['#fda4af', '#f43f5e', '#be123c'],
            shadow: '#e11d48',
          };
        case 'guidance':
        default:
          return {
            halo: ['rgba(99, 102, 241, 0.4)', 'rgba(56, 189, 248, 0.25)', 'rgba(99, 102, 241, 0)'],
            core: ['#a5b4fc', '#6366f1', '#4338ca'],
            shadow: '#4f46e5',
          };
      }
    };

    const render = () => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += isProcessing ? 0.06 : isSpeaking ? 0.05 : isListening ? 0.04 : 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = (Math.min(width, height) / 2) * 0.56;

      ctx.clearRect(0, 0, width, height);

      const palette = getCoachGradients(coachId);

      // Dynamic glow pulse
      const pulse =
        Math.sin(time * 2) * 5 +
        (isSpeaking ? 14 : isListening ? 9 : isProcessing ? 16 : 4);

      // Outer ethereal halo
      const outerGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.3,
        centerX,
        centerY,
        baseRadius * 1.5 + pulse
      );

      if (isListening) {
        outerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
        outerGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.3)');
        outerGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (isSpeaking) {
        outerGradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        outerGradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
        outerGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (isProcessing) {
        outerGradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
        outerGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.3)');
        outerGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        outerGradient.addColorStop(0, palette.halo[0]);
        outerGradient.addColorStop(0.6, palette.halo[1]);
        outerGradient.addColorStop(1, palette.halo[2]);
      }

      ctx.fillStyle = outerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.5 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Fluid morphed neural core
      ctx.save();
      ctx.beginPath();
      const points = 36;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave1 = Math.sin(angle * 3 + time) * 6;
        const wave2 = Math.cos(angle * 5 - time * 1.5) * 4;
        const wave3 = isSpeaking ? Math.sin(angle * 8 + time * 3) * 7 : 0;
        const r = baseRadius + wave1 + wave2 + wave3 + pulse * 0.3;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Core Gradient
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.2,
        centerY - baseRadius * 0.2,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.1
      );

      if (isListening) {
        coreGrad.addColorStop(0, '#60a5fa');
        coreGrad.addColorStop(0.5, '#3b82f6');
        coreGrad.addColorStop(1, '#1d4ed8');
      } else if (isSpeaking) {
        coreGrad.addColorStop(0, '#34d399');
        coreGrad.addColorStop(0.5, '#10b981');
        coreGrad.addColorStop(1, '#047857');
      } else if (isProcessing) {
        coreGrad.addColorStop(0, '#fbbf24');
        coreGrad.addColorStop(0.5, '#f59e0b');
        coreGrad.addColorStop(1, '#b45309');
      } else {
        coreGrad.addColorStop(0, palette.core[0]);
        coreGrad.addColorStop(0.5, palette.core[1]);
        coreGrad.addColorStop(1, palette.core[2]);
      }

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = palette.shadow;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();

      // Inner Light Glint
      const glintGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        0,
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.5
      );
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Orbiting Manifestation Rings
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        baseRadius * 1.25,
        baseRadius * 0.45,
        time * 0.4,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        baseRadius * 1.35,
        baseRadius * 0.5,
        -time * 0.3,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [coachId, isListening, isSpeaking, isProcessing]);

  return (
    <div
      id={`aim-orb-${coachId}`}
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title={
        isListening
          ? 'Listening to you...'
          : isSpeaking
          ? 'Speaking...'
          : isProcessing
          ? 'Thinking & calibrating...'
          : 'Click to interact with coach'
      }
    >
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
};
