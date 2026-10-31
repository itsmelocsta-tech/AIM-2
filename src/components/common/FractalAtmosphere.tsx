import React, { useState } from 'react';

/** Lightweight procedural geometry. Decorative only: no health or mood claims. */
export function FractalAtmosphere({ seed = 8 }: { seed?: number }) {
  const [enabled, setEnabled] = useState(true);
  const arms = Math.max(5, Math.min(13, Math.round(seed)));
  const paths = Array.from({ length: arms }, (_, i) => {
    const angle = (i * 2 * Math.PI) / arms;
    const x = 100 + Math.cos(angle) * 53;
    const y = 100 + Math.sin(angle) * 53;
    return { x, y, angle };
  });
  return (
    <section aria-label="Adaptive Atmosphere visual" className="relative overflow-hidden rounded-2xl border border-cyan-700/30 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Adaptive Atmosphere</p>
          <p className="text-xs text-slate-400">A calmer space for your next move</p>
        </div>
        <button type="button" aria-pressed={enabled} onClick={() => setEnabled(v => !v)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
          {enabled ? 'Visual on' : 'Visual off'}
        </button>
      </div>
      {enabled && (
        <svg viewBox="0 0 200 200" role="img" aria-label="Symmetrical branching pattern"
          className="mx-auto mt-2 h-36 w-36 sm:h-44 sm:w-44 text-cyan-400"
          style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,.22))' }}>
          <circle cx="100" cy="100" r="64" fill="none" stroke="currentColor" strokeOpacity=".16" />
          <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" strokeOpacity=".25" />
          {paths.map(({ x, y, angle }, i) => (
            <g key={i} stroke="currentColor" fill="none" strokeWidth="1.1" strokeOpacity=".65">
              <path d={`M100 100 L${x} ${y}`} />
              <path d={`M${x} ${y} l${Math.cos(angle + .6) * 18} ${Math.sin(angle + .6) * 18} M${x} ${y} l${Math.cos(angle - .6) * 18} ${Math.sin(angle - .6) * 18}`} />
              <circle cx={x} cy={y} r="2" fill="currentColor" stroke="none" />
            </g>
          ))}
          <circle cx="100" cy="100" r="13" fill="#083344" stroke="currentColor" strokeWidth="1.5" />
          <text x="100" y="104" textAnchor="middle" fontSize="10" fontWeight="700" fill="#a5f3fc">AIM</text>
        </svg>
      )}
    </section>
  );
}
