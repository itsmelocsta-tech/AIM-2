# AIM Browser QA

Runner: Playwright in the Browser QA GitHub Actions workflow. No external browser-testing provider is used.

`cd qa && npm ci && npx playwright install chromium && npm test` runs the isolated production UpgradeModal and entitlement-service harness at 390×844 and 1280×800. Root application dependencies must also be installed. A harness PASS proves only component behavior and fixture-based entitlement transitions.

The live job resolves a successful Vercel Preview deployment belonging to the exact PR head SHA through GitHub deployment metadata. It rejects mutable branch aliases, records the SHA/URL, and probes the deployed public phone entry, health endpoint, and unauthenticated API enforcement. Vercel authentication, absent deployment permission, or preview readiness is BLOCKED, never a skipped PASS. Deployment protection is retained; no bypass or credential is embedded.

The live job also runs `test:journey` with a fresh disposable email account. It checks all three answers, real AI plan generation, cloud reload, user-defined opportunities, Basic/Premium enforcement, sign-out/sign-in, responsive bounds, and verified account/data cleanup. The separate signed-in atmosphere suite remains enabled. Credentials stay in memory; reports contain only per-step outcomes and cropped fictional content.

Google OAuth, actual Premium rerouting, purchases and native-device behavior remain separate. The Basic journey never fabricates paid access. Creating disposable users requires `AIM_ALLOW_DISPOSABLE_ACCOUNT=true` and an immutable preview associated with the exact tested commit.

No purchases, credential changes, real user data, traces, video, or saved browser authentication are permitted. Test-account credentials are never retained in artifacts.
