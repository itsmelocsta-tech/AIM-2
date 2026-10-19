import { describe, expect, it, vi } from 'vitest';
import {
  BASIC_LIMITS,
  DEFAULT_ENTITLEMENT,
  PLAY_LAUNCH_OFFER,
  canUsePremiumFeature,
  downgradeToBasic,
  formatMonthlyOfferPrice,
  getManageSubscriptionsUrl,
  getRequiredTrialDisclosureCopy,
  hasPremiumAccess,
} from '../src/services/entitlementService';

describe('AIM entitlements and single-source Google Play launch offer', () => {
  it('fails closed for malformed or missing Google Play renewal dates', () => {
    expect(hasPremiumAccess({ plan: 'premium', status: 'active', renewsAt: 'invalid' })).toBe(false);
    expect(hasPremiumAccess({ plan: 'premium', status: 'active', source: 'google_play' })).toBe(false);
  });
  it('defaults every unverified account to Basic', () => {
    expect(DEFAULT_ENTITLEMENT.plan).toBe('basic');
    expect(hasPremiumAccess(DEFAULT_ENTITLEMENT)).toBe(false);
  });

  it('uses play-launch-offer.json as the single source for the $7.99/month 3-day trial offer', () => {
    expect(PLAY_LAUNCH_OFFER.subscriptionProductId).toBe('aim_premium');
    expect(PLAY_LAUNCH_OFFER.basePlanId).toBe('monthly');
    expect(PLAY_LAUNCH_OFFER.monthlyPriceCents).toBe(799);
    expect(PLAY_LAUNCH_OFFER.introductoryOfferId).toBe('three_day_trial');
    expect(PLAY_LAUNCH_OFFER.freeTrialDays).toBe(3);
    expect(PLAY_LAUNCH_OFFER.annualPlanAtLaunch).toBe(false);
    expect(formatMonthlyOfferPrice()).toBe('$7.99/month');
    expect(getRequiredTrialDisclosureCopy()).toBe(
      'Try AIM free for 3 days. Then $7.99 per month, automatically renewed until you cancel. Cancel any time in Google Play subscriptions.'
    );
    expect(getManageSubscriptionsUrl()).toContain('play.google.com/store/account/subscriptions');
  });

  it('grants Premium only for active verified entitlement states', () => {
    expect(hasPremiumAccess({ plan: 'premium', status: 'active' })).toBe(true);
    expect(canUsePremiumFeature('unlimited_reroutes', { plan: 'premium', status: 'active' })).toBe(true);
  });

  it('honors an unexpired trial or renewal and rejects an expired one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    expect(hasPremiumAccess({ plan: 'premium', status: 'trial', trialEndsAt: '2026-10-07T12:00:00Z' })).toBe(true);
    expect(hasPremiumAccess({ plan: 'premium', status: 'trial', trialEndsAt: '2026-10-05T12:00:00Z' })).toBe(false);
    expect(hasPremiumAccess({ plan: 'premium', status: 'active', renewsAt: '2026-10-05T12:00:00Z' })).toBe(false);
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
