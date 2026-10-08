import { Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';
import config from '../firebase-applet-config.json';

export async function deleteAccount(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Sign in first.' });
  if (req.body?.confirmed !== true) return res.status(400).json({ error: 'Confirm account deletion first.' });
  const signedInAt = req.user?.auth_time;
  const anonymous = req.user?.firebase?.sign_in_provider === 'anonymous';
  if (!anonymous && (typeof signedInAt !== 'number' || signedInAt > Date.now() / 1000 + 60 || Date.now() / 1000 - signedInAt > 300)) {
    return res.status(403).json({ code: 'RECENT_LOGIN_REQUIRED', error: 'Sign out and sign in again, then request deletion within five minutes.' });
  }
  try {
    const app = getFirebaseAdminApp();
    if (!app) throw new Error('Account service unavailable');
    const db = getFirestore(app, config.firestoreDatabaseId);
    await db.recursiveDelete(db.collection('users').doc(uid));
    await db.recursiveDelete(db.collection('rerouteAllowances').doc(uid));
    await db.collection('playSubscriptions').doc(uid).delete();
    const purchases = await db.collection('playPurchaseOwners').where('uid', '==', uid).get();
    for (const purchase of purchases.docs) await purchase.ref.delete();
    // Keep the sign-in usable for retry if data cleanup fails. Remove Auth last.
    await getAuth(app).deleteUser(uid);
    return res.set('Cache-Control', 'no-store').json({ deleted: true });
  } catch {
    return res.status(503).json({ error: 'Deletion did not finish. Some data may already be removed. Please retry.' });
  }
}
