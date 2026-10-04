import React, { useEffect, useState } from 'react';
import { ScheduleItem } from '../../types';
import { ALARM_CHANGE, cancelActivityAlarms, commitActivities, hasNativeAlarms, nativeAlarmRequest, prepareAlarmSound, readCommitments } from '../../services/activityAlarms';

export function ActivityAlarmControls({ userId, items, label = 'I’m doing it · set alarms' }: { userId: string; items: ScheduleItem[]; label?: string }) {
  const [start, setStart] = useState(true), [end, setEnd] = useState(true);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { const update = () => setRevision(n => n + 1); window.addEventListener(ALARM_CHANGE, update); return () => window.removeEventListener(ALARM_CHANGE, update); }, []);
  const saved = readCommitments(userId);
  const eligible = items.filter(i => i.userId === userId && Date.parse(i.endAt) > Date.now() && !['completed', 'cancelled', 'skipped', 'missed'].includes(i.status));
  const armed = eligible.length > 0 && eligible.every(i => Boolean(saved[i.id]));
  if (!eligible.length) return null;
  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      await prepareAlarmSound();
      if (hasNativeAlarms()) {
        const result = await nativeAlarmRequest('permissions');
        if (!result.ready) { setMessage(result.message); return; }
      }
      commitActivities(userId, eligible, { start, end });
      setMessage(hasNativeAlarms() ? 'Preparing your alarms…' : 'Alarms saved. Keep AIM open to hear them.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not set alarms. Retry.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2 text-xs" onClick={e => e.stopPropagation()} data-alarm-revision={revision}>
    {!armed && <div className="flex flex-wrap gap-3 text-slate-300">
      <label className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={start} onChange={e => setStart(e.target.checked)} />Start alert</label>
      <label className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={end} onChange={e => setEnd(e.target.checked)} />Finish alert</label>
    </div>}
    <button type="button" disabled={busy || (!armed && !start && !end)} onClick={() => {
      if (armed) { eligible.forEach(i => cancelActivityAlarms(userId, i.id)); setMessage('Alarms canceled.'); }
      else void enable();
    }} className="min-h-11 rounded-xl border border-indigo-700 bg-indigo-950/60 px-3 py-2 text-indigo-200 disabled:opacity-50 whitespace-normal text-left">
      {busy ? 'Setting alarms…' : armed ? 'Cancel alarms' : label}
    </button>
    {message && <p role="status" className="text-slate-300 leading-relaxed">{message}</p>}
  </div>;
}
