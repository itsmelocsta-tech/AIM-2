# Live Firebase audit — 2026-09-27

Project: `gen-lang-client-0573723214` (Google AI Studio's shared Firebase project).

## Confirmed in Firebase console

- At the start of the audit, Google was the only enabled authentication provider. An anonymous signup returned `ADMIN_ONLY_OPERATION` and an email signup returned `OPERATION_NOT_ALLOWED`; neither created an account. With the owner's go-ahead, Email/Password and Anonymous were enabled. Google remained enabled; email-link sign-in and anonymous auto clean-up were left off.
- The project has no `(default)` Firestore database. AIM's existing data is in `ai-studio-aimlifeoperating-a47e8e7f-36c8-4a5f-a6f8-d02b1c3732c2`. A separate DirectorPro database exists in the same project. The client previously called `getFirestore(app)`, which selects `(default)`; it now selects AIM's named database explicitly.
- AIM's named database has deployed owner-only rules on `/users/{userId}` and immediate subcollection documents, with a default-deny fallback. The repository's `firestore.rules` is more general and was not deployed as part of this audit.
- Authorized domains include Firebase defaults and several Google AI Studio Cloud Run domains. A final preview or production host must be checked against this list before Google sign-in there.

## Live smoke test after enabling providers

- Disposable email signup, email/password sign-in with the same UID, and disposable anonymous signup: passed.
- Both test users wrote and read their own document in AIM's named database: passed.
- A second user's read and write were each denied with HTTP 403. An unsigned read was denied with HTTP 403.
- Both temporary documents and both temporary Auth accounts were deleted successfully. No test data was retained.

## Still to verify

1. Test the full signup/onboarding, profile write/read, refresh, and logout from a reachable AIM build using this branch. The REST smoke test proves Firebase Auth and Firestore behavior, but does not prove the app UI or private Express API integration.
2. Verify that the deployed server has credentials to validate Firebase ID tokens and that `/api/aim/*` accepts valid sessions and rejects unsigned requests. No Application Default Credentials are present in this workspace.
3. Check the authorized domain for the actual preview host and App Check configuration. Live Gemini is a separate verification.

The two sign-in providers were enabled in the live Firebase project. Firestore rules, authorized domains, billing plan, and production deployment were not changed.
