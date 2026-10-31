import { afterEach, expect, it, vi } from 'vitest';
import { UserVoiceCache, userVoiceCache } from '../server/voice/userVoiceCache';
afterEach(() => vi.useRealTimers());
it('isolates identical text across users and does not cache unauthenticated calls', () => {
  vi.useFakeTimers(); const cache = new UserVoiceCache<string>(1000);
  cache.acquire('one', 'same').save('private');
  expect(cache.acquire('one', 'same').cached).toBe('private');
  expect(cache.acquire('two', 'same').cached).toBeUndefined();
  cache.acquire(undefined, 'same').save('anonymous');
  expect(cache.acquire(undefined, 'same').cached).toBeUndefined();
});
it('expires idle speech without another lookup and rejects a late synthesis result', () => {
  vi.useFakeTimers(); const cache = new UserVoiceCache<string>(1000);
  const pending = cache.acquire('one', 'pending');
  cache.acquire('one', 'ready').save('private');
  vi.advanceTimersByTime(1000); pending.save('late private');
  expect(cache.acquire('one', 'ready').cached).toBeUndefined();
  expect(cache.acquire('one', 'pending').cached).toBeUndefined();
});
it('purges only the deleted user and prevents pending writes resurrecting data', () => {
  vi.useFakeTimers(); const cache = new UserVoiceCache<string>();
  const pending = cache.acquire('one', 'pending');
  cache.acquire('one', 'ready').save('one');
  cache.acquire('two', 'ready').save('two');
  cache.purge('one'); pending.save('late');
  expect(cache.acquire('one', 'pending').cached).toBeUndefined();
  expect(cache.acquire('one', 'ready').cached).toBeUndefined();
  expect(cache.acquire('two', 'ready').cached).toBe('two');
});
it('bounds cache size and invalidates evicted pending requests', () => {
  vi.useFakeTimers(); const cache = new UserVoiceCache<string>(1000, 1);
  const first = cache.acquire('one', 'first');
  cache.acquire('two', 'second').save('second'); first.save('late');
  expect(cache.acquire('two', 'second').cached).toBe('second');
  expect(cache.acquire('one', 'first').cached).toBeUndefined();
});
