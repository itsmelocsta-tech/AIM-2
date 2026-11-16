import React from 'react';
import { Compass, RefreshCw, Sparkles, Target, Zap } from 'lucide-react';
import type { AIMWisdomGuidance as Guidance } from '../../services/aimWisdomGuidance';

export function AIMWisdomGuidance({ guidance }: { guidance: Guidance }) {
  return (
    <section
      aria-labelledby="aim-wisdom-guidance-title"
      data-testid="aim-wisdom-guidance"
      className="rounded-2xl border border-indigo-700/35 bg-slate-900/85 p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col gap-2 border-b border-slate-800/90 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Awareness · Intention · Motion
          </p>
          <h2 id="aim-wisdom-guidance-title" className="mt-1 text-base font-bold text-white sm:text-lg">
            AIM Wisdom Guidance
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
            Grounded in your saved circumstances, reflections, plan, and life updates. AIM does not invent patterns that you have not confirmed.
          </p>
        </div>
        <span className="w-fit rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          Current phase: {guidance.evolution.phase}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-cyan-900/70 bg-slate-950/55 p-3.5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
            <Compass className="h-4 w-4" /> Awareness
          </h3>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-100">{guidance.awareness.circumstance}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{guidance.awareness.reflection}</p>
          {guidance.awareness.confirmedPatterns.length > 0 && (
            <ul aria-label="Confirmed reflection patterns" className="mt-2 space-y-1 text-xs text-cyan-100/85">
              {guidance.awareness.confirmedPatterns.map((pattern) => <li key={pattern}>• {pattern}</li>)}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-indigo-900/80 bg-slate-950/55 p-3.5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-300">
            <Target className="h-4 w-4" /> Intention
          </h3>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-100">{guidance.intention.focus}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{guidance.intention.reason}</p>
        </article>

        <article className="rounded-xl border border-amber-900/70 bg-slate-950/55 p-3.5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300">
            <Zap className="h-4 w-4" /> Motion
          </h3>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-100">{guidance.motion.nextAction}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{guidance.motion.setup}</p>
          <p className="mt-2 text-[11px] font-semibold text-amber-200">
            {guidance.motion.timeboxMinutes}-minute first block · Done: {guidance.motion.definitionOfDone}
          </p>
        </article>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs leading-relaxed text-slate-300">
        <p className="flex items-center gap-1.5 font-bold text-emerald-300">
          <RefreshCw className="h-3.5 w-3.5" /> When life changes
        </p>
        <p className="mt-1">{guidance.adaptation.summary}</p>
        {guidance.adaptation.changes.length > 0 && (
          <ul aria-label="Saved plan adjustments" className="mt-2 space-y-1 text-emerald-100/85">
            {guidance.adaptation.changes.map((change) => <li key={change}>• {change}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
