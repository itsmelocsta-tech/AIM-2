# Authentication

AIM uses Firebase Auth for Google popup, email/password, and anonymous guest sign-in. AuthContext observes Firebase session changes. Passwords go to Firebase through its SDK, not to Express. Firebase manages its session and ID-token refresh; AIM does not create custom session cookies.

## Private API boundary

Express mounts requireAuth on `/api/aim` before any private handlers. `/api/health` stays public. Missing/malformed authorization and invalid, expired, or revoked tokens return 401. Failure to initialize Firebase Admin returns 500 without reaching a handler. Successful verification attaches Firebase claims to `req.user`; request body UIDs are not proof of identity. The compatibility export `verifyAuthToken` now has the same strict behavior.

Every private client request uses `src/services/authenticatedFetch.ts`. It obtains a current Firebase ID token, overwrites any caller Authorization header, and refuses to send a request without a token. It only accepts local `/api/aim/` paths and disallows redirects. A 401 raises AuthenticationError without replaying a potentially mutating request. Authentication errors open the account dialog. Existing service-specific fallback behavior otherwise remains in place; an AI fallback is not proof that a server request succeeded.

## Deployment configuration

The browser uses firebase-applet-config.json. Set FIREBASE_PROJECT_ID on the server to the matching Firebase project; the existing project fallback remains for compatibility. Supply server-only Application Default Credentials through the deployment environment (for example, an attached service account). Revocation checking uses Firebase Auth backend access, so the runtime identity needs permission to read Firebase Auth users. Never put service-account JSON or private keys in browser configuration, VITE variables, or source control. GEMINI_API_KEY remains server-only.

## Separate boundaries and limitations

Browser Firestore access is independently protected by firestore.rules: the authenticated UID must match `/users/{userId}`. These rules must be deployed to the actual Firebase project. API token verification does not by itself add ownership checks to server-side shared state.

This change does not repair existing unscoped local application storage, account-switching cleanup, account deletion, or the separate Google Drive OAuth token stored in localStorage. It does not introduce role authorization or rate limiting. Do not treat this patch as a complete launch audit.

## Verification

Run `npm run check` for TypeScript, Vitest, and production build. Authentication tests exercise real local HTTP routes with mocked Firebase Admin verification, including absent/malformed/invalid/revoked tokens, valid requests, verified identity, initialization failure, and public health. Client tests verify token attachment, blocked unsigned requests, 401 handling, and that private call sites use the shared helper. Live Firebase credentials, deployed rules, and provider configuration require a separate deployment smoke test.
