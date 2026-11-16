import React, { useId, useMemo, useState } from 'react';
import type { AIMWisdomGuidance } from '../../services/aimWisdomGuidance';

const colors = {
  lagoon: { primary: '#67e8f9', center: '#083344' },
  amethyst: { primary: '#c4b5fd', center: '#312e81' },
  ember: { primary: '#fdba74', center: '#7c2d12' },
  forest: { primary: '#86efac', center: '#14532d' },
};

/** Procedural geometry driven by saved AIM state. Decorative only: no health or mood claims. */
export function FractalAtmosphere({ guidance }: { guidance?: AIMWisdomGuidance }) {
  const [enabled, setEnabled] = useState(true);
  const gradientId = useId();
  const evolution = guidance?.evolution || {
    phase: 'awareness' as const,
    revision: 'starting',
    completedCount: 0,
    totalCount: 0,
    palette: 'lagoon' as const,
    geometry: 'contours' as const,
    density: 3,
    motion: 0,
    explanation: 'The pattern stays open while AIM gathers real context.',
  };
  const color = colors[evolution.palette];
  const arms = Math.max(5, Math.min(13, evolution.density + 4));
  const revisionOffset = Number.parseInt(evolution.revision.slice(0, 3), 36) || 0;
  const branches = useMemo(() => Array.from({ length: arms }, (_, index) => {
    const angle = (index * 2 * Math.PI) / arms + (revisionOffset % 17) / 100;
    const radius = 45 + ((revisionOffset + index * 7) % 12);
    return { x: 100 + Math.cos(angle) * radius, y: 100 + Math.sin(angle) * radius, angle };
  }), [arms, revisionOffset]);

  const phaseLabel = evolution.phase[0].toUpperCase() + evolution.phase.slice(1);
  return (
    <section
      aria-label="Evolving Fractal Atmosphere"
      data-testid="evolving-fractal-atmosphere"
      data-phase={evolution.phase}
      data-revision={evolution.revision}
      className="relative overflow-hidden rounded-2xl border border-cyan-700/30 bg-slate-950 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Evolving Fractal Atmosphere</p>
          <p className="mt-1 text-xs font-semibold text-slate-200">{phaseLabel} · {evolution.explanation}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Evolves from saved plan progress, reflections, and life updates—not a mood or biology reading.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={enabled}
          onClick={() => setEnabled((value) => !value)}
          className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          {enabled ? 'Visual on' : 'Visual off'}
        </button>
      </div>
      {enabled && (
        <div className="mt-2 grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(180px,240px)_1fr]">
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label={`${phaseLabel} ${evolution.geometry} pattern, revision ${evolution.revision}`}
            className="mx-auto h-40 w-40 sm:h-44 sm:w-44"
            style={{ color: color.primary, filter: `drop-shadow(0 0 12px ${color.primary}40)` }}
          >
            <defs>
              <radialGradient id={gradientId}>
                <stop offset="0" stopColor={color.primary} stopOpacity="0.2" />
                <stop offset="1" stopColor={color.primary} stopOpacity="0.02" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="67" fill={`url(#${gradientId})`} stroke="currentColor" strokeOpacity=".13" />
            {evolution.geometry === 'rings' && Array.from({ length: evolution.density }, (_, index) => (
              <circle key={index} cx="100" cy="100" r={18 + index * (48 / evolution.density)} fill="none" stroke="currentColor" strokeOpacity={0.65 - index * 0.06} strokeWidth="1.1" />
            ))}
            {evolution.geometry === 'petals' && Array.from({ length: arms }, (_, index) => (
              <ellipse key={index} cx="100" cy="61" rx="16" ry="39" transform={`rotate(${index * 360 / arms} 100 100)`} fill={`url(#${gradientId})`} stroke="currentColor" strokeOpacity=".55" />
            ))}
            {evolution.geometry === 'contours' && Array.from({ length: evolution.density }, (_, index) => {
              const wobble = ((revisionOffset + index * 11) % 9) - 4;
              return <ellipse key={index} cx={100 + wobble / 2} cy={100 - wobble / 3} rx={24 + index * 10} ry={18 + index * 8} transform={`rotate(${wobble * 2} 100 100)`} fill="none" stroke="currentColor" strokeOpacity={0.65 - index * 0.06} />;
            })}
            {evolution.geometry === 'branches' && branches.map(({ x, y, angle }, index) => (
              <g key={index} stroke="currentColor" fill="none" strokeWidth="1.1" strokeOpacity=".7">
                <path d={`M100 100 L${x} ${y}`} />
                <path d={`M${x} ${y} l${Math.cos(angle + .58) * 18} ${Math.sin(angle + .58) * 18} M${x} ${y} l${Math.cos(angle - .58) * 18} ${Math.sin(angle - .58) * 18}`} />
                <circle cx={x} cy={y} r="2" fill="currentColor" stroke="none" />
              </g>
            ))}
            <circle cx="100" cy="100" r="13" fill={color.center} stroke="currentColor" strokeWidth="1.5" />
            <text x="100" y="104" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f8fafc">AIM</text>
          </svg>
          <div className="grid grid-cols-3 gap-2" aria-label="AIM evolution stages">
            {(['awareness', 'intention', 'motion'] as const).map((phase, index) => (
              <div key={phase} className={`rounded-xl border px-2 py-2 text-center ${evolution.phase === phase ? 'border-indigo-400 bg-indigo-950/60 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-500'}`}>
                <span className="block text-[10px] font-bold uppercase tracking-wide">{index + 1}</span>
                <span className="block text-[11px] font-semibold capitalize sm:text-xs">{phase}</span>
              </div>
            ))}
            <p className="col-span-3 text-center text-[11px] text-slate-400">
              {evolution.totalCount > 0 ? `${evolution.completedCount} of ${evolution.totalCount} saved priorities complete` : 'No saved priority progress yet'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
