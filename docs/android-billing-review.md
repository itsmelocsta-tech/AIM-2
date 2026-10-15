# Android and billing review candidate

This branch adds Android packaging and server purchase verification to the existing public app. It is based directly on GitHub main; no uploaded repository history, research source, personal records, credentials, keystores, or generated artifacts are included.

## Changes

- Native Android wrapper targeting API 36 with AGP 8.10.1, Gradle 8.11.1, and Play Billing 8.0.0.
- Restricted HTTPS/main-frame WebView message bridge; strict origin matching replaces URL prefix checks. The native app requests no purchases while payments are disabled.
- Fresh Play offer lookup, hashed account binding, purchase acknowledgment, and restore verification APIs. Ineligible free-trial requests cannot silently fall back to an immediate paid plan.
- Protected Firestore billing records, transactional token ownership, account/linked-token checks, expiry validation, and denial of superseded tokens.
- Signed Google Pub/Sub OIDC identity, audience, and service-account validation for subscription notifications. Current Play state determines access, including for reordered notifications.
- Shared launch configuration: $7.99 monthly, 3-day eligible trial, payments disabled. Release tasks require the real HTTPS origin and signing settings.
- Scoped cache/date/persistence repairs and regression tests.

## Scope and remaining work

Payments remain disabled. This branch does not redesign application screens or enable a complete consumer purchase flow. Existing UI is retained for a separate design review and billing integration change.

The native Google credential/return flow, microphone runtime permission handling, file upload/download, back navigation, device lifecycle/offline behavior, signed bundle, and actual Play license testing remain release gates. Supply the upload signing key through secret settings; do not commit it. Verify the configured package ID and Play App Signing certificate before distributing a release.

Configure `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, Firebase Admin credentials, `PLAY_RTDN_AUDIENCE`, and `PLAY_RTDN_SERVICE_ACCOUNT_EMAIL` through server secret settings. Existing static webhook tokens are not accepted. A Pub/Sub push subscription must use the configured audience and expected service-account identity.

An offer ID alone does not establish the current free-trial billing phase after renewals. All advertised Premium features and quotas still need a complete server enforcement audit. Account reset is not complete Firebase account deletion. Published privacy/terms/deletion/support pages, store disclosures/assets, and actual email/Google/Gemini/persistence/rerouting verification remain necessary.

## Evidence boundaries

The backend/native runtime changes do not modify screen layouts, navigation, onboarding, or visible controls. Design evidence for this branch is `not-applicable: backend, native transport, build configuration, and persistence only; existing screen components are unchanged`.

Local validation: TypeScript PASS; 107 Vitest tests across 22 files PASS; production web/backend build PASS. A credential-pattern scan found no credential literals after removing example placeholder values. Native compilation and deployed browser checks await GitHub Actions.

Record the exact commit and GitHub Actions results in the PR. Local fixture tests do not verify Google Play, Firebase rules deployment, live authentication, or physical Android behavior. Keep incomplete verification marked BLOCKED.
