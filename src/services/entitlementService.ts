import playLaunchOffer from '../../play-launch-offer.json';

export type AimPlan = 'basic' | 'premium';
export type PremiumFeature =
  | 'multi_goal'
  | 'adaptive_planning'
  | 'unlimited_reroutes'
  | 'specialist_coaches'
  | 'automated_opportunities'
  | 'advanced_wellness'
  | 'creative_asset_intelligence'
  | 'advanced_insights'
  | 'automatic_alarms';

export interface AimEntitlement {
  plan: AimPlan;
  status: 'free' | 'trial' | 'active' | 'grace' | 'expired';
  trialEndsAt?: string;
  renewsAt?: string;
  productId?: string;
  basePlanId?: string;
  offerId?: string | null;
  cancelAtPeriodEnd?: boolean;
  source?: 'google_play' | 'default';
  updatedAt?: string;
  manageSubscriptionUrl?: string;
}

export const PLAY_LAUNCH_OFFER = playLaunchOffer;

export const BASIC_LIMITS = {
  activeGoals: 1,
  reroutesPerMonth: 3,
  automatedOpportunityScans: 0,
} as const;

export const PREMIUM_FEATURES: ReadonlySet<PremiumFeature> = new Set([
  'multi_goal',
  'adaptive_planning',
  'unlimited_reroutes',
  'specialist_coaches',
  'automated_opportunities',
  'advanced_wellness',
  'creative_asset_intelligence',
  'advanced_insights',
  'automatic_alarms',
]);

export const DEFAULT_ENTITLEMENT: AimEntitlement = { plan: 'basic', status: 'free' };

export function formatMonthlyOfferPrice(cents: number = PLAY_LAUNCH_OFFER.monthlyPriceCents): string {
  return `$${(cents / 100).toFixed(2)}/month`;
}

export function getRequiredTrialDisclosureCopy(): string {
  return (
    PLAY_LAUNCH_OFFER.disclosureCopy ||
    `Try AIM free for ${PLAY_LAUNCH_OFFER.freeTrialDays} days. Then $${(
      PLAY_LAUNCH_OFFER.monthlyPriceCents / 100
    ).toFixed(2)} per month, automatically renewed until you cancel. Cancel any time in Google Play subscriptions.`
  );
}

export function getManageSubscriptionsUrl(entitlement?: AimEntitlement | null): string {
  return (
    entitlement?.manageSubscriptionUrl ||
    PLAY_LAUNCH_OFFER.manageSubscriptionsUrl ||
    `https://play.google.com/store/account/subscriptions?sku=${PLAY_LAUNCH_OFFER.subscriptionProductId}&package=${PLAY_LAUNCH_OFFER.packageName}`
  );
}

export function hasPremiumAccess(entitlement?: AimEntitlement | null): boolean {
  if (!entitlement || entitlement.plan !== 'premium') return false;
  if (entitlement.status === 'active' || entitlement.status === 'grace') {
    if (entitlement.source === 'google_play' && !entitlement.renewsAt) return false;
    if (entitlement.renewsAt && (!Number.isFinite(Date.parse(entitlement.renewsAt)) || Date.parse(entitlement.renewsAt) <= Date.now())) return false;
    return true;
  }
  if (entitlement.status !== 'trial' || !entitlement.trialEndsAt) return false;
  return Date.parse(entitlement.trialEndsAt) > Date.now();
}

export function canUsePremiumFeature(feature: PremiumFeature, entitlement?: AimEntitlement | null): boolean {
  return PREMIUM_FEATURES.has(feature) && hasPremiumAccess(entitlement);
}

/**
 * Access changes never delete user-owned profile, goals, history, memories, plans,
 * wellness logs, or project data. Downgrades only disable premium computation/automation.
 */
export function downgradeToBasic(entitlement?: AimEntitlement | null): AimEntitlement {
  return { plan: 'basic', status: 'free', renewsAt: entitlement?.renewsAt };
}
