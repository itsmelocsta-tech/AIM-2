import { createHash } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';
import { getFirestore } from 'firebase-admin/firestore';
import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, getFirebaseAdminApp } from '../firebaseAdmin';
import offer from '../../play-launch-offer.json';
import config from '../../firebase-applet-config.json';

export const accountId = (uid: string) => createHash('sha256').update(uid).digest('hex');
export function subscriptionAccess(purchase: any, uid: string, now = Date.now()) {
  if (purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId !== accountId(uid)) {
    throw new Error('Purchase belongs to a different AIM account');
  }
  const states = ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED'];
  const line = purchase.lineItems?.find((item: any) => item.productId === offer.subscriptionProductId &&
    item.offerDetails?.basePlanId === offer.basePlanId && Date.parse(item.expiryTime) > now);
  return { active: states.includes(purchase.subscriptionState) && Boolean(line),
    expiresAt: line?.expiryTime ?? null, state: purchase.subscriptionState ?? 'UNKNOWN' };
}
function billingDb() {
  const app = getFirebaseAdminApp();
  if (!app) throw new Error('Firebase Admin unavailable');
  return getFirestore(app, config.firestoreDatabaseId);
}
async function playRequest(path: string, method = 'GET') {
  const raw = process.env.PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw || !process.env.PLAY_PACKAGE_NAME) throw new Error('Google Play configuration unavailable');
  const auth = new GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/androidpublisher'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(process.env.PLAY_PACKAGE_NAME)}/${path}`, {
    method, headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: '{}' } : {}), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (!response.ok) throw new Error('Google Play verification unavailable');
  return response.status === 204 ? {} : response.json();
}
export async function verifySubscription(uid: string, token: string) {
  const purchase = await playRequest(`purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`);
  const entitlement = subscriptionAccess(purchase, uid);
  const db = billingDb();
  const ownerRef = db.collection('playPurchaseOwners').doc(accountId(token));
  // A token cannot be claimed by two AIM accounts. Clients cannot write here.
  await db.runTransaction(async transaction => {
    const owner = await transaction.get(ownerRef);
    if (owner.exists && owner.data()?.uid !== uid) throw new Error('Purchase already linked');
    transaction.set(ownerRef, { uid });
  });
  if (entitlement.active && purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
    await playRequest(`purchases/subscriptions/${encodeURIComponent(offer.subscriptionProductId)}/tokens/${encodeURIComponent(token)}:acknowledge`, 'POST');
  }
  await db.collection('playSubscriptions').doc(uid).set({ token, ...entitlement, verifiedAt: new Date().toISOString() });
  return entitlement;
}
export async function currentSubscription(uid: string) {
  const saved = await billingDb().collection('playSubscriptions').doc(uid).get();
  return saved.exists ? verifySubscription(uid, saved.data()!.token) : { active: false };
}
export function accessRequired() {
  return offer.paymentsEnabled && process.env.PLAY_BILLING_ENABLED === 'true' && process.env.PLAY_ACCESS_ENFORCED === 'true';
}
export async function requirePaidAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!accessRequired()) return next();
  try {
    const subscription = await currentSubscription(req.user!.uid);
    if (!subscription.active) return res.status(402).set('Cache-Control', 'no-store').json({ error: 'AIM Premium subscription required', code: 'SUBSCRIPTION_REQUIRED' });
    next();
  } catch {
    res.status(503).set('Cache-Control', 'no-store').json({ error: 'Subscription status unavailable. Try again later.' });
  }
}
export const billingRouter = Router();
billingRouter.get('/config', (req: AuthenticatedRequest, res) => {
  res.set('Cache-Control', 'no-store').json({ paymentsEnabled: offer.paymentsEnabled && process.env.PLAY_BILLING_ENABLED === 'true',
    accessRequired: accessRequired(), accountId: accountId(req.user!.uid), productId: offer.subscriptionProductId, basePlanId: offer.basePlanId, offerId: offer.introductoryOfferId });
});
billingRouter.post('/verify', async (req: AuthenticatedRequest, res) => {
  const token = req.body?.purchaseToken;
  if (typeof token !== 'string' || !token.length || token.length > 4096) return res.status(400).json({ error: 'A purchase token is required' });
  try { res.set('Cache-Control', 'no-store').json(await verifySubscription(req.user!.uid, token)); }
  catch { res.status(503).json({ error: 'Purchase could not be verified. No paid access was granted. Retry restoration later.' }); }
});
billingRouter.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    // Revalidate with Google on every status request: local clocks or cached Firestore state never grant access.
    res.set('Cache-Control', 'no-store').json(await currentSubscription(req.user!.uid));
  } catch { res.status(503).json({ error: 'Subscription status unavailable' }); }
});
