import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../src/services/entitlementService', async importOriginal => {
  const original = await importOriginal<any>();
  return { ...original, PLAY_LAUNCH_OFFER: { ...original.PLAY_LAUNCH_OFFER, paymentsEnabled: true } };
});
import { canStartPlayBillingPurchase, launchNativePlayPurchase } from '../src/services/playBillingBridge';
afterEach(() => vi.unstubAllGlobals());
it('does not silently turn an ineligible free-trial request into a paid purchase', () => {
  const launch = vi.fn();
  vi.stubGlobal('window', { AimPlayBilling: {
    getBridgeStatusJson: () => JSON.stringify({ platform: 'android_play', billingReady: true, trialEligible: false }),
    launchSubscriptionPurchase: launch,
  } });
  expect(launchNativePlayPurchase('fictional-uid', true)).toBe(false);
  expect(launch).not.toHaveBeenCalled();
});
it('launches an eligible request only when payments and billing are available', () => {
  const launch = vi.fn();
  vi.stubGlobal('window', { AimPlayBilling: {
    getBridgeStatusJson: () => JSON.stringify({ platform: 'android_play', billingReady: true, trialEligible: true }),
    launchSubscriptionPurchase: launch,
  } });
  expect(canStartPlayBillingPurchase(false)).toBe(false);
  expect(launchNativePlayPurchase('fictional-uid', true)).toBe(true);
  expect(launch).toHaveBeenCalledWith('fictional-uid', true);
});
