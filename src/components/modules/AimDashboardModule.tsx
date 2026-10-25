import React, { useState } from 'react';
import { ArrowRight, CalendarDays, Layers3, Sparkles } from 'lucide-react';
import { AimBrand } from '../common/AimBrand';
import { AimHomeModule } from './AimHomeModule';
import { CrystalLab } from './CrystalLab';
import './crystal-dashboard.css';
import { AdaptiveAtmosphere } from './AdaptiveAtmosphere';

function DashboardFrame({ preview = false, initialView, ownerId, availableViews = [], children }: { key?: string; preview?: boolean; initialView?: 'lab' | 'atmosphere'; ownerId: string; availableViews?: string[]; children?: React.ReactNode }) {
  const [chosenView, setView] = useState<'day' | 'lab' | 'atmosphere'>(initialView || (preview ? 'lab' : 'day'));
  const showLab = preview || availableViews.includes('crystal-lab');
  const showAtmosphere = preview || availableViews.includes('atmosphere');
  const view = chosenView === 'lab' && !showLab || chosenView === 'atmosphere' && !showAtmosphere ? 'day' : chosenView;
  return <div className="aim-dashboard" data-testid="aim-dashboard">
    <section className="crystal-hero"><div className="crystal-hero-copy"><p className="crystal-eyebrow">AIM BEFORE I AM</p><h1>Your next move,<br /><span>in focus.</span></h1><p>A clear direction. A space that feels like you.</p>{preview && <p className="crystal-preview-label">Interactive dashboard preview · no account data</p>}</div><AimBrand large /></section>
    <div className="crystal-dashboard-nav" aria-label="Dashboard views">
      {preview ? <a className="crystal-secondary" href="/"><CalendarDays size={16} />Open my AIM<ArrowRight size={15} /></a> : <button type="button" aria-pressed={view === 'day'} onClick={() => setView('day')}><CalendarDays size={16} />My day</button>}
      {showLab && <button type="button" aria-pressed={view === 'lab'} onClick={() => setView('lab')}><Layers3 size={16} />Crystal Lab</button>}
      {showAtmosphere && <button type="button" aria-pressed={view === 'atmosphere'} onClick={() => setView('atmosphere')}><Sparkles size={16} />Atmosphere</button>}
      <span>A space that feels like you</span>
    </div>
    <AdaptiveAtmosphere key={ownerId} ownerId={ownerId} visible={view === 'atmosphere'} />
    {view === 'lab' ? <CrystalLab /> : view === 'day' ? children : null}
  </div>;
}

export function AimDashboardModule(props: React.ComponentProps<typeof AimHomeModule> & { atmosphereOwnerId: string; availableViews?: string[] }) {
  const total = props.dailyPlan.priorityTasks.length;
  const complete = props.dailyPlan.priorityTasks.filter(task => task.completed).length;
  return <DashboardFrame key={props.atmosphereOwnerId} ownerId={props.atmosphereOwnerId} availableViews={props.availableViews}><div className="crystal-day-summary" aria-label="Your saved day">
    <div><span>Today’s priorities</span><strong>{complete}<small> / {total} complete</small></strong></div>
    {(!props.availableModules || props.availableModules.has('projects')) && <div><span>Active projects</span><strong>{props.projects.filter(project => project.status === 'active').length}</strong></div>}
    <button type="button" onClick={() => props.onNavigateToTab('planner')}><CalendarDays size={18} />Open today’s plan<ArrowRight size={16} /></button>
  </div><AimHomeModule {...props} /></DashboardFrame>;
}

export function DashboardPreview({ atmosphere = false }: { atmosphere?: boolean }) {
  return <main className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6"><div className="max-w-6xl mx-auto"><DashboardFrame preview ownerId="public-preview" initialView={atmosphere ? 'atmosphere' : 'lab'} /></div></main>;
}
