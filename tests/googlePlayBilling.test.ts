import { describe, expect, it } from 'vitest';
import { accountId, subscriptionAccess } from '../server/billing/googlePlay';
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
