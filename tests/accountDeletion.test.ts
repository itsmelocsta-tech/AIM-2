import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ removed: [] as string[], fail: false, auth: [] as string[] }));
vi.mock('../server/firebaseAdmin', () => ({ getFirebaseAdminApp: () => ({}) }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ deleteUser: async (uid: string) => { calls.auth.push(uid); } }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({
  collection: (name: string) => ({
    doc: (id: string) => ({ path: `${name}/${id}`, delete: async () => { calls.removed.push(`${name}/${id}`); } }),
    where: (_: string, __: string, uid: string) => ({ get: async () => ({ docs: [{ ref: { delete: async () => calls.removed.push(`owner:${uid}`) } }] }) }),
  }),
  recursiveDelete: async (ref: any) => { if (calls.fail) throw new Error('offline'); calls.removed.push(ref.path); },
}) }));
import { deleteAccount } from '../server/accountDeletion';
beforeEach(() => { calls.removed = []; calls.auth = []; calls.fail = false; });
function response() { return { status: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), json: vi.fn() } as any; }
const request = () => ({ user: { uid: 'owner', auth_time: Math.floor(Date.now() / 1000) }, body: { confirmed: true, uid: 'someone-else' } } as any);
it('requires explicit confirmation and a recent authenticated session', async () => {
  for (const req of [{ body: { confirmed: true } }, { ...request(), body: {} }, { ...request(), user: { uid: 'owner', auth_time: 1 } }]) {
    const res = response(); await deleteAccount(req as any, res); expect(res.status).toHaveBeenCalled();
  }
  expect(calls.removed).toEqual([]); expect(calls.auth).toEqual([]);
});
it('deletes only the authenticated owner and removes Auth after associated data', async () => {
  const res = response(); await deleteAccount(request(), res);
  expect(calls.removed).toEqual(['users/owner', 'rerouteAllowances/owner', 'playSubscriptions/owner', 'owner:owner']);
  expect(calls.auth).toEqual(['owner']); expect(res.json).toHaveBeenCalledWith({ deleted: true });
});
it('keeps sign-in available for a retry when data removal fails', async () => {
  calls.fail = true; const res = response(); await deleteAccount(request(), res);
  expect(res.status).toHaveBeenCalledWith(503); expect(calls.auth).toEqual([]);
});
it('allows the verified anonymous session to delete its data without an unavailable password', async () => {
  const req = request(); req.user = { uid: 'owner', firebase: { sign_in_provider: 'anonymous' } };
  const res = response(); await deleteAccount(req, res);
  expect(res.json).toHaveBeenCalledWith({ deleted: true });
});
