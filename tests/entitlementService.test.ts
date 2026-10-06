import { describe, expect, it, vi } from 'vitest';
import { BASIC_LIMITS, DEFAULT_ENTITLEMENT, canUsePremiumFeature, downgradeToBasic, hasPremiumAccess } from '../src/services/entitlementService';

describe('AIM entitlements', () => {
  it('defaults every unverified account to Basic', () => {
    expect(DEFAULT_ENTITLEMENT.plan).toBe('basic');
    expect(hasPremiumAccess(DEFAULT_ENTITLEMENT)).toBe(false);
  });

  it('grants Premium only for active verified entitlement states', () => {
    expect(hasPremiumAccess({ plan: 'premium', status: 'active' })).toBe(true);
    expect(canUsePremiumFeature('unlimited_reroutes', { plan: 'premium', status: 'active' })).toBe(true);
  });

  it('honors an unexpired trial and rejects an expired one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    expect(hasPremiumAccess({ plan: 'premium', status: 'trial', trialEndsAt: '2026-10-07T12:00:00Z' })).toBe(true);
    expect(hasPremiumAccess({ plan: 'premium', status: 'trial', trialEndsAt: '2026-10-05T12:00:00Z' })).toBe(false);
    vi.useRealTimers();
  });

  it('downgrades access without representing user data deletion', () => {
    expect(downgradeToBasic({ plan: 'premium', status: 'active', renewsAt: '2026-11-01T00:00:00Z' })).toEqual({
      plan: 'basic',
      status: 'free',
      renewsAt: '2026-11-01T00:00:00Z',
    });
    expect(BASIC_LIMITS.activeGoals).toBe(1);
  });
});
