import { ScheduleItem } from '../types';

export type AlarmKind = 'start' | 'end';
export interface AlarmChoice { start: boolean; end: boolean; }
export interface ActivityAlarm { key: string; itemId: string; title: string; kind: AlarmKind; at: number; }
interface Commitment extends AlarmChoice { startAt: string; endAt: string; fired: string[]; }
const keyFor = (userId: string) => `aim_activity_alarms_v1_${userId}`;
export const ALARM_CHANGE = 'aim:alarms-changed';
export const SCHEDULE_CHANGE = 'aim:schedule-changed';
const terminal = new Set(['completed', 'skipped', 'cancelled', 'missed']);

export function readCommitments(userId: string): Record<string, Commitment> {
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(userId)) || '{}');
    if (!saved || Array.isArray(saved) || typeof saved !== 'object') return {};
    return Object.fromEntries(Object.entries(saved).filter(([, value]: [string, any]) => value && Array.isArray(value.fired) && typeof value.startAt === 'string' && typeof value.endAt === 'string')) as Record<string, Commitment>;
  } catch { return {}; }
}
function write(userId: string, commitments: Record<string, Commitment>, notify = true) {
  localStorage.setItem(keyFor(userId), JSON.stringify(commitments));
  if (notify && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(ALARM_CHANGE));
}
export function commitActivities(userId: string, items: ScheduleItem[], choice: AlarmChoice = { start: true, end: true }, now = Date.now()) {
  if (!userId) throw new Error('Sign in before setting alarms.');
  const saved = readCommitments(userId);
  for (const item of items) {
    if (item.userId !== userId || terminal.has(item.status)) continue;
    const start = Date.parse(item.startAt), end = Date.parse(item.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= now) continue;
    const prior = saved[item.id];
    saved[item.id] = { ...choice, startAt: item.startAt, endAt: item.endAt,
      fired: prior?.fired || [] };
    if (start <= now) {
      const key = `${item.id}:start:${start}`;
      if (!saved[item.id].fired.includes(key)) saved[item.id].fired.push(key);
    }
  }
  write(userId, saved);
}
export function cancelActivityAlarms(userId: string, itemId: string) {
  const saved = readCommitments(userId); delete saved[itemId]; write(userId, saved);
}

/** Reconcile against the canonical schedule, so reroutes cannot leave an old alarm armed. */
export function collectActivityAlarms(userId: string, items: ScheduleItem[], now = Date.now()): ActivityAlarm[] {
  const saved = readCommitments(userId);
  const byId = new Map(items.filter(i => i.userId === userId).map(i => [i.id, i]));
  const alarms: ActivityAlarm[] = [];
  let changed = false;
  for (const [id, commitment] of Object.entries(saved)) {
    const item = byId.get(id);
    if (!item || terminal.has(item.status) || Date.parse(item.endAt) < now - 60000) {
      delete saved[id]; changed = true; continue;
    }
    if (commitment.startAt !== item.startAt || commitment.endAt !== item.endAt) {
      commitment.startAt = item.startAt; commitment.endAt = item.endAt; changed = true;
    }
    for (const kind of ['start', 'end'] as const) {
      const at = Date.parse(kind === 'start' ? item.startAt : item.endAt);
      const key = `${id}:${kind}:${at}`;
      if (!commitment[kind] || commitment.fired.includes(key) || !Number.isFinite(at)) continue;
      // Starting now already acknowledges the start. Never replay old alerts after reopening AIM.
      if ((kind === 'start' && item.status === 'in_progress') || at < now - 60000) {
        commitment.fired.push(key); changed = true; continue;
      }
      alarms.push({ key, itemId: id, title: item.title, kind, at });
    }
  }
  if (changed) localStorage.setItem(keyFor(userId), JSON.stringify(saved));
  return alarms.sort((a, b) => a.at - b.at || a.kind.localeCompare(b.kind));
}
export function markAlarmFired(userId: string, alarm: ActivityAlarm) {
  const saved = readCommitments(userId);
  if (saved[alarm.itemId] && !saved[alarm.itemId].fired.includes(alarm.key)) {
    saved[alarm.itemId].fired.push(alarm.key); write(userId, saved, false);
  }
}

interface NativeBridge { postMessage: (message: string) => void; onmessage?: (event: { data: string }) => void; }
declare global { interface Window { AIMAlarms?: NativeBridge; } }
let requestCounter = 0;
const requests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void; timeout: number }>();
export const hasNativeAlarms = () => typeof window !== 'undefined' && Boolean(window.AIMAlarms);
export async function nativeAlarmRequest(action: string, payload: Record<string, unknown> = {}): Promise<{ ready: boolean; message: string }> {
  const bridge = window.AIMAlarms;
  if (!bridge) return { ready: false, message: 'Keep AIM open for alarms. Background alarms require the AIM Android app.' };
  const id = `alarm-${Date.now()}-${++requestCounter}`;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => { requests.delete(id); reject(new Error('Alarm setup timed out. Please retry.')); }, 15000);
    requests.set(id, { resolve, reject, timeout });
    bridge.onmessage = event => {
      let result; try { result = JSON.parse(event.data); } catch { return; }
      const request = requests.get(result.id); if (!request) return;
      clearTimeout(request.timeout); requests.delete(result.id);
      if (result.error) request.reject(new Error(result.error)); else request.resolve({ ready: Boolean(result.ready), message: String(result.message || '') });
    };
    try { bridge.postMessage(JSON.stringify({ id, action, ...payload })); }
    catch (error) { clearTimeout(timeout); requests.delete(id); reject(error); }
  });
}
let audio: AudioContext | undefined;
export async function prepareAlarmSound() {
  if (hasNativeAlarms()) return;
  try { audio ||= new AudioContext(); await audio.resume(); } catch { /* Visible alert remains available. */ }
}
export function playAlarmSound() {
  if (!audio || audio.state !== 'running' || hasNativeAlarms()) return;
  for (let i = 0; i < 3; i++) {
    const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + i * 0.35;
    oscillator.frequency.value = 660; gain.gain.setValueAtTime(0.12, at); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + 0.25);
  }
}
