import React, { useEffect, useState } from 'react';
import { ScheduleItem } from '../../types';
import { ALARM_CHANGE, cancelActivityAlarms, commitActivities, hasNativeAlarms, nativeAlarmRequest, prepareAlarmSound, readCommitments } from '../../services/activityAlarms';

export function ActivityAlarmControls({ userId, items, label = 'I’m doing it · set alarms', showWhenEmpty = false }: { userId: string; items: ScheduleItem[]; label?: string; showWhenEmpty?: boolean }) {
  const [start, setStart] = useState(true), [end, setEnd] = useState(true);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { const update = () => setRevision(n => n + 1); window.addEventListener(ALARM_CHANGE, update); return () => window.removeEventListener(ALARM_CHANGE, update); }, []);
  const saved = readCommitments(userId);
  const eligible = items.filter(i => i.userId === userId && Date.parse(i.endAt) > Date.now() && !['completed', 'cancelled', 'skipped', 'missed'].includes(i.status));
  const armed = eligible.length > 0 && eligible.every(i => Boolean(saved[i.id]));
  const displayedStart = armed ? eligible.every(i => saved[i.id]?.start) : start;
  const displayedEnd = armed ? eligible.every(i => saved[i.id]?.end) : end;
  if (!eligible.length && !showWhenEmpty) return null;
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
      setMessage(hasNativeAlarms() ? 'Alarm choices saved. Check AIM Clock for delivery status.' : 'Alarms saved. Keep AIM open to hear them.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not set alarms. Retry.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2 text-xs" onClick={e => e.stopPropagation()} data-alarm-revision={revision}>
    <div className="flex flex-wrap gap-3 text-slate-300">
      <label className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={displayedStart} disabled={armed} onChange={e => setStart(e.target.checked)} />Start alert</label>
      <label className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={displayedEnd} disabled={armed} onChange={e => setEnd(e.target.checked)} />Finish alert</label>
    </div>
    <button type="button" disabled={busy || !eligible.length || (!armed && !start && !end)} onClick={() => {
      if (armed) { eligible.forEach(i => cancelActivityAlarms(userId, i.id)); setMessage('Alarms canceled.'); }
      else void enable();
    }} className="min-h-11 rounded-xl border border-indigo-700 bg-indigo-950/60 px-3 py-2 text-indigo-200 disabled:opacity-50 whitespace-normal text-left">
      {busy ? 'Setting alarms…' : armed ? 'Cancel alarms' : label}
    </button>
    {!eligible.length && <p role="status" className="text-slate-400 leading-relaxed">No upcoming activities remain in this plan. Add or reroute an activity to set its alerts.</p>}
    {message && <p role="status" className="text-slate-300 leading-relaxed">{message}</p>}
  </div>;
}
