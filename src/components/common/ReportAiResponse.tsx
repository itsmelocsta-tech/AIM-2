import React, { useState } from 'react';
import { authenticatedFetch } from '../../services/authenticatedFetch';

export function ReportAiResponse({ feature }: { feature: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('unsafe');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage('');
    try {
      const response = await authenticatedFetch('/api/aim/content-reports', {
        method: 'POST', body: JSON.stringify({ content, reason, details, feature }),
      });
      if (!response.ok) throw new Error('Could not save your report. Please retry.');
      setContent(''); setDetails(''); setMessage('Report received. The AIM team can review it.');
    } catch { setMessage('Could not save your report. Your text is kept here so you can retry.'); }
    finally { setSaving(false); }
  }

  return <>
    <button type="button" className="underline hover:text-white" onClick={() => { setOpen(true); setMessage(''); }}>Report an AI response</button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true" aria-labelledby="report-ai-title">
      <form onSubmit={submit} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left text-slate-100">
        <h2 id="report-ai-title" className="text-xl font-bold">Report an AI response</h2>
        <p className="mt-2 text-sm text-slate-300">Send a harmful, offensive, or misleading response to the AIM team. Include only the response you want reviewed.</p>
        <label htmlFor="report-ai-content" className="mt-4 block text-sm">Response to report</label>
        <textarea id="report-ai-content" required maxLength={8000} rows={4} value={content} onChange={event => setContent(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3" />
        <label htmlFor="report-ai-reason" className="mt-3 block text-sm">Reason</label>
        <select id="report-ai-reason" value={reason} onChange={event => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3">
          <option value="unsafe">Harmful or unsafe</option><option value="offensive">Offensive content</option><option value="misleading">Misleading or inaccurate</option><option value="other">Other</option>
        </select>
        <label htmlFor="report-ai-details" className="mt-3 block text-sm">Notes (optional)</label>
        <textarea id="report-ai-details" maxLength={2000} rows={2} value={details} onChange={event => setDetails(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-3" />
        <p role="status" className="mt-3 text-sm text-indigo-200">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-3">Close</button>
          <button type="submit" disabled={saving || !content.trim()} className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold disabled:opacity-50">{saving ? 'Sending…' : 'Send report'}</button>
        </div>
      </form>
    </div>}
  </>;
}
