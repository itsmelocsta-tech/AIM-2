import React, { useEffect, useState } from 'react';
import { getIdToken } from '../../services/firebaseClient';
import { authenticatedFetch } from '../../services/authenticatedFetch';

declare global {
  interface Window { AIMPlay?: { postMessage: (message: string) => void; onmessage: ((event: MessageEvent) => void) | null }; }
}
export function PlaySubscription() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!window.AIMPlay) return;
    let current = true;
    authenticatedFetch('/api/aim/billing/config').then(async response => {
      if (!response.ok) throw new Error();
      const config = await response.json(); if (current) setEnabled(config.paymentsEnabled === true);
    }).catch(() => { if (current) setMessage('Subscription service unavailable.'); });
    authenticatedFetch('/api/aim/billing/status').then(async response => {
      if (!response.ok) throw new Error();
      const status = await response.json(); if (current) setActive(status.active === true);
    }).catch(() => { if (current) setActive(null); });
    return () => { current = false; };
  }, []);
  if (!window.AIMPlay) return null;
  async function run(action: 'purchase' | 'restore') {
    setBusy(true); setMessage('Checking Google Play…');
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error('Sign in to your AIM account first.');
      const data: any = await new Promise((resolve, reject) => {
        const bridge = window.AIMPlay!;
        const id = crypto.randomUUID();
        const timer = setTimeout(() => { bridge.onmessage = null; reject(new Error('Billing timed out. Try restoration again.')); }, 180000);
        bridge.onmessage = event => {
          const result = JSON.parse(event.data);
          if (result.id !== id) return;
          clearTimeout(timer); bridge.onmessage = null;
          result.error ? reject(new Error(result.error)) : resolve(result.data);
        };
        bridge.postMessage(JSON.stringify({ id, action, idToken }));
      });
      setMessage(data.active ? 'Your AIM Premium subscription is verified.' : 'No active AIM subscription was verified.');
      setActive(data.active === true);
    } catch (error: any) { setMessage(error.message || 'Billing unavailable.'); }
    finally { setBusy(false); }
  }
  return <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
    <h2 className="font-bold text-white">Google Play subscription</h2>
    {active === true && <p className="text-sm text-emerald-300">AIM Premium active</p>}
    {enabled && <button disabled={busy} onClick={() => run('purchase')} className="p-2 text-indigo-300">View AIM Premium offer</button>}
    <button disabled={busy} onClick={() => run('restore')} className="p-2 text-indigo-300">Restore subscription</button>
    <a href="https://play.google.com/store/account/subscriptions" className="block text-indigo-300">Manage or cancel in Google Play</a>
    {message && <p role="status" className="text-sm text-slate-300">{message}</p>}
  </section>;
}
