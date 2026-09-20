import { expect, it, vi } from 'vitest';
vi.mock('../src/services/firebaseClient', () => ({ getIdToken: vi.fn().mockResolvedValue(null) }));
import { DEFAULT_PROFILE } from '../src/services/storage';
import { api } from '../src/services/api';
import { AuthenticationError } from '../src/services/authenticatedFetch';
it('does not turn an unsigned chat request into a successful AI fallback', async () => {
  await expect(api.chatWithAIM({ message: 'Hello', history: [], userProfile: DEFAULT_PROFILE })).rejects.toBeInstanceOf(AuthenticationError);
});
