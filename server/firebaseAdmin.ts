import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';

let appInstance: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (!appInstance) {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = existing[0];
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0573723214';
      try {
        // Vercel has no attached Google service identity by default. Keep the
        // credential in its server-only environment; local/Cloud Run can use ADC.
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        let credential;
        if (serviceAccountJson) {
          const serviceAccount = JSON.parse(serviceAccountJson);
          if (serviceAccount.project_id !== projectId) {
            throw new Error('Firebase Admin project mismatch');
          }
          credential = cert(serviceAccount);
        }
        appInstance = initializeApp({
          projectId,
          ...(credential ? { credential } : {}),
        });
      } catch {
        // Do not print credential contents (including malformed JSON) to logs.
        console.warn('[firebaseAdmin] Failed to initialize admin app or credentials');
      }
    }
  }
  return appInstance;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) {
    return res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
  }

  try {
    const app = getFirebaseAdminApp();
    if (!app) {
      return res.status(500).json({ error: 'Authentication service unavailable' });
    }
    const decoded = await getAuth(app).verifyIdToken(match[1], true);
    req.user = decoded;
    return next();
  } catch (error: any) {
    // The Admin SDK can label a failed verification HTTP request as
    // auth/argument-error. That is an infrastructure failure, not a bad token.
    if (/^Error while making request:/i.test(error?.message || '')) {
      return res.status(503).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
    }
    const invalidCredentials = new Set([
      'auth/argument-error', 'auth/invalid-argument', 'auth/invalid-id-token',
      'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled',
      'auth/user-not-found',
    ]);
    if (!invalidCredentials.has(error?.code)) {
      return res.status(503).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid, expired, or revoked authentication token' });
  }
}

// Compatibility export: authentication must never be optional on private routes.
export const verifyAuthToken = requireAuth;
