import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../services/authenticatedFetch';
import { storageService } from '../../services/storage';
import { AuthModal } from './AuthModal';
import { hasNativeAlarms, nativeAlarmRequest } from '../../services/activityAlarms';

export function AccountDeletionPage() {
  const { user, loading, logOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [deleted, setDeleted] = useState(false);
  async function remove() {
    if (!confirmed || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await authenticatedFetch('/api/aim/account', { method: 'DELETE', body: JSON.stringify({ confirmed: true }) });
      const result = await response.json();
      if (!response.ok || !result.deleted) throw new Error(result.error || 'Deletion did not finish. Please retry.');
      if (hasNativeAlarms()) await nativeAlarmRequest('replace', { userId: user?.uid, alarms: [] }).catch(() => {
        setMessage('Your account was deleted, but AIM could not clear device alarms. Turn off AIM alarms in Android settings.');
      });
      storageService.clearAllData();
      setDeleted(true);
      await logOut();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Deletion did not finish. Please retry.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-950 text-white px-4 py-12">
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      <h1 className="text-2xl font-bold">Delete your AIM account</h1>
      {deleted ? <p role="status">Your AIM account and saved AIM data were deleted.</p> : <>
        <p className="text-slate-300">This permanently deletes your AIM sign-in, goals, plans, memories, history, and saved settings. You cannot undo it.</p>
        <p className="text-sm text-slate-300">Deleting AIM does not cancel a Google Play subscription. Cancel it in Google Play to stop future payments. Files you saved in Google Drive stay in your Drive.</p>
        <a className="block text-indigo-300 underline" href="https://play.google.com/store/account/subscriptions">Manage or cancel your Google Play subscription</a>
        {loading ? <p>Checking your account…</p> : !user ? <button className="rounded-xl bg-indigo-600 px-4 py-3" onClick={() => setAuthOpen(true)}>Sign in to request deletion</button> : <>
          <label className="flex gap-3 items-start"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} className="mt-1"/><span>I understand that my AIM account and saved AIM data will be permanently deleted.</span></label>
          <button disabled={!confirmed || busy} onClick={remove} className="w-full rounded-xl bg-rose-700 disabled:opacity-50 px-4 py-3">{busy ? 'Deleting…' : 'Permanently delete my AIM account'}</button>
          <button disabled={busy} onClick={async () => { await logOut(); setConfirmed(false); }} className="text-indigo-300 underline">Sign out to sign in again</button>
        </>}
      </>}
      {message && <p role="alert" className="text-rose-300">{message}</p>}
      <a href="/" className="block text-indigo-300 underline">Back to AIM</a>
    </section>
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
  </main>;
}
