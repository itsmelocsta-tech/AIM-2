import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ claims: {} as any, invalid: false, reconcile: vi.fn() }));
vi.mock('google-auth-library', () => ({ OAuth2Client: class {
  async verifyIdToken() { if (state.invalid) throw new Error('invalid'); return { getPayload: () => state.claims }; }
} }));
vi.mock('../server/billing/googlePlay', () => ({ reconcilePurchaseToken: state.reconcile }));
import { playNotification } from '../server/billing/playNotifications';
beforeEach(() => {
  vi.stubEnv('PLAY_RTDN_AUDIENCE', 'https://example.test/api/play/notifications');
  vi.stubEnv('PLAY_RTDN_SERVICE_ACCOUNT_EMAIL', 'push@example.test');
  vi.stubEnv('PLAY_PACKAGE_NAME', 'com.itsmelocsta.aim');
  state.claims = { email: 'push@example.test', email_verified: true }; state.invalid = false; state.reconcile.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
function request(payload: any, auth = 'Bearer fictional-oidc-token') {
  return { headers: { authorization: auth }, body: { message: { data: Buffer.from(JSON.stringify(payload)).toString('base64') } } } as any;
}
function response() { return { status: vi.fn().mockReturnThis(), json: vi.fn(), sendStatus: vi.fn() } as any; }
const event = { packageName: 'com.itsmelocsta.aim', subscriptionNotification: { purchaseToken: 'fictional-token' } };
it('rejects missing, invalid, and wrong-service-account credentials before touching billing', async () => {
  const res = response(); await playNotification(request(event, ''), res); expect(res.sendStatus).toHaveBeenCalledWith(401);
  state.invalid = true; await playNotification(request(event), res); expect(res.sendStatus).toHaveBeenCalledWith(403);
  state.invalid = false; state.claims.email = 'other@example.test'; await playNotification(request(event), res);
  expect(state.reconcile).not.toHaveBeenCalled();
});
it('rechecks the purchase rather than granting access from notification fields', async () => {
  const res = response(); await playNotification(request(event), res);
  expect(state.reconcile).toHaveBeenCalledWith('fictional-token'); expect(res.sendStatus).toHaveBeenCalledWith(204);
});
it('rejects another package and asks Pub/Sub to retry verification outages', async () => {
  const res = response(); await playNotification(request({ ...event, packageName: 'other.app' }), res);
  expect(res.sendStatus).toHaveBeenCalledWith(400); expect(state.reconcile).not.toHaveBeenCalled();
  state.reconcile.mockImplementation(async () => { throw new Error('offline'); });
  await playNotification(request(event), res); expect(res.sendStatus).toHaveBeenCalledWith(503);
});
