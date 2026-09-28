# Live Firebase audit — 2026-09-27

Project: `gen-lang-client-0573723214` (Google AI Studio's shared Firebase project).

## Confirmed in Firebase console

- Google is the only enabled authentication provider. Email/password and Anonymous are absent from the enabled provider list.
- A disposable anonymous signup returned `ADMIN_ONLY_OPERATION`; disposable email signup returned `OPERATION_NOT_ALLOWED`. Neither created an account.
- The project has no `(default)` Firestore database. AIM's existing data is in `ai-studio-aimlifeoperating-a47e8e7f-36c8-4a5f-a6f8-d02b1c3732c2`. A separate DirectorPro database exists in the same project. The client previously called `getFirestore(app)`, which selects `(default)`; it now selects AIM's named database explicitly.
- AIM's named database has deployed owner-only rules on `/users/{userId}` and immediate subcollection documents, with a default-deny fallback. The repository's `firestore.rules` is more general and was not deployed as part of this audit.
- Authorized domains include Firebase defaults and several Google AI Studio Cloud Run domains. A final preview or production host must be checked against this list before Google sign-in there.

## Still to verify

1. Decide whether email/password and anonymous guest accounts should be available as the app advertises. Enabling a provider changes the project's public signup surface; review this decision before changing console settings. The Google provider is already enabled.
2. Test real signup/sign-in, profile write/read, cross-user denial, refresh, and logout from a reachable AIM build using the named database. Then verify that the server has credentials to validate Firebase ID tokens and that `/api/aim/*` accepts valid sessions and rejects unsigned requests.
3. Check the authorized domain for the actual preview host and App Check configuration. Live Gemini is a separate verification.

No account, Firestore rule, provider, authorized domain, billing plan, or production deployment was changed during this audit.
