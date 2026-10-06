import { describe, expect, it, vi } from 'vitest';
import { isPremium } from '../server/entitlementService';

describe('server Premium enforcement', () => {
  it('rejects Basic and expired states', () => {
    expect(isPremium({ plan: 'basic', status: 'free' })).toBe(false);
    expect(isPremium({ plan: 'premium', status: 'expired' })).toBe(false);
  });
  it('accepts active, grace, and live trial states', () => {
    expect(isPremium({ plan: 'premium', status: 'active' })).toBe(true);
    expect(isPremium({ plan: 'premium', status: 'grace' })).toBe(true);
    expect(isPremium({ plan: 'premium', status: 'trial', trialEndsAt: new Date(Date.now()+60000).toISOString() })).toBe(true);
  });
});
