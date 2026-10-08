import { randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';
import { isPremium, readEntitlement } from './entitlementService';
import config from '../firebase-applet-config.json';

export const BASIC_REROUTES_PER_MONTH = 3;

// Server-only records prevent clients from resetting their own allowance.
export async function requireRerouteAllowance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Sign in first.' });
  if (isPremium(await readEntitlement(uid))) return next();
  try {
    const app = getFirebaseAdminApp();
    if (!app) throw new Error('Allowance service unavailable');
    const db = getFirestore(app, config.firestoreDatabaseId);
    const month = new Date().toISOString().slice(0, 7);
    const ref = db.collection('rerouteAllowances').doc(uid).collection('months').doc(month);
    const reservation = randomUUID();
    const accepted = await db.runTransaction(async tx => {
      const saved = await tx.get(ref);
      const reservations: string[] = saved.data()?.reservations ?? [];
      if (reservations.length >= BASIC_REROUTES_PER_MONTH) return false;
      tx.set(ref, { reservations: [...reservations, reservation] });
      return true;
    });
    if (!accepted) return res.status(429).json({ code: 'BASIC_REROUTE_LIMIT', error: 'You used your 3 free plan updates this month. Try again next month or choose Premium.' });
    // Failed analysis does not consume a free update. Transactions also protect
    // simultaneous requests from exceeding the allowance.
    res.once('finish', () => {
      if (res.statusCode < 400) return;
      void db.runTransaction(async tx => {
        const saved = await tx.get(ref);
        const reservations: string[] = saved.data()?.reservations ?? [];
        tx.set(ref, { reservations: reservations.filter(id => id !== reservation) });
      }).catch(() => console.warn('[reroutes] Could not return an unsuccessful update allowance.'));
    });
    return next();
  } catch {
    return res.status(503).json({ error: 'AIM cannot check your free plan updates right now. Please try again.' });
  }
}
