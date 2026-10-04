import React, { useState } from 'react';
import { DailyPlan, PriorityTask, UserProfile } from '../../types';
import { scheduleRepository } from '../../services/repositories/scheduleRepository';
import { commitActivities, hasNativeAlarms, nativeAlarmRequest, prepareAlarmSound } from '../../services/activityAlarms';
import { storageService } from '../../services/storage';
import { ActivityAlarmControls } from './ActivityAlarmControls';

export function taskDurationMinutes(estimate: string): number {
  const hours = estimate.match(/(\d+(?:\.\d+)?)\s*(?:h|hour)/i);
  const minutes = estimate.match(/(\d+)\s*(?:m|min)/i);
  return Math.max(1, Math.min(480, Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : hours ? 0 : 25))));
}
export function StartTaskAlarm({ task, profile, onUpdatePlan }: { task: PriorityTask; profile: UserProfile; onUpdatePlan: (plan: DailyPlan) => void }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const minutes = taskDurationMinutes(task.timeEstimate || '');
  const existing = scheduleRepository.getAlarmItems(profile.id || '').find(i => i.id === `activity-${task.id}` && i.status === 'in_progress' && Date.parse(i.endAt) > Date.now());
  async function start() {
    if (busy || existing || !profile.id) return;
    setBusy(true);
    try {
      await prepareAlarmSound();
      if (hasNativeAlarms()) {
        const permissions = await nativeAlarmRequest('permissions');
        if (!permissions.ready) { setMessage(permissions.message); return; }
      }
      const now = Date.now();
      const item = await scheduleRepository.saveScheduleItem({ id: `activity-${task.id}`, userId: profile.id, title: task.task, description: task.description, startAt: new Date(now).toISOString(), endAt: new Date(now + minutes * 60000).toISOString(), timeZone: profile.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone, status: 'in_progress', priority: 'high', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() });
      commitActivities(profile.id, [item]);
      onUpdatePlan(storageService.getDailyPlan());
      setMessage(hasNativeAlarms() ? 'Activity started. Your finish alarm is being scheduled.' : 'Activity started. Keep AIM open for the finish alarm.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not start activity. Retry.'); }
    finally { setBusy(false); }
  }
  if (existing) return <div className="space-y-2"><p className="text-xs text-slate-300">Activity in progress</p><ActivityAlarmControls userId={profile.id || ''} items={[existing]} /></div>;
  return <div className="space-y-2">
    <button type="button" disabled={busy || Boolean(existing)} onClick={() => void start()} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-semibold text-white disabled:opacity-60 whitespace-normal">
      {existing ? 'Activity started · finish alarm saved' : busy ? 'Starting…' : `I’m doing it · ${minutes}-minute activity`}
    </button>
    <p role="status" className="text-xs text-slate-300">{message || `Start now. AIM will alert you when this ${minutes}-minute activity ends.`}</p>
  </div>;
}
