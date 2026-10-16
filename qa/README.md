# AIM Browser QA

Runner: Playwright in the Browser QA GitHub Actions workflow. No external browser-testing provider is used.

`cd qa && npm ci && npx playwright install chromium && npm test` runs the isolated production UpgradeModal and entitlement-service harness at 390×844 and 1280×800. Root application dependencies must also be installed. A harness PASS proves only component behavior and fixture-based entitlement transitions.

The live job resolves a successful Vercel Preview deployment belonging to the exact PR head SHA through GitHub deployment metadata. It rejects mutable branch aliases, records the SHA/URL, and probes the deployed public phone entry, health endpoint, and unauthenticated API enforcement. Vercel authentication, absent deployment permission, or preview readiness is BLOCKED, never a skipped PASS. Deployment protection is retained; no bypass or credential is embedded.

The same live job now runs `npm run test:journey` against the matching preview. It creates one random email account through AIM, checks all three onboarding answers and Back navigation, real AI pathways, Firebase reload after clearing the local cache, first-run guide, personal opportunity persistence, confirmed one-hour rerouting, sign-out/sign-in, and phone/desktop bounds. It then deletes only that run's records and identity, verifying cleanup. Each completed boundary is recorded in a credential-free JSON attachment. A smoke PASS cannot substitute for this journey.

The journey requires `AIM_ALLOW_DISPOSABLE_ACCOUNT=true`, the full tested SHA, and an immutable AIM preview URL. The workflow enables it only for same-repository PRs or manual runs. Credentials are generated in memory; there are no owner passwords, saved sessions, authenticated screenshots, traces, or videos in artifacts. The existing dedicated preview-access secret is exchanged for a host-scoped cookie without changing protection. Google OAuth still requires a separate interactive authorized test profile. Real purchases, paid entitlements, and native device behavior are separate release checks.

No purchases, credential changes, production promotions, real user data, traces, video, or saved browser authentication are permitted. Artifacts contain component fixtures and public pre-authentication screenshots only.
