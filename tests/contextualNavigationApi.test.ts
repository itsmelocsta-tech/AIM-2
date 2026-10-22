import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../src/services/authenticatedFetch', () => ({ authenticatedFetch: vi.fn().mockImplementation(async () => new Response(JSON.stringify({ reply: 'Consider health, dating and work.' }))), AuthenticationError: class extends Error {} }));
import { api } from '../src/services/api';
import { DEFAULT_PROFILE } from '../src/services/storage';
import { CONTEXTUAL_MENTION_EVENT } from '../src/services/contextualNavigationService';

afterEach(() => vi.unstubAllGlobals());
it('announces only submitted user topics with their owner, never topics in the generated reply', async () => {
  const dispatchEvent = vi.fn();
  vi.stubGlobal('window', { dispatchEvent });
  vi.stubGlobal('CustomEvent', class { type: string; detail: unknown; constructor(type: string, options: any) { this.type = type; this.detail = options.detail; } });
  const profile = { ...DEFAULT_PROFILE, id: 'fictional-owner' };
  await api.chatWithAIM({ message: 'I want a clearer direction.', history: [], userProfile: profile });
  expect(dispatchEvent).not.toHaveBeenCalled();
  await api.interactWithCoach({ coachId: 'guidance', message: 'My friend and I argued.', userProfile: profile });
  expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: CONTEXTUAL_MENTION_EVENT, detail: { userId: profile.id, spaces: ['relationships'] } }));
});
