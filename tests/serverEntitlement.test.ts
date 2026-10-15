import { describe, expect, it } from 'vitest';
import { isPremium, normalizeStoredEntitlement } from '../server/entitlementService';

describe('server Premium enforcement', () => {
  it('fails closed for malformed or missing Google Play renewal dates', () => {
    expect(isPremium({ plan: 'premium', status: 'active', renewsAt: 'invalid' })).toBe(false);
    expect(isPremium({ plan: 'premium', status: 'active', source: 'google_play' })).toBe(false);
  });
  it('rejects Basic and expired states', () => {
    expect(isPremium({ plan: 'basic', status: 'free' })).toBe(false);
    expect(isPremium({ plan: 'premium', status: 'expired' })).toBe(false);
    expect(
      isPremium({
        plan: 'premium',
        status: 'active',
        renewsAt: new Date(Date.now() - 60000).toISOString(),
      })
    ).toBe(false);
  });

  it('accepts active, grace, and live trial states', () => {
    expect(isPremium({ plan: 'premium', status: 'active' })).toBe(true);
    expect(isPremium({ plan: 'premium', status: 'grace' })).toBe(true);
    expect(
      isPremium({
        plan: 'premium',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 60000).toISOString(),
      })
    ).toBe(true);
  });

  it('normalizes expired stored entitlements back to Basic expired state', () => {
    const expiredTrial = normalizeStoredEntitlement({
      plan: 'premium',
      status: 'trial',
      trialEndsAt: new Date(Date.now() - 60000).toISOString(),
    });
    expect(expiredTrial.plan).toBe('basic');
    expect(expiredTrial.status).toBe('expired');
  });
});
