import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ writes: [] as any[], count: 0, fail: false }));
vi.mock('../server/firebaseAdmin', () => ({ getFirebaseAdminApp: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({
  collection: (name: string) => ({ doc: (id = 'new-report') => ({ path: `${name}/${id}` }) }),
  runTransaction: async (callback: any) => {
    if (mock.fail) throw new Error('offline');
    return callback({ get: async () => ({ data: () => ({ day: new Date().toISOString().slice(0, 10), count: mock.count }) }), set: (ref: any, data: any) => mock.writes.push({ ref, data }) });
  },
}) }));
import { reportAiContent } from '../server/aiContentReports';
beforeEach(() => { mock.writes = []; mock.count = 0; mock.fail = false; });
const response = () => ({ status: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), json: vi.fn() }) as any;
const request = () => ({ user: { uid: 'report-owner' }, body: { uid: 'forged-owner', reason: 'misleading', content: 'Fictional AI response', feature: 'chat' } }) as any;
it('requires authentication and validates the reported content', async () => {
  for (const req of [{ body: request().body }, { ...request(), body: { ...request().body, content: '' } }, { ...request(), body: { ...request().body, reason: 'invalid' } }]) {
    await reportAiContent(req as any, response());
  }
  expect(mock.writes).toEqual([]);
});
it('stores the report under the verified owner rather than a supplied user ID', async () => {
  const res = response(); await reportAiContent(request(), res);
  expect(mock.writes[1].ref.path).toBe('aiContentReports/new-report');
  expect(mock.writes[1].data.uid).toBe('report-owner');
  expect(res.status).toHaveBeenCalledWith(201);
});
it('limits reports and reports a failed save honestly', async () => {
  mock.count = 20;
  const limited = response(); await reportAiContent(request(), limited);
  expect(limited.status).toHaveBeenCalledWith(429); expect(mock.writes).toEqual([]);
  mock.fail = true;
  const failed = response(); await reportAiContent(request(), failed);
  expect(failed.status).toHaveBeenCalledWith(503);
});
