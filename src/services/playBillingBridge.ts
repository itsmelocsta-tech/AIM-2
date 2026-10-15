import { PLAY_LAUNCH_OFFER } from './entitlementService';

export interface PlayBillingBridgeStatus {
  platform: 'android_play' | 'web';
  packageName: string;
  billingReady: boolean;
  productId: string;
  basePlanId: string;
  trialOfferId: string;
  trialEligible: boolean;
}

export interface NativePlayPurchaseEvent {
  packageName: string;
  productId: string;
  purchaseToken: string;
  purchaseState?: number;
  isAcknowledged?: boolean;
  isAutoRenewing?: boolean;
  obfuscatedAccountId?: string | null;
}

interface NativeAimPlayBillingInterface {
  getBridgeStatusJson?: () => string;
  launchSubscriptionPurchase?: (firebaseUid: string, preferTrialOffer: boolean) => void;
  queryPurchasesForRestore?: (firebaseUid: string) => void;
  openManageSubscriptions?: () => void;
}

declare global {
  interface Window {
    AimPlayBilling?: NativeAimPlayBillingInterface;
  }
}

export function getPlayBillingBridgeStatus(): PlayBillingBridgeStatus {
  const fallback: PlayBillingBridgeStatus = {
    platform: 'web',
    packageName: PLAY_LAUNCH_OFFER.packageName,
    billingReady: false,
    productId: PLAY_LAUNCH_OFFER.subscriptionProductId,
    basePlanId: PLAY_LAUNCH_OFFER.basePlanId,
    trialOfferId: PLAY_LAUNCH_OFFER.introductoryOfferId,
    trialEligible: false,
  };

  if (typeof window === 'undefined' || !window.AimPlayBilling?.getBridgeStatusJson) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(window.AimPlayBilling.getBridgeStatusJson());
    return {
      platform: parsed.platform === 'android_play' ? 'android_play' : 'web',
      packageName: parsed.packageName || PLAY_LAUNCH_OFFER.packageName,
      billingReady: Boolean(parsed.billingReady),
      productId: parsed.productId || PLAY_LAUNCH_OFFER.subscriptionProductId,
      basePlanId: parsed.basePlanId || PLAY_LAUNCH_OFFER.basePlanId,
      trialOfferId: parsed.trialOfferId || PLAY_LAUNCH_OFFER.introductoryOfferId,
      trialEligible: Boolean(parsed.trialEligible),
    };
  } catch {
    return fallback;
  }
}

export function canStartPlayBillingPurchase(paymentsEnabledOverride?: boolean): boolean {
  const enabled =
    typeof paymentsEnabledOverride === 'boolean'
      ? paymentsEnabledOverride
      : Boolean(PLAY_LAUNCH_OFFER.paymentsEnabled);
  if (!enabled) return false;
  const status = getPlayBillingBridgeStatus();
  return status.platform === 'android_play' && status.billingReady;
}

export function launchNativePlayPurchase(firebaseUid: string, preferTrialOffer: boolean = true): boolean {
  if (!firebaseUid || !canStartPlayBillingPurchase()) return false;
  if (preferTrialOffer && !getPlayBillingBridgeStatus().trialEligible) return false;
  if (typeof window === 'undefined' || !window.AimPlayBilling?.launchSubscriptionPurchase) {
    return false;
  }
  window.AimPlayBilling.launchSubscriptionPurchase(firebaseUid, preferTrialOffer);
  return true;
}

export function requestNativePlayPurchaseRestore(firebaseUid: string): boolean {
  if (!firebaseUid) return false;
  if (typeof window === 'undefined' || !window.AimPlayBilling?.queryPurchasesForRestore) {
    return false;
  }
  window.AimPlayBilling.queryPurchasesForRestore(firebaseUid);
  return true;
}
