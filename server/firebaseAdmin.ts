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

export async function verifyAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const app = getFirebaseAdminApp();
    if (!app) {
      return next();
    }
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.warn('[firebaseAdmin] Token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const app = getFirebaseAdminApp();
    if (!app) {
      return res.status(500).json({ error: 'Firebase Admin not initialized on server' });
    }
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
  }
}
