import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './firebaseAdmin';
import { currentSubscription } from './billing/googlePlay';

export type ServerAimPlan = 'basic' | 'premium';
export interface ServerEntitlement { plan: ServerAimPlan; status: 'free'|'trial'|'active'|'grace'|'expired'; trialEndsAt?: string; renewsAt?: string; }

export const BASIC_SERVER_ENTITLEMENT: ServerEntitlement = { plan: 'basic', status: 'free' };

export async function readEntitlement(uid: string): Promise<ServerEntitlement> {
  try {
    // Never trust /users billing data: users own that hierarchy. Google Play
    // verification reads the server-only purchase record and rechecks Google.
    const subscription = await currentSubscription(uid);
    if (!subscription.active || !('expiresAt' in subscription) ||
        !subscription.expiresAt || Date.parse(subscription.expiresAt) <= Date.now() ||
        !Number.isFinite(Date.parse(subscription.expiresAt))) return BASIC_SERVER_ENTITLEMENT;
    return {
      plan: 'premium',
      status: subscription.state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ? 'grace' : 'active',
      renewsAt: subscription.expiresAt,
    };
  } catch {
    console.warn('[entitlements] Paid access could not be verified; using Basic access.');
    return BASIC_SERVER_ENTITLEMENT;
  }
}

export function isPremium(e: ServerEntitlement): boolean {
  if (e.plan !== 'premium') return false;
  if (e.status === 'active' || e.status === 'grace') return true;
  return e.status === 'trial' && Boolean(e.trialEndsAt) && Date.parse(e.trialEndsAt!) > Date.now();
}

export async function requirePremium(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.uid) return res.status(401).json({ error: 'Authentication required.' });
  const entitlement = await readEntitlement(req.user.uid);
  if (!isPremium(entitlement)) return res.status(403).json({ code: 'PREMIUM_REQUIRED', error: 'AIM Premium is required for this feature.', entitlement });
  (req as any).entitlement = entitlement;
  return next();
}
