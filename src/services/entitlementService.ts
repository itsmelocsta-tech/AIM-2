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
}

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

export function hasPremiumAccess(entitlement?: AimEntitlement | null): boolean {
  if (!entitlement || entitlement.plan !== 'premium') return false;
  if (entitlement.status === 'active' || entitlement.status === 'grace') return true;
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
