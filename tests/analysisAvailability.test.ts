import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';

const auth = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('firebase-admin/app', () => ({ getApps: () => [{}], initializeApp: vi.fn() }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: auth.verify }) }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('GEMINI_API_KEY', '');
  auth.verify.mockResolvedValue({ uid: 'test-user' });
});
afterAll(() => vi.unstubAllEnvs());

async function withServer(run: (base: string) => Promise<void>) {
  const { app } = await import('../server');
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}

it('does not invent a starting plan or reroute when the analysis service is unavailable', async () => {
  await withServer(async base => {
    const headers = { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' };
    const start = await fetch(`${base}/api/aim/cross-reference`, {
      method: 'POST', headers,
      body: JSON.stringify({ currentState: 'Looking for work', desiredState: 'Steady income' }),
    });
    expect(start.status).toBe(503);
    expect(await start.json()).not.toHaveProperty('pathways');

    const reroute = await fetch(`${base}/api/aim/life-update-analyze`, {
      method: 'POST', headers,
      body: JSON.stringify({ content: 'My interview moved', currentDailyPlan: { date: '2026-09-26', priorityTasks: [], timeBlocks: [] } }),
    });
    expect(reroute.status).toBe(503);
    expect(await reroute.json()).not.toHaveProperty('proposedReroute');
  });
});
