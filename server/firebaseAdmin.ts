import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';

let appInstance: App | null = null;

export function getFirebaseAdminApp(): App {
  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = existing[0];
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0573723214';
      try {
        appInstance = initializeApp({
          projectId,
        });
      } catch (err) {
        console.warn('[firebaseAdmin] Failed to initialize admin app:', err);
      }
    }
  }
  return appInstance!;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) {
    return res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
  try {
    const decoded = await getAuth(app).verifyIdToken(match[1], true);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid, expired, or revoked authentication token' });
  }
}

// Compatibility export: authentication must never be optional on private routes.
export const verifyAuthToken = requireAuth;
