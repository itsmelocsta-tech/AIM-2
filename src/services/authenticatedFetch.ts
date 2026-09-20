import { getIdToken } from './firebaseClient';

export class AuthenticationError extends Error {
  constructor() {
    super('Please sign in again to continue.');
    this.name = 'AuthenticationError';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('aim:authentication-required'));
    }
  }
}

/** Send private AIM requests only after obtaining a Firebase ID token. */
export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/api/aim/')) {
    throw new Error('authenticatedFetch only accepts private AIM API paths');
  }
  let token: string | null;
  try {
    token = await getIdToken();
  } catch (error: any) {
    if (['auth/user-token-expired', 'auth/invalid-user-token', 'auth/user-disabled', 'auth/user-not-found'].includes(error?.code)) {
      throw new AuthenticationError();
    }
    throw new Error('Unable to verify your session. Check your connection and try again.');
  }
  if (!token) throw new AuthenticationError();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...init, headers, redirect: 'error' });
  if (response.status === 401) throw new AuthenticationError();
  return response;
}
