import React, { useEffect, useState } from 'react';
import { scheduleRepository } from '../../services/repositories/scheduleRepository';
import { ActivityAlarm, ALARM_CHANGE, SCHEDULE_CHANGE, collectActivityAlarms, hasNativeAlarms, markAlarmFired, nativeAlarmRequest, playAlarmSound } from '../../services/activityAlarms';

export function AimAlarmClock({ userId }: { userId: string | null }) {
  const [next, setNext] = useState<ActivityAlarm | null>(null), [ringing, setRinging] = useState<ActivityAlarm[]>([]);
  const [now, setNow] = useState(Date.now()), [nativeMessage, setNativeMessage] = useState('');
  useEffect(() => {
    setRinging([]); setNext(null); setNativeMessage('');
    let stopped = false, nativeSignature = '', syncing = false, dirty = false;
    async function syncNative() {
      if (!hasNativeAlarms()) return;
      if (syncing) { dirty = true; return; }
      syncing = true;
      try {
        do {
          dirty = false;
          const alarms = userId ? collectActivityAlarms(userId, scheduleRepository.getAlarmItems(userId)).filter(a => a.at > Date.now()) : [];
          const signature = JSON.stringify({ userId, alarms });
          if (signature === nativeSignature) continue;
          const result = await nativeAlarmRequest('replace', { userId: userId || '', alarms });
          if (!stopped) { nativeSignature = signature; setNativeMessage(result.message); }
        } while (dirty && !stopped);
      } catch (error) { if (!stopped) setNativeMessage(error instanceof Error ? error.message : 'Alarms could not be scheduled. Retry.'); }
      finally { syncing = false; }
    }
    function tick() {
      const time = Date.now(); setNow(time);
      if (!userId) return;
      const alarms = collectActivityAlarms(userId, scheduleRepository.getAlarmItems(userId), time);
      const due = alarms.filter(a => a.at <= time);
      if (due.length) {
        due.forEach(a => markAlarmFired(userId, a));
        setRinging(previous => [...previous, ...due].slice(-4)); playAlarmSound();
      }
      setNext(alarms.find(a => a.at > time) || null);
    }
    const update = () => { tick(); void syncNative(); };
    // Auth changes replace the native queue, including an empty queue on sign-out.
    update();
    const interval = window.setInterval(tick, 1000);
    window.addEventListener(ALARM_CHANGE, update); window.addEventListener(SCHEDULE_CHANGE, update);
    window.addEventListener('focus', update); document.addEventListener('visibilitychange', update);
    return () => { stopped = true; clearInterval(interval); window.removeEventListener(ALARM_CHANGE, update); window.removeEventListener(SCHEDULE_CHANGE, update); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [userId]);
  if (!userId) return null;
  return <>
    {(next || nativeMessage) && <aside aria-label="AIM alarm clock" className="mx-3 sm:mx-6 my-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs space-y-1">
      {next && <p className="text-indigo-200 break-words">AIM Clock · {next.kind === 'start' ? 'Start' : 'Finish'} {next.title} at {new Date(next.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · in {Math.ceil((next.at - now) / 60000)} min</p>}
      <p role="status" className="text-slate-400">{hasNativeAlarms() ? nativeMessage : 'Keep AIM open for alarms. Background alarms require the AIM Android app.'}</p>
    </aside>}
    {ringing.length > 0 && <div role="alertdialog" aria-modal="true" aria-labelledby="aim-alarm-title" onKeyDown={e => { if (e.key === 'Tab') e.preventDefault(); if (e.key === 'Escape') setRinging(alarms => alarms.slice(1)); }} className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-indigo-500 bg-slate-900 p-6 space-y-4">
        <h2 id="aim-alarm-title" className="text-lg font-bold text-white">{ringing[0].kind === 'start' ? 'Time to start' : 'Time to wrap up'}</h2>
        <p className="text-slate-200 break-words">{ringing[0].title}</p>
        <button autoFocus type="button" className="min-h-11 w-full bg-indigo-600 text-white rounded-xl px-4 py-3" onClick={() => setRinging(alarms => alarms.slice(1))}>Dismiss alarm</button>
      </div>
    </div>}
  </>;
}
