import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';

const mocks = vi.hoisted(() => ({ verify: vi.fn(), initialize: vi.fn(), apps: vi.fn() }));
vi.mock('firebase-admin/app', () => ({ getApps: mocks.apps, initializeApp: mocks.initialize }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: mocks.verify }) }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.apps.mockReturnValue([{}]);
  mocks.verify.mockResolvedValue({ uid: 'verified-user' });
});

async function withServer(run: (base: string) => Promise<void>) {
  const { app } = await import('../server');
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}

describe('private API authentication', () => {
  it.each([undefined, 'Basic abc', 'Bearer ', 'Bearer one two'])('rejects missing or malformed authorization: %s', async authorization => {
    await withServer(async base => {
      const response = await fetch(`${base}/api/aim/voice/format-spoken`, {
        method: 'POST', headers: authorization ? { Authorization: authorization } : {},
      });
      expect(response.status).toBe(401);
      expect(mocks.verify).not.toHaveBeenCalled();
    });
  });

  it.each(['chat', 'coach/interact', 'plan', 'jobs/scan', 'context/check-in', 'intelligence/priority-assessment', 'voice/speak', 'recommendations/daily'])('protects %s', async path => {
    await withServer(async base => {
      expect((await fetch(`${base}/api/aim/${path}`, { method: 'POST' })).status).toBe(401);
    });
  });

  it.each(['expired', 'revoked', 'forged'])('rejects %s tokens', async reason => {
    mocks.verify.mockRejectedValue(new Error(reason));
    await withServer(async base => {
      expect((await fetch(`${base}/api/aim/voice/format-spoken`, {
        method: 'POST', headers: { Authorization: 'Bearer bad-token' },
      })).status).toBe(401);
    });
  });

  it('accepts verified tokens and checks revocation', async () => {
    await withServer(async base => {
      const response = await fetch(`${base}/api/aim/voice/format-spoken`, {
        method: 'POST', headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });
      expect(response.status).toBe(200);
      expect(mocks.verify).toHaveBeenCalledWith('valid-token', true);
    });
  });

  it('derives identity from verified claims, not the body', async () => {
    const { requireAuth } = await import('../server/firebaseAdmin');
    const req: any = { headers: { authorization: 'Bearer valid-token' }, body: { uid: 'other-user' } };
    const next = vi.fn();
    await requireAuth(req, {} as any, next);
    expect(req.user.uid).toBe('verified-user');
    expect(next).toHaveBeenCalledOnce();
  });

  it('fails closed if Firebase Admin cannot initialize', async () => {
    mocks.apps.mockReturnValue([]);
    mocks.initialize.mockImplementation(() => { throw new Error('unavailable'); });
    await withServer(async base => {
      expect((await fetch(`${base}/api/aim/voice/format-spoken`, {
        method: 'POST', headers: { Authorization: 'Bearer valid-token' },
      })).status).toBe(500);
    });
  });

  it('keeps health public', async () => {
    await withServer(async base => {
      expect((await fetch(`${base}/api/health`)).status).toBe(200);
    });
  });
});
