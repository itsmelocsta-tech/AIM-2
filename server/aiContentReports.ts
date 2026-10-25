import { Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest, getFirebaseAdminApp } from './firebaseAdmin';
import config from '../firebase-applet-config.json';

export const REPORT_REASONS = ['unsafe', 'offensive', 'misleading', 'other'] as const;

export async function reportAiContent(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Sign in to report a response.' });
  const { content, reason, details = '', feature = 'unknown' } = req.body || {};
  if (typeof content !== 'string' || !content.trim() || content.length > 8000 ||
      !REPORT_REASONS.includes(reason) || typeof details !== 'string' || details.length > 2000 ||
      typeof feature !== 'string' || feature.length > 80) {
    return res.status(400).json({ error: 'Include the response, a reason, and no more than 2,000 characters of notes.' });
  }
  try {
    const app = getFirebaseAdminApp();
    if (!app) throw new Error('Unavailable');
    // Outside the client-writable user hierarchy; only trusted Admin code can read reports.
    const db = getFirestore(app, config.firestoreDatabaseId);
    const daily = db.collection('aiReportAllowances').doc(uid);
    const report = db.collection('aiContentReports').doc();
    const day = new Date().toISOString().slice(0, 10);
    const saved = await db.runTransaction(async transaction => {
      const previous = (await transaction.get(daily)).data();
      const count = previous?.day === day ? Number(previous.count) || 0 : 0;
      if (count >= 20) return false;
      transaction.set(daily, { day, count: count + 1 });
      transaction.set(report, { uid, content: content.trim(), reason, details: details.trim(), feature, status: 'new', createdAt: new Date().toISOString() });
      return true;
    });
    if (!saved) return res.status(429).json({ error: 'You have sent 20 reports today. Try again tomorrow.' });
    return res.set('Cache-Control', 'no-store').status(201).json({ reported: true });
  } catch {
    return res.status(503).json({ error: 'Your report could not be saved. Please retry.' });
  }
}
