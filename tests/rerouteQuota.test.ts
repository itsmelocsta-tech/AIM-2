import { beforeEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
const state = vi.hoisted(() => ({ ids: [] as string[], plan: 'basic', unavailable: false }));
vi.mock('../server/entitlementService', () => ({
  readEntitlement: async () => ({ plan: state.plan }), isPremium: (e: any) => e.plan === 'premium',
}));
vi.mock('../server/firebaseAdmin', () => ({ getFirebaseAdminApp: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => {
  const ref: any = { collection: () => ref, doc: () => ref };
  return { collection: () => ref, runTransaction: async (run: any) => {
    if (state.unavailable) throw new Error('offline');
    return run({ get: async () => ({ data: () => ({ reservations: [...state.ids] }) }), set: (_: any, data: any) => { state.ids = data.reservations; } });
  } };
} }));
import { requireRerouteAllowance } from '../server/rerouteQuota';
beforeEach(() => { state.ids = []; state.plan = 'basic'; state.unavailable = false; });
function response() {
  const res: any = new EventEmitter();
  res.statusCode = 200; res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = vi.fn(); return res;
}
it('allows three Basic updates and rejects the fourth without charging again', async () => {
  const next = vi.fn();
  for (let n = 0; n < 3; n++) await requireRerouteAllowance({ user: { uid: 'owner' } } as any, response(), next);
  const res = response();
  await requireRerouteAllowance({ user: { uid: 'owner' } } as any, res, next);
  expect(next).toHaveBeenCalledTimes(3); expect(res.statusCode).toBe(429); expect(state.ids).toHaveLength(3);
});
it('returns an allowance after failed analysis and leaves Premium unlimited', async () => {
  const res = response();
  await requireRerouteAllowance({ user: { uid: 'owner' } } as any, res, vi.fn());
  res.statusCode = 503; res.emit('finish');
  await vi.waitFor(() => expect(state.ids).toHaveLength(0));
  state.plan = 'premium'; state.unavailable = true;
  const next = vi.fn(); await requireRerouteAllowance({ user: { uid: 'owner' } } as any, response(), next);
  expect(next).toHaveBeenCalledOnce();
});
it('fails visibly when the free allowance cannot be checked', async () => {
  state.unavailable = true; const next = vi.fn(), res = response();
  await requireRerouteAllowance({ user: { uid: 'owner' } } as any, res, next);
  expect(res.statusCode).toBe(503); expect(next).not.toHaveBeenCalled();
});
