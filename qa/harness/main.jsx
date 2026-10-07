import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UpgradeModal } from '../../src/components/common/UpgradeModal';
import { DEFAULT_ENTITLEMENT, hasPremiumAccess } from '../../src/services/entitlementService';
import '../../src/index.css';

function PremiumHarness() {
  const [open, setOpen] = useState(false);
  const [entitlement, setEntitlement] = useState(DEFAULT_ENTITLEMENT);
  const states = {
    basic: DEFAULT_ENTITLEMENT,
    active: { plan: 'premium', status: 'active' },
    trial: { plan: 'premium', status: 'trial', trialEndsAt: new Date(Date.now() + 60000).toISOString() },
    expired: { plan: 'premium', status: 'trial', trialEndsAt: new Date(Date.now() - 60000).toISOString() },
  };
  return <main className="min-h-screen bg-slate-950 text-white p-4">
    <h1>Isolated Premium component harness</h1>
    <label>Entitlement fixture <select aria-label="Entitlement fixture" className="bg-slate-900 m-3" onChange={e => setEntitlement(states[e.target.value])}>
      {Object.keys(states).map(x => <option key={x}>{x}</option>)}
    </select></label>
    <output aria-label="Premium access">{hasPremiumAccess(entitlement) ? 'granted' : 'denied'}</output>
    <button onClick={() => setOpen(true)} className="block p-3">Review Premium</button>
    <UpgradeModal open={open} onClose={() => setOpen(false)} entitlement={entitlement}/>
  </main>;
}
createRoot(document.getElementById('root')).render(<PremiumHarness/>);
