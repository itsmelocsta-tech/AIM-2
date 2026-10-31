import type { VoiceSynthesisResponse } from './AIMVoiceService';

// Process-local only. Expire idle entries too; never retain personal speech indefinitely.
export class UserVoiceCache<T> {
  private entries = new Map<string, { uid: string; value?: T; timer: ReturnType<typeof setTimeout> }>();
  constructor(private ttlMs = 5 * 60_000, private limit = 100) {}
  acquire(uid: string | undefined, key: string): { cached?: T; save: (value: T) => void } {
    if (!uid) return { save: () => {} };
    const id = JSON.stringify([uid, key]);
    const existing = this.entries.get(id);
    if (existing?.value !== undefined) return { cached: existing.value, save: () => {} };
    if (existing) this.remove(id);
    while (this.entries.size >= this.limit) this.remove(this.entries.keys().next().value!);
    const entry = { uid, value: undefined as T | undefined, timer: setTimeout(() => this.remove(id), this.ttlMs) };
    entry.timer.unref?.();
    this.entries.set(id, entry);
    return { save: value => {
      // Expiry, deletion, or eviction invalidates even an in-flight synthesis.
      if (this.entries.get(id) === entry) entry.value = value;
    } };
  }
  purge(uid: string): void {
    for (const [key, entry] of this.entries) if (entry.uid === uid) this.remove(key);
  }
  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) clearTimeout(entry.timer);
    this.entries.delete(key);
  }
}
export const userVoiceCache = new UserVoiceCache<VoiceSynthesisResponse>();
