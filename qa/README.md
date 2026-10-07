# AIM Browser QA

Runner: Playwright in the Browser QA GitHub Actions workflow. No external browser-testing provider is used.

`cd qa && npm ci && npx playwright install chromium && npm test` runs the isolated production UpgradeModal and entitlement-service harness at 390×844 and 1280×800. Root application dependencies must also be installed. A harness PASS proves only component behavior and fixture-based entitlement transitions.

The live job resolves a successful Vercel Preview deployment belonging to the exact PR head SHA through GitHub deployment metadata. It rejects mutable branch aliases, records the SHA/URL, and probes the deployed public phone entry, health endpoint, and unauthenticated API enforcement. Vercel authentication, absent deployment permission, or preview readiness is BLOCKED, never a skipped PASS. Deployment protection is retained; no bypass or credential is embedded.

Authenticated onboarding, real Gemini plan generation, saved-plan reload and sign-out/sign-in, Premium account enforcement, rerouting, user-defined opportunities, and Google workspace loading require a separately authorized disposable test profile and runner access. The workflow explicitly records these paths as BLOCKED until that prerequisite exists; these smoke checks cannot establish full new-user success.

No purchases, credential changes, production promotions, real user data, traces, video, or saved browser authentication are permitted. Artifacts contain component fixtures and public pre-authentication screenshots only.
