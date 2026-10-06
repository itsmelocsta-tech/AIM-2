import React from 'react';
import { Crown, Check, X } from 'lucide-react';
import { AimEntitlement } from '../../services/entitlementService';

export function UpgradeModal({ open, onClose, entitlement }: { open: boolean; onClose: () => void; entitlement: AimEntitlement }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
    <div className="w-full max-w-lg rounded-3xl border border-indigo-500/40 bg-slate-950 p-6 shadow-2xl">
      <div className="flex justify-between gap-4"><div><Crown className="w-7 h-7 text-amber-300 mb-3"/><h2 className="text-xl font-bold">Unlock AIM Premium</h2><p className="text-sm text-slate-400 mt-1">AIM keeps your data on Basic. Premium unlocks the automation and deeper intelligence.</p></div><button onClick={onClose}><X className="w-5 h-5"/></button></div>
      <div className="mt-5 grid gap-2 text-sm">{['Multiple active goals','Adaptive planning and unlimited reroutes','Specialist coach orbs','Automated opportunity scans','Advanced wellness and insights','Creative Asset Intelligence','Automatic start/end alarms'].map(x=><div key={x} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5"/>{x}</div>)}</div>
      <div className="mt-6 rounded-2xl bg-slate-900 p-4"><div className="font-bold">$9.99/month <span className="text-slate-500 font-normal">or $79.99/year</span></div><div className="text-xs text-slate-400 mt-1">7-day Premium trial. Billing activates only after Google Play products are verified.</div></div>
      <button disabled className="mt-4 w-full rounded-xl bg-indigo-600/50 px-4 py-3 font-bold text-white/70 cursor-not-allowed">Start 7-day trial · Coming with Play verification</button>
      <div className="text-[11px] text-slate-500 text-center mt-3">Current access: {entitlement.plan === 'premium' ? 'Premium' : 'Basic'}</div>
    </div>
  </div>;
}
