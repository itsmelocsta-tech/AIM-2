import { Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';

export type ServerAimPlan = 'basic' | 'premium';
export interface ServerEntitlement { plan: ServerAimPlan; status: 'free'|'trial'|'active'|'grace'|'expired'; trialEndsAt?: string; renewsAt?: string; }

export const BASIC_SERVER_ENTITLEMENT: ServerEntitlement = { plan: 'basic', status: 'free' };

export async function readEntitlement(uid: string): Promise<ServerEntitlement> {
  const app = getFirebaseAdminApp();
  if (!app) return BASIC_SERVER_ENTITLEMENT;
  try {
    const snap = await getFirestore(app).doc(`users/${uid}/billing/entitlement`).get();
    const data = snap.data() as ServerEntitlement | undefined;
    return data?.plan ? data : BASIC_SERVER_ENTITLEMENT;
  } catch (error) {
    console.warn('[entitlements] Defaulting to Basic because entitlement could not be verified:', error);
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
