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

Payments remain disabled. This branch retains the existing screen layout and does not enable a complete consumer purchase flow. The Premium dialog now reads its monthly price and trial duration from the shared launch offer and explains eligibility, renewal, cancellation, and unavailable checkout.

The Premium screen and staged backend/native configuration now agree on $7.99/month and a 3-day trial for eligible new subscribers, with no annual launch option. Google Play must confirm the final price and eligibility. Verify the matching Play Console products before enabling purchases. Figma metadata review was attempted but blocked by the connected Starter quota; no fresh design comparison PASS is claimed.

The native Google credential/return flow, microphone runtime permission handling, file upload/download, back navigation, device lifecycle/offline behavior, signed bundle, and actual Play license testing remain release gates. Supply the upload signing key through secret settings; do not commit it. Verify the configured package ID and Play App Signing certificate before distributing a release.

Configure `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, Firebase Admin credentials, `PLAY_RTDN_AUDIENCE`, and `PLAY_RTDN_SERVICE_ACCOUNT_EMAIL` through server secret settings. Existing static webhook tokens are not accepted. A Pub/Sub push subscription must use the configured audience and expected service-account identity.

The verified subscription line item now uses Google's current `offerPhase.freeTrial` field to establish trial status instead of the original offer ID. Paid renewals and missing phase metadata retain verified access without claiming a trial. Tests cover active and canceled subscriptions before and after phase changes. API reference: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2#OfferPhase . All advertised Premium features and quotas still need a complete server enforcement audit. Account reset is not complete Firebase account deletion. Published privacy/terms/deletion/support pages, store disclosures/assets, and actual email/Google/Gemini/persistence/rerouting verification remain necessary.

## Evidence boundaries

The native/backend changes retain existing navigation and onboarding. The Premium pricing-copy repair is an interface change: it retains the existing dialog layout, reads the shared offer, and adds eligibility/renewal/cancellation information. Design reference: https://www.figma.com/design/EjzsPVuGWNnrLSIdi1DTIa . Fresh Figma review is BLOCKED by the connected Starter quota. Phone/desktop component bounds and rendered screenshots must be checked for the current head; fixture screenshots do not establish an authenticated deployed comparison.

Local validation: TypeScript PASS; 107 Vitest tests across 22 files PASS; production web/backend build PASS. A credential-pattern scan found no credential literals after removing example placeholder values. Native compilation and deployed browser checks await GitHub Actions.

The first GitHub run passed Quality Gate and Premium/voice component browser checks. The live phone check reached the exact-head preview but was blocked by Vercel deployment protection; the runner needs authorized preview access. The first Android job exposed `sdkmanager: command not found`; the workflow now explicitly installs Android command-line tools and API 36 before compilation. Final commit-bound outcomes belong in the PR.

Record the exact commit and GitHub Actions results in the PR. Local fixture tests do not verify Google Play, Firebase rules deployment, live authentication, or physical Android behavior. Keep incomplete verification marked BLOCKED.

## Current release repair

The live workflow now passes the already configured `VERCEL_AUTOMATION_BYPASS_SECRET` to the exact-head job. A host-validated request exchanges it for a host-scoped cookie without following redirects; browser and API probes share that context. Secret values are never placed in URLs, global browser headers, reports, or traces. Deployment protection stays enabled. Access failure remains BLOCKED.
