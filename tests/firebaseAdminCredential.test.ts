import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cert: vi.fn(), initialize: vi.fn(), apps: vi.fn() }));
vi.mock('firebase-admin/app', () => ({ getApps: mocks.apps, initializeApp: mocks.initialize, cert: mocks.cert }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  mocks.apps.mockReturnValue([]);
  mocks.cert.mockReturnValue('credential-fixture');
  mocks.initialize.mockReturnValue({ name: 'fixture' });
  vi.stubEnv('FIREBASE_PROJECT_ID', 'test-project');
});
afterEach(() => vi.unstubAllEnvs());
it('uses the configured server credential instead of unavailable metadata on Vercel', async () => {
  const account = { project_id: 'test-project', client_email: 'fixture@example.invalid', private_key: 'fictional-fixture' };
  vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', JSON.stringify(account));
  const { getFirebaseAdminApp } = await import('../server/firebaseAdmin');
  expect(getFirebaseAdminApp()).toEqual({ name: 'fixture' });
  expect(mocks.cert).toHaveBeenCalledWith(account);
  expect(mocks.initialize).toHaveBeenCalledWith({ projectId: 'test-project', credential: 'credential-fixture' });
});
it.each(['not-json', JSON.stringify({ project_id: 'other-project' })])('fails closed for invalid credential without logging its contents', async credential => {
  vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', credential);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { getFirebaseAdminApp } = await import('../server/firebaseAdmin');
  expect(getFirebaseAdminApp()).toBeNull();
  expect(mocks.initialize).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith('[firebaseAdmin] Unable to initialize the configured credential');
  warn.mockRestore();
});
