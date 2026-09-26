import { expect, it, vi } from 'vitest';
const getToken = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock('../src/services/firebaseClient', () => ({ getIdToken: getToken }));
import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../src/services/storage';
import { api } from '../src/services/api';
import { AuthenticationError } from '../src/services/authenticatedFetch';
it('does not turn an unsigned chat request into a successful AI fallback', async () => {
  await expect(api.chatWithAIM({ message: 'Hello', history: [], userProfile: DEFAULT_PROFILE })).rejects.toBeInstanceOf(AuthenticationError);
});

it('does not invent a pathway or life reroute when an authenticated request fails', async () => {
  getToken.mockResolvedValueOnce('valid-token').mockResolvedValueOnce('valid-token');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"unavailable"}', { status: 503 })));
  try {
    await expect(api.crossReferencePathways({ currentState: 'Looking for work', desiredState: 'Steady income' })).rejects.toThrow('503');
    await expect(api.analyzeLifeUpdate({
      content: 'My interview moved', currentGoals: [],
      currentDailyPlan: { ...DEFAULT_DAILY_PLAN },
    })).rejects.toThrow('503');
  } finally {
    vi.unstubAllGlobals();
  }
});
