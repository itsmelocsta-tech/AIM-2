# AIM release preparation — 2026-10-25

Package: `app.aim.lifeos`. Android target API 36. Version code 1 / version 1.0.0 (confirm unused in the final Play account before upload).

## Owner gates observed
- The connected Google session opens Play Console at developer-account signup. No app dashboard or upload track is available in that session. Do not assume this rules out another existing developer account.
- Owner-controlled signing inputs are absent from this workspace. The existing signed-bundle workflow requires the upload key and secure backup. No replacement or debug signing key was generated.
- Developer registration, any registration fee, identity verification, and acceptance of Google's Developer Distribution Agreement require the owner.
- If a new personal developer account is used, Google requires 12 continuously opted-in closed testers for at least 14 days before an application for production access. Three web testers do not satisfy that requirement.
- Purchases stay disabled until Play products, service access, real license-test purchase/restore/renewal/revocation, and server enforcement are verified.
- Native Google OAuth is not implemented in this WebView; Google forbids embedded OAuth. Email/guest entry remains available. Do not claim native Google login passed.
- AI Studio shows the known AIM-2 project (gen-lang-client-0573723214) on Free tier with Set up billing. Public personal-data processing is blocked until the actual production key is verified against a billing-backed project and the applicable terms. No paid service was enabled.

## Store declarations to complete honestly
- App access: account creation is required. Provide a dedicated reviewer account and precise steps; do not publish credentials in this repository.
- Data safety: audit email/user IDs, optional profile/context and financial details, optional health/wellness entries, approximate/precise web location, files/Drive metadata, speech-to-text handling, AI prompt processing, technical logs, and subscription identifiers. Do not declare no data collection.
- Privacy contact currently reuses the contact in the existing public release branch: franciscohilburn04@gmail.com. Verify it is monitored before submitting.
- Google’s organization-account rules explicitly cover health apps; its health-app categories include wellness, sleep and stress management. Resolve the developer account type for AIM’s actual wellness features before paying for registration. Complete the Health apps declaration for the general wellness features. AIM does not diagnose, treat, cure, or prevent illness.
- Complete target audience, IARC content rating, ads, and AI-generated-content declarations in Play Console using the actual release behavior. No content rating or production approval is claimed here.
- Publish final HTTPS privacy, terms, and account-deletion URLs. Verify them without Vercel login.
- Upload the 512×512 PNG icon, a 1024×500 feature graphic, and actual app screenshots after current-build verification.

## Official sources
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/10144311
- https://support.google.com/googleplay/android-developer/answer/14094294

The build now writes server code and its source map to `.server/`, outside the public `dist/` folder. `scripts/check-release-output.mjs` fails the build if server code or environment files enter public output.

Current source check: Gemini API Additional Terms (effective March 23, 2026) restrict API Clients directed toward or likely accessed by under-18s, and prohibit personal/sensitive information in Unpaid Services. The connected Firebase project shows Spark/no-cost, and AI Studio confirms the known AIM-2 API project is Free tier. The exact deployment key’s project was not read from secrets. Public personal-data processing is not cleared until a billing-backed project is verified. No billing upgrade was performed. https://ai.google.dev/gemini-api/terms
