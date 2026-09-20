import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const token = vi.hoisted(() => vi.fn());
vi.mock('../src/services/firebaseClient', () => ({ getIdToken: token }));
import { authenticatedFetch, AuthenticationError } from '../src/services/authenticatedFetch';
const request = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', request);
  token.mockResolvedValue('firebase-token');
  request.mockResolvedValue(new Response('{}', { status: 200 }));
});
afterEach(() => vi.unstubAllGlobals());
it('sends verified-session token and preserves caller headers and body', async () => {
  await authenticatedFetch('/api/aim/chat', { method: 'POST', headers: { 'X-Test': 'yes', Authorization: 'Bearer forged' }, body: '{}' });
  const options = request.mock.calls[0][1];
  expect(options.headers.get('Authorization')).toBe('Bearer firebase-token');
  expect(options.headers.get('X-Test')).toBe('yes');
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(options.body).toBe('{}');
  expect(options.redirect).toBe('error');
});
it('does not send requests without a token', async () => {
  token.mockResolvedValue(null);
  await expect(authenticatedFetch('/api/aim/chat')).rejects.toBeInstanceOf(AuthenticationError);
  expect(request).not.toHaveBeenCalled();
});
it('does not send requests when token retrieval fails', async () => {
  token.mockRejectedValue(new Error('offline'));
  await expect(authenticatedFetch('/api/aim/chat')).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});
it('reports unauthorized responses without retrying a mutation', async () => {
  request.mockResolvedValue(new Response('{}', { status: 401 }));
  await expect(authenticatedFetch('/api/aim/chat', { method: 'POST' })).rejects.toBeInstanceOf(AuthenticationError);
  expect(request).toHaveBeenCalledOnce();
});
it.each(['https://example.com/api/aim/chat', '//example.com/api/aim/chat', '/api/health'])('does not send tokens to %s', async path => {
  await expect(authenticatedFetch(path)).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});
it('routes all private API call sites through authenticatedFetch', () => {
  function scan(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (/\.tsx?$/.test(path)) {
        expect(readFileSync(path, 'utf8'), path).not.toMatch(/\bfetch\(['"`]\/api\/aim\//);
      }
    }
  }
  scan('src');
});
