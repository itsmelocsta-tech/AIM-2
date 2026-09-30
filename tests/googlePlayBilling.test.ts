import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ write: vi.fn(), bind: vi.fn(), owner: vi.fn(), access: vi.fn() }));
vi.mock('../server/firebaseAdmin', () => ({ getFirebaseAdminApp: () => ({}) }));
vi.mock('google-auth-library', () => ({ GoogleAuth: class { async getClient() { return { getAccessToken: mocks.access }; } } }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({
  collection: () => ({ doc: () => ({ set: mocks.write }) }),
  runTransaction: async (callback: any) => callback({ get: mocks.owner, set: mocks.bind }),
}) }));
import { accountId, subscriptionAccess, verifySubscription } from '../server/billing/googlePlay';
const now = Date.parse('2026-09-30T00:00:00Z');
const purchase = (state = 'SUBSCRIPTION_STATE_ACTIVE') => ({ subscriptionState: state,
  externalAccountIdentifiers: { obfuscatedExternalAccountId: accountId('alice') },
  lineItems: [{ productId: 'aim_premium', offerDetails: { basePlanId: 'monthly' }, expiryTime: '2026-10-01T00:00:00Z' }] });
describe('Google Play entitlement decisions', () => {
  it.each(['ACTIVE', 'IN_GRACE_PERIOD', 'CANCELED'])('allows unexpired %s subscriptions', state => {
    expect(subscriptionAccess(purchase(`SUBSCRIPTION_STATE_${state}`), 'alice', now).active).toBe(true);
  });
  it.each(['PENDING', 'ON_HOLD', 'PAUSED', 'EXPIRED', 'PENDING_PURCHASE_CANCELED', 'UNKNOWN'])('denies %s', state => {
    expect(subscriptionAccess(purchase(`SUBSCRIPTION_STATE_${state}`), 'alice', now).active).toBe(false);
  });
  it('rejects another account or an unbound purchase', () => {
    expect(() => subscriptionAccess(purchase(), 'bob', now)).toThrow();
    expect(() => subscriptionAccess({ ...purchase(), externalAccountIdentifiers: {} }, 'alice', now)).toThrow();
  });
  it('denies expired, wrong-product, wrong-plan and malformed expiry purchases', () => {
    for (const update of [{ expiryTime: '2026-09-29' }, { expiryTime: 'invalid' }, { productId: 'other' }, { offerDetails: { basePlanId: 'annual' } }]) {
      const p = purchase(); Object.assign(p.lineItems[0], update);
      expect(subscriptionAccess(p, 'alice', now).active).toBe(false);
    }
  });
});

describe('Play server verification and acknowledgment', () => {
  beforeEach(() => {
    vi.stubEnv('PLAY_PACKAGE_NAME', 'com.itsmelocsta.aim');
    vi.stubEnv('PLAY_SERVICE_ACCOUNT_JSON', '{}');
    mocks.access.mockResolvedValue({ token: 'server-oauth-token' });
    mocks.owner.mockResolvedValue({ exists: false });
    mocks.write.mockResolvedValue(undefined);
    mocks.bind.mockReset(); mocks.write.mockClear();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  function currentPurchase() {
    return { ...purchase(), acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
      lineItems: [{ productId: 'aim_premium', offerDetails: { basePlanId: 'monthly' }, expiryTime: '2099-01-01T00:00:00Z' }] };
  }
  it('verifies with Google and acknowledges before persisting access', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(currentPurchase())))
      .mockResolvedValueOnce(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    expect((await verifySubscription('alice', 'purchase-token')).active).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain('subscriptionsv2/tokens/purchase-token');
    expect(fetchMock.mock.calls[1][0]).toContain(':acknowledge');
    expect(mocks.write).toHaveBeenCalledOnce();
  });
  it('does not persist access if acknowledgment fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(currentPurchase())))
      .mockResolvedValueOnce(new Response('', { status: 503 })));
    await expect(verifySubscription('alice', 'purchase-token')).rejects.toThrow();
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('never binds or saves a purchase with a different AIM account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(currentPurchase()))));
    await expect(verifySubscription('bob', 'purchase-token')).rejects.toThrow();
    expect(mocks.bind).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
  });
  it('rejects a token already owned by another account', async () => {
    mocks.owner.mockResolvedValue({ exists: true, data: () => ({ uid: 'bob' }) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(currentPurchase()))));
    await expect(verifySubscription('alice', 'purchase-token')).rejects.toThrow();
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('fails closed on Google API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    await expect(verifySubscription('alice', 'purchase-token')).rejects.toThrow();
    expect(mocks.write).not.toHaveBeenCalled();
  });
});
