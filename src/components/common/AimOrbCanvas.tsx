import React, { useEffect, useRef } from 'react';

interface AimOrbCanvasProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AimOrbCanvas: React.FC<AimOrbCanvasProps> = ({
  size = 220,
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += isThinking ? 0.06 : isSpeaking ? 0.05 : isListening ? 0.04 : 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = (Math.min(width, height) / 2) * 0.58;

      ctx.clearRect(0, 0, width, height);

      // Dynamic glow intensity
      const pulse = Math.sin(time * 2) * 6 + (isSpeaking ? 12 : isListening ? 8 : isThinking ? 15 : 4);

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
        outerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        outerGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.25)');
        outerGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (isSpeaking) {
        outerGradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        outerGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
        outerGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (isThinking) {
        outerGradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        outerGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.3)');
        outerGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        // Default calm twilight aura
        outerGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        outerGradient.addColorStop(0.6, 'rgba(79, 70, 229, 0.15)');
        outerGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
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
        const wave1 = Math.sin(angle * 3 + time) * 7;
        const wave2 = Math.cos(angle * 5 - time * 1.5) * 5;
        const wave3 = isSpeaking ? Math.sin(angle * 8 + time * 3) * 8 : 0;
        const r = baseRadius + wave1 + wave2 + wave3 + (pulse * 0.4);
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
      } else if (isThinking) {
        coreGrad.addColorStop(0, '#fbbf24');
        coreGrad.addColorStop(0.5, '#f59e0b');
        coreGrad.addColorStop(1, '#d97706');
      } else {
        coreGrad.addColorStop(0, '#818cf8');
        coreGrad.addColorStop(0.5, '#6366f1');
        coreGrad.addColorStop(1, '#4338ca');
      }

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = isSpeaking ? '#10b981' : isListening ? '#3b82f6' : '#6366f1';
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
      ctx.arc(centerX - baseRadius * 0.35, centerY - baseRadius * 0.35, baseRadius * 0.5, 0, Math.PI * 2);
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
    };
  }, [isListening, isSpeaking, isThinking]);

  return (
    <div
      id="aim-orb-wrapper"
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title={
        isListening
          ? 'AIM is listening...'
          : isSpeaking
          ? 'AIM is speaking'
          : isThinking
          ? 'AIM is reasoning...'
          : 'Click to speak with AIM'
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
