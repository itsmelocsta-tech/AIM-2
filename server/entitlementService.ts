import { Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';
import firebaseConfig from '../firebase-applet-config.json';
import playLaunchOffer from '../play-launch-offer.json';

export type ServerAimPlan = 'basic' | 'premium';
export type ServerEntitlementStatus = 'free' | 'trial' | 'active' | 'grace' | 'expired';

export interface ServerEntitlement {
  plan: ServerAimPlan;
  status: ServerEntitlementStatus;
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

export interface ProtectedPlaySubscriptionRecord {
  uid: string;
  tokenHash: string;
  purchaseToken?: string;
  packageName: string;
  productId: string;
  basePlanId: string;
  offerId: string | null;
  subscriptionState: string;
  acknowledgementState: string;
  expiryTime?: string;
  autoRenewEnabled: boolean;
  verifiedAt: string;
  lastNotificationType?: number;
}

export const BASIC_SERVER_ENTITLEMENT: ServerEntitlement = {
  plan: 'basic',
  status: 'free',
};

export function isPremium(e: ServerEntitlement, nowMs: number = Date.now()): boolean {
  if (!e || e.plan !== 'premium') return false;
  if (e.status === 'active' || e.status === 'grace') {
    if (e.source === 'google_play' && !e.renewsAt) return false;
    if (e.renewsAt && (!Number.isFinite(Date.parse(e.renewsAt)) || Date.parse(e.renewsAt) <= nowMs)) return false;
    return true;
  }
  return e.status === 'trial' && Boolean(e.trialEndsAt) && Date.parse(e.trialEndsAt!) > nowMs;
}

export function normalizeStoredEntitlement(
  raw?: ServerEntitlement | null,
  nowMs: number = Date.now()
): ServerEntitlement {
  if (!raw || !raw.plan) return BASIC_SERVER_ENTITLEMENT;
  if (raw.plan === 'premium' && !isPremium(raw, nowMs)) {
    return {
      ...raw,
      plan: 'basic',
      status: 'expired',
    };
  }
  return raw;
}

export async function readEntitlement(uid: string): Promise<ServerEntitlement> {
  const app = getFirebaseAdminApp();
  if (!app) return BASIC_SERVER_ENTITLEMENT;
  try {
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    const snap = await db.doc(`users/${uid}/billing/entitlement`).get();
    const data = snap.data() as ServerEntitlement | undefined;
    return normalizeStoredEntitlement(data);
  } catch (error) {
    console.warn('[entitlements] Defaulting to Basic because entitlement could not be verified:', error);
    return BASIC_SERVER_ENTITLEMENT;
  }
}

export async function writeProtectedBillingRecords(params: {
  uid: string;
  entitlement: ServerEntitlement;
  subscriptionRecord: ProtectedPlaySubscriptionRecord;
  linkedTokenHash?: string | null;
}): Promise<ServerEntitlement> {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin is unavailable; cannot persist protected billing records.');
  }
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  const { uid, entitlement, subscriptionRecord, linkedTokenHash } = params;

  const storedEntitlement: ServerEntitlement = {
    ...entitlement,
    manageSubscriptionUrl: entitlement.manageSubscriptionUrl || playLaunchOffer.manageSubscriptionsUrl,
    updatedAt: new Date().toISOString(),
  };

  // Reserve token ownership and publish access atomically. A separate get/set
  // lets two accounts claim the same token or leaves entitlement half-written.
  await db.runTransaction(async transaction => {
    const tokenRef = db.doc(`billing_tokens/${subscriptionRecord.tokenHash}`);
    const token = (await transaction.get(tokenRef)).data();
    const linkedRef = linkedTokenHash && linkedTokenHash !== subscriptionRecord.tokenHash
      ? db.doc(`billing_tokens/${linkedTokenHash}`) : null;
    const linked = linkedRef ? (await transaction.get(linkedRef)).data() : null;
    if ((token?.uid && token.uid !== uid) || (linked?.uid && linked.uid !== uid)) {
      const error: any = new Error('Purchase token is already bound to another account.');
      error.code = 'PLAY_TOKEN_OWNERSHIP_MISMATCH';
      error.statusCode = 403;
      throw error;
    }
    if (token?.replacedByTokenHash) {
      throw new Error('This purchase token has been superseded; restore the current subscription.');
    }

    transaction.set(tokenRef, {
      uid,
      tokenHash: subscriptionRecord.tokenHash,
      packageName: subscriptionRecord.packageName,
      productId: subscriptionRecord.productId,
      basePlanId: subscriptionRecord.basePlanId,
      offerId: subscriptionRecord.offerId,
      subscriptionState: subscriptionRecord.subscriptionState,
      expiryTime: subscriptionRecord.expiryTime || null,
      updatedAt: storedEntitlement.updatedAt,
    });

    if (linkedRef) {
      transaction.set(linkedRef, {
        uid,
        replacedByTokenHash: subscriptionRecord.tokenHash,
        updatedAt: storedEntitlement.updatedAt,
      }, { merge: true });
    }

    const withoutUndefined = (record: object) => Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== undefined)
    );
    transaction.set(db.doc(`users/${uid}/billing/play_subscription`), withoutUndefined(subscriptionRecord));
    transaction.set(db.doc(`users/${uid}/billing/entitlement`), withoutUndefined(storedEntitlement));
  });

  return storedEntitlement;
}

export async function requirePremium(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.uid) return res.status(401).json({ error: 'Authentication required.' });
  const entitlement = await readEntitlement(req.user.uid);
  if (!isPremium(entitlement)) {
    return res.status(403).json({
      code: 'PREMIUM_REQUIRED',
      error: 'AIM Premium is required for this feature.',
      entitlement,
    });
  }
  (req as any).entitlement = entitlement;
  return next();
}
