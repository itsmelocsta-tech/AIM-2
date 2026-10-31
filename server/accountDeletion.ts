import type { Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';
import config from '../firebase-applet-config.json';
import { userVoiceCache } from './voice/userVoiceCache';

/** Delete only the authenticated account. Leave Auth usable if cleanup needs a retry. */
export async function deleteAccount(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Sign in first.' });
  if (req.body?.confirmed !== true) return res.status(400).json({ error: 'Confirm account deletion first.' });
  const age = Date.now() / 1000 - (req.user?.auth_time ?? 0);
  if (req.user?.firebase?.sign_in_provider !== 'anonymous' && (!Number.isFinite(age) || age < -60 || age > 300)) {
    return res.status(403).json({ code: 'RECENT_LOGIN_REQUIRED', error: 'Sign out and sign in again, then request deletion within five minutes.' });
  }
  // Purge cached audio and invalidate pending writes even if database deletion needs a retry.
  userVoiceCache.purge(uid);
  try {
    const app = getFirebaseAdminApp();
    if (!app) throw new Error('Unavailable');
    const db = getFirestore(app, config.firestoreDatabaseId);
    await db.recursiveDelete(db.collection('users').doc(uid));
    for (const name of ['billing_tokens', 'aiContentReports']) {
      const records = await db.collection(name).where('uid', '==', uid).get();
      for (const record of records.docs) await record.ref.delete();
    }
    await db.collection('aiReportAllowances').doc(uid).delete();
    await getAuth(app).deleteUser(uid);
    return res.set('Cache-Control', 'no-store').json({ deleted: true });
  } catch {
    return res.status(503).json({ error: 'Deletion did not finish. Some data may already be removed. Please retry.' });
  }
}
